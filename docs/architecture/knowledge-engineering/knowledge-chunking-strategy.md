<!--
  MIRROR — do not edit locally without updating Notion.
  Source (canonical authoring surface): https://app.notion.com/p/3b69910b029a8064924ae0b662f2be18
  Series: Knowledge Engineering — K3 of K1–K7
  Mirrored: 2026-08-08 · Content verified against Notion the same day.
  Amendments A7 (§5, §5.1, §8), A6 (§12 ordering) and the D4.3 harvest (§7.1) are present in the
  Notion source and are reproduced here verbatim.
-->

# Knowledge Chunking Strategy v1.0

---

# 1. Purpose

The Knowledge Chunking Strategy defines how validated regulatory knowledge is transformed into structured knowledge units ("chunks") suitable for retrieval by AI agents.

Chunking exists to maximise retrieval precision while preserving complete traceability back to authoritative sources.

Every chunk represents one discrete regulatory concept.

Chunking occurs only after successful validation.

---

# 2. Objectives

The chunking strategy has six objectives:

- maximise retrieval precision
- minimise irrelevant context
- preserve complete provenance
- support citation generation
- reduce hallucination risk
- enable efficient semantic search

A chunk is an engineering artefact rather than a storage optimisation.

---

# 3. Guiding Principles

Knowledge chunking follows seven principles.

### One Concept Per Chunk

Each chunk should represent a single regulatory idea.

Examples:

- one licence
- one permit
- one reporting obligation
- one deadline
- one inspection
- one fee

Chunks should never combine unrelated concepts.

---

### Preserve Context

A chunk must remain understandable without requiring surrounding pages.

Necessary context may be included where required.

---

### Preserve Meaning

Chunking must never alter the legal meaning of the source.

Text may be reorganised for retrieval but not rewritten in a way that changes intent.

---

### Preserve Traceability

Every chunk must retain:

- source ID
- citation
- section reference
- publication version

A chunk without provenance is invalid.

---

### Minimise Duplication

The same requirement should exist only once.

Different wording of the same obligation should reference the existing chunk rather than creating duplicates.

---

### Retrieval Optimised

Chunks should maximise the probability that semantic search returns only the relevant knowledge.

Chunk boundaries are determined by meaning rather than page length.

---

### Stable Identity

Every chunk receives a permanent identifier.

Identifiers survive updates where the underlying requirement remains materially unchanged.

---

# 4. Chunk Lifecycle

Every chunk progresses through the following lifecycle:

```
Validated Requirement
        ↓
Chunk Created
        ↓
Metadata Attached
        ↓
Embedding Generated
        ↓
Indexed
        ↓
Published
        ↓
Monitored
```

---

# 5. Chunk Structure

> **Amended 2026-08-08 (founder-approved, A7).** A chunk may carry **source-level** metadata. It must **not** carry claim-level trust dimensions. See §5.1.

Each chunk contains:

- Chunk ID
- Requirement ID
- Source ID
- Jurisdiction
- Industry
- Regulatory domain
- Title
- Body
- Citation
- Effective date
- Version
- Metadata
- **Source Authority** (source-level — see §5.1)

The chunk is the atomic unit consumed by retrieval.

## 5.1 Source-level vs claim-level metadata

**Source Authority is a property of the document a chunk came from.** It is therefore intrinsic to the chunk and is stored on it. It answers _"how authoritative is this source?"_ — a question that can be answered without knowing what claim the chunk will be used to support.

**Evidence Strength, Reasoning Confidence, Trust Level and Trust Score are NOT properties of a chunk and must never be stored on one.**

The reason is straightforward: a chunk has no claim to be strong evidence _for_. Evidence Strength answers _"does this passage actually say this?"_ — which is meaningless until a specific claim exists. The same chunk may be Evidence Strength 5 for one claim and 2 for another.

| Dimension                 | Property of          | Stored on the chunk?                   |
| ------------------------- | -------------------- | -------------------------------------- |
| Source Authority          | the source document  | ✅ Yes                                 |
| Evidence Strength         | a passage↔claim link | ❌ No — derived per claim              |
| Reasoning Confidence      | an inference         | ❌ No — derived per claim              |
| Coverage Confidence       | a retrieved set      | ❌ No — derived per set                |
| Trust Level / Trust Score | a claim              | ❌ No — **derived by the Trust Layer** |

Storing claim-level trust on a chunk would let a value calculated once at publication be reused for claims it was never assessed against — which is the trust-laundering the Trust Layer Specification exists to prevent.

