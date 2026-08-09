<!--
  MIRROR — do not edit locally without updating Notion.
  Source (canonical authoring surface): https://app.notion.com/p/3b69910b029a8086b80fe8b072cd1acd
  Series: Knowledge Engineering — K2 of K1–K7
  Mirrored: 2026-08-08 · Content verified against Notion the same day.
  Amendments A1/A2 (Reasoning Confidence), A4 (Legal Source Category), A5 (hierarchy)
  are already present in the Notion source and are reproduced here verbatim.
-->

# Knowledge Validation Standard v1.0

---

# 1. Purpose

The Knowledge Validation Standard defines the methodology by which regulatory requirements extracted from authoritative sources are verified before they become part of a FoundryAI Knowledge Pack.

Validation exists to ensure that every requirement presented to founders is supported by authoritative evidence and can be independently reproduced.

No extracted requirement may be published without successful validation.

---

# 2. Objectives

The validation process has six objectives.

- Prevent unsupported regulatory claims.
- Prevent AI hallucinations.
- Preserve complete traceability to source material.
- Ensure extracted requirements accurately reflect the original authority.
- Produce evidence suitable for regulatory review.
- Support the Trust Layer confidence model.

Validation measures correctness rather than completeness.

Completeness is addressed separately through the Knowledge Acquisition Process and Coverage Confidence.

---

# 3. Scope

This standard applies to every regulatory requirement stored within FoundryAI.

It covers:

- statutory obligations
- licensing requirements
- permits
- registrations
- inspections
- deadlines
- fees
- reporting obligations
- operational restrictions

It applies regardless of jurisdiction.

---

# 4. Validation Principles

Validation follows seven principles.

## 4.1 Evidence First

Every requirement must be supported by evidence before it may be interpreted.

---

## 4.2 Primary Sources Preferred

Legislation and regulations take precedence over explanatory guidance.

Guidance may clarify requirements but must not replace legal authority.

---

## 4.3 Exact Traceability

Every validated requirement must reference the precise location within its source.

Acceptable references include:

- Act section
- Regulation number
- Clause
- Schedule
- Official page
- Paragraph

General citations such as "Business Licence Act" are insufficient.

---

## 4.4 Reproducibility

Another reviewer must be able to recreate the validation result using only:

- the source document
- recorded metadata
- validation notes

No undocumented judgement should be required.

---

## 4.5 Explicit Uncertainty

If evidence is ambiguous, conflicting or incomplete, the requirement must be downgraded rather than presented as verified.

Uncertainty must never be hidden.

---

## 4.6 Separation of Fact and Interpretation

Facts extracted from source material remain distinct from AI-generated explanations.

Founders must always be able to distinguish:

- what the law states
- how FoundryAI explains it

---

## 4.7 Auditability

Every validation decision becomes part of the permanent evidence record.

Validation history is immutable.

---

# 5. Validation Workflow

Validation consists of six stages.

```
Requirement Extracted
        │
        ▼
Evidence Located
        │
        ▼
Evidence Verified
        │
        ▼
Requirement Confirmed
        │
        ▼
Trust Dimensions Calculated
        │
        ▼
Knowledge Pack Published
```

Each stage produces permanent metadata.

---

# 6. Evidence Verification

For every extracted requirement, validators confirm:

- the cited document exists
- the document is authoritative
- the citation location is correct
- the wording accurately reflects the source
- no contradictory authority exists
- publication status is current

Failure of any check prevents publication.

---

# 7. Validation Record

Every requirement receives a structured validation record.

Minimum fields include:

- Requirement ID
- Source ID
- Citation
- Validator
- Validation date
- Validation outcome
- Source Authority
- Legal Source Category (see §8)
- Evidence Strength
- Reasoning Confidence
- Coverage Confidence contribution
- Reviewer notes

_("Reasoning Confidence" is the canonical dimension name per ADR-0015. Corrected 2026-08-08 from "Reasoning Quality".)_

Validation records remain permanently linked to the originating requirement.

---

# 8. Contradiction Resolution

> **Amended 2026-08-08 (founder-approved, A4).** The six categories below are retained as **Legal Source Category metadata** because they carry a genuinely finer legal distinction than the five-level scale. They are **not** a second trust scale. Source Authority is always derived per ADR-0015, and **no sixth trust level exists**.

