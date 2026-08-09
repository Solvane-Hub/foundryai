# Trust Layer Specification

**Document:** Trust Layer Specification
**Version:** 1.0
**Status:** Canonical — ⚠️ §4.3 (unified confidence model) awaits founder ratification
**Owner:** Jamil Nash (Co-Founder & CEO)
**Author:** Lead Software Engineer
**Last updated:** 2026-08-07
**Supersedes:** portions of _Trust Layer & Evidence Framework v1.0_ (see §13)

---

## 1. Executive Summary

The Trust Layer is the component that stands between what an AI agent produces and what a founder sees. Nothing reaches a founder without passing through it.

Its job is narrow and absolute: **ensure that every claim FoundryAI makes is traceable to an authoritative source, labelled with how certain we are, and withheld when we are not certain enough.** It is the mechanism by which the Constitution's _Truth Before Fluency_ stops being a value and becomes a runtime behaviour.

This specification defines four things the platform did not previously have:

1. **A single confidence model.** Four incompatible schemes existed across four canonical documents. §4 unifies them by separating two things that were being conflated — _how authoritative is this evidence_ and _how did we reason from it_.
2. **A validation algorithm.** The prior framework required "evidence validation" and "hallucination prevention" without saying how. §6 specifies the checks, their order, and what happens on failure.
3. **Coverage confidence.** The platform's most dangerous failure is not fabrication — it is **omission**. A compliance checklist that silently misses a required permit displays as 🟢 VERIFIED and passes every safeguard previously designed. §7 introduces a second, independent dimension to address this.
4. **A structural guarantee.** §8 specifies the database constraint that makes an uncited verified claim _unrepresentable_, so the policy cannot be bypassed by any code path.

---

## 2. Purpose

Trust is FoundryAI's product. A founder acting on our output may register a company, pay a fee, or skip a permit. The cost of being confidently wrong is borne by them, not us.

This document exists so that:

- every engineer implements trust identically
- every agent is held to the same evidentiary standard
- a founder can always answer _"where did this come from and should I rely on it?"_
- a reviewer can reproduce any claim the platform has ever made

**Scope.** Classification, scoring, validation, citation, and coverage of AI-generated output.

**Not in scope.** Retrieval mechanics (_Knowledge Ingestion Pipeline_), agent reasoning (_Specialist Agent Contract_), how stale knowledge is detected (_Knowledge Freshness Specification_), or how humans correct errors (_Human Review Workflow_).

---

## 3. Architecture

The Trust Layer sits between AI orchestration and persistence. It is the **last gate before anything is stored or shown**.

```
Knowledge Engine ──► retrieved evidence
                          │
Specialist Agent ─────────┤
                          ▼
                  ┌───────────────────┐
                  │   TRUST LAYER     │
                  │                   │
                  │  1 schema check   │
                  │  2 citation bind  │
                  │  3 grounding      │
                  │  4 authority      │
                  │  5 classify       │
                  │  6 score          │
                  │  7 coverage       │
                  └────────┬──────────┘
                           │  pass ──► Application Services ──► database ──► founder
                           │
                           └─ fail ──► quarantine (never rendered, always logged)
```

**Placement is deliberate.** The Trust Layer is not a UI concern and not an agent concern. Agents cannot mark their own work trustworthy — a component that both produces and validates a claim provides no assurance. Services perform the writes (Engineering Standards §8), and they write only what the Trust Layer has passed.

### Position in the platform

| Layer                | Responsibility toward trust                                |
| -------------------- | ---------------------------------------------------------- |
| Knowledge Engine     | Supplies evidence with source metadata and authority level |
| Specialist Agents    | Produce claims, each bound to the evidence it came from    |
| **Trust Layer**      | **Validates, classifies, scores, and gates**               |
| Application Services | Persist only validated output                              |
| Frontend             | Renders the badge and citations; performs no trust logic   |

---

## 3A. Design Principles

