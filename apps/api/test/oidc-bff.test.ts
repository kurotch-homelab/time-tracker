import type { Server } from "node:http";
import express from "express";
import { afterEach, describe, expect, it } from "vitest";
import { createOidcBff, type OidcAuthorizationClient } from "../src/oidc-bff.js";
import { InMemorySessionStore } from "../src/session-store.js";

describe("OIDC BFF", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })));
    servers.length = 0;
  });

  it("creates an opaque HttpOnly session only after a state-bound OIDC callback", async () => {
    let authorizationInput: Parameters<OidcAuthorizationClient["createAuthorizationUrl"]>[0] | undefined;
    const client: OidcAuthorizationClient = {
      async createAuthorizationUrl(input) {
        authorizationInput = input;
        return new URL(`https://sso.example.test/authorize?state=${encodeURIComponent(input.state)}`);
      },
      async exchangeAuthorizationResponse(input) {
        expect(input.expectedState).toBe(authorizationInput?.state);
        expect(input.expectedNonce).toBe(authorizationInput?.nonce);
        expect(input.codeVerifier).toBe(authorizationInput?.codeVerifier);
        return { sub: "member_1", organization: "org_1", roles: ["manager"] };
      },
    };
    const bff = createOidcBff({
      client,
      sessions: new InMemorySessionStore(),
      publicOrigin: new URL("https://time-tracker.example.test"),
      organizationClaim: "organization",
      roleClaim: "roles",
      secureCookies: true,
      crossSiteClientSessions: false,
      trustedOrigins: ["https://time-tracker.example.test"],
      sessionLifetimeMs: 24 * 60 * 60_000,
    });
    const app = express();
    app.use(bff.router);
    app.get("/me", async (request, response) => response.json(await bff.authenticate(request)));
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("test server did not bind a TCP port");
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const login = await fetch(`${baseUrl}/auth/login`, { redirect: "manual" });
    const transactionCookie = login.headers.get("set-cookie");
    const location = login.headers.get("location");
    if (!transactionCookie || !location) {
      throw new Error("login did not return a redirect and transaction cookie");
    }
    const state = new URL(location).searchParams.get("state");
    const callback = await fetch(`${baseUrl}/auth/callback?state=${encodeURIComponent(state ?? "")}&code=code_1`, {
      redirect: "manual",
      headers: { cookie: transactionCookie },
    });
    const sessionCookie = callback.headers.get("set-cookie");
    if (!sessionCookie) {
      throw new Error("callback did not return a session cookie");
    }
    const sessionCookieValue = sessionCookie.match(/tt_session=[^;]+/)?.[0];
    if (!sessionCookieValue) {
      throw new Error("callback did not return a usable session cookie");
    }
    const me = await fetch(`${baseUrl}/me`, { headers: { cookie: sessionCookieValue } });

    expect(login.status).toBe(302);
    expect(authorizationInput?.codeVerifier).toHaveLength(43);
    expect(transactionCookie).toContain("HttpOnly");
    expect(callback.status).toBe(303);
    expect(sessionCookie).toContain("tt_session=");
    expect(sessionCookie).toContain("HttpOnly");
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ userId: "member_1", organizationId: "org_1", role: "manager" });
  });
});
