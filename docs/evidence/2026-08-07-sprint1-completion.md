# Sprint 1 — Completion Report

**Sprint:** 1 — Platform Foundation
**Dates:** 2026-08-05 → 2026-08-07
**Status:** ✅ Complete (8 of 9 phases; Phase 2 partial, blocked on founder input)
**Repository:** github.com/jamilnash0/foundryai · **Supabase:** obenrkmcqrsyeuylgfzd

---

## 1. Sprint 1 Definition of Done

> _User can: Register · Login · Create Business · Persist data · Reload · See Dashboard_

| Criterion       | Status | Evidence                                                    |
| --------------- | ------ | ----------------------------------------------------------- |
| Register        | ✅     | `signUpAction`, email confirmation via `/auth/callback`     |
| Login           | ✅     | Verified live: authenticated `GET /dashboard` → 200         |
| Create Business | ✅     | Verified live: `status=draft` on creation                   |
| Persist data    | ✅     | Verified live: intake step saved → HTTP 200                 |
| Reload          | ✅     | Session survives reload; intake resumes at the correct step |
| See Dashboard   | ✅     | Renders real business, status, and journey progress         |

**All six criteria are met.**

## 2. Phase status

| Phase | Name                      | Status                                                                  |
| ----- | ------------------------- | ----------------------------------------------------------------------- |
| P0    | Repo · tooling · CI · env | ✅ Complete                                                             |
| P1    | Data foundation           | ✅ Complete                                                             |
| P2    | Design system             | 🟡 **Partial** — token layer + 9 primitives; brand palette blocked (Q8) |
| P3    | Authentication            | ✅ Complete                                                             |
| P4    | Application shell         | ✅ Complete                                                             |
| P5    | Business creation         | ✅ Complete                                                             |
| P6    | Founder intake            | ✅ Complete                                                             |
| P7    | Dashboard & settings      | ✅ Complete                                                             |
| P8    | Hardening & verification  | ✅ Complete                                                             |

## 3. Verification gate

| Gate                                  | Result                                                 |
| ------------------------------------- | ------------------------------------------------------ |
| Typecheck                             | ✅ PASS — 0 errors, strict mode                        |
| ESLint (incl. 3 layer-boundary rules) | ✅ PASS — 0 errors, 0 warnings                         |
| Prettier                              | ✅ PASS                                                |
| Unit tests                            | **95** across 11 files                                 |
| RLS tenant-isolation tests            | **30**, against a live database with two real sessions |
| E2E specs                             | **4** (smoke, auth, Sprint 1 journey, accessibility)   |
| Production build                      | ✅ PASS (local Windows)                                |

## 4. What exists

**16 routes.** Landing, 4 auth screens, auth callback, dashboard, business creation, intake (+ review), settings, and 5 honest placeholder routes.

**6 Application Services** — auth, business, intake, profile, progress, audit. All business rules live here; `app/` and `components/` cannot reach the database, enforced by ESLint.

**5 database tables** with RLS enabled _and forced_, 9 policies, zero DELETE policies, and an append-only audit log enforced by trigger.

**14 ADRs** recording every non-obvious decision with the options rejected.

**4 evidence records** covering schema, tests, authentication, and Phases 4–6.

## 5. What a founder can do

Register · confirm email · sign in · stay signed in across reloads · create one or more businesses · switch between them · complete a five-step intake with answers saved at every step · **close the browser mid-flow and resume exactly where they left off** · review and edit answers · see real progress and a clear next step · edit account and business details · archive a business · sign out.

## 6. What a founder cannot do — and why nothing pretends otherwise

No compliance requirement, funding match, launch roadmap or task exists. Those depend on the Knowledge Pack and AI layers, which are out of Sprint 1 scope.

**No fabricated data appears anywhere in the product.** Empty states state what will appear and why it is missing; `EmptyState` has no API for "No data". Unbuilt milestones are marked _blocked_ rather than _upcoming_, and are excluded from progress so the platform does not appear permanently stalled. The seed file contains reference data only.

## 7. Defects found and fixed during the sprint

| #   | Defect                                                                                                    | Found by                 |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1   | `NEXT_PUBLIC_SUPABASE_URL` carried `/rest/v1/` → every request 404'd against tables that exist            | Live verification        |
| 2   | `lib/env.ts` threw a raw `TypeError` instead of a validation error (Zod 4 runs refinements after failure) | Founder's local test run |
| 3   | Lifecycle test asserted on the developer message                                                          | Founder's local test run |
| 4–6 | Three `app/ → lib/db` layer violations                                                                    | ESLint layer rule        |
| 7   | ESLint 10 / typescript-eslint 8 peer conflict silently overridden by npm                                  | Install warnings         |
| 8   | Next.js 16 removed `eslint` from `NextConfig`                                                             | Typecheck                |
| 9   | GoTrue could not read manually provisioned users (NULL token columns)                                     | RLS suite                |
| 10  | Shared GoTrue storage key risked cross-tenant session clobbering                                          | Runtime warning          |

Defect 1 is the most significant: it would have presented as a broken database rather than broken configuration. It is now impossible — the env schema rejects it at boot.

## 8. Security posture

- Tenant isolation proven by 30 tests with two real authenticated sessions.
- No `DELETE` policy on any table — deletion is impossible through the API.
- Audit log append-only by trigger, holding against `BYPASSRLS`. Verified functional.
- Both `SECURITY DEFINER` functions pin `search_path`.
- Open-redirect protection on sign-in and `/auth/callback`, with 12 tests.
- No user enumeration on sign-in or password reset.
- `getUser()` for every authorization decision, never `getSession()`.
- Provider errors translated; no internals reach a founder — verified at the serialization boundary.
- Structured logging redacts PII, including founder free-text answers.

**Outstanding (unspecified in architecture):** rate limiting, MFA, breached-password screening, data residency assessment, audit retention policy.

## 9. NOT verified — stated explicitly

- **Playwright has never executed.** 4 specs written and wired into CI; the agent environment lacks `libXdamage`, and no local run has been reported.
- **Accessibility is implemented but unaudited.** No `axe` run has been performed. Static audit found no violations, and the a11y suite targets WCAG 2.1 AA — but that target is still **unconfirmed** (Q23).
- **CI has never run.** No GitHub Actions execution has been observed.
- **Email delivery untested.**
- **No performance or load testing.**
- **No screenshots or demo recording.**

## 10. Blockers carried into Sprint 2

| #   | Blocker                                                         | Blocks                     | Owner   |
| --- | --------------------------------------------------------------- | -------------------------- | ------- |
| 1   | Confidence scale conflict across 4 documents                    | AI agents, Trust Layer     | Founder |
| 2   | Embedding model & dimensionality (`vector(N)` is a column type) | Knowledge Engine           | Founder |
| 3   | `business_stage` vocabulary (Q-S2) — intake already collects it | Coordinator Agent contract | Founder |
| 4   | Brand tokens (Q8)                                               | Design system completion   | Founder |
| 5   | Accessibility target (Q23)                                      | Formal a11y conformance    | Founder |
| 6   | Audit retention & purge procedure (Q-S4)                        | Operations                 | Founder |

## 11. TRL

**Remains TRL 2.** Sprint 1 delivered infrastructure, not proof of the critical function. Full reasoning in the TRL Evidence Register.
