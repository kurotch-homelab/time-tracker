# 20 — Toggl parity: teams/admin/access/audit

Status: ready-for-agent
Type: AFK
Phase: 8
Labels: ready-for-agent, phase-8, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Cover Toggl-style team and workspace management: teams, admin console settings, member profiles, access rights, workspace settings, and audit log exploration.

## TDD starter

- First failing test: `team manager sees only assigned team and project time entry details`.
- Public interface: admin/settings APIs and role-scoped UI.

## Acceptance criteria

- [ ] Given Teams and member profiles, When Admin changes team membership, Then reporting and access scopes update consistently.
- [ ] Given workspace settings, When visibility or creation permissions change, Then project/member behavior follows those settings.
- [ ] Given sensitive admin operations, When performed, Then the audit log records actor, target, action, and timestamp.
- [ ] Given Manager access, When viewing team data, Then 閲覧権限 is limited to assigned scope.

## Blocked by

- `02-auth-bff-org-membership-roles.md`
- `10-reporting-dashboard-kpis.md`
