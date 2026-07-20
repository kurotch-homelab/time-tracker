# Development guide

## Requirements

- Node.js `24.15.0` or compatible Node 24 runtime
- pnpm `10.33.4`

## Commands

```bash
pnpm install
pnpm verify
```

`pnpm verify` runs the local quality gate:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

## TDD workflow

Development follows RED → GREEN → REFACTOR.

1. Pick the next ready issue from `.scratch/time-tracker/issues/` in dependency order.
2. Add one behavior test through a public interface.
3. Run the focused test and confirm it fails for the expected reason.
4. Implement the smallest change that makes the test pass.
5. Refactor only while all tests are green.
6. Run `pnpm verify` before committing.

Do not batch-write all tests before implementation. Each issue should progress by small vertical slices.
