# 18 — Desktop native shell

Status: ready-for-human
Type: HITL
Phase: 6
Labels: ready-for-human, phase-6, native

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Ship a Windows/macOS Tauri desktop shell that shares the web app and API while adding tray/menu-bar presence, OS startup, global shortcuts, offline sync, and device defaults.

## TDD starter

- First failing test: `desktop tray start timer syncs the same active timer visible on web`.
- Public interface: native command boundary and API-visible timer state.

## Acceptance criteria

- [ ] Given the desktop app, When the user starts/stops/switches 案件 from tray or menu bar, Then the server and web UI show the same アクティブタイマー.
- [ ] Given OS startup setting is enabled, When the OS starts, Then the app launches in background and can operate via global shortcut.
- [ ] Given offline desktop usage, When it reconnects, Then the same LWW sync rules apply.
- [ ] Given platform packaging, When release review happens, Then signing/notarization decisions are documented before distribution.

## Blocked by

- `07-pwa-offline-sync-lww.md`
- `16-public-api-webhooks-tokens.md`
