<!--
  MIRROR — do not edit locally without updating Notion.
  Source (canonical authoring surface): https://app.notion.com/p/3b69910b029a80b1aaa8e7f640dfd878
  Series: Knowledge Engineering — K6 of K1–K7
  Mirrored: 2026-08-08 · Content verified against Notion the same day.

  K6 is the CANONICAL monitoring specification (conflict C2, founder-approved).
  AI-6 Knowledge Freshness Specification is RETIRED; its five policy mechanisms are
  absorbed in §2A below. AI-6 is retained at ../knowledge-freshness-specification.md
  for history only — do not implement from it, and do not recreate it.
-->

# Knowledge Monitoring & Change Detection Specification v1.0

---

# 1. Purpose

The Knowledge Monitoring & Change Detection Specification defines how FoundryAI continuously monitors authoritative sources for regulatory changes and maintains the accuracy of published Knowledge Packs over time.

Its purpose is to ensure that founders receive guidance based on current regulatory information while preserving complete historical traceability.

Knowledge monitoring is a continuous operational process rather than a one-time publication activity.

---

# 2. Objectives

The monitoring system has eight objectives.

- Detect regulatory changes as early as possible.
- Preserve historical versions.
- Minimise outdated guidance.
- Trigger controlled review workflows.
- Maintain Trust Layer integrity.
- Notify affected downstream systems.
- Support reproducible historical decisions.
- Protect founders from silent regulatory drift.

---

# 2A. Absorbed policy mechanisms (merged from AI-6, 2026-08-08)

> **Founder-approved merge.** The _Knowledge Freshness Specification_ (AI Architecture doc 6) is **retired as a competing specification**; its five policy mechanisms are absorbed below. K6 is now the single canonical specification for knowledge monitoring, change detection and freshness. AI-6 is retained for history only.

Governing principle carried over: **stale-and-labelled beats stale-and-silent.**

## 2A.1 Review cadence by source class

Age is not the same as staleness. A 2019 Act that has not been amended is current; a guidance page from last month may already be wrong. Cadence therefore follows source class, not calendar age.

| Source class                                  | Cadence                                       |
| --------------------------------------------- | --------------------------------------------- |
| Level 5 — primary legislation                 | On amendment; verify quarterly                |
| Level 4 — regulations / statutory instruments | 90 days                                       |
| Level 3 — official guidance                   | **30 days** — changes quietly and often       |
| Funding programmes                            | **14 days** — deadlines and windows move fast |
| Agency profiles                               | 30 days                                       |

Every document carries `review_due_at`. **Past due is queryable**, which is what turns a cadence into an operational fact rather than a calendar reminder nobody owns.

## 2A.2 Trust-score staleness penalty

A citation past its review date applies a **−10 trust-score penalty** (Trust Layer §5).

It does **not** change the Trust Level badge: the source is still what it is. It lowers certainty, which is the honest signal. Source Authority is preserved; only the score moves.

## 2A.3 Plan cascade rules

```
document changes
   │
   ├─ find published chunks from that document
   ├─ find launch plans citing those chunks
   │
   ├─ plan status = ready   ──► regenerate, show diff
   └─ plan status = active  ──► mark stale, notify, DO NOT auto-replace
```

**An approved plan is never silently replaced.** If a founder is mid-execution, the new version enters `ready` while the approved version stays `active` until they accept it. The ground does not move under someone without consent (Launch Plan Architecture §7A.5).

## 2A.4 A 404 is not an unpublish

A source returning 404 is **not** automatically unpublished. A moved URL and a repealed Act look identical over HTTP.

It is flagged for **urgent review**. If withdrawal is confirmed, chunks are unpublished, plans citing them are marked stale, and the affected requirement becomes ⚪ UNKNOWN rather than silently disappearing.

**A requirement vanishing without explanation is worse than one labelled uncertain.**

## 2A.5 Coverage recovery

When a Knowledge Domain **gains** coverage that previously returned nothing, plans generated during that gap **were incomplete** and are flagged for regeneration.

This is the platform's only mechanism for correcting an omission after the fact — and the reason coverage gaps are recorded per plan rather than computed and discarded.

---

# 3. Monitoring Principles

## 3.1 Official Sources Only

Monitoring observes only approved authoritative sources defined during the Knowledge Acquisition Process.

No unofficial source may trigger an update.

---

## 3.2 Continuous Operation

Knowledge Packs remain under continuous observation throughout their lifecycle.

Monitoring does not cease after publication.

---

## 3.3 Human Review Before Publication

Detected changes never enter production automatically.

Every material change requires validation before publication.

---

## 3.4 Historical Preservation

Previous versions remain permanently available.

Knowledge is superseded rather than overwritten.

---

## 3.5 Explicit Versioning

Every published Knowledge Pack receives a unique version identifier.

Changes are always attributable to a specific version.

---

## 3.6 Auditability

Every detected change becomes part of the permanent audit record.

