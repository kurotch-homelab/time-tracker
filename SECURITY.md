# Security policy

Do not open a public issue for a suspected vulnerability or for credentials
that were exposed accidentally. Contact the maintainers privately through the
repository owner's GitHub security advisory flow instead.

This repository intentionally contains no production credentials, SAML
metadata, signing certificates, database passwords, or Keycloak client
secrets. If any appear in a commit, revoke or rotate them immediately and
remove them from the Git history with the maintainers' approval.

Supported deployments use HTTPS, Keycloak OIDC with PKCE, opaque HttpOnly
sessions, strict request validation, origin checks for state-changing API calls,
and non-root Kubernetes containers. Review the deployment guide before changing
those defaults.
