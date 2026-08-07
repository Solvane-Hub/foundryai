# Changelog

All notable changes to FoundryAI are recorded here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project is pre-release; versions are sprint-scoped until first deployment.

---

## [Unreleased] — Sprint 1 (Platform Foundation)

### Phase 3 — Authentication · 2026-08-05

**Added**

- Email/password authentication: sign up, sign in, sign out, password reset request, and
  password reset completion — all as Server Actions (ADR-0003).
- `proxy.ts` (Next.js 16.3 replaces the `middleware` convention) — refreshes the session on
  every navigation and enforces route protection across 8 protected prefixes.
- Defence in depth: the `(app)` layout re-checks authentication server-side. Middleware can
  be disabled by a matcher change; the layout check cannot.
- `/auth/callback` route handler exchanging email-confirmation and recovery codes for a
  session — a GET navigation target from an email, which is the documented REST exception.
- Application Services layer: `services/auth` and `services/audit`. Server Actions validate
  and delegate; they hold no business logic.
- `lib/errors` — typed errors carrying a **human message** (safe to render) separately from
  a developer message (never rendered), plus a correlation ID surfaced to users as a support
  reference.
- Auth Zod schemas (ADR-0005) and per-field error mapping.
- Minimum UI primitives against the existing token layer: Button, Input, Field, Alert.
  `Field` wires label, description and error via `aria-describedby` / `aria-invalid`.
- Audit logging of `auth.registered`, `auth.signed_in`, `auth.signed_out`,
  `auth.password_reset_requested`, `auth.password_reset_completed`.
- 34 new unit tests (43 total) and an 11-case Playwright auth suite.
- ADR-0012 (audit write path and fail-open policy), ADR-0013 (password policy).

**Security**

- **Open-redirect protection** on the post-sign-in `next` parameter and on `/auth/callback`.
  A user who has just entered credentials is maximally phishable, so this is treated as a
  security control and covered by 12 dedicated tests.
- **No user enumeration.** Wrong credentials return "That email or password is incorrect";
  password reset always reports success regardless of whether the account exists.
- Passwords: 12-character minimum, no composition rules, 72-byte cap (ADR-0013).
- `getUser()` used for every authorization decision — never `getSession()`, which only reads
  a cookie and can be spoofed.
- Supabase provider error strings are translated to our own vocabulary and never surfaced.
- No PII in audit metadata.

**Changed**

- `middleware.ts` → `proxy.ts`; `lib/supabase/middleware.ts` → `lib/supabase/proxy-session.ts`
  (Next.js 16.3 deprecation).
- Landing page now links into the real auth flow.

**Known gaps**

- `SUPABASE_SERVICE_ROLE_KEY` is not configured, so **audit events are not being recorded**.
  The service logs an explicit error rather than failing quietly (ADR-0012).
- Playwright cannot run in the current environment (missing `libXdamage.so.1`, needs root).
  The auth E2E suite is written and wired into CI but has **not** been executed. The same
  behaviour was instead verified at the HTTP layer against the running app with a real
  session — see the Phase 3 evidence record.
- Breached-password screening and MFA are not enabled and are unspecified in the architecture.

### Documentation Operations · 2026-08-05

**Corrected**

- **The FoundryAI Codex exists.** It was reported missing during Sprint 1 planning because it
  was absent from the synced engineering Knowledge base, not from the workspace. Located in
  Notion, read, and confirmed not to conflict with any decision taken. The Codex is a
  structural contents index; no rework was required.

**Added**

- `docs/evidence/` — dated verification records for schema and tests.
- `CHANGELOG.md` — this file. The Master Documentation Index requires a change log in every
  document; none existed.

**Synchronised to Notion** — Database Architecture (3 corrections + implementation status),
Security Architecture (authorization model corrected to user-owned tenancy, plus function
security and audit integrity sections), Development Roadmap (Phase 1 status), API
Architecture (Server Actions decision rule), Engineering Standards (enforcement mechanisms),
Frontend Architecture (directory structure extension), Claude Code Master Context (layer
boundaries + ADR register), Master Documentation Index (repository documentation section +
status corrections), Trust Layer (confidence-scale conflict flag + Learning Layer
reclassified as concept). Created: Sprint Notes, Development Journal, TRL Evidence Register.
Appended: Buildathon Logbook Entry 001.

