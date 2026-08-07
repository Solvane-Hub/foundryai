# FoundryAI — Schema Design & Engineering Decisions

**Phase:** Sprint 1 · Phase 1 (Data Foundation)
**Status:** ⏳ Awaiting founder approval — **no migration has been applied**
**Governing documents:** Database Architecture v1.0 · Security Architecture · Platform
Architecture · Trust Layer & Evidence Framework · Engineering Standards · ADR-0006, ADR-0007

---

## 0. How to read this document

The Database Architecture defines _entities and field names_. It does not define data
types, nullability, keys, indexes, constraints, or RLS policies. This document supplies
that layer and **explains every decision before any SQL is generated**, so the reasoning
is reviewable independently of the syntax.

Where a decision departs from the literal text of a document, it is marked **⚠ DEVIATION**
with the reasoning and a proposed documentation update. Nothing is changed silently.

Two files accompany this document:

| File                                                        | Purpose                                                                                                                              | Apply?      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| `supabase/migrations/20260805120000_sprint1_foundation.sql` | Sprint 1 tables — the only migration intended to run now                                                                             | On approval |
| `docs/architecture/schema-future-phases.sql`                | Design for Phases 3–7 tables. **Reference only — deliberately outside the migrations directory so it cannot be applied by accident** | No          |

---

## Part I — Foundational decisions

### D1. Primary keys: UUID for domain entities, `bigint` identity for the audit log

**Decision.** Every user-facing entity uses `uuid` with `gen_random_uuid()`. The audit log
uses `bigint generated always as identity`.

**Why UUID for domain entities.** Business IDs appear in URLs (`/dashboard/{businessId}`)
and in every API response. Sequential integers would leak total platform volume to any
user — a competitor could register on Monday and Friday and read our growth rate off two
URLs. For a platform whose credibility depends on institutional trust, that is an
unnecessary disclosure. UUIDs also let the client generate an ID before a round-trip,
which makes idempotent retries possible later.

**Why `bigint` for the audit log — a deliberate inconsistency.** Audit rows are internal,
never appear in a URL, are append-only, and will become the highest-volume table on the
platform. Sequential keys give chronological index locality, which is exactly what
time-ranged audit queries need, and `bigint` is half the width of `uuid`. Consistency for
its own sake would cost us here.

**Trade-off accepted.** `gen_random_uuid()` produces v4 (random) UUIDs, which fragment
B-tree indexes as tables grow. UUIDv7 (time-ordered) fixes this and is built into
PostgreSQL 18. We use v4 now for portability across Supabase's current PostgreSQL
versions. The upgrade path is a column default change with no type change and no data
migration — recorded in ADR-0008 rather than left as folklore.

No extension is required: `gen_random_uuid()` has been in PostgreSQL core since 13.

---

### D2. `auth.users` remains the single source of truth for identity

**Decision.** Do not create an application-owned `users` table. Create
`public.profiles` with `id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`,
populated automatically by a trigger on `auth.users` insert.

**⚠ DEVIATION.** The Database Architecture lists a **Users** table containing `email`.
We deliberately **do not store email**, because the same document states _"Duplicate
information should never exist"_ and the Security Architecture assigns identity to
Supabase Auth. Email lives in `auth.users`; the application reads it from the session
JWT. Storing a copy would create two sources of truth that silently diverge the first
time a user changes their address.

_Proposed documentation update:_ Database Architecture § Users — clarify that `email` is
owned by `auth.users` and that `profiles` holds application-level attributes only.

**Why a trigger rather than application code.** If profile creation lived in the signup
Server Action, any other path into `auth.users` — an admin invite, a future OAuth
provider, a password-recovery flow, a seed script — would create a user with no profile.
The trigger makes "every user has a profile" an invariant of the database rather than a
promise made by one code path.

---

### D3. Tenancy: `owner_id`, resolved through one helper function

**Decision.** Per ADR-0006 and founder direction, the tenant is the user.
`businesses.owner_id → auth.users(id)`. Multiple businesses per user are supported now.

