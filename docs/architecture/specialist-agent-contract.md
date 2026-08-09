# Specialist Agent Contract

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 4 of 15

## 1. Executive Summary

Every specialist agent — Research, Compliance, Funding, Action Plan, and every future domain agent — must satisfy one contract. This document is that contract.

It exists because the alternative is five agents that each invent their own error handling, citation format and retry behaviour, and a Trust Layer that must special-case all of them. One contract means a new agent is a prompt plus a schema, not a new integration.

The contract has four hard obligations: **emit the envelope**, **bind every claim to retrieved evidence**, **be idempotent**, and **never self-assess trust**.

## 2. Purpose

**Scope.** The shared I/O envelope, evidence-binding rules, idempotency requirements, failure semantics, and the checklist a new agent must satisfy before it may run.

**Not in scope.** Individual agent behaviour (their own specifications), orchestration (ADR-0016), validation (Trust Layer), prompt authoring (document 8).

## 3. Architecture

```
Execution Plan step ──► SPECIALIST AGENT ──► envelope ──► Trust Layer ──► Services ──► DB
                            │
                     reads: context + retrieved evidence
                     writes: nothing
```

An agent is a **pure function** from context to structured output. It performs no writes, holds no state between steps, and has no database access (Engineering Standards §8). Everything it needs arrives in its input; everything it produces leaves in its output.

## 4. Design Principles

**A1 — Single responsibility.** One agent, one domain. An agent that both determines requirements and matches funding cannot be evaluated or replaced independently.

**A2 — Evidence in, evidence out.** An agent may only assert what its retrieved evidence supports. No model memory.

**A3 — Idempotent.** Re-running a step with identical input must produce equivalent output and must not duplicate side effects. Required by ADR-0016, where retries are normal operation.

**A4 — No trust self-assessment.** Agents never emit `trust_level` or `trust_score`. A component that both produces and validates a claim provides no assurance.

**A5 — Structured refusal.** "I could not determine this" is a valid, expected, first-class output — not an error.

**A6 — Deterministic where possible.** Anything computable without a model (sorting, arithmetic, date maths) is computed outside it.

## 5. The Envelope

Every agent returns exactly this shape. No exceptions.

```json
{
  "status": "OK | NO_AUTHORITATIVE_INFORMATION_FOUND | NEEDS_CLARIFICATION | ERROR",
  "agent": "compliance",
  "agent_version": "1.0.0",
  "prompt_version": "compliance@1.0.0",
  "model_version": "…",
  "knowledge_version": "BS-v1.4",
  "reasoning": "machine-facing rationale, never rendered to a founder",
  "claims": [
    {
      "claim_id": "stable-hash-of-normalised-content",
      "content": { "…domain-specific…" },
      "evidence": [
        { "chunk_id": "uuid", "quote": "verbatim supporting text",
          "source_authority": 5 }
      ],
      "reasoning_hops": 1
    }
  ],
  "unresolved": [
    { "question": "…", "why": "no authoritative source found for X" }
  ]
}
```

### 5.0 The retrieval → agent contract (A12)

Every chunk supplied to an agent by retrieval **must** carry its **`chunk_id`**. This is the
retrieval identity: it corresponds to the exact chunk returned by the current run and is
stable within the Knowledge Pack version it belongs to.

`chunk_id` is the **single** citation identity across the platform. No competing identifier
may be introduced — not a retrieval-local index, not a per-run handle, not a passage hash.
An agent that cannot name the `chunk_id` a claim came from cannot produce a valid claim.

Retrieval also supplies **Source Authority** (a property of the source document) and the
provenance fields of the canonical citation object. It supplies **no claim-level trust
dimensions** — Evidence Strength, Reasoning Confidence, Trust Level and Trust Score do not
exist until the Trust Layer evaluates a specific claim against a specific passage.

See Retrieval Architecture (K5) §3.10 and Trust Layer §8.

### 5.1 `evidence` is the load-bearing field

Each claim carries the **chunk IDs it was built from and a verbatim quote from each**. This is what makes the Trust Layer's grounding check possible (Trust Layer §6.3): Evidence Strength is assessed by comparing the claim against the quoted passage.

An agent that cites a chunk without quoting supporting text has produced an unverifiable claim, and it will be quarantined.

Citations attached downstream use the **canonical citation object** defined in the Trust Layer
Specification §8 — `chunk_id` mandatory. This contract does not restate that schema.

**Chunks must come from the current run.** A chunk ID not returned by this run's retrieval fails citation binding — a plausible citation to a real document that was never retrieved is fabrication.

### 5.2 `reasoning_hops` feeds Reasoning Confidence

`1` = the claim restates one passage. `2–3` = combined across sources, each step evidenced. `>3` = extended synthesis. The Trust Layer maps this to HIGH/MEDIUM/LOW (Trust Layer §4.4). Agents report the count; they do not assign the confidence.

