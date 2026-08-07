# ADR-0012 — Audit write path and failure policy

**Date:** 2026-08-05 · **Status:** Accepted · **Phase:** Sprint 1 Phase 3

## Context

The Security Architecture requires authentication, business creation, AI generation,
knowledge updates and administrative actions to be recorded. ADR-0009 and schema-design D12
made `audit_log` unreachable from the API: RLS enabled with **zero policies**, all grants
revoked from `anon` and `authenticated`, and mutation blocked by trigger.

That is the correct posture for reads — and it means the application has no way to _write_
an audit row through the normal request path. A write mechanism had to be chosen.

## Options considered

1. **`SECURITY DEFINER` function in `public`, granted to `authenticated`.**
   Keeps the service-role key out of the application entirely. But `public` is exposed by
   PostgREST, so the function becomes a callable RPC endpoint — the exact pattern
   ADR-0009 §8 exists to prevent, and the same finding we raised against the pre-existing
   `rls_auto_enable()`. A caller could also forge event names and metadata at will.
   **Rejected** — we should not create the vulnerability class we flagged.

2. **Function in the private `app` schema.** Not reachable: `app` is deliberately not
   exposed to PostgREST, so there is no RPC surface to call. **Not viable.**

3. **Service-role client, server-side only.** The standard Supabase pattern. The key never
   reaches the browser; `audit_log` keeps zero API surface; no forgeable RPC exists.
   Cost: the application holds a key that bypasses all RLS.

## Decision

**Option 3.** Audit writes go through `lib/supabase/admin.ts`, which is server-only and
returns `null` when `SUPABASE_SERVICE_ROLE_KEY` is absent so callers must handle it
explicitly rather than silently proceeding without an audit trail.

Guard rails, enforced by convention and review because they cannot be enforced by the type
system:

- never imported from a Client Component
- **never used to read or return user data** — reads always use the request-scoped client so
  RLS applies
- currently used for exactly one table: `audit_log`

### Failure policy — fail open, loudly

An audit write failure is logged at error level but does **not** fail the user's action.

Failing a founder's sign-in because an audit insert hiccupped would convert a logging fault
into an availability fault, and would be trivially abusable as a denial-of-service: an
attacker who can degrade the audit path could lock every user out.

The trade-off is explicit: **a lost audit row is possible.** It is made visible rather than
silent. If a future compliance requirement demands fail-closed for specific event types,
that should be a per-event policy, not a blanket one, and needs its own ADR.

## Consequences

- `audit_log` retains zero API surface and no forgeable RPC.
- The application now requires `SUPABASE_SERVICE_ROLE_KEY` to record audit events. **Until it
  is configured, auth events are NOT recorded** — the service logs an explicit error rather
  than failing quietly.
- A leaked service-role key is catastrophic. It must live only in server-side environment
  configuration, never in `NEXT_PUBLIC_*`, and should be rotated on any suspicion.
- No PII is written to audit metadata (no email, no name) — Privacy by Default.

## References

Security Architecture (Audit Logging, Secrets Management) · ADR-0009 · schema-design.md D12 ·
`docs/evidence/2026-08-05-phase1-schema-verification.md` §10