Every **child** table resolves ownership by calling `app.business_access(business_id)`
rather than repeating the ownership predicate inline.

**Why the indirection.** There will eventually be dozens of business-owned tables (launch
plans, tasks, compliance requirements, funding matches, documents, conversations). If each
one hard-codes `owner_id = auth.uid()` through a join, introducing organisations later
means editing every policy in the schema — a migration nobody wants to review. With the
helper, that future change is one function body plus a membership table.

The `businesses` table itself uses the predicate directly. Calling the helper from the
policy that guards the table the helper reads would be circular.

---

### D4. Private schema for helper functions

**Decision.** Helper functions live in a dedicated `app` schema, not in `public`.

**Why.** Supabase exposes `public` through PostgREST, which means **any function created
in `public` becomes a callable API endpoint**. `app.business_access` is an internal
security primitive; publishing it as an RPC would let a client probe which business IDs
exist. The `app` schema is not exposed, and `EXECUTE` is granted narrowly.

---

### D5. `SECURITY DEFINER` with a pinned, empty `search_path`

**Decision.** Security-sensitive functions are `SECURITY DEFINER` with
`SET search_path = ''`, and every object reference inside them is schema-qualified.

**Why `DEFINER`.** `app.business_access` must read `public.businesses` while being called
from a policy on a _different_ table. Under `SECURITY INVOKER` that read would itself be
filtered by RLS, producing recursive policy evaluation.

**Why the empty `search_path`.** This is the classic PostgreSQL privilege-escalation
vector: with a mutable search path, a user who can create objects in a schema earlier in
the path can shadow a table or operator the function references and have it execute with
the definer's privileges. Pinning to `''` and fully qualifying every reference closes it.
Supabase's own database linter flags any `SECURITY DEFINER` function without this.

---

### D6. `timestamptz` everywhere, never `timestamp`

**Decision.** All temporal columns are `timestamptz`. `updated_at` is maintained by a
trigger, never by application code.

**Why.** `timestamp without time zone` silently discards offset information. FoundryAI is
explicitly multi-country — The Bahamas (UTC−4/−5), with Guyana (UTC−4) and future markets
elsewhere — and government deadlines are date-sensitive. A compliance timeline computed
against an ambiguous timestamp is a correctness bug in a regulatory product.

**Why a trigger for `updated_at`.** An application-maintained `updated_at` is wrong the
first time someone writes an `UPDATE` that forgets it, and that error is invisible until
someone debugs a stale dashboard. The database is the only place that cannot forget.

---

### D7. Archival, not deletion

**Decision.** Businesses are never hard-deleted. `status = 'archived'` plus `archived_at`.
No `DELETE` policy exists for `authenticated` on any business-owned table.

**Why.** ADR-0007 makes `archived` a lifecycle state. The Security Architecture requires
audit trails, and the Database Architecture requires rollback capability — both are
defeated by row deletion. Because RLS grants no `DELETE`, a bug in application code
_cannot_ destroy a founder's data; the privilege simply is not there.

**⚠ NOTE.** The API Architecture lists a `Delete Business` endpoint. It maps to archive,
not `DROP`. Hard deletion for data-subject erasure requests is a separate, audited
administrative procedure and is deliberately not exposed to the application — it depends
on the retention policy still open as Q22.

---

### D8. Enum vs. lookup table vs. free text

Three different mechanisms, chosen per column by _who owns the vocabulary_:

| Column                    | Mechanism                    | Reasoning                                                                                                                                                                                                 |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `businesses.status`       | **PostgreSQL enum**          | Fixed, small, and tightly coupled to application code — the services layer switches on it. Adding a state should require a migration; that friction is appropriate for a change this significant.         |
| `businesses.country_code` | **Lookup table + FK**        | _"Country-specific logic never resides inside application code"_ (Platform Architecture). Countries are data, and the `countries` table is a documented entity. ISO 3166-1 alpha-2 as the natural key.    |
| `businesses.industry`     | **Free text + length check** | ⚠ Industry taxonomy belongs to the Knowledge Pack, and Engineering Standards forbid hard-coding business rules that belong there. A database enum would freeze a taxonomy that must vary by jurisdiction. |
| `audit_log.event`         | **Text + format check**      | Audit vocabulary churns constantly. An enum would mean a migration per new event type, which would discourage logging — the opposite of what we want.                                                     |

