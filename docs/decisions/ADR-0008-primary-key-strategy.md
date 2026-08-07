# ADR-0008 — Primary key strategy

**Date:** 2026-08-05 · **Status:** Accepted

## Context

The Database Architecture specifies an `id` on every entity without stating a type or
generation strategy. This is effectively irreversible: changing a primary key type after
data exists means rewriting every foreign key in the schema.

## Options considered

1. **`bigint` identity everywhere** — smallest, fastest, best index locality. But IDs
   appear in URLs, and sequential IDs disclose platform volume to anyone who registers
   twice a week and subtracts.
2. **UUID v4 everywhere** — no enumeration, no volume disclosure, client-generatable.
   Random values fragment B-tree indexes as tables grow.
3. **UUID v7 everywhere** — time-ordered UUIDs; the benefits of both. Built into
   PostgreSQL 18; not guaranteed on Supabase's current PostgreSQL versions.
4. **Mixed by role** — UUID for entities exposed to clients, `bigint` for internal
   high-volume tables.

## Decision

**Option 4.**

- Domain entities (`businesses`, `business_profiles`, and every future business-owned
  table) use `uuid` with `gen_random_uuid()`.
- `audit_log` uses `bigint generated always as identity`.
- `profiles.id` is the `auth.users.id` UUID — not independently generated.
- `countries.code` uses the ISO 3166-1 alpha-2 natural key.

`gen_random_uuid()` is in PostgreSQL core from v13; no extension required.

## Consequences

- No enumeration surface and no volume disclosure on anything a user can see.
- Audit queries get chronological index locality where it matters most.
- We accept v4 index fragmentation for now. The upgrade to UUIDv7 is a **column default
  change with no type change and no data migration** — recorded here so it is a known
  option rather than folklore.
- The deliberate inconsistency between tables is documented rather than discovered.

## References

Database Architecture · schema-design.md D1
