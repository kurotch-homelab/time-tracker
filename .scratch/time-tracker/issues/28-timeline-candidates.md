# 28 — Timeline候補

Status: implemented
Type: AFK
Phase: 9
Labels: ready-for-agent, phase-9, toggl-parity, privacy

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Collect private Timeline候補 from the user's device activity and let only the user adopt them into 稼働レコード. Admins cannot inspect raw candidates.

## TDD starter

- First failing test: `timeline candidate becomes a time entry only after the owner accepts it`.
- Public interface: candidate collection/adoption API and user UI.

## Acceptance criteria

- [ ] Given Timeline候補 collection is enabled, When device activity occurs, Then candidates are stored privately for the owner only.
- [ ] Given an Admin, When they query another member's data, Then unaccepted Timeline候補 are not visible.
- [ ] Given a user adopts a candidate, When saved, Then it becomes a normal 稼働レコード with source trace.
- [ ] Given rejected or expired candidates, When cleanup runs, Then they are removed without affecting reports.

## Blocked by

- `06-time-entry-management.md`
- `18-desktop-native-tauri.md`
