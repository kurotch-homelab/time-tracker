import { randomBytes } from "node:crypto";
import express, { type Request, type Response } from "express";
import type { AuthenticatedPrincipal } from "./application.js";
import type { SessionStore } from "./session-store.js";

const AUTH_TRANSACTION_COOKIE = "tt_auth_transaction";
const WEB_SESSION_COOKIE = "tt_session";

export interface OidcAuthorizationClient {
  createAuthorizationUrl(input: {
    readonly redirectUri: string;
    readonly state: string;
    readonly nonce: string;
    readonly codeVerifier: string;
  }): Promise<URL>;
  exchangeAuthorizationResponse(input: {
    readonly callbackUrl: URL;
    readonly expectedState: string;
    readonly expectedNonce: string;
    readonly codeVerifier: string;
  }): Promise<Record<string, unknown>>;
}

export interface OidcBffOptions {
  readonly client: OidcAuthorizationClient;
  readonly sessions: SessionStore;
  readonly publicOrigin: URL;
  readonly organizationClaim: string;
  readonly roleClaim: string;
  readonly secureCookies: boolean;
  readonly crossSiteClientSessions: boolean;
  readonly trustedOrigins: readonly string[];
  readonly sessionLifetimeMs: number;
}

export interface OidcBff {
  readonly router: express.Router;
  authenticate(request: Request): Promise<AuthenticatedPrincipal | undefined>;
}

/**
 * A browser-facing OIDC BFF. Tokens stay server-side and clients receive only
 * opaque, HttpOnly session identifiers.
 */
export function createOidcBff(options: OidcBffOptions): OidcBff {
  const router = express.Router();
  const callbackUri = new URL("/auth/callback", options.publicOrigin).toString();

  router.get("/auth/login", async (_request, response) => {
    const transactionId = opaqueRandomValue();
    const state = opaqueRandomValue();
    const nonce = opaqueRandomValue();
    const codeVerifier = opaqueRandomValue();
    await options.sessions.createLoginTransaction(transactionId, {
      state,
      nonce,
      codeVerifier,
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    response.cookie(AUTH_TRANSACTION_COOKIE, transactionId, cookieOptions(options, 10 * 60));
    const authorizationUrl = await options.client.createAuthorizationUrl({
      redirectUri: callbackUri,
      state,
      nonce,
      codeVerifier,
    });
    response.redirect(302, authorizationUrl.toString());
  });

  router.get("/auth/callback", async (request, response) => {
    const transactionId = readCookie(request, AUTH_TRANSACTION_COOKIE);
    response.clearCookie(AUTH_TRANSACTION_COOKIE, clearCookieOptions(options));
    if (!transactionId) {
      response.status(400).send("Unable to complete sign-in.");
      return;
    }
    const transaction = await options.sessions.consumeLoginTransaction(transactionId);
    if (!transaction || request.query.state !== transaction.state) {
      response.status(400).send("Unable to complete sign-in.");
      return;
    }
    try {
      const claims = await options.client.exchangeAuthorizationResponse({
        callbackUrl: new URL(request.originalUrl, options.publicOrigin),
        expectedState: transaction.state,
        expectedNonce: transaction.nonce,
        codeVerifier: transaction.codeVerifier,
      });
      const principal = principalFromClaims(claims, options);
      if (!principal) {
        response.status(403).send("Your account is not authorized for this organization.");
        return;
      }
      const sessionId = opaqueRandomValue();
      await options.sessions.createWebSession(sessionId, {
        ...principal,
        expiresAt: new Date(Date.now() + options.sessionLifetimeMs),
      });
      response.cookie(WEB_SESSION_COOKIE, sessionId, cookieOptions(options, Math.floor(options.sessionLifetimeMs / 1_000)));
      response.redirect(303, "/");
    } catch (error) {
      console.warn("OIDC callback rejected", { message: error instanceof Error ? error.message : "unknown" });
      response.status(400).send("Unable to complete sign-in.");
    }
  });

  router.post("/auth/logout", async (request, response) => {
    if (!hasExpectedOrigin(request, options.trustedOrigins)) {
      response.status(403).json({ error: "invalid origin" });
      return;
    }
    const sessionId = readCookie(request, WEB_SESSION_COOKIE);
    if (sessionId) {
      await options.sessions.deleteWebSession(sessionId);
    }
    response.clearCookie(WEB_SESSION_COOKIE, clearCookieOptions(options));
    response.status(204).end();
  });

  return {
    router,
    async authenticate(request): Promise<AuthenticatedPrincipal | undefined> {
      const sessionId = readCookie(request, WEB_SESSION_COOKIE);
      if (!sessionId) {
        return undefined;
      }
      const session = await options.sessions.getWebSession(sessionId);
      if (!session) {
        return undefined;
      }
      return {
        userId: session.userId,
        organizationId: session.organizationId,
        role: session.role,
      };
    },
  };
}

function principalFromClaims(claims: Record<string, unknown>, options: OidcBffOptions): AuthenticatedPrincipal | undefined {
  const userId = claims.sub;
  const organizationId = claims[options.organizationClaim];
  if (typeof userId !== "string" || typeof organizationId !== "string" || !userId || !organizationId) {
    return undefined;
  }
  return {
    userId,
    organizationId,
    role: roleFromClaim(claims[options.roleClaim]),
  };
}

function roleFromClaim(value: unknown): AuthenticatedPrincipal["role"] {
  const roles = Array.isArray(value) ? value : [value];
  if (roles.includes("admin")) {
    return "admin";
  }
  if (roles.includes("manager")) {
    return "manager";
  }
  return "member";
}

function opaqueRandomValue(): string {
  return randomBytes(32).toString("base64url");
}

function readCookie(request: Request, name: string): string | undefined {
  const raw = request.header("cookie");
  if (!raw) {
    return undefined;
  }
  const prefix = `${name}=`;
  const matched = raw.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
  if (!matched) {
    return undefined;
  }
  try {
    return decodeURIComponent(matched.slice(prefix.length));
  } catch {
    return undefined;
  }
}

function cookieOptions(options: OidcBffOptions, maxAgeSeconds: number): express.CookieOptions {
  return {
    httpOnly: true,
    sameSite: options.crossSiteClientSessions ? "none" : "lax",
    secure: options.secureCookies,
    path: "/",
    maxAge: maxAgeSeconds * 1_000,
  };
}

function clearCookieOptions(options: OidcBffOptions): express.CookieOptions {
  return {
    httpOnly: true,
    sameSite: options.crossSiteClientSessions ? "none" : "lax",
    secure: options.secureCookies,
    path: "/",
  };
}

function hasExpectedOrigin(request: Request, trustedOrigins: readonly string[]): boolean {
  return trustedOrigins.includes(request.header("origin") ?? "");
}
