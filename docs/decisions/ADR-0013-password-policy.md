# ADR-0013 — Password policy: length over composition

**Date:** 2026-08-05 · **Status:** Accepted · **Phase:** Sprint 1 Phase 3

## Context

No document specifies a password policy. Supabase Auth's default minimum is 6 characters,
which is too weak for a platform that will hold business and funding information.

## Decision

- **Minimum 12 characters** (Supabase default: 6).
- **Maximum 72 characters** — bcrypt silently truncates beyond 72 bytes, so accepting more
  would give users a false impression of added strength.
- **No composition rules.** No required uppercase, digits, or symbols.
- Sign-_in_ imposes no length rule — only sign-up and reset do.

## Rationale

NIST SP 800-63B explicitly recommends against composition rules: they push users toward
predictable substitutions (`Password1!`) that add little entropy while significantly harming
memorability, which in turn drives password reuse and writing passwords down.

Length is the variable that actually matters. A 25-character passphrase with no symbols is
far stronger than a 10-character password with all four character classes.

**Why no length rule at sign-in.** Enforcing the current minimum at sign-in would lock out
any account created under an earlier policy, and would leak that the policy had changed.
Sign-in validates only that a password was supplied; the credential check is the server's job.

## Consequences

- Stronger passwords in practice, with less user friction.
- Accounts created before this policy are unaffected and can still sign in.
- Raising the minimum later cannot retroactively invalidate existing credentials without a
  forced-reset campaign, which would need its own decision.
- ⚠️ **Not yet addressed:** breached-password screening (e.g. Supabase's HaveIBeenPwned
  integration) and MFA. Both are worth enabling; neither is specified in the architecture.
  Raised for the founder.

## References

NIST SP 800-63B §5.1.1 · Security Architecture (Authentication) · `lib/validation/auth.ts`
