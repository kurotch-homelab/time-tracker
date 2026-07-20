# 21 — Toggl parity: required fields, locks, audits, add time for team

Status: implemented
Type: AFK
Phase: 8
Labels: ready-for-agent, phase-8, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Add governance controls equivalent to Toggl required fields, locked time entries, time audits, and add-time-for-team behavior while preserving MVP freedom when disabled.

## TDD starter

- First failing test: `required fields prevent saving an incomplete time entry only when the rule is enabled`.
- Public interface: 稼働レコード save API and governance settings UI.

## Acceptance criteria

- [ ] Given required fields are configured at Org/team/案件 scope, When a user saves an incomplete 稼働レコード, Then missing project/task/tag/memo fields are shown and save is blocked.
- [ ] Given a ロック期間, When an unauthorized user edits a locked 稼働レコード, Then the edit is rejected with a clear reason.
- [ ] Given an Admin adds time for a team member, When it is saved, Then the audit log shows proxy actor and target member.
- [ ] Given suspiciously long or incomplete entries, When time audit runs, Then records are flagged without changing source data.

## Blocked by

- `20-toggl-teams-admin-access-audit.md`
