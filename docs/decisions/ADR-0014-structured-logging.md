# ADR-0014 — Structured logging and correlation IDs

**Date:** 2026-08-07 · **Status:** Accepted · **Phase:** Sprint 1 Phase 8

## Context

The Backend Architecture requires every request to record a correlation ID, execution time,
errors, agent usage and knowledge version. The API Architecture requires a correlation ID on
every error response. Neither names a logging library, a format, or an observability vendor.

Through Phases 3–7 this was partially met: correlation IDs were generated at the action
boundary, threaded into services, attached to every `AppError`, written to
`audit_log.correlation_id`, and shown to founders as a short support reference. But the
actual log output was `console.error` with interpolated strings — unparseable by any
aggregator, and with no guard against writing personal data into a log line.

Choosing an observability vendor is a real decision with cost and data-residency
implications (the platform targets an emerging market and names government partners), and it
is not one engineering should make unilaterally mid-sprint.

## Options considered

1. **Adopt a vendor SDK now** (Datadog, Sentry, Axiom). Best tooling, but commits the project
   to a vendor and a price before anyone has asked whether the data may leave the
   jurisdiction. Rejected as premature.
2. **Keep `console.error` with interpolated strings.** Zero work, but produces logs nothing
   can query, and offers no protection against logging founder answers. Rejected.
3. **Structured JSON to stdout, vendor-agnostic.** Every major platform — Vercel, CloudWatch,
   Datadog, Axiom — ingests JSON lines from stdout without an SDK. Adopting a vendor later is
   a change to one function.

## Decision

**Option 3.** `lib/logger` emits structured JSON with `level`, `message`, `timestamp` and a
typed context carrying `correlationId`, `userId`, `businessId`, `operation`, `durationMs` and
`code`.

Two properties are enforced in code rather than left to discipline:

- **Redaction.** A denylist strips known-sensitive keys — email, name, passwords, tokens, and
  **the founder's free-text intake answers** (`description`, `founderGoals`, `location`).
  Business descriptions and goals are personal business information; they belong in the
  database, never in a log aggregator. The primary control is not passing them, but a caller
  cannot leak them by accident.
- **Execution time.** `timed()` wraps an operation and records its duration and outcome, so
  the documented requirement cannot be forgotten by a caller.

All raw `console.*` calls in `app/`, `services/` and `lib/` have been replaced. The ESLint
`no-console` rule (warn/error only) remains as a backstop.

## Consequences

- Logs are queryable by correlation ID, operation and business from day one.
- Adopting a vendor later is a change to `emit()` — no call sites move.
- Personal data cannot reach a log line through the logger.
- **Still outstanding:** no vendor is chosen, no alerting exists, no log retention policy is
  defined, and there is no trace propagation across the future agent pipeline. `agentUsage`
  and `knowledgeVersion` fields are named in the Backend Architecture but cannot be populated
  until those subsystems exist.

## References

Backend Architecture (Logging) · API Architecture (Error Handling) · Security Architecture
(Data Privacy — Privacy by Default) · Engineering Understanding Report R-25