**T1 — Trust is derived, never declared.** No component may assert its own trustworthiness. Agents produce claims and evidence; the Trust Layer classifies. A component that both produces and validates a claim provides no assurance.

**T2 — Absence is a finding.** ⚪ UNKNOWN is a first-class output, always shown. Silence is a worse failure than an admission.

**T3 — Evidence must be reachable.** Every claim binds to a `chunk_id` retrieved in the current run, plus a verbatim quote. A citation that cannot be re-read is not a citation.

**T4 — Separate what is separate.** Source quality, passage support, inference depth and set completeness are four different facts. Compressing them into one number is what produced the conflicting scales this document replaces.

**T5 — Fail closed.** If validation cannot run, nothing is shown. Deliberately the opposite of audit logging, which fails open (ADR-0012): a lost log entry must not lock a founder out, but unvalidated guidance is worse than none.

**T6 — Structural over procedural.** Where a guarantee can be enforced by a constraint rather than a convention, it is. A `verified` row without citations is unrepresentable in the database, not merely discouraged.

---

## 4. The Trust Model — four independent dimensions

**Ratified 2026-08-07 (ADR-0015).**

### 4.1 Design principle — one number cannot carry four facts

The four conflicting schemes in prior documentation all failed the same way: they compressed several independent facts into a single value. Four distinct questions must be answered about any claim, and each has its own answer:

| #   | Question                                                  | Dimension                | Property of            |
| --- | --------------------------------------------------------- | ------------------------ | ---------------------- |
| 1   | How authoritative is the source?                          | **Source Authority**     | a _document_           |
| 2   | How directly does the cited passage support _this_ claim? | **Evidence Strength**    | a _passage↔claim link_ |
| 3   | How far did we reason from evidence to claim?             | **Reasoning Confidence** | an _inference_         |
| 4   | Is the set complete?                                      | **Coverage Confidence**  | a _set_                |

These are **independent**. A Level 5 Act (high authority) may mention a topic only in passing (low evidence strength). A chain of three direct quotations (high evidence strength) may require heavy synthesis (low reasoning confidence). A set of individually perfect items may be badly incomplete (low coverage).

**Trust Level (the badge) and Trust Score are _derived from_ these four. They are not themselves dimensions.**

### 4.2 Dimension 1 — Source Authority (1–5)

Property of a _document_. Assigned by the Knowledge Engine at ingestion. Adopted unchanged from the Research Agent Specification.

| Level | Source type                                                      | Example                                  |
| ----- | ---------------------------------------------------------------- | ---------------------------------------- |
| **5** | Legislation — Acts and statutes with legal force                 | Business Licence Act                     |
| **4** | Statutory instruments and official regulations                   | Ministerial regulations, Gazette notices |
| **3** | Official government guidance published by the responsible agency | Registrar General's registration guide   |
| **2** | Government-supported or institutional publication                | SBDC programme brochure                  |
| **1** | Any other source                                                 | Press article, third-party summary       |

**Rules.** Level 1 may **never** influence a compliance determination. Level 2 may support `recommended` content only.

### 4.3 Dimension 2 — Evidence Strength (1–5)

Property of the _link between a cited passage and the specific claim_. Assigned by the Trust Layer during grounding (§6.3), never by the generating agent.

Source Authority asks _"is this a good document?"_. Evidence Strength asks _"does this passage actually say this?"_ — a different question, and the one fabrication hides behind.

| Level | Meaning                                                                                  |
| ----- | ---------------------------------------------------------------------------------------- |
| **5** | **Explicit** — the passage states the claim verbatim or near-verbatim                    |
| **4** | **Direct** — the passage states the claim; only rephrasing separates them                |
| **3** | **Partial** — the passage supports part of the claim; the remainder needs another source |
| **2** | **Contextual** — topically relevant, but does not state the claim                        |
| **1** | **Tangential** — a passing mention only                                                  |

**Rule.** Evidence Strength ≤ 2 cannot support `verified` or `derived`. A claim resting only on contextual evidence is an inference, not a finding.

