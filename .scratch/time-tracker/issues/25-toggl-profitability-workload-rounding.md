# 25 — Toggl parity: labor costs/profitability/workload/rounding

Status: implemented
Type: AFK
Phase: 8
Labels: ready-for-agent, phase-8, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Add labor costs, profitability reports, workload reports, rounding rules, and global report settings. Raw 稼働レコード remain unchanged; rounding applies only to reporting or billing output.

## TDD starter

- First failing test: `report rounding changes displayed billable total without mutating stored time entries`.
- Public interface: reporting/billing query API.

## Acceptance criteria

- [ ] Given 労務コスト and billable rates, When profitability report runs, Then revenue, cost, and margin are grouped by project/task/client/member/team.
- [ ] Given workload report range, When viewed by manager, Then team allocation and capacity are shown within 閲覧権限.
- [ ] Given rounding rules, When a report or billing output is generated, Then display/output values are rounded and raw records are preserved.
- [ ] Given global report settings, When users open reports, Then defaults apply unless overridden by saved reports or explicit filters.

## Blocked by

- `13-billing-preview-rates-expenses.md`
- `24-toggl-project-planning-parity.md`
