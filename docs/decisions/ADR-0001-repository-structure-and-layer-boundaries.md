# ADR-0001 — Repository structure and enforced layer boundaries

**Date:** 2026-08-05 · **Status:** Accepted

## Context

The Frontend Architecture documents a directory tree containing `app/`, `components/`,
`hooks/`, `styles/`, `public/` — but no `lib/`, `types/`, `services/`, or `tests/`.

The Platform Architecture and Backend Architecture both require a distinct **Application
Services** layer that owns all business logic, and Engineering Standards §5 requires
shared interfaces to be centralized. Building literally to the documented frontend tree
would force business logic into route handlers and components, violating both.

## Options considered

1. **Build to the documented tree literally** — honours the letter of the Frontend
   Architecture, violates the Platform Architecture. Rejected.
2. **Extend the tree with the layers the backend requires** — adds `services/`, `lib/`,
   `types/`, `tests/`, `supabase/`, `docs/`, `scripts/`. Removes nothing.
3. **Restructure into a monorepo with separate packages** — heavier than a single
   Next.js application needs at this stage. Deferred, not rejected.

## Decision

Option 2, approved by the founder. The Frontend Architecture document should be updated
to include the additional directories.

Three boundaries are enforced by ESLint `no-restricted-imports` rather than by
convention, so a violation fails CI:

| Rule                                                    | Rationale                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `app/` may not import `@/lib/db`                        | Platform Architecture — business logic and writes belong in `services/` |
| `lib/ai/` may not import `@/lib/db` or `@/services`     | Engineering Standards §8 — AI agents never access the database          |
| `components/` may not import `@/services` or `@/lib/db` | Frontend Architecture — presentation holds no business logic            |

## Consequences

- The most important architectural invariants become mechanically verifiable.
- Contributors get an immediate, explanatory error instead of a review comment weeks later.
- Cost: a small amount of indirection for simple reads, which we accept.

## References

Frontend Architecture (Directory Structure) · Platform Architecture (Core Platform
Components, Design Constraints) · Backend Architecture (Layers) · Engineering
Standards §5, §7, §8 · Engineering Understanding Report §8, R-23
