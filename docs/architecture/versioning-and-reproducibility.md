# Versioning & Reproducibility

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 15 of 15

## 1. Executive Summary

The Constitution requires that a human can always reproduce the reasoning path behind any recommendation. This document specifies what must be recorded for that to be true.

The requirement is not academic. A founder may be penalised, a partner may audit us, or we may need to know why the platform said something six months ago. In every case the answer must be retrievable — not reconstructed from memory or inferred from logs.

Reproducibility here means: **given a stored recommendation, we can state exactly which knowledge, which prompt, which model and which evidence produced it.**

## 2. Purpose

**Scope.** What is versioned, what is recorded per generation, how a recommendation is replayed, and the difference between replay and re-run.

**Not in scope.** Code deployment · database migrations · plan version semantics (document 2 §7).

## 3. Architecture

```
every AI-generated object records:
  ├─ knowledge_version   which corpus state
  ├─ prompt_version      which instructions
  ├─ model_version       which model
  ├─ agent_version       which contract
  ├─ citations[]         which chunks, immutable
  └─ correlation_id      which run

           │
     replay ──► retrieve the exact inputs ──► explain the output
     re-run ──► execute again with current versions ──► compare
```

The schema already reserves these columns (`schema-future-phases.sql`, Pattern A).

## 4. Design Principles

**V1 — Version everything that can change an answer.** Knowledge, prompt, model, agent contract.

**V2 — Immutable evidence.** A citation points at a chunk version that never changes. New text is a new chunk.

**V3 — Replay is not re-run.** Replay reconstructs _why we said what we said_. Re-run produces what we _would say now_. Both are needed and they are different operations.

**V4 — Reproducibility is stored, not derived.** Logs are retained for 30 days; recommendations last for years. The evidence chain lives in the database.

**V5 — Non-determinism is acknowledged, not hidden.** Models are stochastic. Replay reconstructs inputs and the recorded output; it does not promise that re-running produces identical text.

## 5. What Is Versioned

| Artefact            | Scheme          | Changes when                                 |
| ------------------- | --------------- | -------------------------------------------- |
| **Knowledge Pack**  | `BS-v1.4`       | Any document published or unpublished        |
| **Knowledge chunk** | immutable id    | Never — re-ingestion creates new chunks (V2) |
| **Prompt**          | `agent@1.2.0`   | Any edit (document 8 §P2)                    |
| **Model**           | provider string | Provider version change                      |
| **Agent contract**  | `1.0.0`         | Envelope or behaviour contract changes       |
| **Launch Plan**     | integer         | Regeneration (document 2 §7)                 |

## 6. The Evidence Chain

For any stored recommendation:

```
recommendation
  ├─ correlation_id ─────► workflow_runs ─► agent_executions (every step)
  │                             ├─ input · output (jsonb)
  │                             ├─ model_version · prompt_version
  │                             └─ latency · tokens
  ├─ citations[] ────────► knowledge_chunks (immutable)
  │                             └─► knowledge_documents (source, dates, authority)
  ├─ knowledge_version ──► corpus state at generation
  └─ trust dimensions ───► how it was classified and why
```

This answers, without inference: what did the founder ask · what did retrieval return · what did each agent conclude and from which passage · how was it classified · what did it cost.

## 7. Replay vs Re-run

|             | Replay                             | Re-run                       |
| ----------- | ---------------------------------- | ---------------------------- |
| Question    | "Why did we say this?"             | "Would we still say this?"   |
| Inputs      | Recorded, historical               | Current                      |
| Model calls | **None** — reads stored data       | Yes                          |
| Cost        | Free                               | Full generation              |
| Used for    | Audit, dispute, support, debugging | Staleness checks, evaluation |

**Replay makes no model calls.** That is what makes it trustworthy as an audit mechanism — it cannot produce a different answer than the one recorded.

## 8. Decision Flow — investigating a disputed recommendation

```
founder disputes a requirement
  ├─ replay by correlation_id
  │     ├─ which chunk supported it? ─► fetch immutable chunk + source document
  │     ├─ was the source correct at the time? ─► check publication/review dates
  │     └─ was it correctly classified? ─► inspect the four trust dimensions
  │
  ├─ knowledge was wrong ──► correct corpus (doc 10), regenerate affected plans
  ├─ knowledge right, agent wrong ──► evaluation case (doc 7), quarantine review
  └─ both right, source has since changed ──► explain; plan marked stale (doc 6)
```

