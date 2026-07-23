import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { Pool } from "pg";
import { createApiApplication } from "./application.js";
import { loadRuntimeConfig } from "./config.js";
import { createKeycloakOidcClient } from "./keycloak-oidc.js";
import { createOidcBff } from "./oidc-bff.js";
import { PostgresSessionStore } from "./session-store.js";
import { PostgresTimeTrackingStore } from "./time-tracking-store.js";

const runtime = loadRuntimeConfig();
const pool = new Pool({ connectionString: runtime.databaseUrl });
const oidcClient = await createKeycloakOidcClient({
  issuerUrl: runtime.oidcIssuerUrl,
  clientId: runtime.oidcClientId,
  clientSecret: runtime.oidcClientSecret,
});
const bff = createOidcBff({
  client: oidcClient,
  sessions: new PostgresSessionStore(pool),
  publicOrigin: runtime.publicOrigin,
  organizationClaim: runtime.oidcOrganizationClaim,
  roleClaim: runtime.oidcRoleClaim,
  secureCookies: runtime.publicOrigin.protocol === "https:",
  crossSiteClientSessions: runtime.desktopOrigin !== undefined || runtime.chromeExtensionOrigin !== undefined,
  trustedOrigins: [
    runtime.publicOrigin.origin,
    ...(runtime.desktopOrigin ? [runtime.desktopOrigin] : []),
    ...(runtime.chromeExtensionOrigin ? [runtime.chromeExtensionOrigin] : []),
  ],
  sessionLifetimeMs: runtime.sessionLifetimeMs,
});
const staticDirectory = process.env.STATIC_DIR
  ?? fileURLToPath(new URL("../../../web/dist", import.meta.url));
const indexFile = `${staticDirectory}/index.html`;
const app = createApiApplication({
  authenticate: bff.authenticate,
  trackingStore: new PostgresTimeTrackingStore(pool),
  allowedOrigins: [
    runtime.publicOrigin.origin,
    ...(runtime.desktopOrigin ? [runtime.desktopOrigin] : []),
    ...(runtime.chromeExtensionOrigin ? [runtime.chromeExtensionOrigin] : []),
  ],
  corsOrigins: [
    ...(runtime.desktopOrigin ? [runtime.desktopOrigin] : []),
    ...(runtime.chromeExtensionOrigin ? [runtime.chromeExtensionOrigin] : []),
  ],
  registerRoutes(application) {
    application.get("/readyz", async (_request, response) => {
      try {
        await pool.query("SELECT 1");
        response.status(200).json({ status: "ready" });
      } catch {
        response.status(503).json({ status: "not ready" });
      }
    });
    application.use(bff.router);
    if (existsSync(indexFile)) {
      application.use(express.static(staticDirectory, { index: false, maxAge: "1h", immutable: true }));
      application.get("/{*path}", (request, response, next) => {
        if (request.path.startsWith("/api/") || request.path.startsWith("/auth/")) {
          next();
          return;
        }
        response.sendFile(indexFile);
      });
    }
  },
});

const server = app.listen(runtime.port, "0.0.0.0", () => {
  console.info(`Time Tracker API listening on port ${runtime.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.info(`Received ${signal}; shutting down`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
