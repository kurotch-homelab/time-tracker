# ADR 0002 — TDD vertical slices

Status: Accepted
Date: 2026-07-21

## Context

The PRD contains many phases, including Toggl Track parity. Writing broad horizontal tests or scaffolding every layer before behavior exists would make the suite brittle.

## Decision

Development proceeds one vertical slice at a time. Every slice begins with one failing behavior test through a public interface, then the smallest implementation to pass it, then refactor.

## Consequences

- Issues in `.scratch/time-tracker/issues/` describe the first failing test to write.
- Tests must use domain language from `CONTEXT.md`.
- Internal collaborators should not be mocked. Mock only system boundaries such as external APIs, clocks, queues, files, or databases when needed.
- RED is not complete if the only failure is a broken test environment or TypeScript compile error unrelated to the intended behavior.
