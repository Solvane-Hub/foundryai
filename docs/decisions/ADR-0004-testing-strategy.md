# ADR-0004 — Testing strategy and per-phase testing

**Date:** 2026-08-05 · **Status:** Accepted

## Context

The Development Roadmap places all testing in Phase 8, after seven build phases. The same
document states "every feature must be testable," and the Engineering Standards Definition
of Done requires tests per feature. These cannot both hold. Deferring test infrastructure
reliably produces untestable code and a Phase 8 that consumes the schedule (R-22).

## Decision

- **Vitest** for unit and integration tests.
- **Playwright** for end-to-end, including a mobile viewport project (acceptance criterion E4).
- **A dedicated `tests/rls/` suite.** Tenant isolation is a security control, not a
  feature. It gets its own directory, its own CI gate, and tests that actively attempt
  cross-tenant access and assert failure.
- The harness is stood up in **Phase 0, empty**. Tests are written **per phase**.
- Roadmap Phase 8 is **retained** as the comprehensive validation gate — this changes
  sequencing, not scope.

## Consequences

- Slightly slower Phase 0; substantially de-risked Phase 8.
- CI can enforce the Definition of Done mechanically from the first commit.
- The RLS suite gives us a real answer to "is tenant isolation actually working?" rather
  than an assumption.

## References

Development Roadmap (Guiding Principles, Phase 8) · Engineering Standards (Definition of
Done) · Engineering Understanding Report R-22, §9 rec. 1–2
