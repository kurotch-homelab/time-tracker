# 15 — freee 下書き連携

Status: ready-for-agent
Type: AFK
Phase: 5
Labels: ready-for-agent, phase-5, integration, billing

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Connect one freee OAuth integration per Org, map freee partners to クライアント, and create draft invoices while preserving 送信履歴 and preventing duplicate sends.

## TDD starter

- First failing test: `freee draft creation stores payload response summary and immutable line snapshots`.
- Public interface: freee integration adapter plus draft creation API.

## Acceptance criteria

- [ ] Given an Admin, When they complete OAuth authorization, Then the Org stores a refreshable server-side freee connection.
- [ ] Given unmapped クライアント, When draft creation is requested, Then the request is blocked with mapping requirements.
- [ ] Given mapped billing preview lines, When a freee draft is created, Then freee draft ID, payload/response summary, and 明細スナップショット are saved.
- [ ] Given the same target range and lines, When sent again, Then duplicate transmission is blocked unless explicitly retried after a failed attempt.

## Blocked by

- `13-billing-preview-rates-expenses.md`
