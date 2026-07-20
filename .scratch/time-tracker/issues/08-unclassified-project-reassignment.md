# 08 — 未分類案件への再割当

Status: ready-for-agent
Type: AFK
Phase: 1
Labels: ready-for-agent, phase-1, data-quality

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Protect 稼働レコード from becoming projectless when a referenced 案件 is deleted or unavailable during sync. Each Org has one deletion-proof, non-billable 未分類案件.

## TDD starter

- First failing test: `unclassified project keeps orphaned time entries billable=false`.
- Public interface: delete/sync behavior observed through get/list 稼働レコード.

## Acceptance criteria

- [ ] Given an Org, When it is initialized, Then exactly one 未分類案件 exists and cannot be deleted.
- [ ] Given a 稼働レコード whose 案件 was deleted, When sync or cleanup runs, Then it is reassigned to the Org's 未分類案件.
- [ ] Given a reassigned record, When billing/reporting filters run, Then it is excluded from billable totals until manually corrected.

## Blocked by

- `03-client-project-activity-tag-management.md`
- `07-pwa-offline-sync-lww.md`
