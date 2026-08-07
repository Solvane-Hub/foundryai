# ADR-0005 — Zod as the single validation layer

**Date:** 2026-08-05 · **Status:** Accepted

## Context

Three documents demand validation without naming a mechanism: the API Architecture
("strong validation on all inputs"), the AI System Architecture ("every response must
conform to its schema. No exceptions"), and the Security Architecture ("validation before
processing"). Without one library, we would end up with several validation styles and
schema drift between agents (R-29).

## Decision

Zod is the single validation layer across all three boundaries:

1. **User input** — Server Actions and route handlers (`lib/validation/`)
2. **Agent contracts** — every AI input/output schema (`lib/ai/schemas/`, Phase 4)
3. **Environment** — validated at boot, fail-fast (`lib/env.ts`)

Types are inferred from schemas via `z.infer`, so a schema and its TypeScript type cannot
disagree.

## Consequences

- One validation idiom to learn and review.
- Agent output validation in Phase 4 reuses infrastructure already proven in Phase 0.
- Zod is a runtime dependency in the request path; its cost is negligible relative to
  database and model latency.

## References

API Architecture · AI System Architecture (JSON Contract) · Security Architecture ·
Engineering Understanding Report R-29, §9 rec. 4
