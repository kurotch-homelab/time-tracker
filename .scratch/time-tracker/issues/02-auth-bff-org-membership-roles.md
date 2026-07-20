# 02 — Webセッション, Org, Membership, roles

Status: implemented
Type: AFK
Phase: 0
Labels: ready-for-agent, phase-0, auth

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Provide the first authenticated vertical slice: a user signs in through the API BFF, receives a Webセッション, belongs to an Org through Membership, and role checks control one protected endpoint and one protected UI route.

## TDD starter

- First failing test: `member cannot access admin-only organization settings through the Web session`.
- Public interface: HTTP endpoint and route-level behavior, not private auth helpers.

## Acceptance criteria

- [ ] Given valid credentials or OIDC identity, When the user signs in, Then a server-managed HttpOnly Webセッション is established.
- [ ] Given Admin, Manager, and Member memberships, When they call a protected endpoint, Then only roles allowed by the matrix can access it.
- [ ] Given a signed-out browser, When it requests a protected route, Then it is redirected or rejected without exposing protected data.

## Blocked by

- `01-ci-and-local-quality-gate.md`
