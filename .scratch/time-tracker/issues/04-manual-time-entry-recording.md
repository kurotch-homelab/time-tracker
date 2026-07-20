# 04 — 手動入力の稼働レコード

Status: ready-for-agent
Type: AFK
Phase: 1
Labels: ready-for-agent, phase-1, time-entry

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Let a member manually create a 稼働レコード by specifying either a time band or duration-only quick input. The saved record must always have a 案件 and normalized `startAt` / `endAt`.

## TDD starter

- First failing test: `manual duration input creates a retrievable time entry with a normalized time band`.
- Public interface: create/get 稼働レコード use case, then HTTP endpoint and minimum UI flow.

## Acceptance criteria

- [ ] Given a valid 案件, When a member enters only duration and end time, Then the 稼働レコード is saved with normalized `startAt` / `endAt`.
- [ ] Given missing 案件, When a member tries to save, Then the save is rejected before persistence.
- [ ] Given an existing 稼働レコード for the same user, When a new normalized 時間帯 overlaps, Then the save is rejected.
- [ ] Given another user's overlapping 時間帯, When the member saves their own record, Then it is allowed.

## Blocked by

- `03-client-project-activity-tag-management.md`
