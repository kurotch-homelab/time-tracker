import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { createApiApplication } from "../src/application.js";
import type { TimeTrackingStore } from "../src/time-tracking-store.js";

describe("time tracker API", () => {
  const servers: Server[] = [];

  afterEach(async () => {
    await Promise.all(servers.map((server) => new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })));
    servers.length = 0;
  });

  it("lets an authenticated PWA start a timer that the desktop client can retrieve", async () => {
    const app = createApiApplication({
      authenticate: (request) => request.header("x-test-session") === "member-session"
        ? { userId: "member_1", organizationId: "org_1", role: "member" }
        : undefined,
    });
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("test server did not bind a TCP port");
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const startResponse = await fetch(`${baseUrl}/api/v1/active-timer`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-test-session": "member-session" },
      body: JSON.stringify({
        id: "timer_1",
        projectId: "project_1",
        startAt: "2026-07-24T09:00:00.000Z",
      }),
    });
    const currentResponse = await fetch(`${baseUrl}/api/v1/active-timer`, {
      headers: { "x-test-session": "member-session" },
    });

    expect(startResponse.status).toBe(201);
    expect(await startResponse.json()).toMatchObject({ id: "timer_1", userId: "member_1" });
    expect(await currentResponse.json()).toMatchObject({ id: "timer_1", projectId: "project_1" });
  });

  it("uses the configured durable timer store for both PWA and desktop requests", async () => {
    const persistedTimers = new Map<string, { id: string; userId: string; projectId: string; startAt: Date }>();
    let startCalls = 0;
    let getCalls = 0;
    const trackingStore: TimeTrackingStore = {
      async getActiveTimer(scope) {
        getCalls += 1;
        return persistedTimers.get(`${scope.organizationId}:${scope.userId}`);
      },
      async startActiveTimer(input) {
        startCalls += 1;
        const timer = { ...input };
        persistedTimers.set(`${input.organizationId}:${input.userId}`, timer);
        return timer;
      },
    };
    const app = createApiApplication({
      authenticate: () => ({ userId: "member_1", organizationId: "org_1", role: "member" }),
      trackingStore,
    });
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("test server did not bind a TCP port");
    }
    const baseUrl = `http://127.0.0.1:${address.port}`;

    await fetch(`${baseUrl}/api/v1/active-timer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "timer_from_store",
        projectId: "project_from_store",
        startAt: "2026-07-24T09:00:00.000Z",
      }),
    });
    const currentResponse = await fetch(`${baseUrl}/api/v1/active-timer`);

    expect(await currentResponse.json()).toMatchObject({ id: "timer_from_store", projectId: "project_from_store" });
    expect(startCalls).toBe(1);
    expect(getCalls).toBe(1);
  });

  it("rejects a state-changing API request from an untrusted browser origin", async () => {
    const app = createApiApplication({
      authenticate: () => ({ userId: "member_1", organizationId: "org_1", role: "member" }),
      allowedOrigins: ["https://time-tracker.example.test"],
    });
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("test server did not bind a TCP port");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/active-timer`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://attacker.example.test",
      },
      body: JSON.stringify({
        id: "timer_1",
        projectId: "project_1",
        startAt: "2026-07-24T09:00:00.000Z",
      }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "invalid origin" });
  });

  it("records only the active tab URL and title sent by the browser extension", async () => {
    const app = createApiApplication({
      authenticate: () => ({ userId: "member_1", organizationId: "org_1", role: "member" }),
    });
    const server = app.listen(0);
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("test server did not bind a TCP port");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/active-timer`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: "timer_extension_1",
        projectId: "project_1",
        startAt: "2026-07-24T09:00:00.000Z",
        referenceUrl: "https://example.test/issues/123",
        pageTitle: "Issue 123",
      }),
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      referenceUrl: "https://example.test/issues/123",
      pageTitle: "Issue 123",
    });
  });
});
