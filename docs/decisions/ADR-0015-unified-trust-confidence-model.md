# ADR-0015 — Unified trust and confidence model

**Date:** 2026-08-07 · **Status:** ✅ **ACCEPTED — ratified by founder 2026-08-07**
**Affects:** Trust Layer & Evidence Framework · Knowledge Architecture · AI System Architecture · Research Agent Specification

## Context

Four canonical documents define confidence, and no two agree:

| Source                           | Scheme                 | Level 3 means                               |
| -------------------------------- | ---------------------- | ------------------------------------------- |
| Trust Layer & Evidence Framework | 4 badges + 0–100 score | n/a                                         |
| AI System Architecture           | 1–5                    | "verified from multiple government sources" |
| Knowledge Architecture           | 1–5                    | "government publication"                    |
| Research Agent Specification     | 1–5                    | "official government guidance"              |

Two contradictions also exist inside the Trust Layer framework itself: `🔵 RECOMMENDED` scores exactly 50 against a rule of _"below 50 — never shown"_, and `⚪ UNKNOWN` carries no score but is displayed.

This was first raised on 2026-08-05 and has been flagged at every subsequent phase. It blocks the Compliance Agent, Funding Agent, Action Plan Agent, Nova, and the Trust Layer itself — that is, everything remaining on the roadmap.

## Root cause

The three 1–5 scales are not arbitrarily different. Each is internally coherent; they disagree because they are measuring **two different things** through one number:

- **Source authority** — a property of a _document_. Objective. An Act outranks a guidance note regardless of what anyone does with it.
- **Reasoning depth** — a property of a _claim_. How far the platform travelled from evidence to conclusion.

The AI System Architecture's level 3, _"verified from multiple government sources"_, is a reasoning property. The other two scales' level 3 is a source property. They were never the same scale.

Any resolution that picks one scale and discards the others destroys information.

## Options considered

1. **Pick one 1–5 scale, discard the rest.** Simple; loses the reasoning dimension, which the badges already depend on.
2. **Invent a new unified scale.** Rejected on principle — the Codex's canonical rule and the Documentation Steward brief both forbid inventing a definition where existing ones conflict.
3. **Separate the two dimensions, adopt the existing scale that measures each.** Nothing is invented; the conflict dissolves because the documents were describing different axes.

## Decision (ratified)

**Four independent dimensions.** Founder direction refined the proposal: rather than three dimensions plus a derived badge, trust is decomposed into four independent measurements, from which the badge and score are derived.

| #   | Dimension                | Scale        | Property of            | Assigned by                             |
| --- | ------------------------ | ------------ | ---------------------- | --------------------------------------- |
| 1   | **Source Authority**     | 1–5          | a _document_           | Knowledge Engine, at ingestion          |
| 2   | **Evidence Strength**    | 1–5          | a _passage↔claim link_ | Trust Layer, during grounding           |
| 3   | **Reasoning Confidence** | HIGH/MED/LOW | an _inference_         | Trust Layer, from citation topology     |
| 4   | **Coverage Confidence**  | HIGH/MED/LOW | a _set_                | Trust Layer, against domain expectation |

**Why four and not three.** The original proposal folded evidence strength into the badge. That conflated two genuinely separate failures: a highly authoritative document that only mentions a topic in passing, versus a weak document that states a claim explicitly. Both were being scored the same. Separating them means fabrication has nowhere to hide — an agent citing a real Act that does not actually say the thing is caught by Evidence Strength, not by Source Authority.

**Trust Level and Trust Score are derived**, not dimensions.

### Ratified thresholds

- 🟢 **VERIFIED requires Source Authority ≥ 4** — legislation and regulations **only**. Official government guidance (Authority 3) can no longer produce a verified claim. This resolves open question T2 in favour of the stricter option.
- 🟡 DERIVED — Authority ≥ 3, Evidence Strength ≥ 3, Reasoning HIGH or MEDIUM, ≥ 2 sources.
- Evidence Strength ≤ 2 can never support verified or derived.
- Reasoning Confidence LOW can never be verified or derived.
- Threshold is `< 50` **exclusive**; `unknown` exempt and always shown.

### Coverage Confidence — v1 policy

**Computed and stored from day one; not displayed to founders in v1** (resolves T4). Available to internal review, telemetry and the evaluation harness. Display expected in v2 once recall is measured.

**Binding consequence:** because founders are not told a list may be incomplete, the product must not imply that it is. Copy must say _"Requirements we found"_, never _"Your complete requirements"_. Constitution Article VII (_honest uncertainty_) makes this mandatory, not stylistic.

### Required document changes — NOW APPLIED

| Document                         | Change                                                                                       | Status       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------ |
| Research Agent Specification     | None — its scale is canonical                                                                | ✅ unchanged |
| Knowledge Architecture           | Level 3 → "official government guidance"; level 2 → "government-supported publication"       | ✅ applied   |
| AI System Architecture           | 1–5 scale removed, replaced by a reference; its level-3 meaning becomes Reasoning Confidence | ✅ applied   |
| Trust Layer & Evidence Framework | Badges derived, score computed, thresholds corrected                                         | ✅ applied   |

## Consequences

- One definition of confidence across the platform; three documents converge instead of conflicting.
- The Research Agent needs no rework.
- The reasoning dimension is preserved rather than collapsed.
- Agents can no longer influence their own trust rating — a component that both produces and validates a claim provides no assurance.
- **Cost:** three documents must be edited together. Applying only part of this leaves the platform in a worse state than the current conflict, because the schemes would then _appear_ reconciled.

## Ratification

Ratified by the founder on 2026-08-07, with two refinements to the proposal: four independent dimensions rather than three, and VERIFIED restricted to Authority ≥ 4.

### Downstream consequence requiring action

Restricting VERIFIED to legislation and regulations means **the Bahamas Knowledge Pack must contain actual legislation, not only agency guidance pages.** Guidance pages are far easier to collect; if the corpus is built primarily from them, nearly every requirement will display as 🟡 DERIVED and the platform will appear far less certain than it is.

Knowledge sourcing must prioritise statutory instruments. This becomes a requirement on the _Knowledge Ingestion Pipeline_ (document 5), not a preference.

## References

Trust Layer Specification v1.0 §4 · Research Agent Specification · Knowledge Architecture ·
AI System Architecture · Engineering Understanding Report R-4, R-27, R-28
