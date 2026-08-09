# ADR-0018 — Evaluation gates and release criteria

**Date:** 2026-08-07 · **Status:** ✅ Accepted

## Context

Prompts, models, chunking and retrieval all change platform behaviour without changing application code. Conventional CI cannot detect a regression in them: a prompt edit that quietly reduces coverage recall passes typecheck, lint and every unit test.

Non-deterministic components without an evaluation harness silently regress on every prompt edit and every model upgrade. The Engineering Standards' Definition of Done does not currently extend to AI behaviour.

## Options considered

1. **Manual review of AI changes.** Fast, and worthless at detecting a two-point recall regression that no human can see by reading a diff.
2. **Evaluate only on major changes.** "Small prompt tweak" is precisely where silent regression enters.
3. **Gate every AI change on an evaluation suite, with hard thresholds.**

## Decision

**Option 3.** Any change to a prompt, model, chunking strategy or retrieval configuration re-runs the evaluation suite before merge.

**Hard gates — failure blocks release regardless of other results:**

| Metric                         | Threshold                       |
| ------------------------------ | ------------------------------- |
| Coverage recall (M1)           | ≥ 95% — **also the TRL 3 gate** |
| Citation validity (M3)         | 100%                            |
| Domain-declaration recall (M7) | ≥ 99%                           |
| Fabrication rate (M9)          | 0                               |

Plus: **a coverage-recall regression greater than 2 percentage points blocks release** even if the absolute value still passes. Coverage is the metric the product's usefulness rests on, and gradual erosion is how it would be lost.

Tiered execution: a fast subset per pull request, the full suite per release.

## Consequences

- AI changes acquire a real Definition of Done, matching the standard applied to code.
- **TRL advancement becomes evidence-based**: the platform cannot claim TRL 3 until M1 has actually been measured at ≥ 95%.
- Evaluation runs cost real model spend, and the gold-standard set requires Bahamian regulatory expertise to compile — a genuine cost, and the critical path to TRL 3.
- A known ceiling: M1 measures recall against _our_ list of requirements. If that list is incomplete, M1 is confidently wrong in exactly the way the platform would be. This is why the set is human-compiled from primary sources and why the ceiling is reported alongside the number.

## References

AI Evaluation Framework §6–7 · Trust Layer §7 · ADR-0015 · ADR-0004 · TRL Evidence Register
