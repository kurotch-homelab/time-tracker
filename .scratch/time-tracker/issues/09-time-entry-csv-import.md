# 09 — 稼働レコード CSV インポート

Status: implemented
Type: AFK
Phase: 1
Labels: ready-for-agent, phase-1, import

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Import historical 稼働レコード from CSV so existing spreadsheets or tools can be migrated into the system with row-level validation and review.

## TDD starter

- First failing test: `csv import creates valid time entries and reports invalid rows with reasons`.
- Public interface: import API and import review UI.

## Acceptance criteria

- [ ] Given a CSV with valid rows, When imported, Then those rows become normalized 稼働レコード.
- [ ] Given invalid rows, When imported, Then they are not saved and each has a human-readable reason.
- [ ] Given imported records that would overlap existing records, When validation runs, Then those rows are rejected before persistence.
- [ ] Given unknown client/project names, When mapping is required, Then the user can map or create 案件 before final import.

## Blocked by

- `04-manual-time-entry-recording.md`
