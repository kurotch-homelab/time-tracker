# 17 — Calendar / Slack / external storage 連携

Status: implemented
Type: AFK
Phase: 5
Labels: ready-for-agent, phase-5, integration

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Add first-party adapters for calendar suggestions, Slack notifications, and optional external storage backup while keeping external service boundaries mockable and observable.

## TDD starter

- First failing test: `weekly summary posts to Slack with the same totals as the report query`.
- Public interface: integration adapter boundary and user-facing settings/API.

## Acceptance criteria

- [ ] Given calendar integration is connected, When a user creates or reviews entries, Then calendar events can be shown as suggestions without becoming records automatically.
- [ ] Given Slack notification settings, When a summary or alert event fires, Then the configured channel receives the expected payload.
- [ ] Given external storage backup is enabled, When a backup event runs, Then an export artifact is written and audit history records the result.
- [ ] Given an external adapter failure, When the operation ends, Then the user can see failure state and retry where appropriate.

## Blocked by

- `14-notifications-reminders-alerts.md`
- `16-public-api-webhooks-tokens.md`
