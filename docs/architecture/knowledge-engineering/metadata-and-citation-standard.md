<!--
  MIRROR — do not edit locally without updating Notion.
  Source (canonical authoring surface): https://app.notion.com/p/3b69910b029a801caa4acac8d7d5c6d6
  Series: Knowledge Engineering — K4 of K1–K7
  Mirrored: 2026-08-08 · Content verified against Notion the same day.
  Amendments R3 (Reasoning Confidence) and C3 (canonical citation object, mandatory
  chunk_id) are already present in the Notion source and are reproduced here verbatim.
-->

# Metadata & Citation Standard v1.0

---

# 1. Purpose

The Metadata & Citation Standard defines the mandatory metadata and citation requirements applied to every knowledge object within FoundryAI.

Its purpose is to ensure that all knowledge remains:

- discoverable
- traceable
- verifiable
- explainable
- reproducible

Every Knowledge Chunk, Requirement, Source Document and Citation shall conform to this standard.

---

# 2. Objectives

The standard has seven objectives.

- Standardise metadata across all Knowledge Packs.
- Preserve complete provenance.
- Support semantic retrieval.
- Enable filtering across jurisdictions and industries.
- Support Trust Layer calculations.
- Enable reproducible citations.
- Ensure long-term maintainability.

Metadata is considered a first-class asset, not an implementation detail.

---

# 3. Scope

This standard applies to:

- Source Documents
- Knowledge Chunks
- Regulatory Requirements
- Generated Launch Plans
- Compliance Recommendations
- Funding Recommendations
- AI-generated explanations
- Evidence Records

Every knowledge object must contain structured metadata.

---

# 4. Metadata Principles

Metadata follows eight principles.

## 4.1 Completeness

Every required metadata field must be populated before publication.

Incomplete metadata prevents publication.

---

## 4.2 Consistency

Equivalent concepts must use identical metadata values across all Knowledge Packs.

Example:

```
Regulatory Domain:
Employment

NOT

Employment Law
Labour
Workers
Hiring
```

Controlled vocabularies are mandatory.

---

## 4.3 Machine Readability

Metadata exists primarily for software consumption.

Human-readable labels may be generated from metadata but shall never replace it.

---

## 4.4 Stability

Identifiers remain stable over time.

Renaming a document must never invalidate existing references.

---

## 4.5 Extensibility

New metadata fields may be added without invalidating historical records.

---

## 4.6 Traceability

Every metadata record must maintain links to:

- originating source
- validating evidence
- publication version
- reviewer

---

## 4.7 Separation of Content and Metadata

Metadata describes knowledge.

It must never duplicate the knowledge itself.

---

## 4.8 Version Awareness

Metadata must always indicate the version of the object it describes.

---

# 5. Mandatory Metadata Fields

Every Knowledge Chunk must contain:

### Identity

- Chunk ID
- Requirement ID
- Source ID

---

### Jurisdiction

- Country
- Region
- Municipality (if applicable)

---

### Classification

- Industry
- Regulatory Domain
- Requirement Category
- Regulator

---

### Authority

- Source Authority
- Evidence Strength
- Reasoning Confidence
- Coverage Confidence Reference

_("Reasoning Confidence" is the canonical name of the ratified trust dimension per ADR-0015. Corrected 2026-08-08 from "Reasoning Quality".)_

---

### Temporal

- Publication Date
- Effective Date
- Review Date
- Version

---

### Provenance

- Original Document
- Citation
- Acquisition Date
- Validator
- Reviewer

---

### Operational

- Publication Status
- Monitoring Status
- Knowledge Pack Version

---

# 6. Citation Standard

> **Amended 2026-08-08 (founder-approved).** The canonical citation object is defined in the **Trust Layer Specification §8**. This section references that definition rather than restating it, so the schema cannot drift. `chunk_id` is now **mandatory**.

Every published regulatory claim must include a citation conforming to the canonical object:

**Mandatory**

- `chunk_id` — **retrieval identity: binds the claim to the exact chunk returned by the current retrieval run**
- Agency
- Source Document
- Section
- Publication Date
- Last Reviewed Date
- Knowledge Version
- URL
- Access Date

**Optional (retained from this standard — they aid human verification)**

- Clause
- Page (where applicable)

Example:

```
chunk_id:          9f2c1e64-...
Agency:            Department of Inland Revenue
Document:          Business Licence Act 2023
Section:           Section 12
Clause:            12(3)
Page:              27
Publication Date:  2023-06-01
Last Reviewed:     2026-07-15
Knowledge Version: BS-v1.4
URL:               https://...
Retrieved:         2026-08-08
```

**Why `chunk_id` is mandatory.** Clause and Page help a _human_ locate the text. `chunk_id` is what lets the _system_ prove the passage was actually retrieved: without it, citation binding cannot confirm the chunk came from this run, Evidence Strength cannot be assessed against the quoted passage, and grounding cannot be replayed. A citation naming a real document that was never retrieved is fabrication, and `chunk_id` is the field that detects it.

General references are insufficient.

---

# 7. Citation Quality Rules

A citation must satisfy five criteria.

### Precise

The cited location uniquely identifies the supporting evidence.

---

### Accessible

A reviewer must be able to locate the cited passage.

---

### Stable

Version changes must not invalidate historical citations.

---

### Complete

The citation must contain all required components.

---

### Reproducible

An independent reviewer should reach the same conclusion from the cited material.

---

# 8. Controlled Vocabularies

The following metadata values are centrally managed.

- Regulatory Domains
- Requirement Categories
- Industry Types
- Regulator Names
- Jurisdiction Codes
- Document Types
- Publication Statuses

These vocabularies are version-controlled.

No free-text alternatives are permitted where a controlled vocabulary exists.

---

# 9. Metadata Validation

Metadata validation occurs automatically before publication.

Validation confirms:

- required fields present
- identifier uniqueness
- vocabulary compliance
- citation completeness
- version consistency
- provenance links

Objects failing validation remain unpublished.

---

# 10. Relationship to Trust Layer

Metadata provides the inputs required by the Trust Layer.

Specifically:

- Source Authority
- Evidence Strength
- Reasoning Confidence
- Coverage Confidence reference

Metadata itself does not calculate trust.

It records the values produced elsewhere.

The four dimensions are defined by ADR-0015 and the Trust Layer Specification. This document records them; it does not define them.

---

# 11. Relationship to Retrieval

Retrieval systems use metadata to:

- filter candidate knowledge
- rank search results
- constrain AI context
- explain why information was selected
- support jurisdiction-specific retrieval

Metadata therefore directly affects retrieval quality.

---

# 12. Governance

Metadata standards are centrally governed.

Changes require:

- Architecture review
- Documentation update
- Version increment
- Migration strategy (if required)

Breaking changes are prohibited without an approved Architecture Decision Record.

---

# 13. Success Criteria

The Metadata & Citation Standard is successful when:

- every knowledge object has complete metadata
- every regulatory claim has reproducible citations
- metadata supports retrieval and trust calculations
- provenance is never lost
- reviewers can independently verify published information

---

# 14. Relationship to Other Specifications

This document follows:

- Knowledge Acquisition Process
- Knowledge Validation Standard
- Knowledge Chunking Strategy

It precedes:

- Retrieval Architecture
- Knowledge Monitoring & Change Detection
- Knowledge Publishing Pipeline

Metadata provides the structured context that enables trustworthy retrieval, explainability and long-term governance across the FoundryAI platform.

---

# End of Document
