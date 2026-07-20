# Repository Instructions

## Agent skills

### Issue tracker

Issues and PRDs are tracked as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo with `CONTEXT.md` at the root and optional ADRs under `docs/adr/`. See `docs/agents/domain.md`.

## Engineering rules

- Follow the PRD in `docs/prd.md`.
- Use the domain language in `CONTEXT.md`.
- Development is TDD-first: RED -> GREEN -> REFACTOR, one vertical slice at a time.
- Prefer behavior tests through public interfaces over tests coupled to implementation details.
