# Knowledge Ingestion Pipeline

**Version:** 1.0 · **Status:** Canonical — ⚠️ implementation blocked (§13) · **Owner:** Jamil Nash
**Last updated:** 2026-08-07 · **Series:** AI Architecture, document 5 of 15

## 1. Executive Summary

The Knowledge Pack is FoundryAI's moat. This document specifies how a government document becomes retrievable, cited evidence.

The pipeline is deliberately **slow and reviewed**, not automated end to end. Knowledge is the one asset where being wrong is worse than being late: a mis-ingested fee becomes a fee we quote to founders with a citation attached.

⚠️ **Implementation is blocked.** The embedding model and dimensionality must be chosen before any chunk is written — `vector(N)` is a column type, and changing N means re-embedding the entire corpus.

## 2. Purpose

**Scope.** Source acquisition, parsing, chunking, embedding, metadata assignment, authority classification, review, publication, and the domain vocabulary the Coordinator consumes.

**Not in scope.** Retrieval at query time (Research Agent) · staleness and re-review (document 6) · trust classification (document 1).

## 3. Architecture

```
ACQUIRE ─► PARSE ─► CHUNK ─► ENRICH ─► EMBED ─► REVIEW ─► PUBLISH
   │         │        │         │         │        │         │
 source    text    passages  metadata  vectors  human    is_published
 + prov.  + struct           + authority        approval     = true
                                                    │
                                          reject ───┘
```

Nothing is retrievable until `is_published = true`. The review gate is a person, not a heuristic.

## 4. Design Principles

**K1 — Provenance before content.** A document without a verifiable source URL, publication date and issuing agency is not ingested. Unattributable knowledge cannot be cited.

**K2 — Legislation first.** Ordering follows Source Authority: Acts and regulations before guidance pages.

**K3 — Chunk on meaning, not length.** A chunk should be a self-contained provision.

**K4 — Human review is mandatory.** Automated ingestion, human publication.

**K5 — Immutable versions.** Documents are re-ingested as new versions; chunks are never edited in place, because citations point at them.

**K6 — Country-scoped by construction.** Every row carries its country. Cross-jurisdiction retrieval is impossible by data shape.

## 5. Stages

### 5.1 Acquire

Sources are registered, not discovered: a source registry holds the agency, document title, URL, expected authority level and review cadence. Manual upload is first-class — Bahamian legislation is often a PDF, not an API.

Captured: retrieval date, HTTP status, content hash. **The content hash is what makes change detection possible** (document 6).

### 5.2 Parse

PDF and HTML to structured text, preserving section numbering — citations require _Section 12_, not a page number. Scanned documents require OCR and are flagged lower-confidence for review.

**Sanitisation happens here.** Retrieved text later enters model context; instruction-like content is neutralised at ingestion, not at inference, because it is cheaper and only done once.

### 5.3 Chunk

Chunks respect document structure: a section, a subsection, a table. Each carries `section_reference` and a pointer to its parent document.

⚠️ **Chunk size and overlap are unset** pending the embedding model.

### 5.4 Enrich

Metadata: country, agency, category, **knowledge domain** (the vocabulary the Coordinator consumes — CO3), document type, publication/effective/expiry dates, and **Source Authority** (Trust Layer §4.2).

**Authority is assigned by source type at registration, not inferred per document.** It is an objective property of what a document _is_.

### 5.5 Embed — ⚠️ blocked

**Embeddings are retrieval artifacts, not Knowledge Pack versions** (K1 §3.6, K7 §3.1,
founder-ratified A10). Regenerating them does **not** increment the Knowledge Pack version;
changing the embedding model invalidates and rebuilds the affected retrieval artifacts only.

Each generation records: model · model version · **dimensions** · timestamp · source Knowledge
Pack version · retrieval configuration version · chunk version · status — the manifest
deterministic replay depends on (K5 §3.8).

Requires: model, dimensionality, index type (HNSW vs IVFFlat), and whether the same model serves queries and documents.

### 5.6 Review

A reviewer confirms: text matches the source, section references are correct, authority is right, domain tags are right, dates are right. Rejection returns the document with a reason. **Approval is recorded with the reviewer's identity** — audit requires knowing who published a claim into the corpus.

