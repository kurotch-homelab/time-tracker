# 26 — Toggl parity: My Reports, sharing, scheduling, invoice drafts

Status: ready-for-agent
Type: AFK
Phase: 8
Labels: ready-for-agent, phase-8, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Support Toggl-style custom reports: saved report definitions, sharing, scheduled delivery, insights-chart style report cards, and invoice draft generation/export from reports.

## TDD starter

- First failing test: `shared report link exposes only records allowed by the viewer permission scope`.
- Public interface: saved report API, sharing link, and scheduled delivery boundary.

## Acceptance criteria

- [ ] Given a custom report, When saved, Then filters, grouping, columns, and visualization settings are persisted.
- [ ] Given a shared report, When another user opens it, Then data is recalculated under that viewer's 閲覧権限.
- [ ] Given scheduled delivery, When delivery time arrives, Then the configured report link or attachment is sent.
- [ ] Given a report-based invoice draft, When generated, Then line granularity and rounding settings are applied without replacing freee delegation.

## Blocked by

- `11-filters-search-export-bulk-ops.md`
- `13-billing-preview-rates-expenses.md`
- `14-notifications-reminders-alerts.md`
