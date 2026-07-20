# Time Tracker implementation backlog

Canonical PRD: [`docs/prd.md`](../../docs/prd.md)
Domain glossary: [`CONTEXT.md`](../../CONTEXT.md)

This backlog is ordered by dependency. Each issue is intended to be started with one failing behavior test, then implemented with a RED → GREEN → REFACTOR loop.

## Issue map

| Issue | Type | Phase | Blocked by |
|---|---|---:|---|
| [01 — CI and local quality gate](issues/01-ci-and-local-quality-gate.md) | AFK | 0 | None |
| [02 — Webセッション, Org, Membership, roles](issues/02-auth-bff-org-membership-roles.md) | AFK | 0 | 01 |
| [03 — クライアント, 案件, 作業種別, タグ](issues/03-client-project-activity-tag-management.md) | AFK | 1 | 02 |
| [04 — 手動入力の稼働レコード](issues/04-manual-time-entry-recording.md) | AFK | 1 | 03 |
| [05 — アクティブタイマー](issues/05-active-timer-lifecycle.md) | AFK | 1 | 04 |
| [06 — 稼働レコード一覧・編集・整理](issues/06-time-entry-management.md) | AFK | 1 | 04 |
| [07 — PWA オフライン同期と LWW](issues/07-pwa-offline-sync-lww.md) | AFK | 1 | 04, 05, 06 |
| [08 — 未分類案件への再割当](issues/08-unclassified-project-reassignment.md) | AFK | 1 | 03, 07 |
| [09 — 稼働レコード CSV インポート](issues/09-time-entry-csv-import.md) | AFK | 1 | 04 |
| [10 — レポート基盤と KPI ダッシュボード](issues/10-reporting-dashboard-kpis.md) | AFK | 2 | 04, 06 |
| [11 — フィルタ・検索・エクスポート・一括整理](issues/11-filters-search-export-bulk-ops.md) | AFK | 2 | 10 |
| [12 — 月次着地見込み](issues/12-monthly-forecast.md) | AFK | 2/4 | 10 |
| [13 — 請求プレビュー・レート・経費](issues/13-billing-preview-rates-expenses.md) | AFK | 3 | 10 |
| [14 — 通知・リマインダー・アラート](issues/14-notifications-reminders-alerts.md) | AFK | 4 | 12 |
| [15 — freee 下書き連携](issues/15-freee-draft-invoice-integration.md) | AFK | 5 | 13 |
| [16 — 公開 API・Webhook・外部連携トークン](issues/16-public-api-webhooks-tokens.md) | AFK | 5 | 02, 04 |
| [17 — Calendar / Slack / external storage 連携](issues/17-calendar-slack-storage-integrations.md) | AFK | 5 | 14, 16 |
| [18 — Desktop native shell](issues/18-desktop-native-tauri.md) | HITL | 6 | 07, 16 |
| [19 — Mobile native shell](issues/19-mobile-native-react-native.md) | HITL | 7 | 07, 16 |
| [20 — Toggl parity: teams/admin/access/audit](issues/20-toggl-teams-admin-access-audit.md) | AFK | 8 | 02, 10 |
| [21 — Toggl parity: required fields, locks, audits, add time for team](issues/21-toggl-required-fields-locks-time-audits.md) | AFK | 8 | 20 |
| [22 — Toggl parity: timesheet approvals](issues/22-toggl-timesheet-approvals.md) | AFK | 8 | 21 |
| [23 — Toggl parity: Time Off](issues/23-toggl-time-off.md) | AFK | 8 | 14, 22 |
| [24 — Toggl parity: tasks/templates/recurring/fixed fee](issues/24-toggl-project-planning-parity.md) | AFK | 8 | 03, 13 |
| [25 — Toggl parity: labor costs/profitability/workload/rounding](issues/25-toggl-profitability-workload-rounding.md) | AFK | 8 | 13, 24 |
| [26 — Toggl parity: My Reports, sharing, scheduling, invoice drafts](issues/26-toggl-custom-reports-sharing-invoices.md) | AFK | 8 | 11, 13, 14 |
| [27 — Browser extension and URL start](issues/27-browser-extension-url-start.md) | HITL | 9 | 16, 18 |
| [28 — Timeline候補](issues/28-timeline-candidates.md) | AFK | 9 | 06, 18 |
| [29 — Integration expansion](issues/29-integration-expansion.md) | HITL | 9 | 16 |
| [30 — AI Insights](issues/30-ai-insights.md) | HITL | 9 | 25, 26 |

## Current implementation seed

`packages/core` already contains the first seed for manual 稼働レコード creation. Treat it as the start of issue 04, not as the completed end-to-end slice.
