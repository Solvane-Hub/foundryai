# Observability & Telemetry

**Version:** 1.0 · **Status:** Canonical — partially implemented (ADR-0014) · **Owner:** Jamil Nash
**Last updated:** 2026-08-07 · **Series:** AI Architecture, document 11 of 15

## 1. Executive Summary

An AI system that cannot be observed cannot be trusted, debugged, or costed. This document specifies what FoundryAI measures and why.

The distinguishing requirement is that observability here must answer **quality** questions, not just health questions. "Is the service up?" is table stakes. "Did coverage recall drop after Tuesday's prompt change?" is the question that matters, and it requires telemetry designed for it.

`lib/logger` (ADR-0014) already implements structured logging with correlation IDs and redaction. This document specifies the rest.

## 2. Purpose

**Scope.** Metrics, traces, logs, dashboards, alerts, and retention for the AI subsystem.

**Not in scope.** Evaluation methodology (document 7) · cost optimisation actions (13) · incident response process.

## 3. Architecture

```
services · agents · workflow runner
        │  structured JSON, correlation_id, no PII (ADR-0014)
        ▼
   stdout ──► aggregator (vendor-agnostic)
        │
        ├── metrics   counters, histograms
        ├── traces    correlation_id spans a whole run
        └── logs      searchable, retained
                │
        dashboards · alerts
```

Writing structured JSON to stdout keeps the platform vendor-neutral. Choosing an aggregator later changes configuration, not code.

## 4. Design Principles

**O1 — Correlation ID everywhere.** One ID ties a founder's action to every step, model call, log line and audit row. Without it, a multi-step AI failure is unreconstructable.

**O2 — Measure quality, not just health.**

**O3 — Never log PII.** Enforced by redaction, including founder free-text answers (ADR-0014).

**O4 — Every model call is accounted.** Tokens, latency, model version, prompt version — cost and reproducibility both depend on it.

**O5 — Alert on what a human should act on.** An alert nobody acts on trains people to ignore alerts.

## 5. What Is Measured

### 5.1 Workflow

| Metric                                        | Type      | Why                          |
| --------------------------------------------- | --------- | ---------------------------- |
| Runs started / completed / failed / cancelled | Counter   | Health                       |
| Run duration                                  | Histogram | Founder-visible latency      |
| Step duration by agent                        | Histogram | Which agent is slow          |
| Retry count by step                           | Counter   | Instability                  |
| Runs resumed after crash                      | Counter   | ADR-0016 working as intended |
| Queue depth · oldest queued run               | Gauge     | Worker capacity              |

### 5.2 Quality

| Metric                               | Type      | Why                                               |
| ------------------------------------ | --------- | ------------------------------------------------- |
| **Quarantine rate by agent**         | Counter   | Rising = degradation                              |
| **Coverage Confidence distribution** | Histogram | Corpus completeness in production                 |
| Trust level distribution             | Counter   | Sudden DERIVED shift = corpus or threshold change |
| Refusal rate (⚪ UNKNOWN)            | Counter   | Too low is suspicious, not good                   |
| Schema validation failures           | Counter   | Prompt or model drift                             |
| Clarification rate                   | Counter   | Coordinator confidence in the wild                |

**Coverage Confidence distribution is the production analogue of evaluation recall.** Evaluation measures 20 curated profiles; this measures every real business. A drift here is the earliest available signal that the corpus no longer matches who is signing up.

### 5.3 Cost

Tokens in/out per step, cost per run, cost per founder, model spend by agent — feeding document 13.

### 5.4 Knowledge

Documents past review date · review queue depth and age · change-detection lag · retrieval hit rate by domain (a domain that never returns results is a coverage gap hiding in plain sight).

## 6. Tracing

The `correlation_id` is generated at the action boundary and threaded through every step, model call, log line and audit row. A trace answers: what did the founder ask, which agents ran, what did retrieval return, what was quarantined and why, what did it cost, how long did it take.

This is also the reproducibility path (document 15) — the same identifier retrieves the full evidence chain.

## 7. Alerts

