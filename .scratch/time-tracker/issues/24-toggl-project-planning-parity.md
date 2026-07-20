# 24 — Toggl parity: tasks/templates/recurring/fixed fee

Status: implemented
Type: AFK
Phase: 8
Labels: ready-for-agent, phase-8, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Add Toggl-style project planning aids used for time aggregation: タスク, project templates, recurring project estimates, and fixed fee project tracking. This is not a ticket-management or Gantt system.

## TDD starter

- First failing test: `fixed fee project dashboard shows progress without changing raw time entries`.
- Public interface: 案件/タスク settings APIs and project dashboard.

## Acceptance criteria

- [ ] Given タスク under a 案件, When 稼働レコード are recorded, Then reports can group by タスク.
- [ ] Given a project template, When a new 案件 is created from it, Then configured defaults and tasks are copied.
- [ ] Given recurring project estimates, When a new period starts, Then estimate tracking resets according to recurrence settings.
- [ ] Given fixed fee settings, When dashboard/reporting runs, Then progress against fixed fee is shown separately from hourly billing.

## Blocked by

- `03-client-project-activity-tag-management.md`
- `13-billing-preview-rates-expenses.md`
