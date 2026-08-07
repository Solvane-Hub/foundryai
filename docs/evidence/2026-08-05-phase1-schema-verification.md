# Evidence — Sprint 1 Phase 1 Schema Verification

**Date:** 2026-08-05
**Project:** Supabase `obenrkmcqrsyeuylgfzd` (FoundryAI) · PostgreSQL 17.6.1.155 · us-east-1
**Migration:** `20260805120000_sprint1_foundation`
**Method:** Direct `pg_catalog` queries after migration. Not derived from the migration
tool's success flag — the catalog is the ground truth.

---

## 1. Pre-migration state

```
list_migrations → []
list_tables(public, app) → []
```

Database was empty. No prior migrations.

---

## 2. Table structure, RLS, indexes, constraints

Query:

```sql
select c.relname, c.relrowsecurity, c.relforcerowsecurity,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policies,
       (select count(*) from pg_index i where i.indrelid=c.oid) as indexes,
       (select count(*) from pg_constraint k where k.conrelid=c.oid and k.contype='c') as check_constraints,
       (select count(*) from pg_constraint k where k.conrelid=c.oid and k.contype='f') as foreign_keys,
       (select count(*) from pg_trigger t where t.tgrelid=c.oid and not t.tgisinternal) as triggers
from pg_class c
where c.relnamespace='public'::regnamespace and c.relkind='r' order by c.relname;
```

Result:

| table               | rls_enabled | rls_forced | policies | indexes | checks | fks | triggers |
| ------------------- | ----------- | ---------- | -------- | ------- | ------ | --- | -------- |
| `audit_log`         | true        | true       | 0        | 6       | 3      | 2   | 2        |
| `business_profiles` | true        | true       | 3        | 3       | 10     | 1   | 1        |
| `businesses`        | true        | true       | 3        | 5       | 3      | 2   | 1        |
| `countries`         | true        | **false**  | 1        | 1       | 3      | 0   | 0        |
| `profiles`          | true        | true       | 2        | 1       | 1      | 1   | 1        |

**`audit_log` has 0 policies — intentional** (schema-design.md D12): RLS enabled with no
policy grants nothing, making the table invisible through PostgREST.

**`countries` is not FORCED — intentional**: public reference data seeded by migration;
forcing would block the seed.

---

## 3. RLS policies

| table               | policy                           | cmd    | roles         | predicate                                 |
| ------------------- | -------------------------------- | ------ | ------------- | ----------------------------------------- |
| `business_profiles` | `business_profiles_insert_own`   | INSERT | authenticated | check: `app.business_access(business_id)` |
| `business_profiles` | `business_profiles_select_own`   | SELECT | authenticated | using: `app.business_access(business_id)` |
| `business_profiles` | `business_profiles_update_own`   | UPDATE | authenticated | both: `app.business_access(business_id)`  |
| `businesses`        | `businesses_insert_own`          | INSERT | authenticated | check: `owner_id = (SELECT auth.uid())`   |
| `businesses`        | `businesses_select_own`          | SELECT | authenticated | using: `owner_id = (SELECT auth.uid())`   |
| `businesses`        | `businesses_update_own`          | UPDATE | authenticated | both: `owner_id = (SELECT auth.uid())`    |
| `countries`         | `countries_select_authenticated` | SELECT | authenticated | using: `true`                             |
| `profiles`          | `profiles_select_own`            | SELECT | authenticated | using: `id = (SELECT auth.uid())`         |
| `profiles`          | `profiles_update_own`            | UPDATE | authenticated | both: `id = (SELECT auth.uid())`          |

**9 policies. Zero DELETE policies** — deletion is impossible through the API (ADR-0009).
**Every policy is scoped to `authenticated`** — none evaluates for `anon`.
**`(SELECT auth.uid())` confirmed in the stored expression** — the InitPlan optimisation
survived into the catalog, so it is evaluated once per query rather than once per row.

---

## 4. Functions

