# ADR-0006 — Tenancy model: user-owned, multi-business

**Date:** 2026-08-05 · **Status:** Accepted (founder direction)

## Context

The Platform Architecture refers to "complete tenant isolation," the Security Architecture
to "another organization's data," and the Database Architecture to businesses users
"belong to" — membership language. But no organization entity exists, and the PRD excludes
team collaboration from MVP. Retrofitting `organization_id` into RLS policies across every
table is one of the most expensive migrations available to us, so this had to be decided
before the first migration (R-8, Q1, Q2).

## Decision

**For MVP, the tenant is the user.** `businesses.owner_id` references `auth.users(id)`.
RLS policies scope every business-owned row to `owner_id = auth.uid()`, traversed via the
parent business for child tables.

**Multiple businesses per user are supported now**, not "in the future" as the Database
Architecture currently states.

To keep the documented future (organisation workspaces, government portals, investor
workspaces) reachable without a rewrite, ownership is resolved through **a single
`business_access` SQL helper function** used by every policy — rather than repeating
`owner_id = auth.uid()` inline across dozens of policies. Introducing organizations later
becomes a change to that one function plus a membership table, instead of an edit to every
policy in the schema.

## Consequences

- Simplest correct model for MVP; no speculative organization machinery built now.
- One indirection in policy definitions, which buys a substantially cheaper future migration.
- Two documents need updating: the Database Architecture ("belong to" → owner-based;
  multi-business is present-tense) and the Security Architecture ("organization" → "user"
  for MVP).

## References

Founder direction, 2026-08-05 · Database Architecture · Security Architecture ·
Platform Architecture · Engineering Understanding Report R-8, Q1, Q2
