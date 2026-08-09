<!--
  MIRROR — do not edit locally without updating Notion.
  Source (canonical authoring surface): https://app.notion.com/p/3b69910b029a80dbaef2c618e40683f2
  Series: Knowledge Engineering — K7 of K1–K7
  Mirrored: 2026-08-08 · Content verified against Notion the same day.
  Amendment A10 (§3 split, §3.1, §7) is already present in the Notion source and is
  reproduced here verbatim. K1's position is canonical: embeddings are retrieval
  artifacts, not Knowledge Pack versions.
  NO EMBEDDING MODEL IS SELECTED. KI1 / MP-1 remains explicitly open.
-->

# Knowledge Publishing Pipeline Specification v1.0

---

# 1. Purpose

The Knowledge Publishing Pipeline defines the controlled process by which validated regulatory knowledge is transformed into production-ready Knowledge Packs available for retrieval by FoundryAI AI agents.

The pipeline ensures that no knowledge enters production without passing all required validation, governance, and quality assurance stages.

Knowledge publication is treated as a controlled release process rather than a data import.

---

# 2. Objectives

The publishing pipeline has eight objectives.

- Ensure only validated knowledge reaches production.
- Preserve complete traceability.
- Maintain immutable version history.
- Support controlled rollbacks.
- Protect production retrieval quality.
- Enable repeatable publishing.
- Maintain platform trust.
- Support jurisdiction-by-jurisdiction releases.

---

# 3. Guiding Principles

The publishing pipeline follows eight principles.

### Validation Before Publication

Only knowledge that has successfully completed the Knowledge Validation Standard may enter the pipeline.

---

### Immutable Releases

Published Knowledge Packs are immutable.

Corrections require publishing a new version rather than modifying an existing one.

---

### Version Everything

> **Amended 2026-08-08 (founder-approved, A10).** This principle previously listed Embeddings among canonical versioned artefacts, contradicting K1 §3.6. **K1's position is canonical: embeddings are not Knowledge Pack versions.**

Every published artefact receives its own version.

**Canonical knowledge versions** — these define the Knowledge Pack:

- Knowledge Pack
- Knowledge Chunks
- Metadata

**Retrieval artifacts** — versioned and reproducible, but **not** canonical knowledge versions:

- Embeddings
- Retrieval Index

See §3.1 below.

---

### Atomic Publication

A publication either succeeds completely or not at all.

Partial releases are prohibited.

---

### Reproducibility

A published release must be reproducible from:

- source documents
- metadata
- validation records
- publishing configuration
- retrieval configuration and embedding model/version (§3.1)

---

### 3.1 Embeddings are retrieval artifacts, not knowledge versions

Embeddings are an **implementation artifact of retrieval**. They are derived from published chunks; they are not knowledge, and they carry no meaning a founder or reviewer could inspect.

**Consequences — all binding:**

- **Regenerating embeddings does NOT create a new Knowledge Pack version.** The knowledge is unchanged; only the index over it changed.
- **Changing the embedding model invalidates the affected retrieval artifacts** and requires regeneration — but **must not by itself increment the Knowledge Pack version**.
- Embeddings are nonetheless **versioned and reproducible in their own right**, because deterministic retrieval replay depends on them (K5 §3.8).

**Every embedding generation records:**

| Field                             | Why                                                            |
| --------------------------------- | -------------------------------------------------------------- |
| Embedding model                   | Identifies the generator                                       |
| Model version                     | Same model, different version, different vectors               |
| **Dimensions**                    | A column type in the vector store — changing it is a migration |
| Generation timestamp              | Ordering and audit                                             |
| **Source Knowledge Pack version** | Which knowledge state these vectors index                      |
| Retrieval configuration version   | Required for deterministic replay (K5 §3.8)                    |
| Chunk version                     | Which chunk revision was embedded                              |
| Generation status                 | Partial regeneration must be detectable                        |

This record is what allows a historical retrieval to be replayed: the Knowledge Pack version alone is insufficient, because the same knowledge indexed by a different embedding model returns a different ordered result set.

⚠️ **No embedding model is selected by this document.** Model, version and dimensionality remain open (KI1 / MP-1) and block implementation of the retrieval index.

---

### Separation of Staging and Production

Knowledge is prepared within a staging environment before promotion into production.

Production is never edited directly.

---

### Auditability

Every publishing action becomes part of the permanent audit record.

---

### Controlled Promotion

Promotion into production requires explicit approval according to governance policies.

---