### 4.4 Dimension 3 — Reasoning Confidence (HIGH / MEDIUM / LOW)

Property of the _inference_. How far the platform travelled from evidence to conclusion.

| Level      | Meaning                                                          |
| ---------- | ---------------------------------------------------------------- |
| **HIGH**   | Single-hop. The claim restates cited evidence. No synthesis.     |
| **MEDIUM** | Multi-hop across ≤ 3 sources, every step individually evidenced. |
| **LOW**    | Synthesis across many sources, or a step not directly evidenced. |

**Rule.** `LOW` reasoning confidence can never be `verified` or `derived`. It is `recommended` at most, and is a candidate for human review.

This dimension is what the AI System Architecture's _"verified from multiple government sources"_ was actually describing — a reasoning property that had been mislabelled as a source property.

### 4.5 Dimension 4 — Coverage Confidence (HIGH / MEDIUM / LOW)

Property of a _set_. See §7 — it addresses omission, which no per-claim dimension can express.

**v1 policy (founder decision, 2026-08-07): computed and stored, but NOT displayed to founders.** See §7.4.

### 4.6 Trust Level — derived from the four dimensions

The user-facing badge. **Derived by the Trust Layer, never assigned by an agent.**

| Badge              | Requires                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| 🟢 **VERIFIED**    | Source Authority **≥ 4** (legislation or regulation **only**) · Evidence Strength ≥ 4 · Reasoning HIGH |
| 🟡 **DERIVED**     | Source Authority ≥ 3 · Evidence Strength ≥ 3 · Reasoning HIGH or MEDIUM · ≥ 2 qualifying sources       |
| 🔵 **RECOMMENDED** | Not legally required. Source Authority ≥ 2. Must never be presented as an obligation                   |
| ⚪ **UNKNOWN**     | No qualifying source found. **Must still be shown**                                                    |

#### ⚠️ Operational consequence of Authority ≥ 4 for VERIFIED

**Official government guidance (Authority 3) can no longer produce a 🟢 VERIFIED claim.** Only legislation and regulations can.

This is the stricter of the two options in T2 and it is the right call for a platform making regulatory claims — but it has a direct, non-obvious consequence for Phase 3:

> **The Bahamas Knowledge Pack must contain actual legislation, not only agency guidance pages.** Agency websites are far easier to collect than Acts and Gazette notices. If the Knowledge Pack is built primarily from guidance pages, almost every requirement will display as 🟡 DERIVED and the platform will look far less certain than it actually is.

Knowledge sourcing must therefore prioritise statutory instruments. This is now a requirement on the _Knowledge Ingestion Pipeline_ (document 5), not merely a preference.

---

## 5. Trust Score (0–100, computed)

Derived from all four dimensions. **Never chosen by a model** — a model asked to score its own output will score it highly.

```
base                verified 85 · derived 70 · recommended 50 · unknown 0
+ authority         +5 per citation at authority 5, +3 at authority 4   (max +15)
+ evidence          +5 if every citation is Evidence Strength 5
− reasoning         −5 if Reasoning Confidence is MEDIUM
− staleness         −10 if any citation is past its review-due date
− single-source     −5 if derived from exactly 2 sources
clamp 0…100
```

| Band     | Meaning                                    |
| -------- | ------------------------------------------ |
| 90–100   | Legislation, current, explicitly on point  |
| 70–89    | Authoritative and current                  |
| 50–69    | Best practice, or authoritative but ageing |
| **< 50** | **Never shown as guidance** — quarantined  |

`unknown` is exempt from the threshold and is always displayed. Its purpose is to communicate absence.

---

## 6. Validation Algorithm

Executed in order. **Any failure quarantines the claim.**