## 8.1 Legal Source Category → Source Authority mapping

| Legal Source Category (metadata)           | Derived Source Authority (ADR-0015)                        |
| ------------------------------------------ | ---------------------------------------------------------- |
| Constitution                               | **5**                                                      |
| Primary legislation (Acts, statutes)       | **5**                                                      |
| Regulations                                | **4**                                                      |
| Ministerial orders / statutory instruments | **4**                                                      |
| Official guidance                          | **3**                                                      |
| Agency publications                        | **3** if issued by the responsible agency; **2** otherwise |

Source Authority is the canonical value consumed by the Trust Layer. Legal Source Category is recorded alongside it and is used **only** for conflict resolution ordering within a level.

## 8.2 Conflict resolution order

Conflicts are resolved first by **Source Authority**, then by **Legal Source Category** where authority is equal, then by recency:

1. Higher Source Authority prevails.
2. Where authority is equal, the finer Legal Source Category ordering above prevails — e.g. a Constitution outranks an Act, and a Regulation outranks a Ministerial order, though each pair shares one authority level.
3. Where both are equal, the newer version prevails.
4. Where ambiguity remains, both interpretations are retained pending expert review.
5. **No AI-generated interpretation may resolve a legal conflict independently.**

This preserves the distinction between a Constitution and an ordinary Act — which matters legally — without inventing a trust level for it.

Where conflicts cannot be resolved:

- the requirement is withheld from publication
- the conflict is documented
- manual review is required

---

# 9. Validation Outcomes

Each requirement receives one outcome.

### Validated

Evidence fully supports the extracted requirement.
Publication permitted.

---

### Partially Validated

Evidence supports the core requirement but additional clarification is needed.
Publication permitted with reduced confidence.

---

### Unverified

Evidence insufficient.
Requirement withheld.

---

### Rejected

Evidence contradicts the extracted requirement.
Requirement removed from the Knowledge Pack.

---

# 10. Relationship to the Trust Layer

Validation provides inputs into the Trust Layer but does not determine trust independently.

Validated requirements receive scores for:

- Source Authority
- Evidence Strength
- Reasoning Confidence

Coverage Confidence is calculated separately across the complete Knowledge Pack.

Validation therefore supplies three of the four Trust Layer dimensions.

The four dimensions are defined by ADR-0015 and the Trust Layer Specification. This standard supplies values; it does not define the model.

---

# 11. Human Review

Human review is mandatory when:

- contradictory legislation exists
- evidence cannot be located
- multiple interpretations are equally plausible
- legal amendments introduce ambiguity
- AI confidence falls below operational thresholds

Human review decisions must themselves be documented.

---

# 12. Quality Assurance

Validation quality is assessed through periodic audits.

Audits examine:

- citation accuracy
- traceability
- evidence quality
- reviewer consistency
- false validation rate
- missed contradictions

Audit findings feed continuous improvement of the validation process.

---

# 13. Success Criteria

The Knowledge Validation Standard is successful when:

- every published requirement has traceable evidence
- unsupported claims cannot enter production
- validation decisions are reproducible
- uncertainty is explicitly represented
- trust calculations receive accurate inputs
- reviewers can independently confirm published requirements

Success is measured by the reliability of published knowledge rather than the speed of validation.

---

# 14. Relationship to Other Specifications

> **Corrected 2026-08-08 (A5).** This section previously listed the Trust Layer Specification as _following_ this standard, inverting the documentation hierarchy.

## Governing — this standard is subordinate to them

- FoundryAI Constitution
- **Trust Layer Specification** (and ADR-0015, ratified)
- AI System Architecture

Where this standard conflicts with any of the above, **they govern**.

## Inputs — processes this standard follows

- Knowledge Acquisition Process (K1)
- Knowledge Pack Architecture (K1 §3)

## Outputs — processes this standard precedes

- Knowledge Chunking Strategy (K3)
- Metadata & Citation Standard (K4)
- Retrieval Architecture (K5)
- Human Review Workflow (AI-10) — receives escalations from §11

Validation transforms acquired information into trusted knowledge that downstream AI systems may safely consume.

---

# End of Document
