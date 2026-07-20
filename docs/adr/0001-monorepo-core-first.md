# ADR 0001 — Monorepo with core-first domain logic

Status: Accepted
Date: 2026-07-21

## Context

The product must support Web/PWA first, then desktop and mobile native clients. The same 稼働レコード, アクティブタイマー, offline sync, billing, and reporting rules must behave consistently across clients.

## Decision

Use a pnpm monorepo and keep cross-client business rules in `packages/core`. Application packages call core behavior through public interfaces instead of reimplementing domain rules.

Initial package layout:

- `packages/core`: domain services, validation, sync rules, billing/report calculation primitives.
- `apps/api`: future API/BFF boundary.
- `apps/web`: future PWA.
- native apps are added in later phases and reuse core/API contracts.

## Consequences

- Domain tests can start before API/UI scaffolding exists.
- Public interfaces must stay small and stable.
- UI/API tests still need to cover end-to-end behavior; core tests alone do not complete a vertical slice.
