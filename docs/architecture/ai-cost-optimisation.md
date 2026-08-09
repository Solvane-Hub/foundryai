# AI Cost Optimisation

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 13 of 15

## 1. Executive Summary

FoundryAI serves founders in emerging economies. Many will not pay much, and some of the platform's value is in reaching people who currently pay nothing for advice they cannot get. That makes cost per founder a **product constraint**, not a finance concern.

A single plan generation runs five agents, retrieval, and Trust Layer adjudication. Unmanaged, that is the difference between a viable platform and one that cannot be given away.

The governing principle: **spend where correctness depends on it, economise everywhere else.**

## 2. Purpose

**Scope.** Cost accounting, budgets, caching, model tiering, and the controls that prevent runaway spend.

**Not in scope.** Pricing · provider commercial terms · infrastructure cost outside AI.

## 3. Architecture

```
run ──► steps ──► model calls
              │        │
              │   tokens recorded per call (ADR-0014, doc 11)
              ▼
     cost attribution: per step · per run · per business · per agent
              │
     ┌────────┴────────┐
   budgets          caching
   (enforced)     (retrieval + deterministic steps)
```

Cost is measured before it is optimised. Every model call already records tokens, model version and latency (document 11 §5.3), which makes attribution a query rather than a project.

## 4. Design Principles

**C1 — Correctness is never traded for cost.** No optimisation may reduce coverage recall, grounding precision, or citation validity. Those are the hard gates (document 7).

**C2 — Cheapest capable tier.** Classification does not need a reasoning model.

**C3 — Do not pay twice for the same answer.** Deterministic inputs should hit a cache.

**C4 — Budgets are enforced, not advisory.** A runaway loop should stop, not merely alert.

**C5 — Attribute before optimising.** Optimising an unmeasured pipeline optimises the wrong step.

## 5. Where the Money Goes

| Stage                           | Relative cost | Optimisable?                                      |
| ------------------------------- | ------------- | ------------------------------------------------- |
| Coordinator classification      | Low           | ✅ `fast` tier                                    |
| Retrieval (embedding the query) | Very low      | ✅ cacheable                                      |
| Research structuring            | Medium        | Partly                                            |
| **Compliance reasoning**        | **High**      | ⚠️ Correctness-critical — C1 applies              |
| **Funding matching**            | **High**      | ⚠️ Correctness-critical                           |
| Action Plan assembly            | Medium        | ✅ Ordering is deterministic, outside the model   |
| **Trust adjudication**          | Medium–High   | ⚠️ Only invoked on disagreement (document 1 §6.3) |

The two most expensive stages are the two where being wrong causes real harm. **That is the constraint this document exists to respect**, and it is why the optimisation targets are elsewhere.

## 6. Controls

### 6.1 Model tiering

Agents request a capability tier, not a model (document 12 §6). Classification and summarisation use `fast`; compliance and funding use `reasoning`. Tier assignment is configuration and is reviewed against evaluation, so a downgrade that costs accuracy is visible.

### 6.2 Caching

| Cacheable                       | Key                                     | TTL                             |
| ------------------------------- | --------------------------------------- | ------------------------------- |
| Query embeddings                | hash(text, embedding model)             | Indefinite — deterministic      |
| Retrieval results               | hash(query, filters, knowledge_version) | Until knowledge version changes |
| Coordinator classification      | hash(profile fields, prompt version)    | Until profile or prompt changes |
| **Compliance / Funding output** | ❌ **not cached across businesses**     | —                               |

**Agent output is never shared between businesses.** Two restaurants in Nassau are not the same business, and treating them as such is exactly how a founder receives requirements that do not apply to them. Caching is per-input, and business context is part of the input.

Retrieval caching keyed on `knowledge_version` is safe by construction: a corpus change changes the key.

### 6.3 Budgets

| Budget                    | Default            | On breach                                              |
| ------------------------- | ------------------ | ------------------------------------------------------ |
| Tokens per step           | 1× expected        | Truncate input, retry once, then fail                  |
| Cost per run              | Configured ceiling | Fail run; partial results retained (ADR-0016)          |
| Runs per business per day | Rate-limited       | Queue, notify founder                                  |
| Daily platform spend      | Configured ceiling | 🔴 Alert; new runs queued, in-flight allowed to finish |

