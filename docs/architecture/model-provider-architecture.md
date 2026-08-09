# Model Provider Architecture

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 12 of 15

## 1. Executive Summary

The AI System Architecture states that changing models must never require changing business logic. This document specifies the abstraction that makes that true.

The motivation is not vendor preference. It is that FoundryAI intends to serve emerging-market governments and institutions, and **where inference happens may become a procurement requirement rather than an engineering choice**. An architecture that cannot answer "can this run somewhere else?" forecloses that conversation.

## 2. Purpose

**Scope.** The provider interface, model selection, fallback, data residency, and what must be recorded per call.

**Not in scope.** Prompt authoring (8) · cost policy (13) · evaluation (7).

## 3. Architecture

```
agents ──► ModelClient (interface) ──► provider adapter ──► API
              │                            │
     model-agnostic contract         Anthropic · (future) OpenAI,
     complete · stream · embed        NVIDIA-hosted, self-hosted
              │
        records: model_version, tokens, latency, provider
```

Agents depend on the **interface**, never on a provider SDK. `lib/ai/providers/` is the only place a vendor SDK is imported — which makes "can we move?" a code-review question with a verifiable answer.

## 4. Design Principles

**MP1 — Agents are provider-agnostic.** No provider type appears in agent code.

**MP2 — Capability, not brand.** Agents request a capability tier (`reasoning`, `fast`, `embedding`), not a model name. Model choice is configuration.

**MP3 — Every call is recorded.** Provider, model version, tokens, latency — for reproducibility (15) and cost (13).

**MP4 — Failover must not silently change behaviour.** A different model is a different system. Failover is recorded and evaluated, never invisible.

**MP5 — Residency is a first-class constraint.** Which provider may process which data is configuration, not an assumption.

**MP6 — Embeddings are not interchangeable.** Changing an embedding model invalidates the entire vector corpus. It is a migration, not a config change.

## 5. The Interface

```ts
interface ModelClient {
  complete(req: {
    tier: 'reasoning' | 'fast';
    system: string;
    input: string;
    schema: ZodSchema; // structured output is mandatory
    maxTokens: number;
    timeoutMs: number;
  }): Promise<ModelResult>;

  embed(req: { tier: 'embedding'; texts: string[] }): Promise<EmbedResult>;
}

interface ModelResult {
  data: unknown; // schema-validated
  provider: string;
  modelVersion: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}
```

Schema validation lives **inside** the client so no provider path can return unvalidated output.

## 6. Model Selection

| Tier        | Used by                                              | Characteristics                           |
| ----------- | ---------------------------------------------------- | ----------------------------------------- |
| `reasoning` | Compliance, Funding, Action Plan, Trust adjudication | Highest quality; cost secondary           |
| `fast`      | Coordinator classification, summarisation            | Low latency, high volume                  |
| `embedding` | Ingestion, retrieval                                 | ⚠️ Fixed for the life of the corpus (MP6) |

**Current:** Anthropic Claude for `reasoning` and `fast`. `embedding` is **undecided** and blocks document 5.

Tier-to-model mapping is configuration, versioned and recorded per call, so a change is visible in telemetry rather than inferred.

## 7. Failover

```
call ──► primary
   ├─ success ──► return
   ├─ transient (429, 5xx, timeout) ──► retry same provider (ADR-0016)
   └─ exhausted ──► secondary IF configured AND residency-permitted
                     └─► record provider_failover; flag run for evaluation
```

**Failover is off by default.** Silently answering a compliance question with a different, unevaluated model is worse than failing the run — the founder gets an answer we cannot vouch for. Enabling failover requires the secondary to have passed the evaluation suite (document 7).

## 8. Data Residency

| Question                        | Position                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------- |
| What is sent?                   | Business profile fields and retrieved public documents. **No email, no name** |
| Where is it processed?          | Currently US-based providers                                                  |
| Is it retained by the provider? | Zero-retention terms must be confirmed per provider                           |
| Can processing be constrained?  | Yes — provider selection is configuration, per environment                    |

⚠️ **Open.** The Bahamas Data Protection (Privacy of Personal Information) Act and any institutional partner's requirements have not been assessed against this. Flagged since the Engineering Understanding Report (R-17) and unresolved. This is a **legal** determination, not an engineering one.

## 9. Decision Flow — adding a provider

```
proposed provider
  ├─ residency permitted for the data class? ── no ──► reject
  ├─ supports structured output? ── no ──► reject (schema is mandatory)
  ├─ implement adapter behind ModelClient
  ├─ run full evaluation suite (document 7)
  ├─ hard gates pass? ── no ──► not eligible, even as failover
  └─ register in tier config; record in telemetry
```

## 10. Security

| Concern                 | Control                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| API keys                | Server-side only, never `NEXT_PUBLIC_*` (Security Architecture)             |
| PII to providers        | Minimised at the Execution Plan boundary; agents receive only listed fields |
| Provider prompt logging | Zero-retention terms required; verified per provider                        |
| Response injection      | Schema validation inside the client                                         |
| Key rotation            | Configuration; no code change                                               |
| Cross-provider leakage  | One provider per call; no fan-out of the same payload                       |

## 11. Failure Modes

| #   | Failure                                              | Severity    | Mitigation                                                             |
| --- | ---------------------------------------------------- | ----------- | ---------------------------------------------------------------------- |
| F1  | Provider outage halts generation                     | 🟠 High     | Runs are durable (ADR-0016) — they queue and resume, not fail          |
| F2  | **Silent failover changes answers**                  | 🔴 Critical | MP4; failover off by default; recorded and evaluated                   |
| F3  | Model deprecated by vendor                           | 🟠 High     | `model_version` recorded; evaluation re-run before pinning a successor |
| F4  | Embedding model changed                              | 🔴 Critical | MP6 — full re-embed required; treated as a migration                   |
| F5  | Cost spike from a model change                       | 🟡 Medium   | Cost alerts (11); tier config reviewed                                 |
| F6  | Provider processes data in a prohibited jurisdiction | 🔴 Critical | MP5; blocked pending legal assessment                                  |

## 12. Success Metrics

| Metric                                           | Target   |
| ------------------------------------------------ | -------- |
| Provider SDK imports outside `lib/ai/providers/` | **0**    |
| Calls missing `model_version`                    | **0**    |
| Undocumented failovers                           | **0**    |
| Time to add a provider (adapter + evaluation)    | ≤ 1 week |

## 13. Relationships

**Depends on:** AI System Architecture (model layer) · ADR-0016 · ADR-0005.
**Constrains:** Specialist Agent Contract (4) · Ingestion (5) via embeddings · Cost (13).
**Related:** Prompt Standard (8) — prompts may need per-provider variants · Versioning (15) · Security Architecture.

## 14. Future Evolution

Second provider once evaluation supports comparison · self-hosted or regionally-hosted inference if residency requires it · per-jurisdiction provider routing · smaller fine-tuned models for classification once labelled data exists.

## 15. Open Questions

| #        | Question                                                                           | Severity            |
| -------- | ---------------------------------------------------------------------------------- | ------------------- |
| **MP-1** | **Embedding model and dimensionality** — blocks document 5                         | 🔴 Founder decision |
| **MP-2** | **Data residency assessment** against Bahamian law and partner requirements        | 🔴 Legal            |
| MP-3     | Is a second provider required for v1 resilience, or is durable queuing sufficient? | 🟡 Medium           |

## 16. ADR References

**0019** (provider abstraction and residency) · **0016** (durability absorbs outages) · 0005 · 0014.