The third branch matters most in practice: **the platform was right and is now out of date.** Without versioning that is indistinguishable from having been wrong — and the difference matters enormously to a founder and to anyone auditing us.

## 9. Security

| Concern                               | Control                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Evidence chain tampering              | `agent_executions` is append-only in the same way `audit_log` is (ADR-0012 pattern)     |
| Chunk mutation invalidating citations | V2 — chunks immutable; corrections create new versions                                  |
| Replay leaking cross-tenant data      | Replay is business-scoped under RLS                                                     |
| PII in stored inputs                  | Agent inputs contain business data by nature. Stored under RLS, never in the log stream |
| Retention vs erasure                  | ⚠️ Conflict — see §12                                                                   |

## 10. Failure Modes

| #   | Failure                                              | Severity    | Mitigation                                             |
| --- | ---------------------------------------------------- | ----------- | ------------------------------------------------------ |
| F1  | Version field missing → recommendation unexplainable | 🔴 Critical | NOT NULL on provenance columns for AI-generated rows   |
| F2  | Chunk edited in place, breaking a citation           | 🔴 Critical | V2 enforced at ingestion                               |
| F3  | Prompt changed without a version bump                | 🟠 High     | Prompts in Git (doc 8); version recorded per execution |
| F4  | Model deprecated, historical version unavailable     | 🟡 Medium   | Replay reads stored output; V5                         |
| F5  | Storage growth from full input/output retention      | 🟡 Medium   | Retention policy (open)                                |
| F6  | Deletion request destroys the audit trail            | 🟠 High     | §12 — unresolved conflict                              |

## 11. Success Metrics

| Metric                                          | Target   |
| ----------------------------------------------- | -------- |
| Recommendations replayable end-to-end           | **100%** |
| AI-generated rows missing a version field       | **0**    |
| Citations resolving to an immutable chunk       | **100%** |
| Median replay time                              | ≤ 2 s    |
| Disputes resolved without re-running generation | ≥ 90%    |

## 12. ⚠️ Unresolved conflict — reproducibility vs erasure

Reproducibility requires retaining agent inputs, which contain the founder's business information. A data-subject erasure request requires deleting it.

These are in genuine tension. Options — none yet chosen:

- **Retain with pseudonymisation.** Strip identifiers, keep the chain. Weakens the link to a specific founder, which is sometimes the point of the audit.
- **Delete on request, accept the gap.** Honours erasure; forfeits the ability to explain that founder's past recommendations.
- **Retain under legal-obligation basis.** May be defensible for records underpinning regulatory guidance, but **requires legal input**, not an engineering decision.

This is flagged rather than resolved. It touches the Bahamas Data Protection Act, the still-outstanding retention policy (Q-S4), and the audit-log purge procedure. **It should be settled before real founder data accumulates**, because retrofitting a retention model onto existing records is materially harder than choosing one now.

## 13. Relationships

**Governed by:** Constitution (reproducible reasoning path).
**Depends on:** ADR-0016 (`agent_executions`) · Trust Layer (1) · Ingestion (5) · Model Provider (12).
**Constrains:** Specialist Agent Contract (4) · Prompt Standard (8) · Observability (11).
**Related:** Human Review (10) · Freshness (6) · Security Architecture.

## 14. Future Evolution

Founder-facing "why did you tell me this?" explanations built on replay · cryptographic signing of evidence chains if an institutional partner requires non-repudiation · cross-version diffing to show how guidance changed over time · retention tiering once volume is known.

## 15. Open Questions

| #       | Question                                                    | Severity           |
| ------- | ----------------------------------------------------------- | ------------------ |
| **VR1** | **Reproducibility vs erasure (§12)**                        | 🔴 Legal + founder |
| VR2     | Retention period for `agent_executions` full inputs/outputs | 🟠 High            |
| VR3     | Is replay exposed to founders, or internal only?            | 🟡 Medium          |

## 16. ADR References

**0016** (execution record) · **0015** (trust dimensions recorded) · 0012 (append-only pattern) · 0014 · 0008.