| function                                  | security | volatility | search_path   |
| ----------------------------------------- | -------- | ---------- | ------------- |
| `app.business_access(p_business_id uuid)` | DEFINER  | stable     | `""` (pinned) |
| `app.handle_new_user()`                   | DEFINER  | volatile   | `""` (pinned) |
| `app.prevent_mutation()`                  | INVOKER  | volatile   | `""` (pinned) |
| `app.set_updated_at()`                    | INVOKER  | volatile   | `""` (pinned) |

Both `SECURITY DEFINER` functions have an empty pinned `search_path`, closing the
privilege-escalation vector (schema-design.md D5). All four live in the private `app`
schema, which PostgREST does not expose.

---

## 5. Append-only enforcement (executed as the privileged migration role)

```sql
insert into public.audit_log (event, metadata) values ('test.append_only_probe', '{"probe":true}');
update public.audit_log set event='tampered' where id = <probe>;   -- expected to fail
delete from public.audit_log where id = <probe>;                   -- expected to fail
```

Both raised `SQLSTATE 42501` and were caught by the `insufficient_privilege` handler; the
`DO` block completed without reaching either `FAIL` branch.

Post-condition: `probe_rows_remaining = 1` — the row survived the DELETE attempt.

**Conclusion:** append-only is enforced by trigger, and therefore holds even against a role
carrying `BYPASSRLS`. Privilege revocation alone would not have achieved this.

⚠️ **Known artifact:** the probe row (`event = 'test.append_only_probe'`) is permanent by
design and cannot be removed without the documented purge procedure (open item Q-S4).

---

## 6. Identity trigger (ADR-0010)

Two users inserted into `auth.users`. Result:

| email                             | profile_created | full_name |
| --------------------------------- | --------------- | --------- |
| `rls.tenant.a@foundryai-test.dev` | true            | Tenant A  |
| `rls.tenant.b@foundryai-test.dev` | true            | Tenant B  |

`app.handle_new_user()` fired on insert and extracted `full_name` from
`raw_user_meta_data`. "Every auth user has a profile" is a database invariant, not a
promise made by application code.

---

## 7. Anonymous role denial (live HTTP, not catalog inspection)

```
GET /rest/v1/countries?select=code&limit=1   (apikey: anon)
→ 401  {"code":"42501","message":"permission denied for table countries"}
```

Grants to `anon` were correctly revoked.

---

## 8. Reference data seed

| code | name                | currency | active   |
| ---- | ------------------- | -------- | -------- |
| BS   | The Bahamas         | BSD      | **true** |
| BB   | Barbados            | BBD      | false    |
| BZ   | Belize              | BZD      | false    |
| GY   | Guyana              | GYD      | false    |
| JM   | Jamaica             | JMD      | false    |
| TT   | Trinidad and Tobago | TTD      | false    |

Reference data only. No fabricated business, compliance, or funding data was seeded
(Constitution — _Truth Before Fluency_ applies to seeds as well as to AI output).

---

## 9. Supabase security linter

| level | finding                                                                                                        | assessment                                                |
| ----- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| INFO  | `public.audit_log` has RLS enabled but no policies                                                             | **Intentional** — D12. Accepted, not remediated.          |
| WARN  | `public.rls_auto_enable()` is `SECURITY DEFINER`, executable by `anon` and `authenticated` via `/rest/v1/rpc/` | **Pre-existing; not created by this migration.** See §10. |

No findings against any object created by this migration.

---

## 10. Pre-existing finding — `public.rls_auto_enable()`

Not authored by this migration. An event-trigger function that auto-enables RLS on new
tables in `public`. Owner `postgres`, `SECURITY DEFINER`, `search_path` set to `pg_catalog`,
`EXECUTE` granted to `PUBLIC`, `anon`, `authenticated`, `postgres`, `service_role`.

**Assessed risk: LOW.** `RETURNS event_trigger` functions cannot be invoked through
PostgREST RPC — PostgreSQL rejects direct calls to trigger functions. The `search_path` is
also pinned.

**Assessed hygiene: POOR.** It is exactly the pattern ADR-0009 §8 exists to prevent, and the
linter will continue to flag it.

**Recommended remediation (NOT applied — outside Sprint 1 scope, awaiting founder approval):**

```sql
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
```

Event triggers fire through the event-trigger mechanism and do not require `EXECUTE` grants,
so this revocation does not affect its function.
