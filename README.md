# Time Tracker

Time Tracker is an MIT-licensed organization time-tracking application. Its
PWA and Windows/macOS desktop application share one React UI and one server API.
The server is an OIDC browser-facing backend-for-frontend (BFF): browser and
desktop clients never receive or store OIDC access tokens.

## Architecture

```text
PWA / Tauri desktop
        │ HttpOnly session cookie
        ▼
Time Tracker API ── OIDC + PKCE ──> Keycloak ── SAML ──> Google Workspace
        │
        └──> CloudNativePG (PostgreSQL)
```

Google Workspace is deliberately not an application dependency. Configure its
SAML identity provider inside Keycloak; the application speaks OIDC only to its
Keycloak realm. This keeps identity-provider metadata and signing material out
of this public repository.

## Local development

Node `24.15.0` and pnpm `10` are required.

```sh
corepack enable
pnpm install
pnpm verify
```

Copy `.env.example` to a local `.env`, provide a local PostgreSQL URL and a
Keycloak OIDC client, apply the migration, then run the API and PWA:

```sh
pnpm --filter @time-tracker/api build
node --env-file=.env apps/api/dist/src/migrate.js
pnpm dev:api
pnpm dev:web
```

The PWA uses relative API routes by default. Set the public, non-secret
`VITE_API_ORIGIN` only when building the Tauri bundle, for example
`https://time-tracker.apps.silver-vine.jp`.

## Keycloak and Google Workspace

Create a confidential Keycloak OIDC client in the Time Tracker realm:

- Client ID: `time-tracker-web` (or update the Helm value).
- Standard Authorization Code flow enabled; Implicit flow disabled.
- Redirect URI: `https://time-tracker.apps.silver-vine.jp/auth/callback`.
- Add protocol mappers that issue a non-empty `organization` claim and a
  `roles` claim containing optional `admin` or `manager`; other users become
  `member`.
- Add Google Workspace as a SAML identity provider in the same realm. Keep its
  metadata URL/certificate and any client secret in Keycloak, not Git.

The API checks PKCE, `state`, and `nonce`, stores only hashes of opaque session
and login-transaction identifiers in PostgreSQL, and sends `HttpOnly` cookies.
When `DESKTOP_ORIGIN=tauri://localhost` is configured, the API allows only that
desktop origin in addition to the public PWA origin.

## Chrome extension

`apps/extension` is a Manifest V3 popup extension for internal Google Workspace
distribution. It has no certificate, no private key, and only the `activeTab`
permission. On an explicit click it sends the current HTTP(S) tab's URL and
title—never page content—to start a timer. After organization distribution,
set `runtime.chromeExtensionOrigin` to the issued
`chrome-extension://<extension-id>` before enabling its API access. Details are
in [apps/extension/README.md](apps/extension/README.md).

## Kubernetes and Argo CD

`deploy/chart` is a Helm chart designed for the existing homelab conventions:
Traefik `IngressRoute`, CloudNativePG with `longhorn-static`, and an Argo CD
PreSync migration Job. Validate it before use:

```sh
helm lint deploy/chart
helm template time-tracker deploy/chart --namespace time-tracker
```

Create these two secrets in the `time-tracker` namespace with the existing
Sealed Secrets workflow; do not add plaintext Secret manifests to this repo.

| Secret | Required keys | Purpose |
| --- | --- | --- |
| `time-tracker-database-owner` | `username`, `password` | CloudNativePG bootstrap owner |
| `time-tracker-runtime` | `database-url`, `oidc-client-secret` | API database connection and Keycloak confidential-client secret |

`deploy/argocd-application.example.yaml` is deliberately an example rather
than a change to the separate Argo CD repository. Copy/adapt it there after the
image repository and sealed secrets exist.

## Desktop builds

The `Desktop bundles` workflow builds Windows, Apple Silicon macOS, and Intel
macOS artifacts with GitHub-hosted runners. It uploads unsigned build artifacts;
macOS notarization and Windows Authenticode signing require your organization’s
separate signing credentials and remain intentionally outside this public repo.

For public repositories, GitHub documents standard hosted runners as free and
unlimited, subject to concurrency limits. See [GitHub-hosted runner
reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
and [Actions limits](https://docs.github.com/en/actions/reference/limits).