| #   | Check                                                                                          | Failure action                                                 |
| --- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1   | **Schema** — output matches the agent's JSON contract                                          | Reject, retry once, then fail the run                          |
| 2   | **Citation binding** — every claim references ≥ 1 retrieved chunk _actually returned this run_ | Quarantine — a citation to unretrieved evidence is fabrication |
| 3   | **Grounding** — the claim's assertions appear in, or follow from, the cited passages           | Quarantine, log for human review                               |
| 4   | **Authority floor** — cited sources meet the minimum for the proposed level                    | Downgrade level, re-score                                      |
| 5   | **Classification** — derive the badge (§4.4)                                                   | —                                                              |
| 6   | **Scoring** — compute (§5)                                                                     | Below threshold → quarantine                                   |
| 7   | **Coverage** — assess completeness (§7)                                                        | Attach coverage confidence                                     |

### Grounding check (6.3)

The most important and least trivial check. Verifying that generated text is supported by cited passages is itself an inference problem.

**v1 approach — deterministic-first, escalating:**

1. **Entity check (deterministic).** Every proper noun, fee, deadline, agency name and section reference in the claim must appear in a cited passage. Cheap, and it catches the highest-severity fabrications — invented fees, invented agencies, invented deadlines.
2. **Semantic check.** Embedding similarity between the claim and each cited passage must exceed a calibrated floor.
3. **Adjudication.** Where 1 and 2 disagree, a separate model call — with a different prompt and no access to the generating agent's reasoning — judges support. It may only _downgrade_, never upgrade.

Escalation exists because step 1 alone rejects valid paraphrase and step 3 alone is expensive and non-deterministic.

**⚠️ Calibration outstanding.** The similarity floor cannot be chosen analytically; it must be fitted against a labelled set. Owned by the _AI Evaluation Framework_.

---

## 7. Coverage Confidence — the omission problem

**This section addresses the platform's most severe unmitigated risk.**

Every safeguard above defends against _fabrication_: saying something untrue. None defends against _omission_: failing to say something required.

If the Knowledge Pack lacks a required permit, or retrieval ranks it below the cut, the Compliance Agent produces a checklist in which **every item is real, every citation is valid, and every badge is 🟢 VERIFIED** — and which is incomplete. A founder who follows it and is later penalised for a missing health permit has been harmed exactly as much as one given a fabricated permit.

Per-item trust cannot express this, because each item is individually correct. **Coverage is a property of the set, not of any member.**

### Coverage Confidence (set property)

| Level      | Meaning                                                                                                                              | Displayed as                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **HIGH**   | Knowledge Pack has verified coverage for this business type and jurisdiction; retrieval returned sources across all expected domains | "We believe this list is complete."                                                      |
| **MEDIUM** | Coverage exists but one or more expected domains returned nothing                                                                    | "This list may be incomplete — we found nothing on _taxation_."                          |
| **LOW**    | Business type is outside verified coverage                                                                                           | "We have limited information for this type of business. Treat this as a starting point." |

### Determination

Coverage is assessed against a **declared domain expectation** per business classification — for a restaurant in The Bahamas: business formation, licensing, health/food safety, employment, taxation. If retrieval returns nothing in an expected domain, coverage is reduced and **the specific gap is named**.

Naming the gap matters: _"we found nothing about food safety"_ is actionable, while a bare "may be incomplete" is not.

**Consequences.**

- Coverage confidence is displayed at the **list** level, alongside per-item badges.
- The domain expectation map is **Knowledge Pack data**, never application code (Platform Architecture — Multi-Country Expansion).
- **Coverage recall must be measured**, not asserted. That measurement is the true proof of the platform's critical function and is the primary blocker to advancing beyond TRL 2. Owned by the _AI Evaluation Framework_.

---

## 8. Citations and the Evidence Chain

### The canonical citation object

**This is the single canonical definition for the platform.** It is the union of the Trust
Layer and Metadata & Citation Standard (K4) formats, agreed 2026-08-08. Subordinate documents
— K4, the Specialist Agent Contract, Knowledge Ingestion — **reference this definition rather
than restating it**, so the schema cannot drift.