Provenance metadata required for retrieval and citation (source ID, citation, section reference, version, effective date) is unaffected and must be preserved.

---

# 6. Chunk Size

Chunks should prioritise semantic completeness over token count.

Guidelines:

- Avoid splitting a single obligation.
- Split unrelated obligations.
- Keep supporting context with the requirement.
- Avoid combining multiple independent procedures.

Token limits are implementation details and should not dictate chunk boundaries.

---

# 7. Relationships Between Chunks

Chunks may reference related chunks.

Relationship types include:

- prerequisite
- exception
- dependency
- supersedes
- related procedure
- supporting guidance

These relationships enable richer retrieval without duplicating content.

## 7.1 Conditional relationships

> **Harvested 2026-08-08 (founder decision D4.3)** from the retired _Retrieval Engine
> Specification_ §8 and _Knowledge Graph Architecture_ §8. Both documents are non-canonical.
> Graph-first retrieval was **not** adopted (D1); only the conditional-logic concept is taken,
> and K3 is its owner.

Not every requirement applies to every business. A requirement may apply only above an employee
threshold, only where alcohol is sold, only where goods are imported.

Where applicability is conditional, the condition is recorded as **structured logic attached to
the chunk relationship** — not as prose inside the chunk body.

```
Requirement: Food Handler Certificate
  applies_if: employees > 5

Requirement: Liquor Licence
  applies_if: sells_alcohol = true

Requirement: Customs Registration
  applies_if: imports_goods = true
```

Structured conditions are machine-evaluable; prose conditions are not. A condition buried in a
sentence can only be honoured by a model reading it correctly every time, which is not a control.

**Boundaries — binding:**

- A conditional relationship is a **property of the relationship**, not a trust dimension. It
  does not affect Source Authority and never appears in the four-dimension trust model
  (ADR-0015, §5.1).
- Conditions are **evaluated against the structured Business Profile**, never against
  conversational text (ADR-0017 — conversation is never evidence).
- Evaluating a condition to `false` **excludes a requirement from a founder's plan; it does not
  delete or unpublish the chunk.** The chunk remains published and retrievable for other
  businesses.
- An **unevaluable** condition — the profile lacks the field — is not treated as `false`. It is
  reported as unresolved so the Coordinator can decide (K5 §10; ADR-0017 `unresolved[]`).
  Silently dropping a requirement because a field was missing is the omission failure this
  platform exists to prevent.
- Condition vocabulary is **controlled and version-controlled** (K4 §8), like every other
  metadata vocabulary.

⚠️ **Scope note.** This section deliberately records the concept only. **No dedicated
conditional-logic specification is created.** If this grows beyond what K3 can carry, that
warrants a founder decision to create one — not a silent expansion here.

---

# 8. Metadata Requirements

Every chunk records:

- jurisdiction
- industry
- regulator
- document type
- legal authority
- **Source Authority** (source-level only — §5.1)
- **Legal Source Category** (K2 §8.1)
- effective date
- regulatory domain
- keywords

Metadata supports both filtering and retrieval.

Claim-level trust dimensions are **not** chunk metadata (§5.1). They are derived by the Trust Layer when a specific claim is evaluated against retrieved evidence.

---

# 9. Versioning

Chunks are versioned whenever the underlying requirement changes.

Historical versions remain available for audit purposes.

Superseded chunks are never deleted.

---

# 10. Quality Assurance

Chunk quality is evaluated against:

- semantic completeness
- citation accuracy
- metadata completeness
- retrieval performance
- duplication rate
- traceability

Poor-quality chunks are rejected before publication.

---

# 11. Success Criteria

The chunking strategy is successful when:

- every validated requirement becomes a retrievable chunk
- chunks preserve legal meaning
- provenance is never lost
- duplicate knowledge is minimised
- retrieval consistently returns the correct regulatory information

---

# 12. Relationship to Other Specifications

> **Corrected 2026-08-08 (A6).** K3 and K4 previously each claimed to precede the other. The lifecycle order is **K3 → K4**: chunks are created, then metadata and citations are attached to them.

## Governing — this document is subordinate to them

- FoundryAI Constitution
- **Trust Layer Specification** (and ADR-0015, ratified)
- AI System Architecture

## Inputs — processes this document follows

- Knowledge Acquisition Process (K1)
- Knowledge Validation Standard (K2)

## Outputs — processes this document precedes

- Metadata & Citation Standard (K4)
- Retrieval Architecture (K5)
- Knowledge Publishing Pipeline (K7)

Chunking transforms validated regulatory requirements into the atomic knowledge units that power every AI agent within FoundryAI.

---

# End of Document
