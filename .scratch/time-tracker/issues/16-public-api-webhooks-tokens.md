# 16 — 公開 API・Webhook・外部連携トークン

Status: ready-for-agent
Type: AFK
Phase: 5
Labels: ready-for-agent, phase-5, api

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Expose external automation surfaces without confusing them with browser Webセッション. Provide 外部連携トークン, scoped public APIs for 稼働レコード, and Webhook delivery for major domain events.

## TDD starter

- First failing test: `external integration token can create a time entry but cannot access browser session endpoints`.
- Public interface: token-authenticated HTTP API and Webhook delivery contract.

## Acceptance criteria

- [ ] Given a personal or integration token, When a public API call is made, Then it is authenticated separately from Webセッション.
- [ ] Given token scopes, When an endpoint is called, Then only permitted operations and Org data are accessible.
- [ ] Given 稼働レコード create/update/delete, When committed, Then configured Webhooks receive signed events.
- [ ] Given Webhook delivery failure, When retry policy runs, Then retries are bounded and visible in delivery history.

## Blocked by

- `02-auth-bff-org-membership-roles.md`
- `04-manual-time-entry-recording.md`
