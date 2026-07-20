# 23 — Toggl parity: Time Off

Status: implemented
Type: AFK
Phase: 8
Labels: ready-for-agent, phase-8, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Support Time Off as non-working periods that affect reminder eligibility, utilization, workload, and report interpretation without becoming payroll or leave-balance management.

## TDD starter

- First failing test: `time off excludes a day from missing-record reminders and utilization denominator`.
- Public interface: Time Off request/approval API and reporting/reminder behavior.

## Acceptance criteria

- [ ] Given a Time Off period, When missing-record reminders evaluate, Then those dates are excluded.
- [ ] Given Time Off in a report period, When utilization is calculated, Then the denominator excludes non-working time.
- [ ] Given Time Off approval workflow is enabled, When a request is approved or rejected, Then status and reviewer details are recorded.
- [ ] Given workload reports, When Time Off exists, Then team capacity reflects absence periods.

## Blocked by

- `14-notifications-reminders-alerts.md`
- `22-toggl-timesheet-approvals.md`