```json
{
  "chunk_id": "uuid", // MANDATORY — retrieval identity
  "agency": "Registrar General's Department",
  "document": "Business Names Act",
  "section": "Section 12",
  "clause": "12(3)", // optional, where the source has clauses
  "page": 27, // optional, where paginated
  "publication_date": "2025-03-01",
  "last_reviewed_date": "2026-07-15",
  "knowledge_version": "BS-v1.4",
  "url": "https://…",
  "accessed_at": "2026-08-08"
}
```

| Field                | Required | Origin      | Purpose                                                                      |
| -------------------- | -------- | ----------- | ---------------------------------------------------------------------------- |
| `chunk_id`           | **Yes**  | Trust Layer | **Binds the claim to the exact chunk returned by the current retrieval run** |
| `agency`             | Yes      | Trust Layer | Who the founder deals with                                                   |
| `document`           | Yes      | both        | The source                                                                   |
| `section`            | Yes      | both        | Locates the provision                                                        |
| `clause`             | No       | **K4**      | Finer than section, where the source provides it                             |
| `page`               | No       | **K4**      | Human verification in paginated PDFs                                         |
| `publication_date`   | Yes      | both        | When the source was published                                                |
| `last_reviewed_date` | Yes      | Trust Layer | Drives the staleness penalty (§5)                                            |
| `knowledge_version`  | Yes      | both        | Corpus state — reproducibility                                               |
| `url`                | Yes      | Trust Layer | Reviewer access                                                              |
| `accessed_at`        | Yes      | **K4**      | When we retrieved it                                                         |

**`chunk_id` is mandatory and is the field that makes the rest verifiable.** Without it a
citation names a document but not the passage: check 6.2 could not confirm the chunk came from
this run, Evidence Strength (§4.3) could not be assessed against the quoted passage, and
grounding could not be replayed. `clause` and `page` help a _human_ find the text; `chunk_id`
is what lets the _system_ prove it was actually retrieved.

A citation missing any required field is invalid and fails check 6.2.

### Evidence chain

Every stored recommendation records: original source · retrieved passage · agent · model version · prompt version · knowledge version · decision logic · final output.

This makes the Constitution's reproducibility requirement literal — any claim can be replayed. The schema already reserves these columns (`docs/architecture/schema-future-phases.sql`, Pattern A).

---

## 9. Decision Flow

Implements the ratified four-dimension model (§4, ADR-0015). All three dimensions that
constrain classification are evaluated **before** a badge is assigned; coverage is assessed
**after**, over the set that survived.

```
agent output — envelope per ADR-0017
   │
   ├─ schema valid? ───────────────── no ─► retry once ─► fail run
   ├─ every claim carries evidence? ─ no ─► QUARANTINE (fabrication)
   ├─ chunk_id from THIS run? ─────── no ─► QUARANTINE (fabricated citation)
   │
   ├── ① SOURCE AUTHORITY (1–5) ── read from knowledge metadata
   │        └─ authority = 1 ──────────────► QUARANTINE (never compliance)
   │
   ├── ② EVIDENCE STRENGTH (1–5) ── assessed per passage↔claim link (§6.3)
   │        └─ ES ≤ 2 ─────────────────────► QUARANTINE (contextual only,
   │                                          cannot be verified or derived)
   │
   ├── ③ REASONING CONFIDENCE ───── derived from reasoning_hops
   │        HIGH = 1 hop · MEDIUM = 2–3 evidenced hops · LOW = otherwise
   │        └─ LOW ──► may never be VERIFIED or DERIVED
   │
   ├── CLASSIFY (§4.6)
   │     Authority ≥ 4 · ES ≥ 4 · Reasoning HIGH ─────────────► 🟢 VERIFIED
   │        (legislation or regulation only — never guidance)
   │     Authority ≥ 3 · ES ≥ 3 · Reasoning HIGH|MEDIUM
   │        · ≥ 2 qualifying sources ────────────────────────► 🟡 DERIVED
   │     Authority ≥ 2 · not legally required ───────────────► 🔵 RECOMMENDED
   │     no qualifying source ───────────────────────────────► ⚪ UNKNOWN
   │
   ├── TRUST SCORE (§5) ── computed from ①②③, never model-assigned
   │        └─ score < 50 and not UNKNOWN ─► QUARANTINE
   │
   └── ④ COVERAGE CONFIDENCE ────── assessed over the surviving SET (§7)
            HIGH / MEDIUM / LOW, with named gaps
            **Computed and stored. Not displayed in v1 (§7.4).**
            Coverage does NOT gate persistence — a low-coverage set is
            still shown, because withholding it would leave the founder
            with nothing while telling them nothing.
                     │
                  PERSIST ──► DISPLAY
```

