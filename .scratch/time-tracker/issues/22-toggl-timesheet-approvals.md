# 22 — Toggl parity: timesheet approvals

Status: implemented
Type: AFK
Phase: 8
Labels: ready-for-agent, phase-8, toggl-parity

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Implement タイムシート submission, review, rejection, comments, statuses, and optional multi-layer approval. Approved periods become locked by rule.

## TDD starter

- First failing test: `approved timesheet locks the submitted time entries against member edits`.
- Public interface: タイムシート API and approval UI flow.

## Acceptance criteria

- [ ] Given a member with weekly 稼働レコード, When they submit a タイムシート, Then its status becomes submitted and approvers can review it.
- [ ] Given a submitted タイムシート, When an approver approves or rejects, Then status, reviewer, comment, and timestamp are recorded.
- [ ] Given multi-layer approval, When a lower layer approves, Then the next approver is notified and final approval waits for all required layers.
- [ ] Given final approval, When member attempts to edit included records, Then ロック期間 rules prevent the edit.

## Blocked by

- `21-toggl-required-fields-locks-time-audits.md`
