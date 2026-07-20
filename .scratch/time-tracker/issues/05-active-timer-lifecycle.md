# 05 — アクティブタイマー

Status: implemented
Type: AFK
Phase: 1
Labels: ready-for-agent, phase-1, timer

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Implement the アクティブタイマー lifecycle across domain, API, and UI: start, edit while running, stop into a 稼働レコード, quick resume, idle detection prompt, and optional Pomodoro that excludes breaks from records.

## TDD starter

- First failing test: `starting a second active timer finalizes the previous timer for the same user`.
- Public interface: timer use case/API observed through start/stop responses.

## Acceptance criteria

- [ ] Given no running timer, When a member starts a timer for a 案件, Then exactly one アクティブタイマー exists for that user.
- [ ] Given an existing アクティブタイマー, When the user starts another, Then the previous one is stopped into a 稼働レコード before the new one starts.
- [ ] Given a running timer, When the user changes 案件 / 作業種別 / memo, Then the active state updates without creating a completed record.
- [ ] Given idle time is detected, When the user chooses discard or count, Then the resulting 稼働レコード reflects that choice.

## Blocked by

- `04-manual-time-entry-recording.md`
