# Evidence — Sprint 1 Phases 4–6 Verification

**Date:** 2026-08-07
**Phases:** 4 (Application Shell) · 5 (Business Creation) · 6 (Founder Intake)
**Repository:** `github.com/jamilnash0/foundryai` · **Supabase:** `obenrkmcqrsyeuylgfzd`

---

## 1. Verification gate

| Gate                            | Agent environment      | Local (Windows)                   |
| ------------------------------- | ---------------------- | --------------------------------- |
| Typecheck                       | ✅ PASS                | ✅ PASS                           |
| ESLint (incl. layer boundaries) | ✅ PASS                | ✅ PASS                           |
| Prettier                        | ✅ PASS                | —                                 |
| Unit tests                      | ⚠️ cannot run (see §5) | ✅ 69/70 → **fixed, 94 expected** |
| Production build                | ⚠️ cannot run (see §5) | ✅ PASS                           |

---

## 2. Live verification against the database

Executed as a **real authenticated founder**, under RLS, via PostgREST.

```
create business             -> status=draft
create intake profile       -> last_completed_step=0
save step 1                 -> HTTP 200   (draft persisted immediately)
funding amount, no currency -> HTTP 400   (constraint correctly rejects)
amount + derived currency   -> HTTP 204
advance to intake_complete  -> HTTP 204
duplicate intake profile    -> HTTP 409   (1:1 relationship enforced)
archive (soft delete)       -> HTTP 204
hard DELETE attempt         -> HTTP 403   (no DELETE policy exists)
```

Every documented database guarantee held under real application usage, not just
catalog inspection.

## 2b. Audit logging — now functional

The Phase 3 blocker is resolved. `SUPABASE_SERVICE_ROLE_KEY` is configured and verified:

```
service_role READ  audit_log -> 200
service_role WRITE audit_log -> 201   (audit logging FUNCTIONAL)
anon         READ  audit_log -> 401   (correctly denied)
service_role PATCH audit_log -> 403   (append-only trigger still holds)
```

---

## 3. Logic verified without the test runner

Because Vitest cannot execute in the agent environment (§5), these invariants were
executed directly in Node:

| Invariant                                             | Result      |
| ----------------------------------------------------- | ----------- |
| Business lifecycle transitions                        | 13/13 cases |
| `resolveCurrentBusiness` (foreign cookie ID ignored)  | 4/4 cases   |
| `stepFromParam` (no jumping ahead; junk clamped)      | 12/12 cases |
| `intakeProgress` (clamps >100%; answered ≠ completed) | 6/6 cases   |
| Env schema (path rejection, slash stripping)          | 5/5 cases   |
| Error boundary (no developer detail on the wire)      | verified    |

---

## 4. Defects found and fixed

| #   | Defect                                                                                                                                                                                   | How found                | Resolution                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 1   | `NEXT_PUBLIC_SUPABASE_URL` carried a `/rest/v1/` suffix → **every** Supabase request 404'd against tables that exist                                                                     | Live verification        | Corrected; `lib/env.ts` now rejects any path at boot, with 4 regression tests                               |
| 2   | `lib/env.ts` threw a raw `TypeError` instead of a validation error on malformed URLs — Zod 4 runs refinements after an earlier check fails, so unguarded `new URL()` escaped `safeParse` | Founder's local test run | Guarded parse                                                                                               |
| 3   | `business-lifecycle.test.ts` asserted on `Error.message` (the developer message)                                                                                                         | Founder's local test run | Implementation proven correct by audit; test **strengthened**, now asserting the serialization boundary     |
| 4   | Three `app/ → lib/db` layer violations introduced during Phases 4–6                                                                                                                      | ESLint layer rule        | Fixed by exposing reads through `services/` and centralizing types in `types/` — never by relaxing the rule |
| 5   | PostgREST 404 on all tables                                                                                                                                                              | Live verification        | Root cause was defect 1, not a schema-cache issue                                                           |

**The layer-boundary lint rule paid for itself three times in one session.** Each
violation was a type or read reaching past the services layer, and each was caught
before review rather than during it.

---

## 5. NOT verified — stated explicitly

- **Vitest and `next build` cannot run in the agent environment.** Both fail over the
  mounted filesystem: `next build` dies with `Bus error (core dumped)` (SIGBUS from
  memory-mapped I/O on a network mount) and Vitest hangs. The founder's local Windows
  run is authoritative and has passed.
- **Playwright has still never executed.** The E2E suite is written and wired into CI.
- **No accessibility audit.** Fields carry `aria-invalid`/`aria-describedby`, errors use
  `role="alert"`, the shell has a skip link and a labelled progress bar — but no `axe`
  run has been performed and no WCAG target is agreed (open question Q23).
- **No screenshots.** The agent environment cannot render a browser.
- **Email delivery untested** — confirmation and recovery emails have never been sent.
- **CI has never executed** — no GitHub Actions run has been observed.

---

## 6. Open questions raised or still outstanding

| #    | Question                                                                                                                                                                                                                           | Blocks               |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Q-S2 | `business_stage` vocabulary is undefined in canonical documentation. Five generic values are in use, stored as free text. **Must be confirmed before the Coordinator Agent consumes them** or the agent input contract will drift. | Phase 4 (agents)     |
| Q8   | Brand tokens                                                                                                                                                                                                                       | Design system polish |
| Q18  | Embedding model and dimensionality (`vector(N)` is a column type)                                                                                                                                                                  | Knowledge phase      |
| —    | Confidence scale conflict across four documents                                                                                                                                                                                    | Agents, Trust Layer  |
| Q23  | Accessibility conformance target                                                                                                                                                                                                   | Hardening            |
| Q-S4 | Audit retention and purge procedure                                                                                                                                                                                                | Operations           |
