# Evidence — Sprint 1 Phase 0 & 1 Test Results

**Date:** 2026-08-05
**Toolchain:** Node 22.22.3 · Next.js 16.3.0 · React 19.2.8 · TypeScript 5.9.3 ·
Tailwind 4.3.3 · Vitest 4.1.10 · Playwright 1.62.1 · ESLint 9.39.5 · Zod 4.4.3

---

## 1. Full verification gate

| Gate       | Command                                   | Result                        |
| ---------- | ----------------------------------------- | ----------------------------- |
| Typecheck  | `tsc --noEmit`                            | ✅ pass, 0 errors             |
| Lint       | `eslint .`                                | ✅ pass, 0 errors, 0 warnings |
| Format     | `prettier --check .`                      | ✅ pass                       |
| Unit tests | `vitest run tests/unit tests/integration` | ✅ **9/9 passed**             |
| RLS tests  | `vitest run tests/rls`                    | ✅ **30/30 passed**           |
| Build      | `next build`                              | ✅ pass                       |

---

## 2. Layer-boundary enforcement — proven, not asserted

Deliberate violations were written, linted, and then removed. ESLint exited `1` with three
errors:

```
app/__violation.ts
  1:1  error  '@/lib/db/businesses' import is restricted…
        Layer violation: app/ must not query the database directly.
        Route through services/ (Platform Architecture)

components/__violation.ts
  1:1  error  '@/services/noop' import is restricted…
        Layer violation: components/ is presentation only.

lib/ai/__violation.ts
  1:1  error  '@/lib/db/businesses' import is restricted…
        Layer violation: AI agents must never access the database or services.
        Agents return validated JSON; Application Services perform all writes
        (Engineering Standards §8)

✖ 3 problems (3 errors, 0 warnings)     exit=1
```

Engineering Standards §8 is now a build failure rather than a convention.

---

## 3. SQL grammar validation

Validated with `pglast` 8.4 (libpg_query — the actual PostgreSQL parser, not an approximation).

- `supabase/migrations/20260805120000_sprint1_foundation.sql` → **78 statements parsed**
- `docs/architecture/schema-future-phases.sql` → **17 statements parsed**

Parse-tree audit of the migration: RLS enabled on 5/5 tables, forced on 4/4 user tables,
0 DELETE policies, 0 unscoped policies, 2/2 `SECURITY DEFINER` functions with pinned
`search_path`.

---

## 4. RLS integration suite — 30 tests, live database, two real sessions

Run against Supabase project `obenrkmcqrsyeuylgfzd` with two genuinely authenticated
users. No mocks — mocking here would test the mock, not the security boundary.

**Anonymous access (4 tests)** — cannot read `countries`, `businesses`, `profiles`; cannot
insert a business.

**Own-data access (5 tests)** — reads reference data; reads own business; reads own intake
profile; sees exactly one profile row; **multiple businesses per founder confirmed**
(ADR-0006).

**Cross-tenant denial (11 tests)** — Tenant B cannot SELECT, UPDATE, or DELETE Tenant A's
business; sees zero rows in a broad SELECT; **cannot create a business with `owner_id` set
to A (spoofing rejected)**; cannot SELECT, UPDATE, or INSERT against A's intake profile
(`app.business_access` enforced); cannot SELECT or UPDATE A's profile row. After each
attempt, A's data was re-read and confirmed unchanged.

**Deletion (2 tests)** — a founder cannot delete their _own_ business; archival is the
supported path.

**Audit log (3 tests)** — unreadable and unwritable by authenticated and anonymous clients.

**Constraints via the API (6 tests)** — blank name rejected; unknown country code rejected;
`archived` without `archived_at` rejected; funding amount without currency rejected;
negative employee count rejected; second intake profile per business rejected.

```
Test Files  1 passed (1)
     Tests  30 passed (30)
  Duration  4.65s
```

---

## 5. Defects found and fixed during this phase

| #   | Defect                                                                                                                                                   | Detection                       | Resolution                                                                                                 |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| 1   | `next.config.ts` used an `eslint` key removed from `NextConfig` in Next.js 16                                                                            | `tsc --noEmit`                  | Key removed; lint retained as its own CI gate                                                              |
| 2   | Env parsers typed as `NodeJS.ProcessEnv`, which requires `NODE_ENV` and made them untestable in isolation                                                | `tsc --noEmit`                  | Narrowed to `EnvSource = Readonly<Record<string, string \| undefined>>`                                    |
| 3   | ESLint 10 conflicted with `typescript-eslint@8` peer range; npm was silently overriding it                                                               | `npm install` ERESOLVE warnings | Pinned ESLint to 9.39.5 — zero peer conflicts. A toolchain built on overridden peers was not accepted.     |
| 4   | `@typescript-eslint` rules referenced without registering the plugin in the same flat-config object                                                      | `eslint .`                      | Plugin registered explicitly                                                                               |
| 5   | Test env unconfigured, so importing `lib/env` threw at module load                                                                                       | `vitest run`                    | `tests/setup.ts` configures non-secret placeholders — the fail-fast behaviour was correct and was retained |
| 6   | Manually provisioned `auth.users` rows had NULL token columns; GoTrue cannot scan NULL into non-nullable Go strings → _"Database error querying schema"_ | RLS suite sign-in failure       | Token columns coalesced to `''`                                                                            |
| 7   | Multiple GoTrue clients shared one storage key, risking session clobbering between tenants                                                               | Runtime warning during RLS run  | Distinct `storageKey` per client                                                                           |

---

## 6. Not yet tested

Stated explicitly so this record is not read as broader than it is:

- **No E2E run.** `tests/e2e/smoke.spec.ts` exists but Playwright browsers were not
  installed in this environment. It is wired into CI and has not been executed.
- **No accessibility testing.** No `axe` run; no WCAG target agreed (open question Q23).
- **No performance or load testing.**
- **No application code exists to test.** Auth, business creation, intake and dashboard are
  Phases 3–7. The 9 unit tests cover `lib/env` and `lib/utils/cn` only.