### 5.3 `unresolved` is not failure

An agent that determined four requirements and could not determine a fifth returns `OK` with four claims and one `unresolved` entry. This becomes an ⚪ UNKNOWN item in the plan (Launch Plan §8) and reduces coverage. **Discarding what could not be determined is the single easiest way to produce a confidently incomplete plan.**

## 6. Idempotency

Required by ADR-0016: `(workflow_run_id, sequence_no)` is unique, so a retry that partially wrote is rejected rather than duplicated.

| Obligation               | Meaning                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------- |
| No side effects          | Agents write nothing. The runner persists                                           |
| Stable `claim_id`        | A hash of normalised content, not a random ID — so a retry produces matching claims |
| Deterministic ordering   | Claims sorted by a stable key before return                                         |
| No wall-clock dependence | An agent must not embed "today" in output; the runner supplies dates                |

Non-determinism from the model itself is acceptable and expected; **structural** non-determinism is not.

## 7. Decision Flow

```
receive context + evidence
   │
   ├─ evidence empty? ──► NO_AUTHORITATIVE_INFORMATION_FOUND (not an error)
   │
   ├─ hard input missing? ──► NEEDS_CLARIFICATION (structured, no prose)
   │
   ├─ for each candidate claim:
   │     ├─ supported by a quoted passage? ── no ──► move to `unresolved`
   │     ├─ compute claim_id, reasoning_hops
   │     └─ attach evidence[]
   │
   └─ emit envelope ──► Trust Layer
```

## 8. Security

| Concern                                      | Control                                                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt injection via retrieved documents** | Retrieved text is untrusted. System prompts state that retrieved content is evidence to cite, never instructions. Ingestion sanitises (document 5) |
| Fabricated citations                         | Chunk IDs validated against the run's retrieval set                                                                                                |
| Trust laundering                             | `trust_level`/`trust_score` emitted by an agent are discarded                                                                                      |
| Database access                              | None — structurally impossible; `lib/ai/` cannot import `lib/db` (ESLint-enforced)                                                                 |
| PII to models                                | Only fields the Execution Plan supplies. No email, no name                                                                                         |
| Cross-tenant leakage                         | Agents receive one business's context per run; no retrieval spans tenants                                                                          |

## 9. Failure Modes

| #   | Failure                                    | Severity    | Mitigation                                                                |
| --- | ------------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| F1  | Claim with no supporting quote             | 🔴 Critical | Trust Layer quarantine; Evidence Strength ≤ 2 cannot be verified/derived  |
| F2  | **Silently dropping undeterminable items** | 🔴 Critical | `unresolved[]` is mandatory; empty-when-expected is an evaluation finding |
| F3  | Non-idempotent retry duplicating claims    | 🟠 High     | Stable `claim_id`; unique `(run, sequence)`                               |
| F4  | Schema-invalid output                      | 🟠 High     | Retry once with the error appended, then permanent failure (ADR-0016)     |
| F5  | Agent exceeding its domain                 | 🟡 Medium   | A1; evaluation asserts claim categories                                   |
| F6  | Model memory leaking into claims           | 🔴 Critical | Grounding check — unsupported assertions quarantined                      |

## 10. Success Metrics

| Metric                                                    | Target |
| --------------------------------------------------------- | ------ |
| Claims emitted without evidence                           | **0**  |
| Quarantine rate per agent                                 | ≤ 5%   |
| Idempotency violations on retry                           | **0**  |
| Schema-invalid responses                                  | ≤ 1%   |
| `unresolved` recall (items that should have been flagged) | ≥ 95%  |

## 11. New Agent Checklist

An agent may not run until all are true: specification exists · JSON schema registered · prompt versioned (document 8) · evaluation set exists (document 7) · idempotency tested · emits no trust fields · declares its knowledge domains · failure modes documented.

## 12. Relationships

**Depends on:** ADR-0016 · Trust Layer (1) · Coordinator (3).
**Constrains:** Research, Compliance, Funding, Action Plan and all future agents.
**Related:** Prompt Engineering Standard (8) · Agent Memory (9) · Evaluation (7) · Versioning (15).

## 13. Future Evolution

Parallel step execution (agents are already side-effect free) · streaming partial claims · agent-specific retrieval budgets · tool use beyond retrieval, which would require revisiting A2.

## 14. ADR References

**0017** (this contract) · **0016** (idempotency origin) · **0015** (no self-assessed trust) · 0014 (logging).

## 15. Open Questions

| #   | Question                                                                                          |
| --- | ------------------------------------------------------------------------------------------------- |
| SA1 | Maximum claims per agent per run, to bound cost and plan size?                                    |
| SA2 | Should `quote` be a character range into the chunk rather than copied text, to avoid duplication? |
