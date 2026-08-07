# ADR-0007 — Business lifecycle states

**Date:** 2026-08-05 · **Status:** Accepted (founder direction)

## Context

The Database Architecture defines `businesses.status` without enumerating its values.
Progress tracking, the dashboard, workflow resumption, and intake all depend on it (Q7).

## Decision

Canonical lifecycle, per founder direction:

```
Draft → Intake Started → Intake Complete → Launch Plan Generated → Business Active → Archived
```

Implemented as a PostgreSQL enum `business_status` with values `draft`,
`intake_started`, `intake_complete`, `launch_plan_generated`, `active`, `archived`.

Transitions are validated in `services/business/` — **never** in the database, in a
component, or in a Server Action. A Postgres enum permits any value transition; the
services layer is what makes the lifecycle a state machine rather than a label.

`archived` is the soft-delete mechanism for businesses. Archived businesses remain
readable by their owner and are excluded from default listings.

Sprint 1 exercises `draft → intake_started → intake_complete`. The remaining transitions
are defined now so later phases add behaviour, not schema.

## Consequences

- A single, typed vocabulary shared by database, services, and UI.
- Adding a state later requires a migration, which is appropriate friction for a change
  of this significance.

## References

Founder direction, 2026-08-05 · Database Architecture (Businesses) ·
Development Roadmap Phases 2 and 5 · Engineering Understanding Report Q7
