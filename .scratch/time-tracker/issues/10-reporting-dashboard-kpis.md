# 10 — レポート基盤と KPI ダッシュボード

Status: implemented
Type: AFK
Phase: 2
Labels: ready-for-agent, phase-2, reporting

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Build the first reportable path from 稼働レコード to dashboard cards and grouped summaries. This covers Toggl-style Summary Report basics plus the project/member dashboard required by the PRD.

## TDD starter

- First failing test: `dashboard totals match filtered billable and non-billable time entries`.
- Public interface: report query API and dashboard UI.

## Acceptance criteria

- [ ] Given multiple users and 案件, When a role-scoped report query runs, Then only records within 閲覧権限 are included.
- [ ] Given billable and non-billable records, When the dashboard loads, Then total hours and billable rate match the source records.
- [ ] Given estimates or budgets on a 案件, When the project dashboard renders, Then progress against estimate is visible.
- [ ] Given weekly and monthly date ranges, When selected, Then summary totals and KPI cards update consistently.

## Blocked by

- `04-manual-time-entry-recording.md`
- `06-time-entry-management.md`
