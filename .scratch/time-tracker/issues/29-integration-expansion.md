# 29 — Integration expansion

Status: ready-for-human
Type: HITL
Phase: 9
Labels: ready-for-human, phase-9, integration

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Expand beyond first-party integrations toward Toggl-style ecosystem coverage: Jira, Salesforce, QuickBooks, Zapier, Make, and other connector patterns driven by public API/Webhook primitives.

## TDD starter

- First failing test: `jira issue context maps to a project task timer without exposing unrelated workspace data`.
- Public interface: connector adapter contract and public API/Webhook behavior.

## Acceptance criteria

- [ ] Given a configured connector, When an external event or button action occurs, Then the expected 稼働レコード or timer context is created.
- [ ] Given connector credentials, When scopes are insufficient or revoked, Then the integration fails safely and surfaces reconnect instructions.
- [ ] Given outgoing Webhooks or automation platform calls, When delivery fails, Then retry and dead-letter behavior are visible.
- [ ] Given a new connector request, When implementation begins, Then credential/scope decisions are reviewed by a human.

## Blocked by

- `16-public-api-webhooks-tokens.md`