### 5.7 Publish

`is_published = true` inside a transaction with a knowledge-version bump. Retrieval only ever sees published chunks.

## 6. Decision Flow

```
registered source
   ├─ provenance complete? ── no ──► reject (K1)
   ├─ parse ── failed? ──► manual queue
   ├─ chunk · enrich · embed
   ├─ review ── rejected? ──► return with reason
   └─ publish + version bump
```

## 7. The Statutory Sourcing Requirement

**ADR-0015 makes 🟢 VERIFIED require Source Authority ≥ 4 — legislation and regulations only.**

Agency guidance pages are dramatically easier to collect than Acts and Gazette notices. A corpus built the easy way renders almost every requirement 🟡 DERIVED, and the platform looks far less certain than it is.

**Therefore: statutory instruments are ingested first, and coverage of a domain is not considered complete until its governing legislation is in the corpus** — not merely the agency's explanation of it. This is a requirement, not a preference.

## 8. Security

| Concern                                     | Control                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Prompt injection via ingested documents** | Sanitised at parse (5.2); agents treat retrieved text as evidence, never instructions                             |
| Unattributable knowledge                    | K1 — no provenance, no ingestion                                                                                  |
| Corpus poisoning                            | Sources registered in advance; human review gate; publication audited with reviewer identity                      |
| Copyright                                   | Government works are generally reproducible, but **licensing must be confirmed per source class** — open question |
| Cross-jurisdiction leakage                  | Country is mandatory and indexed; retrieval always filters                                                        |

## 9. Failure Modes

| #   | Failure                                   | Severity    | Mitigation                                                |
| --- | ----------------------------------------- | ----------- | --------------------------------------------------------- |
| F1  | Mis-parsed fee or date becomes cited fact | 🔴 Critical | Human review; OCR flagged                                 |
| F2  | Chunk loses its section reference         | 🟠 High     | Structure-aware chunking; review checks citations resolve |
| F3  | Wrong authority level assigned            | 🟠 High     | Assigned by source type at registration, not per document |
| F4  | Domain mis-tagged → coverage misjudged    | 🔴 Critical | Review checks tags; recall measured (document 7)          |
| F5  | Embedding model changed after ingestion   | 🟠 High     | Version recorded; change forces full re-embed             |
| F6  | Published document later withdrawn        | 🟠 High     | Expiry dates; freshness monitoring (document 6)           |

## 10. Success Metrics

| Metric                                             | Target |
| -------------------------------------------------- | ------ |
| Published chunks without complete provenance       | **0**  |
| Citation section references that resolve           | 100%   |
| Domain-tagging accuracy                            | ≥ 98%  |
| Share of compliance-domain corpus at authority ≥ 4 | ≥ 60%  |
| Documents published without review                 | **0**  |

## 11. Relationships

**Depends on:** Knowledge Architecture · Trust Layer (1) · Database Architecture.
**Constrains:** Research Agent · Coordinator (3) — supplies the domain vocabulary · Freshness (6).
**Related:** Evaluation (7) · Human Review (10) · Safety (14).

## 12. Future Evolution

Automated change detection via content hash · RSS and Gazette monitoring · legislation-database APIs · cross-country document mapping · assisted parsing with human confirmation.

## 13. Open Questions — implementation blockers

| #       | Question                                                                | Severity                         |
| ------- | ----------------------------------------------------------------------- | -------------------------------- |
| **KI1** | **Embedding model and dimensionality** — `vector(N)` is a column type   | 🔴 **Blocks all implementation** |
| KI2     | Chunk size and overlap (depends on KI1)                                 | 🔴 Blocking                      |
| KI3     | Who performs review, and what qualifies them?                           | 🟠 High                          |
| KI4     | Licensing confirmation for reproducing government content               | 🟠 High                          |
| KI5     | Is OCR acceptable for authority-5 sources, or must they be text-native? | 🟡 Medium                        |

## 14. ADR References

**0015** (authority scale, statutory requirement) · 0016 (ingestion as workflow runs) · 0011 · 0014.