| Alert                          | Condition                                       | Severity       |
| ------------------------------ | ----------------------------------------------- | -------------- |
| Workflow runner stopped        | No run advanced in 10 min while queue non-empty | 🔴 Page        |
| Failure rate spike             | > 10% of runs failing over 15 min               | 🔴 Page        |
| Quarantine rate spike          | 2× baseline over 1 h                            | 🟠 Investigate |
| Review queue urgent SLA breach | Any urgent item > 4 h                           | 🟠 Investigate |
| Cost anomaly                   | Daily spend > 2× 7-day mean                     | 🟠 Investigate |
| Refusal rate collapse          | ⚪ UNKNOWN rate drops > 50%                     | 🟠 Investigate |
| Freshness sweep missed         | No sweep in 48 h                                | 🟠 Investigate |

**A collapsing refusal rate is an alert, not a celebration.** If the system suddenly stops saying "unknown", the likeliest explanation is that a prompt change removed the refusal instruction — the exact failure document 8 F4 describes.

## 8. Decision Flow — investigating a quality regression

```
quality alert
  ├─ correlate with deploys ── recent prompt/model change? ──► compare prompt_version
  ├─ correlate with knowledge ── recent publish? ──► compare knowledge_version
  ├─ pull affected runs by correlation_id ──► inspect evidence chains
  └─ reproduce against the evaluation set (document 7)
```

Every branch depends on version fields being recorded per execution, which is why document 15 is not optional.

## 9. Security

| Concern                         | Control                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------- |
| PII in logs                     | Redaction denylist including free-text answers (ADR-0014)                                |
| Prompt/response content in logs | **Not logged by default.** Stored in `agent_executions` under RLS, not in the log stream |
| Log access                      | Aggregator access is privileged and audited                                              |
| Correlation ID as an identifier | Random UUID, not derived from user data                                                  |
| Retention                       | Logs 30 days; `agent_executions` per audit policy (open)                                 |

## 10. Failure Modes

| #   | Failure                          | Severity    | Mitigation                                                             |
| --- | -------------------------------- | ----------- | ---------------------------------------------------------------------- |
| F1  | Correlation ID lost mid-pipeline | 🟠 High     | Threaded through the run row; asserted in tests                        |
| F2  | PII reaches logs                 | 🔴 Critical | Redaction tested (`tests/unit/logger.test.ts`)                         |
| F3  | Alert fatigue                    | 🟠 High     | O5; alerts reviewed quarterly and removed if unactioned                |
| F4  | Silent worker death              | 🔴 Critical | Queue-depth alert, not a heartbeat — measures the symptom that matters |
| F5  | Metrics exist but nobody looks   | 🟠 High     | Quality metrics reviewed at each release alongside evaluation          |
| F6  | Log volume cost                  | 🟡 Medium   | Sampling for debug level; info and above always retained               |

## 11. Success Metrics

| Metric                                      | Target  |
| ------------------------------------------- | ------- |
| Runs traceable end-to-end by correlation ID | 100%    |
| Model calls without token accounting        | **0**   |
| PII incidents in logs                       | **0**   |
| Mean time to identify a quality regression  | ≤ 1 day |
| Alerts actioned                             | ≥ 80%   |

## 12. Relationships

**Depends on:** ADR-0014 · ADR-0016 · Backend Architecture (Logging).
**Feeds:** Cost Optimisation (13) · Evaluation (7) · Human Review (10).
**Related:** Versioning (15) · Security Architecture.

## 13. Future Evolution

OpenTelemetry traces when an aggregator is chosen · per-founder cost dashboards · automated regression bisection across prompt versions · Coverage Confidence trend as a public trust indicator once calibrated.

## 14. Open Questions

| #   | Question                                                                |
| --- | ----------------------------------------------------------------------- |
| OB1 | Which aggregator, and does data residency constrain the choice?         |
| OB2 | Retention for `agent_executions` (interacts with audit retention, Q-S4) |
| OB3 | Are quality metrics exposed to founders as a transparency feature?      |

## 15. ADR References

**0014** (structured logging — implemented) · **0016** (run and step telemetry) · 0015 · 0012.
