<!--
  MIRROR — do not edit locally without updating Notion.
  Source (canonical authoring surface): https://app.notion.com/p/3b69910b029a801b9323cb24bef41654
  Series: Knowledge Engineering — K5 of K1–K7
  Mirrored: 2026-08-08 · Content verified against Notion the same day.
  Amendments A3 + A7 (§3.4), A8 (§10), A9 (§3.8, §12) and A12 (§3.10, §11) are already
  present in the Notion source and are reproduced here verbatim.
  Embedding model / index parameters remain BLOCKED on KI1 / MP-1. No model is selected.
-->

# Retrieval Architecture (RAG) Specification v1.0

---

# 1. Purpose

The Retrieval Architecture Specification defines how FoundryAI retrieves regulatory knowledge for AI agents in a manner that is accurate, explainable, jurisdiction-aware, and auditable.

Retrieval is responsible for selecting the minimum set of validated knowledge required for an AI agent to complete a task while preserving complete provenance and trust information.

The retrieval system is considered part of the platform's safety architecture.

---

# 2. Objectives

The Retrieval Architecture has eight objectives.

- Retrieve only relevant knowledge.
- Prevent cross-jurisdiction contamination.
- Minimise hallucinations.
- Preserve provenance.
- Preserve Trust Layer metadata.
- Support explainable AI responses.
- Optimise retrieval performance.
- Maximise retrieval recall while maintaining precision.

Retrieval quality is measured independently from AI generation quality.

---

# 3. Design Principles

Retrieval follows nine architectural principles.

## 3.1 Retrieval Before Generation

AI agents must retrieve knowledge before producing responses.

Models must never answer regulatory questions from internal model memory alone.

---

## 3.2 Jurisdiction Isolation

Knowledge retrieval must be constrained to the founder's jurisdiction.

Example:

A Bahamian restaurant must never retrieve licensing requirements from Jamaica.

Jurisdiction isolation is a mandatory safety requirement.

---

## 3.3 Industry Isolation

Retrieval is filtered by industry before semantic ranking.

A restaurant should not retrieve tourism licensing requirements unless explicitly relevant.

---

## 3.4 Provenance and Source Metadata Preservation

> **Amended 2026-08-08 (founder-approved, A3 + A7).** Retrieval preserves **source-level** metadata. Claim-level trust dimensions do not exist at retrieval time.

Every retrieved chunk carries, and agents must retain:

- **`chunk_id`** — mandatory retrieval identity (§3.10)
- **Source Authority** — a property of the source document
- Legal Source Category
- citation fields, Knowledge Pack version, effective date

**Evidence Strength, Reasoning Confidence, Trust Level and Trust Score are NOT retrieved.** They do not exist until a specific claim is evaluated against a specific passage, and they are derived by the Trust Layer at that point — never read from the index.

Retrieval therefore supplies **one** of the four dimensions (Source Authority) plus the provenance needed to compute the rest. Source metadata is never discarded during retrieval.

---

## 3.5 Explainability

Every retrieved chunk must remain linked to:

- original document
- citation
- regulator
- Knowledge Pack version

This information must remain available throughout the reasoning pipeline.

---

## 3.6 Minimal Context

Only the knowledge necessary for the current task should be retrieved.

Excessive context reduces reasoning quality.

---

## 3.7 Deterministic Filtering Before Semantic Search

Structured filters execute before embeddings are queried.

Mandatory filters include:

- jurisdiction
- industry
- publication status
- effective date

Semantic search operates only on the filtered candidate set.

---

## 3.8 Retrieval is Deterministically Reproducible

> **Amended 2026-08-08 (founder-approved, A9).** "Materially identical" was too weak for replay.

Given a fixed set of:

- Knowledge Pack version
- retrieval configuration
- query representation
- jurisdiction and industry filters
- ranking configuration
- embedding model **and** model version

…the system **must reproduce the same ordered retrieval result set**. Not similar, not materially equivalent — the same chunks in the same order.

**These inputs must be persisted with every retrieval run** (§12). Reproducibility is a property of _recorded inputs_, not of the infrastructure: a later ranking improvement or index rebuild does **not** reproduce a historical retrieval unless the versioned inputs above were preserved. Nothing in this document should be read as implying otherwise.

Ranking improvements are permitted and expected — they change the _configuration_, and the configuration is versioned. A historical retrieval is replayed against the configuration it actually ran under.

---

## 3.9 Retrieval Never Creates Knowledge

Retrieval selects knowledge.

Generation interprets knowledge.

These responsibilities remain separate.

---

## 3.10 Chunk identity is mandatory

> **Added 2026-08-08 (founder-approved, A12).**

Every chunk returned by retrieval **must** carry its **`chunk_id`**.

The identifier must correspond to the **exact chunk returned by this retrieval run** and must remain **stable within the relevant Knowledge Pack version**.

`chunk_id` is the single citation identity used across the platform. **No competing identity field may be introduced** — not a retrieval-local index, not a per-run handle, not a passage hash. Downstream, the Trust Layer verifies that every claim's cited `chunk_id` was returned by _this_ run; a citation naming a real document that was never retrieved is fabrication, and `chunk_id` is what detects it.

See the canonical citation object in the Trust Layer Specification §8, and the agent envelope in the Specialist Agent Contract.

---

# 4. Retrieval Pipeline

```
Founder Request
        │
        ▼
Business Context Resolution
        │
        ▼
Jurisdiction Filter
        │
        ▼
Industry Filter
        │
        ▼
Knowledge Domain Filter
        │
        ▼
Metadata Filtering
        │
        ▼
Semantic Search
        │
        ▼
Trust Filtering
        │
        ▼
Ranking
        │
        ▼
Context Assembly
        │
        ▼
AI Agent
```

