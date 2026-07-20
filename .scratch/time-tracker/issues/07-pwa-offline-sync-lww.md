# 07 — PWA オフライン同期と LWW

Status: ready-for-agent
Type: AFK
Phase: 1
Labels: ready-for-agent, phase-1, offline-sync

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Make the PWA usable offline for recording and editing, then synchronize when online. 同期競合 is resolved by LWW and rejected changes are returned as sync results, not silently lost.

## TDD starter

- First failing test: `offline sync adopts the latest conflicting active timer`.
- Public interface: sync engine API plus service-worker-backed UI flow.

## Acceptance criteria

- [ ] Given offline creation of a 稼働レコード, When the device reconnects, Then the record is sent and becomes retrievable online.
- [ ] Given conflicting changes from multiple devices, When sync runs, Then the change with the latest `updatedAt` is adopted.
- [ ] Given a rejected offline change, When sync completes, Then the user receives a sync result explaining the rejection.
- [ ] Given pending local changes, When the PWA reloads, Then the queue persists and retries safely.

## Blocked by

- `04-manual-time-entry-recording.md`
- `05-active-timer-lifecycle.md`
- `06-time-entry-management.md`
