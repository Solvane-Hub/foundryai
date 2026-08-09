# ADR-0019 — Model provider abstraction and data residency

**Date:** 2026-08-07 · **Status:** ✅ Accepted · ⚠️ residency assessment outstanding

## Context

The AI System Architecture requires that changing models never requires changing business logic. Beyond portability, FoundryAI intends to serve emerging-market governments and institutions, where **where inference happens may become a procurement requirement rather than an engineering preference**.

An architecture that cannot answer "can this run somewhere else?" forecloses that conversation before it starts.

## Options considered

1. **Call the provider SDK directly from agents.** Simplest; couples every agent to one vendor and makes portability a rewrite.
2. **Thin wrapper around one provider.** Marginally better; leaks provider concepts into agent code.
3. **Capability-tier interface with provider adapters.** Agents request `reasoning`, `fast` or `embedding` — never a model name. Adapters live in one directory.

## Decision

**Option 3.**

- Agents depend on `ModelClient`. **A provider SDK may be imported only inside `lib/ai/providers/`** — a rule checkable in review, and consistent with the existing ESLint layer boundaries.
- Tier-to-model mapping is configuration, versioned, and recorded per call.
- **Schema validation happens inside the client**, so no provider path can return unvalidated output.
- **Failover is off by default.** Silently answering a compliance question with a different, unevaluated model is worse than failing the run — the founder receives an answer we cannot vouch for. Enabling failover requires the secondary to have passed the evaluation suite (ADR-0018).
- **Embedding models are not interchangeable.** Changing one invalidates the entire vector corpus; it is a migration, not a configuration change.

## Consequences

- Provider portability is a property of the codebase, not an aspiration.
- Per-call recording of provider, model version, tokens and latency serves reproducibility (document 15) and cost attribution (document 13) simultaneously.
- Cost: one indirection layer, and adding a provider requires a full evaluation run before it may be used at all.

## ⚠️ Outstanding

**Data residency has not been assessed.** The platform currently sends business profile data to US-based providers. The Bahamas Data Protection (Privacy of Personal Information) Act and any institutional partner requirements have not been evaluated against this.

This is a **legal determination, not an engineering one**. It has been open since the Engineering Understanding Report (R-17) and should be resolved before institutional conversations, not during them.

## References

Model Provider Architecture · AI System Architecture (Model Layer) · Security Architecture ·
ADR-0016 · ADR-0005 · Engineering Understanding Report R-17
