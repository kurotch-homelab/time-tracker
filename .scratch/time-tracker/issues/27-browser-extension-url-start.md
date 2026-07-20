# 27 — Browser extension and URL start

Status: ready-for-human
Type: HITL
Phase: 9
Labels: ready-for-human, phase-9, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Add Chrome/Firefox/Edge extension support and URL-based timer start so external tools can create timer context with URL, title, 案件, タスク, and 参照URL candidates.

## TDD starter

- First failing test: `browser extension starts a timer with a reference URL but no private page content`.
- Public interface: extension message/API boundary and active timer API.

## Acceptance criteria

- [ ] Given an external tool page, When the extension button is pressed, Then a timer starts with URL/title/reference metadata according to configured rules.
- [ ] Given URL start link, When a user opens it, Then the intended timer or time entry draft starts after authentication.
- [ ] Given missing project mapping, When extension start is requested, Then the user can choose or map a 案件 before save.
- [ ] Given browser store release, When packaging is prepared, Then permissions and review copy are approved by a human.

## Blocked by

- `16-public-api-webhooks-tokens.md`
- `18-desktop-native-tauri.md`