Every stage narrows the candidate set before the next begins.

---

# 5. Context Resolution

Before retrieval begins, the system determines:

- country
- industry
- business stage
- business structure
- relevant regulatory domains
- current workflow stage

These values originate from the Business Profile and Coordinator Agent.

No retrieval occurs without an established context.

---

# 6. Filtering Strategy

Filtering occurs in the following order:

1. Knowledge Pack version
2. Publication status
3. Jurisdiction
4. Industry
5. Regulatory domain
6. Effective date
7. Trust thresholds
8. Semantic similarity

Each filter reduces the candidate pool before semantic search.

---

# 7. Semantic Retrieval

Semantic retrieval identifies knowledge most relevant to the current task.

The retrieval engine operates only over validated Knowledge Chunks.

Similarity scores are used for ranking, not validation.

High semantic similarity does not imply correctness.

---

# 8. Hybrid Retrieval

FoundryAI uses hybrid retrieval combining:

- structured metadata filters
- semantic similarity search
- exact keyword matching
- citation lookup

Different retrieval methods compensate for one another's weaknesses.

---

# 9. Ranking Strategy

Candidate chunks are ranked using multiple signals.

Ranking considers:

- semantic similarity
- regulatory relevance
- source authority
- evidence strength
- recency
- business context
- workflow stage

No single signal determines ranking.

---

# 10. Trust-Informed Filtering

> **Amended 2026-08-08 (founder-approved, A8).** Retrieval **reports** signals; it does not **decide**.

Retrieval applies Trust Layer _policy inputs_ it can evaluate at retrieval time:

- low **Source Authority** may reduce ranking
- Authority 1 sources are excluded from compliance retrieval entirely
- retrieval **reports coverage limitations** — which expected Knowledge Domains returned nothing

**Retrieval must not independently trigger founder clarification.**

Clarification is a **Coordinator** decision, made from its classification confidence and coverage rules (Coordinator Agent Specification §7.1). Retrieval surfaces the signal; the Coordinator decides whether to ask, to proceed best-effort with reduced Coverage Confidence, or to pause.

The separation matters: retrieval sees one query's results, while the Coordinator sees the whole business context and the full domain expectation. A retrieval-triggered question would fire per-query and could interrupt a founder several times in one run for gaps the Coordinator had already accounted for.

Evidence Strength cannot be applied as a retrieval filter — it does not exist until a claim is evaluated (§3.4).

Trust influences retrieval behaviour without modifying underlying knowledge.

---

# 11. Context Assembly

Retrieved chunks are assembled into an AI context package.

The package includes:

- knowledge chunks, each with its mandatory **`chunk_id`** (§3.10)
- citations conforming to the canonical citation object (Trust Layer §8)
- **Source Authority** and Legal Source Category (source-level metadata only)
- Knowledge Pack version
- retrieval metadata and the persisted retrieval configuration (§3.8)

The AI model receives this package as immutable context.

The package carries **no claim-level trust dimensions** — those are derived downstream by the Trust Layer once the agent has produced claims.

---

# 12. Retrieval Logging

Every retrieval request generates an audit record containing:

- timestamp
- requesting agent
- workflow
- business
- Knowledge Pack version
- retrieved chunk IDs
- ranking scores
- trust values

Retrieval logs support debugging and reproducibility.

To satisfy §3.8, the record must additionally persist everything required for deterministic replay:

- retrieval configuration version
- query representation
- jurisdiction and industry filters applied
- ranking configuration version
- embedding model **and** model version

Without these, a historical retrieval cannot be reproduced — only approximated.

---

# 13. Failure Handling

Retrieval failures must never silently fall back to model memory.

Possible outcomes include:

- insufficient knowledge found
- low coverage detected
- conflicting evidence
- retrieval timeout
- unsupported jurisdiction

The AI agent must surface these limitations explicitly.

---

# 14. Performance Objectives

Target performance:

- metadata filtering under 100 ms
- semantic retrieval under 300 ms
- complete context assembly under 500 ms

Performance targets may evolve with scale.

Correctness always takes priority over latency.

---

# 15. Monitoring

Retrieval quality is continuously monitored.

Metrics include:

- retrieval precision
- retrieval recall
- citation utilisation
- irrelevant chunk rate
- duplicate retrieval rate
- context size
- trust distribution

Monitoring supports continuous optimisation.

---

# 16. Security

Retrieval must respect platform security boundaries.

Requirements include:

- Row Level Security enforcement
- tenant isolation
- Knowledge Pack version control
- audit logging
- immutable citations

Retrieval must never expose another tenant's operational data.

---

# 17. Success Criteria

The Retrieval Architecture is successful when:

- AI agents consistently receive relevant knowledge
- provenance is preserved
- trust metadata accompanies every retrieved chunk
- retrieval remains reproducible
- hallucinations caused by missing context are minimised
- cross-jurisdiction contamination is prevented

Success is measured by retrieval quality rather than model capability.

---

# 18. Relationship to Other Specifications

This document follows:

- Knowledge Acquisition Process
- Knowledge Validation Standard
- Knowledge Chunking Strategy
- Metadata & Citation Standard

It precedes:

- Knowledge Monitoring & Change Detection
- Knowledge Publishing Pipeline
- AI Agent Specifications

Retrieval is the operational bridge between the Knowledge System and the AI reasoning layer.

---

# End of Document
