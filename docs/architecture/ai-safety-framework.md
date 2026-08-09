# AI Safety Framework

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 14 of 15

## 1. Executive Summary

FoundryAI's safety problem is specific and unusual. It is not that the platform might produce offensive content — it is that **it might produce plausible, well-formatted, confidently-cited guidance that is wrong**, and that a founder will act on it with their money and their legal standing.

This document defines the harms that matter here, the boundary between information and regulated advice, and the controls that keep the platform inside it.

The Constitution already states the values. This turns them into enforceable behaviour.

## 2. Purpose

**Scope.** Harm taxonomy, the advice boundary, refusal behaviour, injection defence, PII handling, and the safety obligations every agent inherits.

**Not in scope.** Validation mechanics (document 1) · evaluation (7) · platform security (Security Architecture).

## 3. Architecture

Safety is not a filter at the end. It is distributed across four layers that each fail independently.

```
INGESTION      sanitise · authority floors · human review        (doc 5)
    ▼
PROMPT         constraints · untrusted-content framing · refusal (doc 8)
    ▼
TRUST          grounding · citation binding · quarantine          (doc 1)
    ▼
PRESENTATION   badges · advice boundary · honest framing          (doc 2)
```

## 4. Design Principles

**S1 — Wrong is worse than absent.** Refusing to answer is always available and never a failure.

**S2 — Confidence must be earned.** Presentation certainty is derived from evidence, never from fluency.

**S3 — Information, not advice.** The platform tells founders what the law says. It does not tell them what to do about their situation.

**S4 — Defence in depth.** No single control is trusted.

**S5 — The human decides.** Constitution, _Human Agency_. The platform never takes an action with legal or financial consequence on a founder's behalf.

## 5. Harm Taxonomy

| #   | Harm                                                                         | Severity    | Primary control                                        |
| --- | ---------------------------------------------------------------------------- | ----------- | ------------------------------------------------------ |
| H1  | **Omission** — a required permit missing from an otherwise correct plan      | 🔴 Critical | Coverage Confidence (doc 1 §7); recall measurement (7) |
| H2  | **Fabrication** — invented fee, agency, deadline or requirement              | 🔴 Critical | Grounding; citation binding; entity check              |
| H3  | **Stale guidance** — correct last year, wrong now                            | 🔴 Critical | Freshness (6); score penalty                           |
| H4  | **Over-certainty** — DERIVED presented as VERIFIED                           | 🟠 High     | Authority ≥ 4 for VERIFIED (ADR-0015)                  |
| H5  | **Regulated advice** — crossing from information into legal/financial advice | 🟠 High     | §6                                                     |
| H6  | **Jurisdictional error** — another country's law                             | 🟠 High     | Deterministic jurisdiction; country-scoped retrieval   |
| H7  | **Prompt injection** — a document or founder redirecting agent behaviour     | 🟠 High     | Layered defence (doc 8 §6)                             |
| H8  | **PII exposure** — founder data in logs, prompts or provider retention       | 🟠 High     | Redaction; minimisation; provider terms                |
| H9  | **Discriminatory output** — differing guidance by founder demographics       | 🟠 High     | §7                                                     |

**H1 leads deliberately.** It is the least visible, the least defended by conventional AI safety practice, and the most likely to cause real-world harm in this product.

## 6. The Advice Boundary

The line FoundryAI must not cross:

| ✅ Information (in scope)                    | ❌ Advice (out of scope)                                      |
| -------------------------------------------- | ------------------------------------------------------------- |
| "The Business Licence Act requires X"        | "You should structure as a company rather than a sole trader" |
| "This licence costs $Y per the fee schedule" | "This licence is not worth the cost for you"                  |
| "Applications typically take 5–10 days"      | "You'll be fine, just start trading"                          |
| "We could not confirm whether this applies"  | "It probably doesn't apply to you"                            |

**The distinction is between reporting what a source says and recommending what a founder should do.** 🔵 RECOMMENDED content sits closest to the line and must therefore state that it is best practice and **not legally required** (Trust Layer §4.6).

Two obligations follow:

1. **Never present output as legal or financial advice**, and never imply that following it guarantees compliance.
2. **Never claim completeness.** Because Coverage Confidence is internal in v1, copy must say _"Requirements we found"_, never _"Your complete requirements"_ (Trust Layer §7.4). This is a safety control, not a copy preference.

⚠️ Whether a disclaimer is legally required in The Bahamas is a **legal determination** and remains open.

## 7. Fairness

Founder demographics may be collected for funding eligibility (some programmes are demographically targeted). This creates a specific risk: demographic data influencing _compliance_ output, where it has no legitimate role.

