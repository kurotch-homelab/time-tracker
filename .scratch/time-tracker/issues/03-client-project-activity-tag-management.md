# 03 — クライアント, 案件, 作業種別, タグ

Status: implemented
Type: AFK
Phase: 1
Labels: ready-for-agent, phase-1, domain

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Allow an authorized user to create and manage the minimum master data needed before 稼働レコード can be saved: クライアント, 案件, 記録範囲, 作業種別, and タグ.

## TDD starter

- First failing test: `member can record to a public project but not to an assignment-limited project without assignment`.
- Public interface: domain service plus API route for creating/selecting a 案件.

## Acceptance criteria

- [x] Given an Admin, When they create a クライアント and 案件, Then the 案件 belongs to the クライアント and can be selected for recording.
- [x] Given a public 案件, When any member in the Org records time, Then 記録範囲 allows it without granting 閲覧権限 to other members.
- [x] Given an assignment-limited 案件, When an unassigned member tries to record time, Then the save is rejected.
- [x] Given the global 作業種別 template, When a new Org is initialized, Then the 9 default activity types are available and can be overridden or disabled downstream.

## Blocked by

- `02-auth-bff-org-membership-roles.md`