**Honest trade-off on `industry`.** Free text buys no referential integrity: nothing
stops `"Hospitality"` and `"hospitality "` coexisting. The services layer must validate
against the Knowledge-Pack-sourced list. **This is worth your review** — a lookup table is
cleaner, but is undocumented architecture and I will not introduce it unilaterally
(open question Q-S1 below).

---

### D9. `numeric` for money — never `float`

**Decision.** `funding_requirement_amount numeric(14,2)`, paired with a mandatory
`funding_requirement_currency char(3)` (ISO 4217) whenever an amount is present.

**Why.** Binary floating point cannot represent 0.10 exactly; sums drift. The PRD requires
estimated fees and funding amounts, and the Constitution demands _Truth Before Fluency_ —
a platform that quotes government fees must not quote them approximately.

**Why the paired currency is enforced by constraint.** An amount without a currency is not
a quantity, it is a number. `14,2` accommodates 999,999,999,999.99 — beyond any plausible
SME funding requirement, and cheap to widen later.

---

### D10. RLS: enabled _and_ forced, deny-by-default, one policy per operation

**Decision.**

- `ENABLE ROW LEVEL SECURITY` **and** `FORCE ROW LEVEL SECURITY` on every business-owned table.
- Separate `SELECT` / `INSERT` / `UPDATE` policies. Never `FOR ALL`.
- Every policy scoped `TO authenticated`.
- Privileges explicitly revoked from `anon`.

**Why `FORCE`.** `ENABLE` alone exempts the table owner. Migrations run as a superuser-ish
role, so without `FORCE` a routine maintenance query executes with no isolation at all.

**Why one policy per operation.** `FOR ALL` collapses read and write rules into a single
predicate, so a reviewer cannot see at a glance who may write. Split policies make the
Code Review Checklist question _"is ownership verified before every write?"_ answerable by
reading the policy names.

**Why `TO authenticated`.** Without a role qualifier PostgreSQL evaluates the policy for
`anon` too. Naming the role means an unauthenticated request is rejected before any
predicate runs.

**Deny-by-default is structural:** RLS enabled with no matching policy grants nothing.
There is no `DELETE` policy anywhere, so deletion is impossible through the API.

---

### D11. `(select auth.uid())`, not bare `auth.uid()`

**Decision.** Every policy wraps the call: `owner_id = (select auth.uid())`.

**Why.** This is not stylistic. A bare function call in a policy is re-evaluated **per
row**; wrapping it in a scalar subquery lets the planner hoist it into an InitPlan and
evaluate it **once per query**. On a founder listing tasks this is invisible; on any table
that grows, it is the difference between an index scan and a per-row function call. This
is a documented Supabase performance guideline and is far cheaper to apply now than to
retrofit across every policy later.

---

### D12. The audit log is append-only at the database level

**Decision.** `INSERT`/`UPDATE`/`DELETE` revoked from `anon` and `authenticated`; RLS
enabled with **no policies at all** (unreadable through the API); and `BEFORE UPDATE` /
`BEFORE DELETE` triggers that raise an exception.

**Why the triggers, given the revokes.** `service_role` holds `BYPASSRLS` and broad
privileges — so grants alone would leave the audit trail mutable by any server-side code
holding the service key. A trigger fires regardless of privilege. This makes tamper
resistance a property of the table rather than a property of everyone's good behaviour,
which is what the Security Architecture's _Auditability_ principle actually requires.

**⚠ NOTE.** These triggers also block legitimate retention purges. Purging requires a
documented administrative procedure that drops the trigger inside a transaction, or a
partition-drop strategy. That procedure depends on the retention policy still open as Q22
and should be written before the first purge is needed, not during one.

---

### D13. Intake: typed columns for known fields, JSONB for the rest

