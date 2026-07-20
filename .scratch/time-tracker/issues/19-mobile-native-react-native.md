# 19 — Mobile native shell

Status: ready-for-human
Type: HITL
Phase: 7
Labels: ready-for-human, phase-7, native

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Ship iOS/Android React Native or Expo clients for mobile-first recording, offline sync, push notifications, quick add, and home/lock-screen widgets.

## TDD starter

- First failing test: `mobile offline time entry syncs through the same conflict rules as PWA`.
- Public interface: shared core/API and app-level user flow.

## Acceptance criteria

- [ ] Given mobile offline recording, When the device reconnects, Then 稼働レコード sync uses the same LWW outcomes as web.
- [ ] Given push notifications, When reminder or alert rules fire, Then mobile receives the configured notification.
- [ ] Given home/lock-screen widget action, When the user starts/stops or switches 案件, Then the app and server agree on アクティブタイマー state.
- [ ] Given mobile design review, When one-handed quick recording is tested, Then the key path is reachable in a few taps.

## Blocked by

- `07-pwa-offline-sync-lww.md`
- `16-public-api-webhooks-tokens.md`
