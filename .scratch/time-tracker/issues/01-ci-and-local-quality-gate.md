# 01 — CI and local quality gate

Status: ready-for-agent
Type: AFK
Phase: 0
Labels: ready-for-agent, phase-0, tdd, tooling

## Parent

- `.scratch/time-tracker/PRD.md`

## What to build

Make the repository runnable and verifiable by any agent before product development continues. The quality gate must run install, lint, typecheck, test, and build consistently locally and in CI.

## TDD starter

- First failing check: CI or local `pnpm verify` fails when a package has a type/test/build regression.
- Public interface: package scripts and GitHub Actions workflow.

## Acceptance criteria

- [ ] Given a clean checkout, When `pnpm install --frozen-lockfile` and `pnpm verify` run, Then lint, typecheck, test, and build all pass.
- [ ] Given a pull request or push, When CI runs, Then the same verification gate runs with the pinned Node/pnpm versions.
- [ ] Given generated build output, When Git status is checked, Then ignored artifacts do not appear as pending source changes.

## Blocked by

None - can start immediately
