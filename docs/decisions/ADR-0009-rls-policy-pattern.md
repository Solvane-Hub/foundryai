# ADR-0009 — Row Level Security policy pattern

**Date:** 2026-08-05 · **Status:** Accepted

## Context

RLS is the platform's core security property: _"Cross-business access is impossible"_
(Database Architecture). The documents mandate RLS but define no policy pattern. Without
one, policies drift in shape across tables and become unreviewable — which defeats the
purpose, because an unreviewable security control is an unverified one.

## Decision

A single pattern, applied to every table:

1. **`ENABLE` _and_ `FORCE` row level security.** `ENABLE` alone exempts the table owner,
   so a maintenance query run as the owning role would have no isolation at all.
2. **One policy per operation.** Never `FOR ALL` — split policies let a reviewer see who
   may write by reading the policy names.
3. **Every policy scoped `TO authenticated`**, so unauthenticated requests are rejected
   before any predicate is evaluated.
4. **No `DELETE` policy anywhere.** Deletion is impossible through the API; archival is
   the only removal mechanism. A bug in application code cannot destroy founder data
   because the privilege does not exist.
5. **`(select auth.uid())`, never bare `auth.uid()`.** The scalar subquery lets the
   planner hoist the call into an InitPlan — evaluated once per query rather than once
   per row.
6. **Ownership resolved through `app.business_access()`** on every business-owned table,
   except `businesses` itself (which would recurse).
7. **Grants _and_ policies.** RLS filters rows; grants decide whether a role may attempt
   the operation at all. Security Architecture: _"No layer assumes another layer has
   already performed validation."_
8. **Helper functions live in the `app` schema**, which PostgREST does not expose.
   A function in `public` becomes a callable API endpoint.

## Consequences

- Every table's security posture is verifiable by reading a fixed set of policy names.
- Adding a business-owned table is mechanical, which makes it hard to get wrong.
- Retrofitting item 5 across dozens of policies later would be tedious; doing it now is free.
- `tests/rls/` asserts this pattern holds on every table, so drift fails CI.

## References

Database Architecture § Row Level Security · Security Architecture · ADR-0006 ·
schema-design.md D3, D4, D5, D10, D11