**Ordering is deliberate.** Authority, Evidence Strength and Reasoning Confidence are all
per-claim and can each independently disqualify a claim, so they are evaluated first and
cheapest-first. Coverage is a property of the _set_ (§4.1) and cannot be computed until the
set is final — which is precisely why it is a separate dimension rather than a fourth
threshold on an individual claim.

⚪ UNKNOWN is exempt from the score threshold and is always shown.

---

## 10. Security

| Concern                                     | Control                                                                                                                                                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Prompt injection via ingested documents** | Retrieved text is untrusted input. The Trust Layer treats agent output as a _claim about_ evidence, never as instructions. Adjudication (6.3.3) runs with a fixed prompt that never includes the generating agent's reasoning. |
| **Trust laundering**                        | Agents cannot set `trust_level` or `trust_score`; both are derived. An agent that emits them has its values discarded.                                                                                                         |
| **Citation forgery**                        | Citations must reference chunks retrieved _in the current run_, matched by `chunk_id`. A plausible-looking citation to a real document that was never retrieved fails check 6.2.                                               |
| **Bypass**                                  | The database CHECK constraint (§8 of the schema design) makes a `verified`/`derived` row without citations **unrepresentable**. No code path can bypass it.                                                                    |
| **Quarantine disclosure**                   | Quarantined content is never rendered and never returned by the API. It is retained for review and evaluation only.                                                                                                            |
| **Audit**                                   | Every quarantine and downgrade is written to `audit_log` with its correlation ID (ADR-0014).                                                                                                                                   |

---

## 11. Failure Modes

| #   | Failure                                                 | Severity    | Detection                               | Mitigation                                                 |
| --- | ------------------------------------------------------- | ----------- | --------------------------------------- | ---------------------------------------------------------- |
| F1  | **Silent omission** — complete-looking, incomplete list | 🔴 Critical | Coverage assessment; recall measurement | §7. **Currently the least mitigated risk on the platform** |
| F2  | Fabricated citation                                     | 🔴 Critical | Check 6.2                               | Structural — `chunk_id` must match this run                |
| F3  | Ungrounded claim with valid citation                    | 🔴 Critical | Check 6.3                               | Entity + semantic + adjudication                           |
| F4  | Stale knowledge presented as current                    | 🟠 High     | `last_reviewed_date` vs review cadence  | Score penalty; freshness spec                              |
| F5  | Over-classification (`derived` shown as `verified`)     | 🟠 High     | Check 6.4                               | Authority floor forces downgrade                           |
| F6  | Threshold miscalibration — valid content quarantined    | 🟡 Medium   | Evaluation harness                      | Quarantine is reviewable, not discarded                    |
| F7  | Trust Layer unavailable                                 | 🟡 Medium   | Health check                            | **Fail closed.** No output is shown unvalidated            |
| F8  | Founder misreads 🔵 RECOMMENDED as required             | 🟡 Medium   | Usability testing                       | Copy must state "not legally required"                     |

**F7 is deliberately the opposite of the audit-log policy (ADR-0012).** Audit logging fails _open_ because a lost log entry must not lock a founder out. Trust validation fails _closed_ because unvalidated guidance is worse than no guidance.

---

## 12. Success Metrics

