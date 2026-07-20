# 12 — 月次着地見込み

Status: ready-for-agent
Type: AFK
Phase: 2/4
Labels: ready-for-agent, phase-2, forecast

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Show month-end forecast ranges using working-day pace extrapolation. The forecast must support total hours, billable amount, 案件 outlook, member outlook, and threshold signals later consumed by notifications.

## TDD starter

- First failing test: `monthly forecast excludes holidays and shows a reference range when data is sparse`.
- Public interface: forecast query API and dashboard card.

## Acceptance criteria

- [ ] Given month-to-date 稼働レコード and organization working-day settings, When forecast runs, Then weekends/holidays are excluded from pace calculation.
- [ ] Given current-month pace and recent-week pace, When both exist, Then the UI shows a min/max range.
- [ ] Given early-month sparse data, When forecast renders, Then it is marked as a reference value.
- [ ] Given forecast exceeding estimate or monthly limit, When first detected, Then one alert signal is emitted for the target member and manager.

## Blocked by

- `10-reporting-dashboard-kpis.md`
