# 11 — フィルタ・検索・エクスポート・一括整理

Status: implemented
Type: AFK
Phase: 2
Labels: ready-for-agent, phase-2, reporting

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Make report/list conditions reusable across list views, reports, and exports. Add full-text-ish search, saved filters, CSV/Excel exports, and bulk operations with audit logging.

## TDD starter

- First failing test: `saved filter returns the same time entries in list, report, and export`.
- Public interface: filter query API and export endpoint.

## Acceptance criteria

- [ ] Given a filter by period, クライアント, 案件, member, and tag, When applied to list/report/export, Then the same authorized records are selected.
- [ ] Given a saved filter, When reused later, Then it resolves with the same conditions unless explicitly edited.
- [ ] Given an export request, When CSV or Excel is selected, Then detail rows and summary rows can both be produced.
- [ ] Given bulk delete/restore/billable/reassign, When executed, Then only authorized 稼働レコード change and audit logs capture the operation.

## Blocked by

- `10-reporting-dashboard-kpis.md`
