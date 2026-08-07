# Evidence — Sprint 1 Phase 3 Authentication Verification

**Date:** 2026-08-05
**Environment:** production build (`next start`) against Supabase `obenrkmcqrsyeuylgfzd`

---

## 1. Verification gate

| Gate                          | Result                    |
| ----------------------------- | ------------------------- |
| Typecheck                     | ✅ 0 errors               |
| Lint (incl. layer boundaries) | ✅ 0 errors, 0 warnings   |
| Format                        | ✅                        |
| Unit + integration            | ✅ **43/43**              |
| RLS tenant isolation          | ✅ **30/30**              |
| Build                         | ✅ 9 routes, proxy active |

---

## 2. HTTP-layer verification against the running application

Performed with a **real Supabase session** for `rls.tenant.a@foundryai-test.dev`, obtained
via the password grant and encoded into the `@supabase/ssr` cookie format.

| Scenario                                                    | Expected                     | Observed                                                                                   |
| ----------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| Authenticated `GET /dashboard`                              | 200, renders workspace       | ✅ 200                                                                                     |
| — renders "Welcome" heading                                 | yes                          | ✅                                                                                         |
| — shows signed-in email                                     | yes                          | ✅                                                                                         |
| — greets by profile name                                    | yes                          | ✅ `Welcome, Tenant` — proves the `handle_new_user` trigger data (ADR-0010) reaches the UI |
| — no fabricated compliance data                             | yes                          | ✅ no match for `Business Licence` / `Registrar General`                                   |
| — sign-out control present                                  | yes                          | ✅                                                                                         |
| Authenticated `GET /login`                                  | redirect to `/dashboard`     | ✅ 307 → `/dashboard`                                                                      |
| Anonymous `GET /dashboard`                                  | redirect preserving intent   | ✅ 307 → `/login?next=%2Fdashboard`                                                        |
| Anonymous `GET /login`, `/signup`                           | 200                          | ✅ 200                                                                                     |
| `GET /auth/callback` with no code                           | redirect with error          | ✅ 307 → `/login?error=missing_code`                                                       |
| **Open-redirect probe** `?code=bogus&next=https://evil.com` | must NOT redirect off-origin | ✅ 307 → `/login?error=invalid_link`                                                       |

---

## 3. Security properties verified

- **Route protection** — 8 protected prefixes redirect when unauthenticated, preserving the
  requested path so the founder lands where they intended.
- **Defence in depth** — the `(app)` layout re-checks authentication server-side, so a proxy
  matcher misconfiguration cannot silently expose a protected route.
- **Open redirect blocked** — 12 unit tests plus the live probe above.
- **No user enumeration** — wrong credentials return a generic message; password reset always
  reports success. Asserted in the E2E spec.
- **`getUser()` everywhere** — `getSession()` only reads a cookie and can be spoofed; it is
  not used for any authorization decision.
- **Provider errors never surfaced** — Supabase messages are translated into our own
  vocabulary; the developer message is kept off the wire.

---

## 4. Test inventory

**43 unit tests** — 14 auth validation, 12 open-redirect, 5 error/Result, 3 field-error
mapping, 6 environment, 3 class-name utility.

**11 Playwright cases written** covering route protection, validation, user-enumeration
resistance, the full sign-in → reload → sign-out cycle, and absence of fabricated dashboard
data.

---

## 5. NOT verified — stated explicitly

- **Playwright did not execute.** The sandbox lacks `libXdamage.so.1` and installing system
  libraries requires root. The suite is written and wired into CI but has **never run**.
  Section 2 verifies the same behaviour at the HTTP layer instead; that is weaker than a
  browser run because it does not exercise client-side hydration, `useActionState`, or the
  Server Action round trip.
- **Server Actions were not invoked over HTTP.** Sign-in in section 2 was performed against
  the Supabase auth API directly, then the resulting session was presented to the app. The
  action code path itself is covered only by unit tests of its validation and error mapping.
- **Audit logging is inert.** `SUPABASE_SERVICE_ROLE_KEY` is not configured, so no
  `auth.*` events were written. The service logged the explicit error it is designed to log.
  This must be resolved before Phase 3 can be considered complete against the Security
  Architecture.
- **No accessibility testing.** Fields are wired with `aria-invalid` / `aria-describedby` and
  errors use `role="alert"`, but no `axe` run has been performed and no WCAG target is agreed.
- **Email delivery untested** — confirmation and recovery emails were not sent or received.