| Control         | Rule                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Compliance path | Demographic fields are **not** passed to the Compliance Agent                                                          |
| Funding path    | Demographics used **only** to check stated eligibility criteria, always with the criterion cited                       |
| Evaluation      | Identical businesses with differing founder demographics must produce identical compliance output — an assertable test |
| Language        | Guidance is written for someone with no legal or business background                                                   |

## 8. Refusal

Refusal is a designed output, not a failure (S1).

```
no authoritative source        ──► ⚪ UNKNOWN, shown, high priority
evidence too weak (ES ≤ 2)     ──► quarantine, not shown
reasoning too speculative (LOW)──► not verified/derived; may be recommended
outside jurisdiction            ──► fail plainly: "we don't support that country yet"
outside scope (legal advice)    ──► decline and point to a professional
```

**A falling refusal rate is a monitored alert** (document 11 §7), not an improvement. If the platform stops saying "unknown", the likeliest cause is a lost refusal instruction — not a better corpus.

## 9. Decision Flow — assessing a proposed capability

```
proposed feature
  ├─ could it produce a claim a founder acts on? ── yes ──► requires Trust Layer + citations
  ├─ does it cross into advice (§6)? ── yes ──► REJECT or reframe as information
  ├─ does it act on the founder's behalf? ── yes ──► REJECT (S5)
  ├─ new harm not in §5? ──► add to taxonomy, define control, add adversarial cases
  └─ proceed with evaluation gates
```

## 10. Security

| Concern                     | Control                                                     |
| --------------------------- | ----------------------------------------------------------- |
| Injection via documents     | Sanitised at ingestion; framed as evidence; schema backstop |
| Injection via founder input | Delimited; jurisdiction deterministic                       |
| PII to providers            | Minimised; no email or name; zero-retention terms required  |
| PII in logs                 | Redaction denylist including free-text answers (ADR-0014)   |
| Model output as instruction | Output is data, schema-validated; never executed            |
| Autonomous action           | None. The platform never files, pays, or submits (S5)       |

## 11. Failure Modes

| #   | Failure                                        | Severity    | Mitigation                                     |
| --- | ---------------------------------------------- | ----------- | ---------------------------------------------- |
| F1  | Confidently incomplete plan (H1)               | 🔴 Critical | Coverage; recall gate; honest framing          |
| F2  | Refusal instruction lost in a prompt edit      | 🔴 Critical | Mandatory refusal test (doc 8)                 |
| F3  | Founder treats output as legal advice          | 🟠 High     | §6 framing; badge semantics; usability testing |
| F4  | Demographics influence compliance              | 🟠 High     | Field-level exclusion; assertable evaluation   |
| F5  | Injection succeeds end-to-end                  | 🟠 High     | Four independent layers                        |
| F6  | Safety controls degrade silently over releases | 🟠 High     | Adversarial set is a release gate (doc 7)      |

## 12. Success Metrics

| Metric                                       | Target |
| -------------------------------------------- | ------ |
| Fabricated claims reaching a founder         | **0**  |
| Successful injections in the adversarial set | **0**  |
| Refusal correctness                          | ≥ 95%  |
| Compliance output varying by demographics    | **0**  |
| PII incidents                                | **0**  |
| Copy implying completeness                   | **0**  |

## 13. Relationships

**Governed by:** Constitution (Truth Before Fluency · Human Agency · Article VII).
**Depends on:** Trust Layer (1) · Prompt Standard (8) · Ingestion (5) · Evaluation (7).
**Constrains:** every agent · Launch Plan presentation (2) · Nova.
**Related:** Human Review (10) · Security Architecture · Model Provider (12).

## 14. Future Evolution

Formal red-teaming before public launch · founder comprehension testing (do people read 🔵 as optional?) · jurisdiction-specific advice-boundary rules as countries are added · incident review process once real founders are exposed.

## 15. Open Questions

| #       | Question                                                                 | Severity           |
| ------- | ------------------------------------------------------------------------ | ------------------ |
| **SF1** | **Is a legal disclaimer required in The Bahamas, and what must it say?** | 🔴 Legal           |
| SF2     | Is professional liability insurance warranted before public launch?      | 🔴 Founder         |
| SF3     | Who is accountable if a founder is penalised after following a plan?     | 🔴 Founder / legal |

**SF3 is uncomfortable and should be answered before launch, not after.**

## 16. ADR References

**0015** (VERIFIED ≥ 4; coverage) · **0018** (adversarial gate) · 0016 · 0014 · 0012.
