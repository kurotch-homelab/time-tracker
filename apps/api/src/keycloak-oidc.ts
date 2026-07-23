import * as oidc from "openid-client";
import type { OidcAuthorizationClient } from "./oidc-bff.js";

export interface KeycloakOidcOptions {
  readonly issuerUrl: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

/** Keycloak is the only protocol boundary; upstream SAML stays configured there. */
export async function createKeycloakOidcClient(options: KeycloakOidcOptions): Promise<OidcAuthorizationClient> {
  const configuration = await oidc.discovery(
    new URL(options.issuerUrl),
    options.clientId,
    undefined,
    oidc.ClientSecretBasic(options.clientSecret),
  );

  return {
    async createAuthorizationUrl(input): Promise<URL> {
      const codeChallenge = await oidc.calculatePKCECodeChallenge(input.codeVerifier);
      return oidc.buildAuthorizationUrl(configuration, {
        redirect_uri: input.redirectUri,
        response_type: "code",
        scope: "openid profile email",
        state: input.state,
        nonce: input.nonce,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
    },
    async exchangeAuthorizationResponse(input): Promise<Record<string, unknown>> {
      const tokens = await oidc.authorizationCodeGrant(configuration, input.callbackUrl, {
        expectedState: input.expectedState,
        expectedNonce: input.expectedNonce,
        pkceCodeVerifier: input.codeVerifier,
      });
      const claims = tokens.claims();
      if (!claims) {
        throw new Error("Keycloak did not issue an ID token");
      }
      return claims as Record<string, unknown>;
    },
  };
}