**Decision.** `business_profiles` carries typed columns for the fields the Coordinator
Agent's documented input contract requires, plus a `responses jsonb` column for
evolving intake answers, plus `last_completed_step` for resumption.

**Why the hybrid.** The Coordinator specification names its inputs precisely — business
name, country, industry, stage, goals, location, employees, funding requirements. Those
are contractual and get real columns with real constraints. The exact intake _question
set_ remains open (Q6), and modelling questions that may change next week as columns
would mean a migration per wording change. JSONB absorbs that churn without weakening the
fields the AI layer actually depends on.

`responses` is constrained to be a JSON **object**, not a scalar or array, so it cannot
quietly become something the application does not expect.

**Why `last_completed_step` is a column.** Draft persistence and resumption are Sprint 1
acceptance criteria (C3, C4), not polish. Resumability is a data property.

---

### D14. One profile per business, enforced by the database

`business_profiles.business_id` is `UNIQUE NOT NULL` with `ON DELETE CASCADE`. The
Database Architecture describes a 1:1 relationship; a unique constraint is what makes it
one, rather than a convention the application maintains.

---

### D15. Every foreign key is indexed

PostgreSQL creates an index for `PRIMARY KEY` and `UNIQUE`, **but not for foreign keys**.
An unindexed FK makes every parent `UPDATE`/`DELETE` take a full scan of the child table,
and it makes the RLS join in each child policy a sequential scan. Every FK column here has
an explicit index.

Additionally, a **partial** index on `(owner_id, updated_at DESC) WHERE status <>
'archived'` serves the dashboard's default listing — the single most frequent query in the
product — without indexing archived rows nobody lists.

---

### D16. Constraints encode the rules that must never be violated

Beyond keys, the schema asserts:

- names and free-text fields are non-blank and length-bounded (prevents a 2 GB "business name")
- `employee_count >= 0`
- funding amount non-negative, and **currency required whenever an amount exists**
- `status = 'archived'` **if and only if** `archived_at IS NOT NULL` — the two cannot disagree
- country and currency codes match `^[A-Z]{2}$` / `^[A-Z]{3}$`
- JSONB columns are objects
- audit events match a `namespace.event` pattern

**Why in the database rather than only in Zod.** The Security Architecture states _"No
layer assumes another layer has already performed validation."_ Zod protects the request
path; constraints protect the data regardless of which path wrote it — a Server Action, a
future REST endpoint, a seed script, or a migration.

---

### D17. Sprint 1 applies Sprint 1 tables only

**Decision.** The migration creates: `countries`, `profiles`, `businesses`,
`business_profiles`, `audit_log`, two enums, and three functions. Launch plans, tasks,
compliance requirements, funding opportunities, documents, conversations, and knowledge
tables are **designed** in `schema-future-phases.sql` but **not created**.

**Why.** Sprint-01 explicitly places AI, Knowledge, Nova, Funding, and Compliance out of
scope. Creating empty tables for them now would mean shipping RLS policies we cannot yet
test against real access patterns, and would invite a later migration to alter them
anyway. Designing them now proves the Sprint 1 schema does not paint us into a corner;
applying them now would be building outside approved scope.

The future-phase design deliberately lives **outside** `supabase/migrations/` so no
tooling can pick it up.

---

## Part II — Table specifications

### `public.countries` — reference data

| Column          | Type          | Null | Default | Notes                                                |
| --------------- | ------------- | ---- | ------- | ---------------------------------------------------- |
| `code`          | `char(2)`     | no   | —       | **PK.** ISO 3166-1 alpha-2, `^[A-Z]{2}$`             |
| `name`          | `text`        | no   | —       | 1–100 chars                                          |
| `currency_code` | `char(3)`     | no   | —       | ISO 4217, `^[A-Z]{3}$`                               |
| `is_active`     | `boolean`     | no   | `false` | Deployment gate — a country exists before it is live |
| `created_at`    | `timestamptz` | no   | `now()` |                                                      |

