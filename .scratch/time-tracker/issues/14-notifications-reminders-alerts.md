# 14 — 通知・リマインダー・アラート

Status: ready-for-agent
Type: AFK
Phase: 4
Labels: ready-for-agent, phase-4, notifications

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Deliver notification channels and rules for missing records, abandoned timers, forecast/estimate overrun alerts, weekly summaries, quiet hours, and per-user notification preferences.

## TDD starter

- First failing test: `missing-record reminder is not sent during quiet hours or Japanese holidays`.
- Public interface: notification scheduler boundary and in-app/PWA/email delivery adapters.

## Acceptance criteria

- [ ] Given a working day with zero 稼働レコード by end time, When quiet hours do not apply, Then the selected reminder channel is sent.
- [ ] Given a Japanese holiday or Time Off day, When reminder rules evaluate, Then missing-record reminders are skipped.
- [ ] Given an overrun forecast signal, When it is detected for the first time, Then the member and assigned manager receive one alert.
- [ ] Given a weekly summary schedule, When the schedule fires, Then the summary includes hours, billable rate, and forecast notes.

## Blocked by

- `12-monthly-forecast.md`
