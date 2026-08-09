# Audit — four unregistered Notion documents

**Date:** 2026-08-08 · **Status:** Audit only. Nothing modified, nothing registered.
**Baseline:** ADR-0015 … ADR-0019 · Trust Layer · Launch Plan · Coordinator · Specialist Agent
Contract · K1–K7.

---

## Cross-cutting findings

**F1 — All four self-declare `Status: Canonical`.** None appears in `DOCUMENT_MANIFEST.md`.
Four documents assert an authority the register does not grant them. Per the manifest rule —
_a document not in this manifest is not canonical_ — the declaration is void, but any reader
opening one of these files sees "Canonical" at the top.

**F2 — 24 shadow ADRs.** Each document carries its own decision series: `ADR-RE-001…006`,
`ADR-KG-001…006`, `ADR-RM-001…006`, `ADR-EC-001…006`. None is in `docs/decisions/`. This is a
parallel decision register competing with ADR-0001 … ADR-0019.

**F3 — Three competing Source Authority scales.**

| Source                  | Levels                                                                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ADR-0015 (ratified)** | **5**                                                                                                                                                       |
| Retrieval Engine §11    | 7 — Legislation · Regulations · Official Gazette · Agency Policy · Official Guidance · FAQ · AI Summary                                                     |
| Evidence & Citation §3  | 8 — Legislation · Regulations · Government Gazette · Government Agency · Official Guidance · Government Forms · Internal Knowledge Summary · AI Explanation |