**RLS:** readable by all `authenticated`; **no write policy** — reference data changes by
migration or `service_role` only. Seeded with `BS` (Bahamas, BSD) as active, and the six
documented expansion targets as inactive.

---

### `public.profiles` — application-level user attributes

| Column       | Type          | Null | Default | Notes                                             |
| ------------ | ------------- | ---- | ------- | ------------------------------------------------- |
| `id`         | `uuid`        | no   | —       | **PK**, FK → `auth.users(id)` `ON DELETE CASCADE` |
| `full_name`  | `text`        | yes  | —       | 1–150 chars when present                          |
| `created_at` | `timestamptz` | no   | `now()` |                                                   |
| `updated_at` | `timestamptz` | no   | `now()` | trigger-maintained                                |

No `email` — see D2. Created automatically by `app.handle_new_user()`.

**RLS:** owner may `SELECT` and `UPDATE` own row. No `INSERT` policy (trigger only), no
`DELETE` policy (cascades from `auth.users`).

---

### `public.businesses` — the tenancy root

| Column         | Type              | Null | Default             | Notes                                                              |
| -------------- | ----------------- | ---- | ------------------- | ------------------------------------------------------------------ |
| `id`           | `uuid`            | no   | `gen_random_uuid()` | **PK**                                                             |
| `owner_id`     | `uuid`            | no   | —                   | FK → `auth.users(id)` `ON DELETE CASCADE`. **Tenancy column.**     |
| `name`         | `text`            | no   | —                   | 1–200 chars, non-blank                                             |
| `industry`     | `text`            | yes  | —                   | 1–120 chars. Validated by services against the Knowledge Pack (D8) |
| `country_code` | `char(2)`         | no   | —                   | FK → `countries(code)` `ON DELETE RESTRICT`                        |
| `status`       | `business_status` | no   | `'draft'`           | ADR-0007 lifecycle                                                 |
| `archived_at`  | `timestamptz`     | yes  | —                   | Set iff `status = 'archived'`                                      |
| `created_at`   | `timestamptz`     | no   | `now()`             |                                                                    |
| `updated_at`   | `timestamptz`     | no   | `now()`             | trigger-maintained                                                 |

**Indexes:** `owner_id`; `country_code`; partial `(owner_id, updated_at DESC) WHERE status
<> 'archived'`; partial unique `(owner_id, lower(btrim(name))) WHERE status <> 'archived'`
— a founder cannot own two active businesses with the same name, but may reuse a name
after archiving.

**RLS:** `SELECT`/`INSERT`/`UPDATE` where `owner_id = (select auth.uid())`. **No `DELETE`.**

---

### `public.business_profiles` — intake responses (1:1)

| Column                         | Type            | Null | Default             | Notes                                                  |
| ------------------------------ | --------------- | ---- | ------------------- | ------------------------------------------------------ |
| `id`                           | `uuid`          | no   | `gen_random_uuid()` | **PK**                                                 |
| `business_id`                  | `uuid`          | no   | —                   | **UNIQUE**, FK → `businesses(id)` `ON DELETE CASCADE`  |
| `description`                  | `text`          | yes  | —                   | ≤ 5000 chars                                           |
| `founder_goals`                | `text`          | yes  | —                   | ≤ 5000 chars                                           |
| `location`                     | `text`          | yes  | —                   | ≤ 200 chars                                            |
| `business_stage`               | `text`          | yes  | —                   | ≤ 60 chars. ⚠ Values undefined in documentation (Q-S2) |
| `employee_count`               | `integer`       | yes  | —                   | 0 – 1,000,000                                          |
| `funding_requirement_amount`   | `numeric(14,2)` | yes  | —                   | ≥ 0                                                    |
| `funding_requirement_currency` | `char(3)`       | yes  | —                   | Required when amount present                           |
| `responses`                    | `jsonb`         | no   | `'{}'`              | Must be an object                                      |
| `last_completed_step`          | `smallint`      | no   | `0`                 | 0–20. Powers resumption                                |
| `completed_at`                 | `timestamptz`   | yes  | —                   | Set on intake completion                               |
| `created_at` / `updated_at`    | `timestamptz`   | no   | `now()`             |                                                        |

