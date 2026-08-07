# ADR-0003 — Server Actions as the default interaction pattern

**Date:** 2026-08-05 · **Status:** Accepted (founder direction)

## Context

The Platform Architecture shows "API / Server Actions" as a single layer. The API
Architecture specifies versioned REST (`/api/v1/...`). The Frontend Architecture permits
either. No rule said which to use when — flagged as R-7 in the Engineering Understanding
Report.

## Decision

**Server Actions are the default.** REST route handlers under `/api/v1/` are used only
where they provide a clear architectural benefit:

- external or third-party consumers (future government/partner integrations)
- webhooks
- streaming responses
- endpoints requiring independent versioning or rate-limit policy
- non-browser clients (future mobile)

Both paths delegate to the **same** Application Service. Neither may contain business
logic. This is what prevents the duplicate-logic failure mode R-7 warned about.

Because Server Actions have no URL surface, the API Architecture's `/api/v1/` versioning
mandate applies to route handlers only. Server Action contracts are versioned by their
Zod schemas in `lib/validation/`.

## Consequences

- Less boilerplate, progressive enhancement, and type safety across the boundary by default.
- Adding a REST endpoint later is cheap because the service already exists.
- Requires review discipline: a Server Action must never grow business logic inline.

## References

Founder direction, 2026-08-05 · API Architecture · Platform Architecture ·
Frontend Architecture · Engineering Understanding Report R-7