# 4. Publishing Workflow

```
Validated Knowledge
        │
        ▼
Metadata Validation
        │
        ▼
Chunk Verification
        │
        ▼
Embedding Generation
        │
        ▼
Retrieval Index Build
        │
        ▼
Staging Environment
        │
        ▼
Quality Assurance
        │
        ▼
Approval
        │
        ▼
Production Publication
        │
        ▼
Monitoring
```

Each stage produces versioned artefacts.

---

# 5. Staging Environment

Before publication every Knowledge Pack exists within a staging environment.

Staging supports:

- QA
- retrieval testing
- trust verification
- citation review
- regression testing
- approval

No AI agent retrieves staging knowledge during production workflows.

---

# 6. Quality Assurance

The following checks are mandatory.

### Acquisition Complete

All required authoritative sources collected.

---

### Validation Complete

Every requirement successfully validated.

---

### Metadata Complete

Required metadata populated.

---

### Citation Complete

Every regulatory claim contains reproducible citations.

---

### Trust Verification

Trust Layer values successfully calculated.

---

### Retrieval Testing

Representative retrieval scenarios demonstrate acceptable precision and recall.

---

### Coverage Assessment

Coverage Confidence calculated and reviewed.

---

### Publication Checklist

All governance requirements satisfied.

---

# 7. Embedding Generation

Embeddings are generated only after validation and chunk verification.

Embedding generation records the full artifact manifest defined in §3.1: embedding model · model version · **dimensions** · generation timestamp · **source Knowledge Pack version** · retrieval configuration version · chunk version · generation status.

Embeddings are regenerated whenever:

- a chunk changes materially, **or**
- the embedding model or model version changes.

In the second case the regeneration is a **retrieval-artifact rebuild**, not a knowledge release: affected artifacts are invalidated and rebuilt, and **the Knowledge Pack version does not change** (§3.1). The rebuild is still governed, audited and staged like any other publication step — it simply does not represent new knowledge.

⚠️ Blocked pending the embedding model decision (KI1 / MP-1).

---

# 8. Retrieval Index Publication

The retrieval index is built from:

- published chunks
- published metadata
- published embeddings

Indexes are versioned alongside the Knowledge Pack.

Previous indexes remain recoverable.

---

# 9. Version Management

Every publication receives:

- Knowledge Pack Version
- Publication Timestamp
- Release Identifier
- Reviewer
- Approval Record

Historical versions remain permanently available.

---

# 10. Rollback Strategy

Rollback restores a previous published version.

Rollback never deletes later versions.

Rollback records:

- initiating event
- affected versions
- justification
- approval
- timestamp

Rollbacks preserve complete audit history.

---

# 11. Founder Impact

Following publication the platform evaluates:

- affected jurisdictions
- affected industries
- affected businesses
- affected Launch Plans
- affected Compliance Reports
- notification requirements

Only impacted founders are notified.

---

# 12. Audit Logging

Publishing generates permanent audit records.

Recorded events include:

- publication started
- validation completed
- approval granted
- production published
- rollback executed
- publication cancelled

Audit records are immutable.

---

# 13. Monitoring

Following publication the platform monitors:

- retrieval quality
- citation usage
- trust distribution
- retrieval failures
- stale references
- founder feedback
- system performance

Monitoring informs future Knowledge Pack improvements.

---

# 14. Security

Publishing must preserve:

- tenant isolation
- version integrity
- immutable audit records
- provenance
- citation accuracy
- Trust Layer metadata

No publication may weaken platform security guarantees.

---

# 15. Governance

Knowledge publication requires documented approval.

Approval confirms:

- acquisition complete
- validation complete
- retrieval verified
- quality assurance complete
- governance satisfied

Publishing authority is centrally managed.

---

# 16. Success Criteria

The Knowledge Publishing Pipeline is successful when:

- only validated knowledge reaches production
- every release is reproducible
- rollback is possible
- provenance is preserved
- retrieval quality remains stable
- founders receive trustworthy regulatory guidance

Success is measured by publication reliability rather than publication speed.

---

# 17. Relationship to Other Specifications

This document follows:

- Knowledge Acquisition Process
- Knowledge Validation Standard
- Knowledge Chunking Strategy
- Metadata & Citation Standard
- Retrieval Architecture
- Knowledge Monitoring & Change Detection

It provides the operational mechanism that transforms validated regulatory knowledge into production-ready Knowledge Packs consumed by all FoundryAI AI agents.

---

# End of Document