Finding A4 resolved exactly this class of conflict on 2026-08-08 and ruled **no sixth level**.
Both scales also rank AI-generated material _as evidence_, which K5 §3.9 ("Retrieval Never
Creates Knowledge") and ADR-0017 forbid.

**F4 — They contradict each other, not only the canon.**
Reasoning Model §11 ranks conflict resolution "1. legislation 2. regulations 3. government
guidance **4. coordinator** 5. human review" — the Coordinator arbitrates.
Evidence & Citation §10 states "**The AI never arbitrates legal conflicts.**"

**F5 — All four predate the current canon.** Notion timestamps 2026-08-07 23:23–23:40.
ADR-0015 was ratified 2026-08-07; ADR-0016–0019 and K1–K7 followed on 2026-08-08. They are not
wrong so much as _superseded_ — they describe the architecture as understood before ratification.

---

## 1. Retrieval Engine Specification

**Purpose:** orchestration layer that identifies the complete set of authoritative knowledge
for a founder question, combining graph traversal, structured filtering, semantic retrieval and
evidence ranking. Returns a structured evidence package to the Coordinator.

**Overlap:** **K5 owns retrieval/RAG.** Near-total functional overlap. Also touches Coordinator.

### Conflicts

**C-RE-1 — seven-level authority scale.** See F3.

> RE §11: "Priority becomes: 1. Legislation 2. Regulations 3. Official Gazette 4. Agency Policy 5. Official Guidance 6. FAQ 7. AI Summary"

vs K2 §8.1, which maps six Legal Source Categories onto **five** ADR-0015 levels, and ADR-0015
which owns the scale.

**C-RE-2 — graph traversal precedes and outranks semantic retrieval.**

> RE §7: "The graph is traversed before embeddings."
> RE §9: "Semantic retrieval never discovers legal obligations. Those must originate from graph traversal."
> RE ADR-RE-001: "Graph traversal always precedes semantic retrieval."

vs K5 §4, whose pipeline contains **no graph stage**: "Founder Request → Business Context
Resolution → Jurisdiction Filter → Industry Filter → Knowledge Domain Filter → Metadata
Filtering → Semantic Search → Trust Filtering → Ranking → Context Assembly → AI Agent"
and K5 §8 Hybrid Retrieval: "structured metadata filters · semantic similarity search · exact
keyword matching · citation lookup" — again no graph.

This is not a wording difference. RE requires a knowledge-graph substrate that K3 and K5 do not
model. K3 §7 defines lightweight chunk relationships (prerequisite, exception, dependency,
supersedes, related procedure, supporting guidance) — not a traversal engine.

**C-RE-3 — output package omits `chunk_id`.**

> RE §14: `{ "requirements": [], "citations": [], "agencies": [], "documents": [], "coverage": {}, "unknowns": [], "conflicts": [], "retrieval_path": [] }`

vs K5 §3.10 (A12): "Every chunk returned by retrieval **must** carry its `chunk_id`… **No
competing identity field may be introduced**." Also `unknowns` competes with the ADR-0017
mandatory `unresolved[]`.

**C-RE-4 — competing latency and recall targets.**

> RE §16: Retrieval Latency **<2 seconds**; Requirement Recall **≥99%**

vs K5 §14: "metadata filtering under 100 ms · semantic retrieval under 300 ms · complete
context assembly under 500 ms" (~900 ms), and ADR-0018 which owns release gates at coverage
recall ≥95% / domain-declaration recall ≥99%.

### Consistent with canon

RE §15 Non-Goals — "The Retrieval Engine does **not** … assign trust scores" ✅ ADR-0015.
RE §2 Goal 2 determinism ✅ direction of K5 §3.8, though weaker (does not enumerate embedding
model version as a fixed input).

### Useful unique material

- **§6 business-taxonomy expansion** — Restaurant → Prepared Food → Retail Food → Hospitality →
  Tourism. No canonical document specifies how an industry label expands into a retrieval scope.
- **§8 conditional requirement evaluation** — structured predicates ("Employees > 5 ? YES →
  Food Handler Certificate"). K3 §7 has relationship types but no conditional logic.
- **§13 Unknown as an explicit retrieval state** with enumerated causes.

**Disposition: MERGE useful material into K5 (+ Coordinator for taxonomy expansion), ARCHIVE the rest.**
K5 owns retrieval; two retrieval specifications is the C2 failure mode.

---

## 2. Knowledge Graph Architecture

**Purpose:** models regulatory knowledge as a typed, versioned graph of entities and
relationships rather than document embeddings, so obligations can be reasoned over and
explained by traversal rather than inference.

**Overlap:** K1 (Knowledge Pack as unit of knowledge), K3 (chunking + relationships), K7
(publication), K6 (freshness), Trust Layer.

### Conflicts

**C-KG-1 — competing system of record.**

> KG Executive Summary: "The Knowledge Graph is therefore the system of record for regulatory knowledge."
> KG ADR-KG-001: "The Knowledge Graph is the canonical source of regulatory truth."

vs K1 §3 (Knowledge Pack Architecture) and K7, under which the **Knowledge Pack** is the
published unit and K7 §4 is the only path into production. Two documents claim to be the source
of truth for the same knowledge.

**C-KG-2 — competing publication pipeline.**

> KG §9: "Official Source → Crawler → Parser → Validation → Human Review → Knowledge Graph → Embedding → Publication → Coordinator Agent"

vs K7 §4: "Validated Knowledge → Metadata Validation → Chunk Verification → Embedding
Generation → Retrieval Index Build → **Staging Environment** → Quality Assurance → **Approval**
→ Production Publication → Monitoring".

KG's pipeline has no staging environment, no quality gate and no rollback — the three controls
K7 §4.4/§5/§10 exist to provide.

**C-KG-3 — blanket freshness target.**

> KG §12 Success Metrics: "Knowledge Freshness — ≤30 days"

vs K6 §2A.1, founder-approved in the AI-6 merge: "**Age is not the same as staleness.** A 2019
Act that has not been amended is current; a guidance page from last month may already be wrong.
Cadence therefore follows source class, not calendar age" — L5 on amendment/quarterly, L4 90
days, L3 30 days, funding programmes 14 days, agency profiles 30 days.

**C-KG-4 — competing relationship vocabulary.**

> KG §6: requires · issued_by · regulated_by · supersedes · replaces · references · depends_on · exempts · applies_to · applies_if · inherited_from · overrides · verified_by · published_in · cited_by · derived_from

vs K3 §7: prerequisite · exception · dependency · supersedes · related procedure · supporting
guidance.

K4 §8 requires controlled vocabularies to be centrally managed and version-controlled; two
overlapping lists for the same concept violates that directly.

**C-KG-5 — chunk ownership.** KG §4 lists "Knowledge Chunk" as an Evidence entity, placing
chunks inside the graph model. **K3 owns knowledge chunking.**

**C-KG-6 — embeddings inside the knowledge lifecycle (ambiguity, not a hard contradiction).**
KG §9 places "Embedding" between Knowledge Graph and Publication, and §10 versions "every
entity". A10 ruled embeddings are **retrieval artifacts** that do not increment the Knowledge
Pack version (K7 §3.1). KG does not state the contrary explicitly, but its lifecycle implies it.

### Consistent with canon

KG Principle 4 "Unknown Is Better Than Incorrect" ✅ ⚪ UNKNOWN badge, K6 §2A.4.
KG ADR-KG-002 "LLMs consume the graph but never modify it" ✅ "Never let an AI agent write to
the database."
KG Goal 3 deterministic retrieval ✅ direction of K5 §3.8.

### Useful unique material

- **§7 jurisdictional inheritance** — "Global → Country → State/Province → Municipality →
  Industry → Business Activity → Individual Business. **Lower levels inherit obligations from
  higher levels unless explicitly overridden.**" Nothing canonical specifies inheritance. K5
  §3.2 specifies jurisdiction _isolation_ — a different thing. **This is a genuine gap.**
- **§8 conditional requirements** as structured logic rather than natural language.
- **§4 entity taxonomy** across Geographic / Business / Regulatory / Government / Legal / Evidence.
- **§6 typed relationships** — richer than K3 §7 and possibly a superset worth harvesting.

**Disposition: FOUNDER DECISION REQUIRED (see D1).** This is the only one of the four that is
not a straightforward archive. It proposes a different retrieval substrate, not a different
description of the existing one.

---

## 3. FoundryAI Reasoning Model

**Purpose:** end-to-end pipeline from founder input to recommendation — intake, profile,
retrieval, coverage validation, coordinator, specialists, assembly, trust validation, plan.

**Overlap:** Coordinator Agent Specification, Specialist Agent Contract, ADR-0016, ADR-0017,
Trust Layer, Launch Plan Architecture. **This document overlaps more canonical material than
any of the other three.**

### Conflicts

**C-RM-1 — the Coordinator calls agents.** _The most serious finding in this audit._

> RM §8: "The Coordinator Agent orchestrates all specialist agents. Responsibilities: determine work order, **delegate specialist analysis**, merge findings, resolve conflicts…"
> RM §4 pipeline: "Coordinator Agent → Specialist Agents"
> RM ADR-RM-004: "Coordinator agents orchestrate rather than specialise."

vs ADR-0016, ratified: "**Agents plan; the runner executes. The Coordinator emits an Execution
Plan and does not call other agents.**"

This is a direct contradiction of the decision that makes a workflow resumable. A half-finished
Execution Plan is data in PostgreSQL; a half-finished delegation call stack is nothing.

**C-RM-2 — the Coordinator arbitrates legal conflicts.**

> RM §11: "Resolution order: 1. legislation 2. regulations 3. government guidance **4. coordinator** 5. human review"

vs K2 §8.2(5): "**No AI-generated interpretation may resolve a legal conflict independently.**"
Also contradicted by the Evidence & Citation document's own §10 (F4).

**C-RM-3 — competing agent output contract.**

> RM §10: "Each recommendation contains: title · explanation · action · priority · dependencies · deadline · citations · evidence · **confidence** · **coverage**"

vs ADR-0017, which owns the shared output contract: one envelope; every claim carries the
`chunk_id`s it came from **and a verbatim quote from each**; `unresolved[]` is **mandatory**.
RM's shape has no `chunk_id`, no verbatim quote and no `unresolved[]`.

Worse, `confidence` and `coverage` appear as **agent-returned fields**. ADR-0015: Trust Level
and Trust Score are **derived, never agent-assigned** — "a component that both produces and
validates a claim provides no assurance."

**C-RM-4 — hard stop on low coverage.**

> RM §7: "If coverage falls below publication thresholds, **reasoning stops**."

vs ADR-0016: "**Partial results are always retained.** A failed run keeps completed steps; never
show a founder a blank failure", and founder decision **CO2**: "Generate a best-effort plan when
classification confidence is low."

### Consistent with canon

RM §14 "the underlying model remains stateless" ✅ "Conversation is never evidence."
RM Principle 2 "Retrieval Before Reasoning" ✅ K5 §3.1.
RM Principle 3 "Coverage Before Confidence" ✅ — a crisp articulation of why Coverage Confidence
exists at all.
RM ADR-RM-006 "Trust Layer is the final validation stage" ✅ ADR-0015.

### Useful unique material

- **§15 failure modes** — eight named conditions (missing evidence, low coverage, conflicting
  regulations, outdated legislation, insufficient jurisdiction data, missing founder
  information, hallucinated citations, contradictory recommendations). Partly covered by K5 §13
  and AI-14; the consolidated list is still useful.
- **§9 specialist roster** — Compliance · Funding · Legal Structure · Tourism · Construction ·
  Property · Licensing. AI-4 defines the _contract_; this names candidate agents.

**Disposition: ARCHIVE.** Everything correct in it is already canonical and stated more
precisely. Its unique contributions contradict ADR-0016 and ADR-0017 on the two most
load-bearing execution decisions in the platform. Optionally harvest §15.

---

## 4. Evidence & Citation Architecture

**Purpose:** how evidence is established, preserved, verified and presented; evidence as a
first-class object rather than metadata; founder-facing explainability.

**Overlap:** **Trust Layer §8 owns the canonical citation object.** Also K4, ADR-0015, K6, K5 §12.

### Conflicts

**C-EC-1 — a third citation schema, without `chunk_id`.**

> EC §7: "Minimum standard: Document Title · Issuing Authority · Publication Date · Section Reference.
> Preferred standard: Document · Section · Clause · Page · Official URL · Effective Date · Version"

vs Trust Layer §8 and K4 §6 after C3/A12: `chunk_id` is **mandatory** — "binds the claim to the
exact chunk returned by the current retrieval run". K4 §6 was deliberately rewritten to
_reference_ Trust Layer §8 rather than restate it, precisely so a second schema could not drift.
EC restates a third.

**C-EC-2 — five-value classification competing with the four-badge Trust Level.**

> EC §4 Classification: "Verified · Derived · Informational · Historical · Superseded"

vs ADR-0015: 🟢 verified · 🟡 derived · 🔵 **recommended** · ⚪ **unknown**.
"Informational" is not "recommended"; there is no "unknown"; Historical and Superseded are
lifecycle states, not trust levels. Note also EC §12 renders the badge under the heading
"**Confidence**", conflating Trust Level with confidence.

**C-EC-3 — eight-level authority scale.** See F3.

> EC §3 Principle 3: "1. Legislation 2. Regulations 3. Government Gazette 4. Government Agency 5. Official Guidance 6. Government Forms 7. Internal Knowledge Summary 8. AI Explanation"

**C-EC-4 — competing freshness state machine.**

> EC §11: "Current · Under Review · Superseded · Archived · Pending Verification"

vs K6 §2A.4: "`current` · `review_due` · `changed_pending_assessment` · `stale` · `withdrawn`".
Same field, two vocabularies. K6 is canonical for monitoring (C2).

**C-EC-5 — blanket freshness target.** EC §15: "Evidence Freshness ≤30 days" — same conflict
with K6 §2A.1 as C-KG-3.

**C-EC-6 — audit record insufficient for A9 replay.**

> EC §13: "Evidence Version · Knowledge Version · Retrieval Timestamp · Retrieval Path · Generation Timestamp · Coordinator Version · Model Version"

vs K5 §12, which additionally requires retrieval configuration version, query representation,
filters applied, ranking configuration version and **embedding model and model version**.
"Model Version" here means the LLM, not the embedding model. Without it, K5 §3.8 deterministic
replay is impossible. Complementary but incomplete — not a contradiction.

### Consistent with canon

EC §10 "**The AI never arbitrates legal conflicts**" ✅ K2 §8.2(5) — and directly contradicts
the Reasoning Model (F4).
EC Principle 4 "Evidence Is Immutable… Corrections create new versions" ✅ K7 §4.3.
EC ADR-EC-005 "Conflicting evidence blocks publication until resolved" ✅ K2 §8.2, fail-closed.

### Useful unique material

- **§12 Founder Experience — the expandable "Why?" panel.** A worked example showing
  requirement, plain-English rationale, supporting evidence, badge and evidence status.
  **This is the strongest material in all four documents.** The Trust Layer defines the badges;
  nothing canonical specifies how a founder inspects the evidence behind a requirement. This is
  a real gap in the presentation layer.
  ⚠️ The example copy states the requirement definitively. Constitution Article VII requires
  "Requirements we found", never "your complete requirements" — the panel would need that framing.
- **§9 Evidence Resolution** — multiple evidence records composing one package (Act + portal +
  guidance + fee schedule).
- **§2 Goal 2** — verification by "founder, advisor, regulator, or auditor" as an explicit
  design constraint.
- **§14 failure modes** — broken URLs, missing pages, parser failures.

**Disposition: MERGE §12 into the presentation layer (Launch Plan Architecture and/or Trust
Layer), ARCHIVE the schema sections.** Trust Layer §8 owns the citation object; K6 owns
freshness states; ADR-0015 owns the badges.

---

## Summary table

| Document                             | Current purpose                                                                                                    | Overlap                                                                                           | Conflicts                                                                                                                                                                                                                                                                   | Useful unique material                                                                                                              | Recommended disposition                                                            | Decision required? |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------ |
| **Retrieval Engine Specification**   | Orchestration layer selecting all authoritative knowledge for a founder query; returns structured evidence package | **K5 (owns retrieval)** · Coordinator                                                             | 4 — 7-level authority scale (§11) · graph-before-semantic (§7, §9, ADR-RE-001) · output omits `chunk_id` (§14) · competing latency/recall targets (§16)                                                                                                                     | Business-taxonomy expansion (§6) · conditional requirement logic (§8) · Unknown as retrieval state (§13)                            | **MERGE into K5 + Coordinator, ARCHIVE remainder**                                 | **Yes** — D2, D4   |
| **Knowledge Graph Architecture**     | Typed, versioned entity/relationship graph as the reasoning substrate for obligations                              | K1 · **K3 (owns chunking)** · K7 · K6 · Trust Layer                                               | 6 — competing system of record (ADR-KG-001) · competing publication pipeline (§9) · blanket ≤30-day freshness (§12) · competing relationship vocabulary (§6) · chunks in graph (§4) · embeddings in knowledge lifecycle (§9/§10)                                            | **Jurisdictional inheritance (§7)** · conditional requirements (§8) · entity taxonomy (§4) · typed relationships (§6)               | **FOUNDER DECISION** — adopt as scoped subordinate spec, or archive and harvest §7 | **Yes** — D1       |
| **FoundryAI Reasoning Model**        | End-to-end reasoning pipeline from intake to launch plan                                                           | **ADR-0016** · **ADR-0017** · Coordinator · Specialist Agent Contract · Trust Layer · Launch Plan | 4 — **Coordinator calls agents (§8, §4, ADR-RM-004) vs ADR-0016** · **Coordinator arbitrates legal conflicts (§11) vs K2 §8.2(5)** · competing output contract with agent-assigned confidence (§10) vs ADR-0017/ADR-0015 · hard stop on low coverage (§7) vs ADR-0016 + CO2 | Failure-mode list (§15) · specialist roster (§9)                                                                                    | **ARCHIVE** — optionally harvest §15                                               | **Yes** — D2 only  |
| **Evidence & Citation Architecture** | Evidence as first-class object; establishment, preservation, verification, presentation                            | **Trust Layer §8 (owns citation object)** · K4 · ADR-0015 · K6 · K5 §12                           | 5 + 1 gap — third citation schema without `chunk_id` (§7) · five-value classification vs four badges (§4) · 8-level authority scale (§3) · competing freshness states (§11) vs K6 §2A.4 · blanket ≤30-day freshness (§15) · audit record lacks embedding model (§13)        | **Founder "Why?" evidence panel (§12)** · evidence resolution packages (§9) · auditor-verifiability goal (§2) · failure modes (§14) | **MERGE §12 into presentation layer, ARCHIVE schema sections**                     | **Yes** — D3, D4   |

---

## Founder Decisions Required

### D1 — Is FoundryAI graph-backed or chunk-and-filter?

**The only genuine architectural question in this audit.** The other three documents describe
the existing architecture imprecisely; this one proposes a different substrate.

The canonical stack (K3 chunks → K5 filter-then-semantic) and the Knowledge Graph
(traversal-first, semantic as supplement) are different systems. Retrieval Engine §9 makes the
stake explicit: "Semantic retrieval never discovers legal obligations. Those must originate
from graph traversal." Under K5, semantic search over filtered chunks is exactly how
requirements are found.

Options:

- **(a) Archive the graph, harvest §7 jurisdictional inheritance into K3/K5.** Smallest change.
  Keeps one retrieval architecture. Loses traversal explainability.
- **(b) Register Knowledge Graph as a new canonical document with narrowed scope** — entity and
  relationship model only — explicitly subordinate to K1/K3/K7, with §9, §10 and §12 removed as
  duplicating K7 and K6. Requires reconciling K3 §7 and KG §6 into one vocabulary.
- **(c) Adopt graph-first retrieval.** Would require reopening K5 and probably K3. **Not
  recommended without a strong reason** — K5 was ratified two days ago and A8/A9/A12 were
  resolved against it.

I have no recommendation to offer beyond noting that (c) is the expensive path. **This is your
call, not mine.**

### D2 — Disposition and de-canonicalisation of all four

All four say `Status: Canonical` and none is registered. Whatever their fate, that line should
not remain as-is.

Do you approve: registering all four in `DOCUMENT_MANIFEST.md` with explicit status
(⛔ ARCHIVED or 🟡 SUPERSEDED as appropriate), and adding a retirement banner to each in Notion
recording what superseded it — the same treatment AI-6 received?

Note this is the AI-6 pattern deliberately: retire, don't delete. Three of these contain
material worth keeping.

### D3 — The 24 shadow ADRs

`ADR-RE-001…006`, `ADR-KG-001…006`, `ADR-RM-001…006`, `ADR-EC-001…006` exist outside
`docs/decisions/`. Several are already canonical in substance (ADR-KG-002 "LLMs never modify
the graph"; ADR-EC-005 "conflicting evidence blocks publication"). Several contradict ratified
ADRs (ADR-RM-004 "Coordinator agents orchestrate"; ADR-RE-001 "graph traversal always precedes
semantic retrieval").

Do you approve retiring all 24 as a parallel register, with any you want preserved raised as
properly numbered ADRs in the main sequence for separate ratification?

### D4 — Where does the harvested material live?

Three pieces of genuinely useful material have no obvious owner:

| Material                      | Source        | Candidate owner                                               |
| ----------------------------- | ------------- | ------------------------------------------------------------- |
| Founder "Why?" evidence panel | EC §12        | Launch Plan Architecture, or Trust Layer presentation section |
| Business-taxonomy expansion   | RE §6         | Coordinator (classification) or K5 (query construction)       |
| Conditional requirement logic | RE §8 + KG §8 | K3 (chunk relationships) or a new scoped specification        |

Assigning an owner is an architectural decision. Which document should receive each — and for
the conditional logic, does it warrant its own specification or belong inside K3?

### D5 — Latency and recall targets

RE §16 sets retrieval latency <2 s and requirement recall ≥99%. K5 §14 sets ~900 ms across
three stages; ADR-0018 owns release gates at coverage recall ≥95% and domain-declaration recall
≥99%.

Should any RE §16 target be promoted into ADR-0018, or is ADR-0018 complete as ratified?
**ADR-0018 owns gates**, so I will not change a threshold without your approval.

---

**Nothing was modified.** All four documents are unchanged in Notion. Nothing was registered in
`DOCUMENT_MANIFEST.md`. No architectural decision was taken.
