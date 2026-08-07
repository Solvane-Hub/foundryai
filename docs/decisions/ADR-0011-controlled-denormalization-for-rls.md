# ADR-0011 — Controlled denormalization for RLS performance

**Date:** 2026-08-05 · **Status:** Accepted (founder approved) · **⚠ Deviates from Database Architecture**

## Context

The Database Architecture states a normalization principle without qualification:

> **Normalized.** Duplicate information should never exist.
> Relationships are preferred over repeated fields.

This is correct as a default and the schema follows it everywhere else. But it collides with
Row Level Security on tables that are more than one hop from the tenancy root.

`businesses` is the tenancy root; ownership is `businesses.owner_id`. A child table one hop
away — `business_profiles` — resolves ownership with a single indexed lookup through
`app.business_access(business_id)`.

Tables **two or more hops** away are the problem. Strictly normalized, `tasks` would reach its
business through `launch_plans`:

```
tasks → launch_plans → businesses → owner_id
```

RLS predicates are evaluated **per row, on every read**. A normalized policy would therefore be:

```sql
using (
  exists (
    select 1 from launch_plans lp
    where lp.id = tasks.launch_plan_id
      and app.business_access(lp.business_id)
  )
)
```

That is a correlated subquery plus a join executed for every candidate row of the most
frequently read table in the product — the founder's task list, rendered on the dashboard on
every page load. The cost compounds with each additional hop: `conversation_messages` →
`conversations` → `businesses` has the same shape, and future modules (Property, Tourism,
Construction) will add more.

RLS predicates are also **not** something the application can optimize around. There is no
query the frontend can write that avoids them, and no index on `tasks` alone that makes the
join disappear.

## Options considered

1. **Strict normalization; accept the join in every policy.**
   Honours the documented principle exactly. Cost: a join per row on every read of every
   deep table, growing with hop count, on the platform's hottest queries. Rejected — this
   is a permanent tax on the core user experience.

2. **A `SECURITY DEFINER` function that walks the parent chain.**
   Keeps the schema normalized and hides the join inside a function. But the join still
   executes; it is merely less visible. `STABLE` caching helps within a statement and not
   across rows with differing arguments. Rejected — it obscures the cost without removing it.

3. **Materialized view or cached ownership table.**
   Introduces replication lag into a _security_ boundary. A stale ownership row is a
   cross-tenant read. Rejected on principle: correctness of isolation must never depend on
   refresh timing.

4. **Carry `business_id` on every business-owned table, regardless of depth.**
   Every RLS predicate becomes one indexed lookup through the same helper, at any depth.
   Costs 16 bytes per row and requires the redundant column to be kept truthful.

## Decision

**Option 4, approved by the founder.**

Every business-owned table carries `business_id uuid NOT NULL REFERENCES businesses(id) ON
DELETE CASCADE`, **even when it is reachable through a parent**. The RLS predicate is
uniformly:

```sql
using (app.business_access(business_id))
```

Known affected tables (all Phase 3+; none in Sprint 1):

| Table                   | Natural parent        | Carries `business_id`     | Hops saved |
| ----------------------- | --------------------- | ------------------------- | ---------- |
| `tasks`                 | `launch_plans`        | ✅                        | 1          |
| `conversation_messages` | `conversations`       | ✅                        | 1          |
| `agent_executions`      | `workflow_runs`       | ✅                        | 1          |
| `knowledge_chunks`      | `knowledge_documents` | ❌ **not business-owned** | n/a        |

`business_profiles`, `launch_plans`, `compliance_requirements`, `funding_opportunities`,
`workflow_runs`, `conversations` and `documents` are direct children — their `business_id` is
the natural foreign key, not a denormalization.

### Scope limit — this is not a licence to denormalize generally

This ADR authorises **exactly one** redundant column, `business_id`, and **only** where it
collapses an RLS traversal. It does not authorise duplicating names, statuses, amounts,
citations, or any other attribute. Every other table remains strictly normalized per the
Database Architecture. Any future proposal to denormalize something else needs its own ADR
and its own justification; this one may not be cited as precedent.

### Keeping the redundant column truthful

A denormalized column is only safe if it cannot drift. Three mechanisms, in order of strength:

1. **Composite foreign key.** Where a parent is unique on `(id, business_id)`, the child
   declares `FOREIGN KEY (parent_id, business_id) REFERENCES parent (id, business_id)`.
   The database then makes a mismatched pair **unrepresentable** — this is preferred wherever
   the parent can carry the required unique constraint.
2. **Trigger-derived, not caller-supplied.** A `BEFORE INSERT` trigger populates `business_id`
   from the parent row so application code never supplies it and therefore cannot supply it
   wrongly.
3. **Consistency test.** `tests/rls/` asserts, for every affected table, that no row exists
   whose `business_id` disagrees with its parent's. Drift fails CI rather than surfacing as a
   support ticket.

Mechanism 1 is used wherever the parent's constraints permit; mechanism 2 is the fallback.
Mechanism 3 applies unconditionally.

## Consequences

**Gained**

- Every RLS predicate is one indexed lookup, at any depth. Policy cost stops growing with
  schema depth.
- Every business-owned table has an identical policy shape, so security review is mechanical
  and drift is visible.
- Deep modules (Property, Tourism, Construction) inherit the pattern without re-litigating it.
- `ON DELETE CASCADE` from `businesses` reaches every owned row directly.

**Accepted costs**

- 16 bytes per row plus an index on each affected table.
- A redundant column that must be kept truthful — mitigated by the three mechanisms above.
- A documented, bounded exception to a documented principle.

**Documentation update required.** Database Architecture § Normalized should note the
exception: _"`business_id` may be carried on any business-owned table regardless of depth, to
keep Row Level Security predicates to a single indexed lookup. See ADR-0011. No other
denormalization is permitted without a new ADR."_

## References

Database Architecture § Normalized, § Row Level Security · Platform Architecture
(Observability, Design Constraints) · ADR-0006 (tenancy) · ADR-0009 (RLS policy pattern) ·
schema-design.md D3 · er-diagram.md §5 · Founder approval 2026-08-05
