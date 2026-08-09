# ADR-0017 — Shared agent output contract

**Date:** 2026-08-07 · **Status:** ✅ Accepted

## Context

Five specialist agents exist on paper (Research, Compliance, Funding, Action Plan, plus future domain agents). Each could define its own output shape, error handling and citation format.

If it did, the Trust Layer would need to special-case every agent, adding one would be an integration project, and evaluation could not compare them.

## Options considered

1. **Per-agent shapes, Trust Layer adapts.** Maximum agent flexibility; the Trust Layer becomes a pile of special cases and the highest-risk component in the system becomes the least uniform. Rejected.
2. **One envelope, domain-specific payload.** Shared structure for status, evidence, provenance and unresolved items; each agent owns only the `content` of its claims.

## Decision

**Option 2.** Every agent returns the envelope defined in the Specialist Agent Contract §5.

Four obligations are non-negotiable:

- **Evidence binding.** Every claim carries the `chunk_id`s it was built from _and a verbatim quote from each_. A chunk not returned by the current run's retrieval fails validation — a plausible citation to a real document that was never retrieved is fabrication.
- **Idempotency.** Stable `claim_id` from normalised content, deterministic ordering, no wall-clock dependence. Required because ADR-0016 makes retries normal operation and `(workflow_run_id, sequence_no)` is unique.
- **No trust self-assessment.** Agents report `reasoning_hops` and evidence; the Trust Layer derives Evidence Strength, Reasoning Confidence, Trust Level and Trust Score. A component that both produces and validates a claim provides no assurance.
- **`unresolved[]` is mandatory.** An agent that could not determine something must say so. Discarding undeterminable items is the easiest way to produce a confidently incomplete plan — the platform's most severe harm (H1).

## Consequences

- Adding an agent is a prompt plus a schema, not an integration.
- The Trust Layer validates uniformly; grounding logic is written once.
- Evaluation can compare agents on the same metrics.
- Cost: agents cannot return convenient bespoke shapes, and `unresolved[]` forces authors to handle the case they would rather skip. Both are intentional.

## References

Specialist Agent Contract §5–6 · ADR-0016 · ADR-0015 · Trust Layer §6