| Metric                                                        | Target            | Owner                        |
| ------------------------------------------------------------- | ----------------- | ---------------------------- |
| Claims reaching a founder without a citation                  | **0**             | Structural (constraint)      |
| Fabricated-citation rate                                      | **0**             | Check 6.2                    |
| Grounding precision (quarantined content actually ungrounded) | ≥ 95%             | Evaluation Framework         |
| **Coverage recall** vs gold-standard requirement sets         | **≥ 95%**         | Evaluation Framework         |
| Quarantine rate on valid content (false positives)            | ≤ 5%              | Evaluation Framework         |
| Median validation latency                                     | ≤ 800 ms per plan | Observability                |
| Recommendations reproducible from stored evidence chain       | **100%**          | Versioning & Reproducibility |

**Coverage recall is the metric that decides whether FoundryAI works.** Everything else measures whether we lie; that one measures whether we are useful.

---

## 13. Relationships to Other Documents

**Governed by:** Constitution (Truth Before Fluency, Evidence Before Opinion) · FoundryAI Codex · Platform Architecture.

**Supersedes:** _Trust Layer & Evidence Framework v1.0_ §Trust Score and §Four Levels of Trust. That document's Learning Layer section remains a concept, not a specification.

**Depends on:**

- _Knowledge Architecture_ — supplies Source Authority and knowledge versions
- _Research Agent Specification_ — its 1–5 scale is adopted as canonical (§4.2)
- _Database Architecture_ — `trust_level` enum, `trust_score`, `citations`, evidence-chain columns

**Constrains:**

- _AI System Architecture_ — agents may not self-assign trust
- _Specialist Agent Contract_ — every claim must carry `chunk_id` references
- _Frontend Architecture_ — badges and coverage rendered per §4.4 and §7; no trust logic in the UI

**Blocks / is blocked by:**

- **Blocks:** Compliance Agent, Funding Agent, Action Plan Agent, Nova
- **Blocked by:** §4.3 ratification; calibration data from the _AI Evaluation Framework_

---

## 14. Future Evolution

| Change                                           | Trigger                                             |
| ------------------------------------------------ | --------------------------------------------------- |
| Calibrated grounding thresholds                  | First labelled evaluation set                       |
| Per-domain coverage maps beyond The Bahamas      | Second Knowledge Pack                               |
| Founder feedback as a trust signal               | Learning Layer specification                        |
| Regulation-change alerts on affected plans       | Knowledge Freshness Specification                   |
| Cryptographic evidence-chain signing             | Institutional partnership requiring non-repudiation |
| Per-claim trust deltas across knowledge versions | Versioning & Reproducibility                        |

Deliberately **not** planned: agent-assigned trust, model-only grounding, hiding `unknown`.

---

## 15. ADR References

| ADR                 | Relevance                                                             |
| ------------------- | --------------------------------------------------------------------- |
| **0015** (proposed) | **Unified trust and confidence model — §4.3. Awaiting ratification.** |
| 0012                | Fail-open audit policy; contrasted with fail-closed trust (F7)        |
| 0014                | Structured logging — quarantine and downgrade events                  |
| 0009                | RLS pattern — trust data inherits business-owned policies             |
| 0011                | Denormalization — `business_id` on trust-bearing tables               |

---

## 16. Open Questions

| #      | Question                                                                                                                                                  | Blocks                |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| ~~T1~~ | ~~Ratify §4.3?~~ — **RESOLVED 2026-08-07.** Ratified as ADR-0015                                                                                          | —                     |
| ~~T2~~ | ~~VERIFIED from a single authority-3 source?~~ — **RESOLVED 2026-08-07.** VERIFIED requires Authority ≥ 4; official guidance can reach 🟡 DERIVED at most | —                     |
| T3     | Who reviews quarantined content, and within what SLA?                                                                                                     | Human Review Workflow |
| ~~T4~~ | ~~Coverage shown in v1?~~ — **RESOLVED 2026-08-07.** Computed and stored, **not displayed in v1** (§7.4). Display expected in v2 once recall is measured  | —                     |
| T5     | Retention period for quarantined content                                                                                                                  | Operations            |
