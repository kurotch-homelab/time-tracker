import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().url(),
  PUBLIC_ORIGIN: z.string().url(),
  OIDC_ISSUER_URL: z.string().url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  OIDC_ORGANIZATION_CLAIM: z.string().min(1).default("organization"),
  OIDC_ROLE_CLAIM: z.string().min(1).default("roles"),
  DESKTOP_ORIGIN: z.string().url().optional(),
  CHROME_EXTENSION_ORIGIN: z.string().url().optional(),
  SESSION_LIFETIME_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(24),
});

export interface RuntimeConfig {
  readonly nodeEnv: "development" | "test" | "production";
  readonly port: number;
  readonly databaseUrl: string;
  readonly publicOrigin: URL;
  readonly oidcIssuerUrl: string;
  readonly oidcClientId: string;
  readonly oidcClientSecret: string;
  readonly oidcOrganizationClaim: string;
  readonly oidcRoleClaim: string;
  readonly desktopOrigin?: string;
  readonly chromeExtensionOrigin?: string;
  readonly sessionLifetimeMs: number;
}

export function loadRuntimeConfig(environment: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const raw = environmentSchema.parse(environment);
  const publicOrigin = new URL(raw.PUBLIC_ORIGIN);
  if (publicOrigin.protocol !== "https:" && raw.NODE_ENV === "production") {
    throw new Error("PUBLIC_ORIGIN must use HTTPS in production");
  }
  return {
    nodeEnv: raw.NODE_ENV,
    port: raw.PORT,
    databaseUrl: raw.DATABASE_URL,
    publicOrigin,
    oidcIssuerUrl: raw.OIDC_ISSUER_URL,
    oidcClientId: raw.OIDC_CLIENT_ID,
    oidcClientSecret: raw.OIDC_CLIENT_SECRET,
    oidcOrganizationClaim: raw.OIDC_ORGANIZATION_CLAIM,
    oidcRoleClaim: raw.OIDC_ROLE_CLAIM,
    ...(raw.DESKTOP_ORIGIN === undefined ? {} : { desktopOrigin: originFromUrl(raw.DESKTOP_ORIGIN) }),
    ...(raw.CHROME_EXTENSION_ORIGIN === undefined ? {} : { chromeExtensionOrigin: originFromUrl(raw.CHROME_EXTENSION_ORIGIN) }),
    sessionLifetimeMs: raw.SESSION_LIFETIME_HOURS * 60 * 60_000,
  };
}

function originFromUrl(value: string): string {
  const url = new URL(value);
  return url.origin === "null" ? `${url.protocol}//${url.host}` : url.origin;
}