Budgets fail **runs**, never founder data. A run stopped on budget keeps its completed steps and can resume.

### 6.4 Avoiding unnecessary work

Skip the Funding Agent when no funding interest is indicated (Coordinator C6) · deterministic ordering outside the model · Trust adjudication only on entity/semantic disagreement · regenerate only affected sections when a single document changes.

## 7. Decision Flow — an optimisation proposal

```
proposal
  ├─ does it touch a correctness-critical stage? ── yes ──► run evaluation (doc 7)
  │        └─ any hard gate regressed? ──► REJECT (C1)
  ├─ measurable saving? ── no ──► reject (complexity without benefit)
  └─ ship; monitor cost + quality together (doc 11)
```

Cost and quality are reviewed **together**. A saving that quietly reduced recall is not a saving.

## 8. Security

| Concern                            | Control                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Cache poisoning across tenants** | Cache keys include business context; agent output never shared between businesses                  |
| Cost-exhaustion attack             | Per-business rate limits; daily ceiling; authenticated access only                                 |
| Budget bypass                      | Enforced in the model client, not in agent code                                                    |
| Cached PII                         | Retrieval caches hold public documents. Profile-derived caches are business-scoped and short-lived |

## 9. Failure Modes

| #   | Failure                                 | Severity    | Mitigation                                            |
| --- | --------------------------------------- | ----------- | ----------------------------------------------------- |
| F1  | **Cost optimisation degrades accuracy** | 🔴 Critical | C1; evaluation gate                                   |
| F2  | Cross-business cache leak               | 🔴 Critical | Business context in the key; never share agent output |
| F3  | Runaway retry loop                      | 🟠 High     | Max 3 attempts per step (ADR-0016); run ceiling       |
| F4  | Stale cache after knowledge change      | 🟠 High     | `knowledge_version` in the key                        |
| F5  | Budget stops a founder mid-plan         | 🟠 High     | Partial results retained; founder told plainly        |
| F6  | Unmeasured spend                        | 🟡 Medium   | Every call accounted (C5)                             |

## 10. Success Metrics

| Metric                                      | Target                                          |
| ------------------------------------------- | ----------------------------------------------- |
| Cost per plan generation                    | Tracked; target set after first production data |
| Retrieval cache hit rate                    | ≥ 60%                                           |
| Runs exceeding budget                       | ≤ 1%                                            |
| Cost regressions shipped without evaluation | **0**                                           |
| Cross-business cache incidents              | **0**                                           |
| Daily spend variance vs 7-day mean          | ≤ 2×                                            |

Deliberately no cost-per-plan target yet: setting one before measurement would be a guess presented as a goal.

## 11. Relationships

**Depends on:** Observability (11) — attribution · Model Provider (12) — tiering · ADR-0016 — budgets fail runs safely.
**Constrained by:** Evaluation (7) — C1 is enforced by its hard gates.
**Related:** Trust Layer (1) — adjudication cost · Coordinator (3) — routing avoids unnecessary steps.

## 12. Future Evolution

Cost-per-plan targets once production data exists · smaller fine-tuned classifiers · batch embedding during ingestion · provider price comparison once a second provider is evaluated · founder-visible generation quotas if abuse appears.

## 13. Open Questions

| #    | Question                                                                                                                                                                                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CO-1 | Target cost per founder journey, and is there a monthly ceiling?                                                                                                                                                  |
| CO-2 | Are plan regenerations rate-limited per founder, and at what threshold?                                                                                                                                           |
| CO-3 | Does a free tier exist, and does it get a reduced model tier? _(A reduced tier for free users would mean different founders receive different quality — a product and ethical decision, not an engineering one.)_ |

## 14. ADR References

**0016** (budgets fail runs; partial results retained) · **0019** (tiering) · 0018 (C1 enforcement) · 0014.
