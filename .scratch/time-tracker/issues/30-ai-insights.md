# 30 — AI Insights

Status: ready-for-human
Type: HITL
Phase: 9
Labels: ready-for-human, phase-9, ai, reporting

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Add AI Insights as a read-only reporting assistant that explains trends, anomalies, utilization, workload, and profitability using cited aggregate data. It must not mutate source data.

## TDD starter

- First failing test: `ai insight includes supporting report filters and does not change time entries`.
- Public interface: insight generation API and report UI.

## Acceptance criteria

- [ ] Given sufficient report data, When AI Insights runs, Then it returns observations grounded in explicit aggregates and filters.
- [ ] Given insufficient or unauthorized data, When asked for an insight, Then it refuses or narrows scope without exposing hidden records.
- [ ] Given generated insights, When viewed later, Then the supporting report query can be reproduced.
- [ ] Given any AI operation, When it completes, Then no 稼働レコード, rate, cost, or report setting is mutated automatically.

## Blocked by

- `25-toggl-profitability-workload-rounding.md`
- `26-toggl-custom-reports-sharing-invoices.md`