**Synchronised to Google Drive** — schema verification evidence (`04 Database`), test results
(`13 Buildathon/Judging Evidence`), TRL assessment (`13 Buildathon/TRL Evidence`),
engineering log (`09 Daily Log`).

### Phase 1 — Data Foundation · 2026-08-05

**Added**

- Sprint 1 database schema applied to Supabase (`20260805120000_sprint1_foundation`):
  `countries`, `profiles`, `businesses`, `business_profiles`, `audit_log`.
- `app.business_access(uuid)` — the single ownership predicate for every business-owned
  table. Introducing organisations later is a change to this one function body.
- `business_status` enum implementing the approved lifecycle: `draft` → `intake_started`
  → `intake_complete` → `launch_plan_generated` → `active` → `archived`.
- Append-only `audit_log` enforced by trigger, so it holds against roles carrying
  `BYPASSRLS` — not by privilege revocation alone.
- `app.handle_new_user()` trigger guaranteeing every `auth.users` row has a profile.
- 9 RLS policies across 5 tables. **No `DELETE` policy anywhere** — deletion is impossible
  through the API by design.
- Generated `types/database.ts` and a `db:types` script.
- `tests/rls/` — 30 tenant-isolation tests running against a live database with two real
  authenticated sessions.
- CI job for the RLS suite with `RLS_TESTS_REQUIRED=1`, so a missing configuration fails
  rather than silently skipping a security suite.
- `docs/architecture/schema-design.md`, `er-diagram.md`, `schema-future-phases.sql`.
- `docs/evidence/` — schema verification and test results.
- ADR-0008 (primary keys), ADR-0009 (RLS policy pattern), ADR-0010 (identity ownership),
  ADR-0011 (controlled denormalization for RLS).

**Security**

- `FORCE ROW LEVEL SECURITY` on all four user-data tables, so RLS is not bypassed by the
  table owner during maintenance.
- Both `SECURITY DEFINER` functions pin `search_path = ''`, closing the shadowing
  privilege-escalation vector.
- Helper functions isolated in a private `app` schema, which PostgREST does not expose.
- Grants revoked from `anon` on every table; verified by live HTTP returning `42501`.

**Known issues**

- Pre-existing `public.rls_auto_enable()` is `SECURITY DEFINER` and executable by `anon`.
  Assessed LOW risk (event-trigger functions cannot be invoked via RPC). **Not modified** —
  outside Sprint 1 scope, awaiting founder approval.
- One permanent probe row exists in `audit_log` from append-only verification. It cannot be
  removed without the purge procedure, which is not yet defined (Q-S4).

---

### Phase 0 — Foundation & Engineering Workflow · 2026-08-05

**Added**

- Next.js 16.3 App Router · React 19.2 · TypeScript 5.9 (strict) · Tailwind 4.3 ·
  Zod 4.4 · Vitest 4.1 · Playwright 1.62.
- ESLint flat config enforcing three architectural layer boundaries as **build failures**:
  `app/` ✗ `lib/db`; `lib/ai/` ✗ `lib/db` and `services/`; `components/` ✗ `services/`.
- `lib/env.ts` — Zod-validated environment, fail-fast at boot.
- CI: typecheck → lint → format → test → build, plus E2E and dependency-audit jobs.
- PR template mirroring the Engineering Standards code review checklist.
- `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`.
- ADR-0001 through ADR-0007.

**Changed**

- ESLint pinned to 9.39.5 rather than 10.x: npm was silently overriding a peer conflict
  with `typescript-eslint@8`. Correctness over recency.
- TypeScript pinned to 5.9.x rather than 7.x, which is not yet verified against the
  Next.js and ESLint toolchains. A deliberate future upgrade, not an incidental one.
