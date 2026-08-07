# ADR-0010 — `auth.users` owns identity; `profiles` owns application attributes

**Date:** 2026-08-05 · **Status:** Accepted · **⚠ Deviates from Database Architecture**

## Context

The Database Architecture specifies a **Users** table with `id`, `email`, `full_name`,
`created_at`, `updated_at`, while also stating that authentication is managed by Supabase
Auth and that _"duplicate information should never exist."_ Supabase already stores
identity and email in `auth.users`. Following the field list literally would create two
sources of truth for a user's email address.

## Decision

Create `public.profiles` with `id` referencing `auth.users(id)` on cascade delete, holding
`full_name` and future application-level attributes.

**Do not store `email`.** It lives in `auth.users` and is read from the session JWT.

Populate `profiles` from an `AFTER INSERT` trigger on `auth.users`, not from application
code.

## Consequences

- One source of truth for email. The two cannot diverge, because there is only one.
- Reading a user's email requires the session or an `auth.users` join rather than a
  `profiles` column. This is a small ergonomic cost for a correctness guarantee.
- "Every user has a profile" becomes a database invariant rather than a promise made by
  one code path — it holds for admin invites, future OAuth, password recovery, and seeds.
- **Documentation update required:** Database Architecture § Users should note that
  `email` is owned by `auth.users` and that `profiles` carries application attributes only.

## References

Database Architecture § Users, § Normalized · Security Architecture § Authentication ·
schema-design.md D2
