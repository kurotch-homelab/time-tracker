# Time Tracker PRD pointer

Canonical PRD lives at [`docs/prd.md`](../../docs/prd.md).

This tracker file exists so local markdown issues can reference a stable parent inside `.scratch/time-tracker/`.

## Implementation policy

- Follow the domain language in [`CONTEXT.md`](../../CONTEXT.md).
- Use TDD: each implementation issue starts with one failing behavior test through a public interface.
- Keep slices vertical and demoable. For early slices, that means crossing domain logic, persistence, API, and the minimum UI surface once those layers exist.
- The current phase order is defined in [`README.md`](README.md).