---

## 3.7 Transparency

Founders should be informed when their recommendations are based on updated regulatory information.

---

# 4. Monitoring Workflow

```
Official Sources
        │
        ▼
Scheduled Monitoring
        │
        ▼
Change Detection
        │
        ▼
Impact Assessment
        │
        ▼
Human Validation
        │
        ▼
Knowledge Pack Update
        │
        ▼
Publication
        │
        ▼
Founder Notification
```

Every stage produces a permanent record.

---

# 5. Monitoring Methods

The monitoring system may use multiple techniques.

These include:

- document checksum comparison
- publication date monitoring
- RSS feeds
- government APIs
- official newsletters
- gazette publications
- web page change detection

The monitoring method is recorded for every source.

---

# 6. Types of Detected Changes

Detected changes are classified into one of the following categories.

### Administrative

Formatting or structural changes without regulatory impact.

---

### Editorial

Clarifications that do not alter legal obligations.

---

### Regulatory

New or amended requirements.

---

### Procedural

Application process changes.

---

### Financial

Fee changes.

---

### Temporal

Deadlines or effective dates.

---

### Structural

New licences, permits or regulatory domains.

---

# 7. Impact Assessment

Every detected change undergoes impact assessment.

Assessment determines:

- affected industries
- affected jurisdictions
- affected Knowledge Chunks
- affected Launch Plans
- affected founders
- urgency
- required review effort

Impact assessment determines workflow priority.

---

# 8. Knowledge Pack Status

Knowledge Packs may have one of the following statuses.

- Draft
- Under Review
- Published
- Superseded
- Archived

Status changes are recorded permanently.

---

# 9. Publication Workflow

Validated updates follow a controlled publication process.

```
Validated Change
        │
        ▼
New Knowledge Pack Version
        │
        ▼
Chunk Regeneration
        │
        ▼
Embedding Regeneration
        │
        ▼
Retrieval Index Update
        │
        ▼
Publication
```

Historical versions remain accessible.

---

# 10. Founder Impact Management

When a published Knowledge Pack changes, the platform determines:

- which businesses are affected
- which launch plans require review
- which recommendations become outdated
- whether founders should be notified

Notifications are prioritised according to regulatory impact.

---

# 11. Trust Layer Integration

Monitoring influences the Trust Layer by:

- updating Coverage Confidence
- recalculating Evidence Strength where required
- preserving Source Authority
- identifying stale knowledge

Monitoring does not independently modify trust scores without validation.

---

# 12. Change Logging

Every detected change records:

- source
- detection timestamp
- previous version
- new version
- reviewer
- approval outcome
- publication timestamp
- affected artefacts

These logs support regulatory audits and internal governance.

---

# 13. Monitoring Metrics

The platform continuously measures:

- detection latency
- validation time
- publication time
- stale knowledge rate
- update frequency
- false positive rate
- missed change rate

These metrics support continuous improvement.

---

# 14. Failure Handling

Monitoring failures include:

- inaccessible source
- checksum mismatch
- parsing failure
- retrieval failure
- validation delay

Failures are logged and escalated for manual review.

Knowledge Packs remain published until validated replacements exist.

---

# 15. Governance

Changes to monitoring rules require:

- Architecture review
- Knowledge Engineering approval
- Documentation update
- Version increment

Operational procedures remain version-controlled.

---

# 16. Success Criteria

The monitoring process is successful when:

- regulatory changes are detected promptly
- historical versions remain reproducible
- founders receive updated guidance
- stale knowledge is minimised
- publication remains controlled
- trust calculations remain accurate

Success is measured by the platform's ability to remain current without sacrificing reliability.

---

# 17. Relationship to Other Specifications

> **Corrected 2026-08-08.** This section previously listed the Trust Layer Specification as _following_ this document. That inverted the documentation hierarchy.

## Governing documents — this document is subordinate to them

- FoundryAI Constitution
- **Trust Layer Specification** (and ADR-0015, ratified)
- AI System Architecture
- ADR-0016 — monitoring sweeps run as persisted workflow runs

Where this document conflicts with any of the above, **they govern**.

## Inputs — processes this document follows

- Knowledge Acquisition Process (K1)
- Knowledge Validation Standard (K2)
- Knowledge Chunking Strategy (K3)
- Metadata & Citation Standard (K4)
- Retrieval Architecture (K5)

## Outputs — processes this document precedes

- Knowledge Publishing Pipeline (K7)
- Human Review Workflow (AI-10) — receives the review queue this document generates
- Launch Plan Architecture (AI-2) — receives the plan cascade in §2A.3

## Superseded

- **Knowledge Freshness Specification (AI Architecture doc 6)** — retired 2026-08-08. Its policy mechanisms are absorbed in §2A. Retained for history.

Monitoring provides the operational mechanism by which FoundryAI maintains the long-term accuracy of its regulatory knowledge.

---

# End of Document
