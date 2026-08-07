# FoundryAI — Entity Relationship Reference (Sprint 1)

**Status:** ⏳ Awaiting founder review — migration not yet applied
**Companion documents:** `schema-design.md` (decisions) · `20260805120000_sprint1_foundation.sql` (DDL)

---

## 1. Diagram

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "1:1  identity"
    AUTH_USERS ||--o{ BUSINESSES : "1:N  owner_id"
    COUNTRIES  ||--o{ BUSINESSES : "1:N  country_code"
    BUSINESSES ||--|| BUSINESS_PROFILES : "1:1  intake"
    AUTH_USERS ||--o{ AUDIT_LOG : "0..N  actor_id"
    BUSINESSES ||--o{ AUDIT_LOG : "0..N  business_id"

    AUTH_USERS {
        uuid id PK "Supabase-managed"
        text email "source of truth"
    }
    PROFILES {
        uuid id PK_FK "= auth.users.id"
        text full_name
        timestamptz created_at
        timestamptz updated_at
    }
    COUNTRIES {
        char code PK "ISO 3166-1 alpha-2"
        text name
        char currency_code "ISO 4217"
        boolean is_active "deployment gate"
    }
    BUSINESSES {
        uuid id PK
        uuid owner_id FK "TENANCY COLUMN"
        char country_code FK
        text name
        text industry "Knowledge Pack validated"
        business_status status
        timestamptz archived_at
    }
    BUSINESS_PROFILES {
        uuid id PK
        uuid business_id FK_UQ "1:1 enforced"
        text description
        text founder_goals
        text business_stage
        integer employee_count
        numeric funding_requirement_amount
        jsonb responses
        smallint last_completed_step
        timestamptz completed_at
    }
    AUDIT_LOG {
        bigint id PK "identity, not uuid"
        uuid actor_id FK "SET NULL"
        uuid business_id FK "SET NULL"
        text event
        uuid correlation_id
        inet ip_address
        jsonb metadata
    }
```

---

## 2. Every relationship

| #   | Parent       | Child               | Cardinality | Foreign key                                         | On delete  | Why                                                                                                                                      |
| --- | ------------ | ------------------- | ----------- | --------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `auth.users` | `profiles`          | **1 : 1**   | `profiles.id` (PK **and** FK)                       | `CASCADE`  | The PK _is_ the FK, so a second profile is structurally impossible. Created by trigger, so the relationship cannot be missing either.    |
| R2  | `auth.users` | `businesses`        | **1 : N**   | `businesses.owner_id`                               | `CASCADE`  | The ownership edge. Founder direction: multiple businesses per user. Deleting the account removes the businesses.                        |
| R3  | `countries`  | `businesses`        | **1 : N**   | `businesses.country_code`                           | `RESTRICT` | Jurisdiction is data, not code. `RESTRICT` — never orphan a business by removing a country.                                              |
| R4  | `businesses` | `business_profiles` | **1 : 1**   | `business_profiles.business_id` (`UNIQUE NOT NULL`) | `CASCADE`  | Intake responses belong to exactly one business. `UNIQUE` is what makes it 1:1 rather than a convention.                                 |
| R5  | `auth.users` | `audit_log`         | **0 .. N**  | `audit_log.actor_id` (nullable)                     | `SET NULL` | ⚠️ **Not** `CASCADE`. The audit record must outlive the user it describes — cascading would let account deletion erase its own evidence. |
| R6  | `businesses` | `audit_log`         | **0 .. N**  | `audit_log.business_id` (nullable)                  | `SET NULL` | Same reasoning. Nullable because some events (`auth.signed_in`) have no business context.                                                |

**Both `audit_log` FKs are nullable and `SET NULL` by design.** That is the one place in the schema where referential looseness is deliberate: an audit trail that can be destroyed by deleting a row elsewhere is not an audit trail.

---

## 3. Cardinality at a glance

```
auth.users ──1:1──> profiles                  exactly one, guaranteed by trigger + PK
auth.users ──1:N──> businesses                zero or more (founder direction)
countries  ──1:N──> businesses                exactly one country per business (NOT NULL)
businesses ──1:1──> business_profiles         zero or one until intake starts, then exactly one
auth.users ──0:N──> audit_log                 optional both ways
businesses ──0:N──> audit_log                 optional both ways
```

**Note on R4.** A business exists in `draft` before intake begins, so `business_profiles` is
_zero-or-one_ in practice — the row is created when intake starts (`intake_started`) and is
unique thereafter. The database enforces "at most one"; the services layer enforces "exactly
one once intake has begun."

---

## 4. Ownership model

Five ownership classes. Every table belongs to exactly one, and the class determines its RLS shape.

| Class                 | Tables                                         | Read              | Write               | RLS predicate                                             |
| --------------------- | ---------------------------------------------- | ----------------- | ------------------- | --------------------------------------------------------- |
| **External identity** | `auth.users`                                   | Supabase Auth     | Supabase Auth       | Managed by Supabase, not by us                            |
| **Identity-owned**    | `profiles`                                     | own row           | own row             | `id = (select auth.uid())`                                |
| **Tenancy root**      | `businesses`                                   | own rows          | own rows            | `owner_id = (select auth.uid())` — direct, not via helper |
| **Business-owned**    | `business_profiles`, and every Phase 3–7 child | via owner         | via owner           | `app.business_access(business_id)`                        |
| **Global reference**  | `countries`, future `knowledge_*`              | all authenticated | `service_role` only | `using (true)` / `using (is_published)`                   |
| **System**            | `audit_log`                                    | ❌ none           | ❌ none             | RLS on, **zero policies** — invisible to the API          |

### Why `businesses` uses the predicate directly

`app.business_access()` reads `public.businesses`. Calling it from the policy that guards
`businesses` would mean the policy invokes a function that reads the table the policy guards —
recursive evaluation. The tenancy root therefore inlines `owner_id = (select auth.uid())`;
**every other business-owned table calls the helper.**

### Why the helper exists at all

This is the single most important structural decision in the schema. Instead of every child
table repeating a join back to `businesses`, ownership resolves through one function body:

```sql
app.business_access(p_business_id uuid) → boolean
  ⇢ exists(select 1 from businesses
            where id = p_business_id
              and owner_id = (select auth.uid()))
```

With ~15 business-owned tables by Phase 7, introducing organisations means editing **one
function** plus adding a membership table — not rewriting every policy in the schema.

### Deletion

There is **no `DELETE` policy on any table**. Businesses are archived
(`status = 'archived'` + `archived_at`, enforced consistent by CHECK constraint). Child rows
cascade only if a parent is removed by an administrator outside the API. A bug in application
code cannot destroy a founder's data, because the privilege does not exist.

---

## 5. How Phase 3–7 tables attach

Every future table hangs off `businesses` and inherits the same RLS shape:

```
businesses
├── business_profiles        1:1   (Sprint 1)
├── launch_plans             1:1   → tasks 1:N → task_dependencies M:N (self)
├── compliance_requirements  1:N
├── funding_opportunities    1:N
├── workflow_runs            1:N   → agent_executions 1:N
├── conversations            1:N   → conversation_messages 1:N
└── documents                1:N

countries
└── knowledge_documents      1:N   → knowledge_chunks 1:N     [global, NOT business-owned]
```

**One deliberate denormalisation to flag.** `tasks` carries `business_id` _in addition to_
`launch_plan_id`, even though it is reachable through the plan. This keeps the RLS predicate a
single indexed lookup instead of a join on every row read. It trades against the Database
Architecture's _"duplicate information should never exist"_ principle, and is the only place in
the design that does so. Raised for your decision in `schema-design.md`; the same question will
apply to `conversation_messages` at Phase 6.

**Knowledge is not business-owned.** It attaches to `countries`, is readable by every
authenticated user, and is written only by the ingestion pipeline. It must never use
`app.business_access` — knowledge is global, and scoping it to a business would break
retrieval entirely.
