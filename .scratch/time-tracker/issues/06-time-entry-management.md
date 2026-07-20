# 06 — 稼働レコード一覧・編集・整理

Status: ready-for-agent
Type: AFK
Phase: 1
Labels: ready-for-agent, phase-1, time-entry

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Allow members to list, edit, split, duplicate, and delete their own 稼働レコード while preserving 時間帯 validation, auditability, and role-based 閲覧権限.

## TDD starter

- First failing test: `member can split their own time entry without creating overlapping time bands`.
- Public interface: 稼働レコード management API and UI behavior.

## Acceptance criteria

- [ ] Given a member, When they open the list, Then they see their own 稼働レコード but not other members' details.
- [ ] Given a valid edit, When it changes 案件, 作業種別, memo, tags, billable, or references, Then the updated record is retrievable.
- [ ] Given a split operation, When the requested split point is inside the 時間帯, Then two non-overlapping records replace the original.
- [ ] Given a delete operation, When it succeeds, Then the record is logically deleted and audit history remains.

## Blocked by

- `04-manual-time-entry-recording.md`