**RLS:** all four operations gated by `app.business_access(business_id)`; no `DELETE`
(cascades from the parent business).

---

### `public.audit_log` — append-only

| Column           | Type          | Null | Default  | Notes                                                                       |
| ---------------- | ------------- | ---- | -------- | --------------------------------------------------------------------------- |
| `id`             | `bigint`      | no   | identity | **PK** (D1)                                                                 |
| `occurred_at`    | `timestamptz` | no   | `now()`  |                                                                             |
| `actor_id`       | `uuid`        | yes  | —        | FK → `auth.users(id)` `ON DELETE SET NULL` — the record survives the user   |
| `business_id`    | `uuid`        | yes  | —        | FK → `businesses(id)` `ON DELETE SET NULL`                                  |
| `event`          | `text`        | no   | —        | `namespace.event` format                                                    |
| `correlation_id` | `uuid`        | yes  | —        | Ties a log entry to the request that caused it (API + Backend Architecture) |
| `ip_address`     | `inet`        | yes  | —        | Native type, not text                                                       |
| `user_agent`     | `text`        | yes  | —        | ≤ 500 chars                                                                 |
| `metadata`       | `jsonb`       | no   | `'{}'`   | Must be an object                                                           |

**RLS:** enabled with **no policies** — invisible to the API. Written by `service_role`
or a `SECURITY DEFINER` service function. Mutation blocked by trigger (D12).

---

## Part III — Functions

| Function                              | Security                                | Purpose                                                        |
| ------------------------------------- | --------------------------------------- | -------------------------------------------------------------- |
| `app.business_access(uuid) → boolean` | `DEFINER`, `STABLE`, `search_path = ''` | Single ownership predicate for every business-owned table (D3) |
| `app.set_updated_at()`                | `INVOKER`, `search_path = ''`           | Trigger — maintains `updated_at` (D6)                          |
| `app.handle_new_user()`               | `DEFINER`, `search_path = ''`           | Trigger on `auth.users` — guarantees a profile exists (D2)     |
| `app.prevent_mutation()`              | `INVOKER`, `search_path = ''`           | Trigger — enforces append-only (D12)                           |

`app.business_access` is `STABLE`, not `VOLATILE`, so PostgreSQL may cache it within a
statement rather than re-running it per row.

---

## Part IV — Open questions raised by this design

These do not block the migration but should be resolved before Phase 2.

| #        | Question                                                                                                                                                                                                      | Impact                                 |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| **Q-S1** | Should `industry` become a lookup table rather than free text? It would give referential integrity, but is undocumented architecture and may conflict with per-jurisdiction taxonomies in the Knowledge Pack. | Data quality; possible later migration |
| **Q-S2** | What are the valid `business_stage` values? Named in the PRD and Coordinator spec, never enumerated. Currently free text.                                                                                     | Intake UI; Coordinator input contract  |
| **Q-S3** | Confirm intake step count (`last_completed_step` bounded 0–20) and the final question set (Q6).                                                                                                               | Intake schema                          |
| **Q-S4** | Audit retention period and purge mechanism — needed because D12 blocks deletion by design.                                                                                                                    | Q22, storage growth                    |
| **Q-S5** | Should `countries` seed the six expansion targets as inactive rows now, or only `BS`? Current design seeds all seven with `is_active` gating.                                                                 | Multi-country readiness                |

---

## Part V — Verification plan (on approval)

Before Phase 1 is called done:

1. Migration applies cleanly to an empty database, and applies twice without error.
2. `tests/rls/` proves — with two real authenticated sessions — that User B cannot
   `SELECT`, `INSERT`, `UPDATE`, or `DELETE` any of User A's rows, on **every** table.
3. Every table reports `rowsecurity = true` and `relforcerowsecurity = true`.
4. The audit log rejects `UPDATE` and `DELETE` even as `service_role`.
5. Generated TypeScript types compile (`npm run db:types`).
6. Supabase database linter reports no `SECURITY DEFINER` search-path warnings.
