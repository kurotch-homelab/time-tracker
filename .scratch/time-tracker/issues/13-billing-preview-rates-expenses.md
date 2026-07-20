# 13 — 請求プレビュー・レート・経費

Status: ready-for-agent
Type: AFK
Phase: 3
Labels: ready-for-agent, phase-3, billing

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Calculate billable previews without issuing invoices. This includes rate history, member-specific rates, currency-separated tax-exclusive totals, minimum charges, expenses, and immutable 明細スナップショット preparation.

## TDD starter

- First failing test: `billing preview uses the historical project member rate that was active on the time entry date`.
- Public interface: billing preview API.

## Acceptance criteria

- [ ] Given rate history at Org, クライアント, 案件, and member levels, When a preview is generated, Then the correct rate is resolved by precedence and effective date.
- [ ] Given monthly minimum charge settings, When billable total is below the minimum, Then the preview applies the minimum without changing raw 稼働レコード.
- [ ] Given multiple currencies, When preview runs, Then totals are grouped by currency without conversion.
- [ ] Given billable 経費 with receipt URLs, When preview runs, Then expense lines are included in the draftable summary.
- [ ] Given a preview is converted to 送信履歴, When source data later changes, Then the 明細スナップショット remains immutable and differences are detectable.

## Blocked by

- `10-reporting-dashboard-kpis.md`
