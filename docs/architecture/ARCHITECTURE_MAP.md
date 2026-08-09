# FoundryAI Canonical Architecture & Dependency Map

**Version 1.0 · 2026-08-08 · Status: Canonical**
Register: `DOCUMENT_MANIFEST.md` · Decisions: `docs/decisions/ADR-0001 … ADR-0019`

This map answers three questions the manifest cannot: **what governs what**, **what breaks if
this changes**, and **what is not yet safe to build on**. The manifest is the register of
documents; this is the register of _dependencies between_ them.

> **Rule of the map.** An arrow means _"changing the source requires re-reading the target."_
> It is not a call graph and not a data-flow diagram.

---

## 1. Authority hierarchy

Five tiers. A document may only be overruled by something above it.

```
TIER 0   FoundryAI Constitution
         └─ Article VII: never claim completeness
                     │
TIER 1   Ratified ADRs (0001–0019) — binding, amendable only by founder decision
         │  ADR-0015 four-dimension trust
         │  ADR-0016 workflow state machine
         │  ADR-0017 agent output contract
         │  ADR-0018 evaluation gates
         │  ADR-0019 provider abstraction
                     │
TIER 2   Trust Layer Specification  ◄── the single governing spec for the AI subsystem
                     │
TIER 3   AI System Architecture · Knowledge Architecture · Platform Architecture
                     │
TIER 4   Subsystem specifications — AI-1…AI-15, K1…K7
                     │
TIER 5   Implementation — services/, lib/, app/, supabase/migrations/
```

**Every K-series document declares itself subordinate to Tier 2.** K2 §14, K3 §12, K6 §17 all
carry the corrected hierarchy after finding A5. K1 §1.4 always did.

---

## 2. The two ADRs everything hangs from

### ADR-0015 — four independent trust dimensions

The most-referenced decision in the platform. Ratified 2026-08-07; **unchanged** through the
C1–C3, R1–R3 and A1–A12 resolutions — every conflict was resolved by moving the _other_
document.

| Dimension            | Scale        | Property of              | Where it is assigned                                           |
| -------------------- | ------------ | ------------------------ | -------------------------------------------------------------- |
| Source Authority     | 1–5          | a **document**           | K2 §8.1 at validation; stored on the chunk (K3 §5.1)           |
| Evidence Strength    | 1–5          | a **passage↔claim link** | Trust Layer, per claim — never stored on a chunk               |
| Reasoning Confidence | HIGH/MED/LOW | an **inference**         | Trust Layer, per claim                                         |
| Coverage Confidence  | HIGH/MED/LOW | a **set**                | Trust Layer, per retrieved set — computed, not displayed in v1 |

**Derived, never assigned:** Trust Level (🟢🟡🔵⚪) and Trust Score (0–100).

**Depends on ADR-0015 — a change here forces a re-read of all of these:**

```
ADR-0015
  ├── Trust Layer Specification §4, §4.6, §5, §6, §7, §8
  ├── K2  §7 validation record · §8.1 authority mapping · §10 · §14
  ├── K3  §5 §5.1 §8   ← A7: chunks carry Source Authority only
  ├── K4  §5 §10       ← R3: Reasoning Confidence
  ├── K5  §3.4 §10 §11 ← A3/A7/A8
  ├── K6  §11 §2A.2    ← staleness penalty moves score, never the badge
  ├── AI-4 Specialist Agent Contract §5.0
  ├── AI-3 Coordinator §7.0 §7.1
  ├── AI-12 Evaluation Framework — trust-derivation gates
  └── schema-future-phases.sql — trust columns
```

### ADR-0016 — long-running workflow execution

**A workflow is a state machine in PostgreSQL, not a running process.** One worker invocation
advances it by exactly one step.

```
ADR-0016
  ├── AI-2 Launch Plan Architecture — generation is a workflow run, not a request
  ├── AI-3 Coordinator — emits an Execution Plan; does NOT call other agents
  ├── AI-4 Specialist Agent Contract — every step idempotent
  ├── K6 §17 — monitoring sweeps run as persisted workflow runs
  └── agent_executions · (workflow_run_id, sequence_no) UNIQUE
```

**Consequence that catches people:** because retries are normal operation, every step must be
idempotent, which is why `claim_id` derives from normalised content and never from wall-clock
time. ADR-0016 and ADR-0017 are jointly responsible for that rule; neither states it alone.

---

## 3. The knowledge pipeline — K1 → K7

The K-series is a **lifecycle**, and its order is now unambiguous (finding A6 resolved a
circular claim between K3 and K4).

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  K1  Knowledge Pack Authoring Guide          ── methodology     │
   │      acquisition · source registration · authority assignment   │
   └───────────────────────────┬─────────────────────────────────────┘
                               ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  K2  Knowledge Validation Standard           ── correctness     │
   │      evidence verified · Legal Source Category → Authority      │
   │      supplies 3 of 4 trust dimensions · contradiction ordering  │
   └───────────────────────────┬─────────────────────────────────────┘
                               ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  K3  Knowledge Chunking Strategy             ── atomicity       │
   │      one concept per chunk · Source Authority ONLY on chunks    │
   └───────────────────────────┬─────────────────────────────────────┘
                               ▼   (A6: K3 → K4, not the reverse)
   ┌─────────────────────────────────────────────────────────────────┐
   │  K4  Metadata & Citation Standard            ── traceability    │
   │      references Trust Layer §8 citation object · chunk_id req'd │
   └───────────────────────────┬─────────────────────────────────────┘
                               ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  K7  Knowledge Publishing Pipeline           ── release gate    │
   │      atomic · immutable · human-approved · rollback             │
   │      embeddings = RETRIEVAL ARTIFACTS, not Pack versions        │
   └───────────────────────────┬─────────────────────────────────────┘
                               ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  K5  Retrieval Architecture (RAG)            ── grounding       │
   │      deterministic reproducibility · chunk_id mandatory         │
   │      REPORTS coverage; does NOT decide clarification            │
   └───────────────────────────┬─────────────────────────────────────┘
                               ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │  K6  Knowledge Monitoring & Change Detection ── currency        │
   │      absorbs retired AI-6 §2A · cascades back into K2           │
   └───────────────────────────┬─────────────────────────────────────┘
                               │
                               └──── revalidation loop ──► K2
```

**K7 sits before K5 in the lifecycle but after it in the document numbering.** Knowledge must
be published before it can be retrieved. The numbering follows authoring order, not execution
order — worth knowing before reading them in sequence.

**The K6 → K2 loop is the only cycle in the map, and it is deliberate.** Monitoring detects
change; change re-enters validation. Everything else is a directed acyclic graph.

---

## 4. Retired: AI-6 Knowledge Freshness Specification

```
   AI-6 Knowledge Freshness Specification
        │  ⛔ RETIRED 2026-08-08 (conflict C2, founder-approved)
        │  Retained at docs/architecture/knowledge-freshness-specification.md
        │  History only — DO NOT IMPLEMENT FROM IT
        ▼
   K6 §2A "Absorbed policy mechanisms"
        ├─ §2A.1  review cadence by source class (L5 quarterly … funding 14d)
        ├─ §2A.2  −10 trust-score staleness penalty — score moves, badge does not
        ├─ §2A.3  plan cascade: ready ⇒ regenerate · active ⇒ notify, never replace
        ├─ §2A.4  a 404 is not an unpublish
        └─ §2A.5  coverage recovery — the only after-the-fact omission fix
```

**Why it was retired rather than scoped.** K6 and AI-6 both specified change detection, review
cadence and staleness propagation. Two documents describing one mechanism is how the two
descriptions drift apart, and the one that drifts is always the one nobody is reading. The
mechanisms were substantive, so they moved rather than being deleted.

**Live dependency:** §2A.3 is consumed by **AI-2 Launch Plan Architecture §7A.5**, and §2A.2
by **Trust Layer §5**. Retiring the document did not retire its obligations.

---

## 5. The runtime path — Coordinator, Retrieval, Trust

Where the knowledge system meets the agent system. This is the sequence that produces a Launch
Plan.

```
  Founder intake
        │
        ▼
  ┌───────────────────────────────────────────────────────┐
  │ AI-3 COORDINATOR                                      │
  │   classifies business · declares expected domains     │
  │   emits an EXECUTION PLAN — does not call agents      │
  │   §7.0/§7.1 OWNS the clarification decision           │
  └───────────────────┬───────────────────────────────────┘
                      │  Execution Plan
                      ▼
  ┌───────────────────────────────────────────────────────┐
  │ WORKFLOW RUNNER (ADR-0016)                            │
  │   one step per invocation · idempotent · resumable    │
  └───────────────────┬───────────────────────────────────┘
                      │  step
                      ▼
  ┌───────────────────────────────────────────────────────┐
  │ K5 RETRIEVAL                                          │
  │   jurisdiction → industry → domain → metadata filters │
  │   returns chunks, each with MANDATORY chunk_id        │
  │   + Source Authority + coverage signals               │
  │   REPORTS gaps ─────────────────────────► Coordinator │
  └───────────────────┬───────────────────────────────────┘
                      │  immutable context package
                      ▼
  ┌───────────────────────────────────────────────────────┐
  │ AI-4 SPECIALIST AGENT (ADR-0017)                      │
  │   one envelope · every claim cites chunk_ids          │
  │   + a VERBATIM QUOTE from each                        │
  │   unresolved[] is MANDATORY                           │
  └───────────────────┬───────────────────────────────────┘
                      │  claims + citations
                      ▼
  ┌───────────────────────────────────────────────────────┐
  │ TRUST LAYER (ADR-0015)                                │
  │   verifies each cited chunk_id came from THIS run     │
  │   derives Evidence Strength · Reasoning Confidence    │
  │   derives Coverage Confidence over the set            │
  │   ⇒ Trust Level + Trust Score   FAILS CLOSED          │
  └───────────────────┬───────────────────────────────────┘
                      ▼
  ┌───────────────────────────────────────────────────────┐
  │ AI-2 LAUNCH PLAN                                      │
  │   partial results retained · never a blank failure    │
  │   copy: "Requirements we found" — never "complete"    │
  └───────────────────────────────────────────────────────┘
```

### The three separations this path exists to enforce

**Retrieval reports; the Coordinator decides** (A8). Retrieval sees one query. The Coordinator
sees the whole business and the full domain expectation. A retrieval-triggered question would
fire per-query and interrupt a founder repeatedly for gaps already accounted for.

**Agents plan; the runner executes** (ADR-0016). The Coordinator emitting a plan rather than
calling agents is what makes a run resumable — a half-finished plan is data, a half-finished
call stack is nothing.

**Agents produce; the Trust Layer validates** (ADR-0015). A component that both produces a
claim and rates its own confidence provides no assurance. This is why trust is derived and
never agent-assigned.

---

## 6. `chunk_id` — the single identity

One field carries more architectural weight than any other, so it gets its own section.

```
K3 §5      chunk created, permanent identifier, stable across versions
   │
K4 §6      MANDATORY in the citation object (Trust Layer §8 is canonical)
   │
K7 §6      quality gate: no chunk_id ⇒ publication blocked
   │
K5 §3.10   MANDATORY on every retrieval result. "No competing identity
   │       field may be introduced" — not an index, handle, or hash
   │
AI-4 §5.0  every claim carries its chunk_ids + a verbatim quote from each
   │
Trust      verifies the cited chunk_id was returned by THIS run.
Layer §8   A chunk not in this run's retrieval is FABRICATION.
```

**Why one identity and not several.** Each additional identifier is another join that can be
wrong, and a fabrication check is only as strong as its weakest identity. `chunk_id` is the
only field that answers _"was this passage actually retrieved?"_ — the question that separates
a citation from a plausible-looking reference to a real document.

---

## 7. Change-impact table

Read this before changing anything in the left column.

| If you change…                     | You must re-read                                           | Because                                                     |
| ---------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------- |
| **ADR-0015**                       | Trust Layer, K2, K3, K4, K5, K6, AI-3, AI-4, AI-12, schema | Every trust surface derives from it                         |
| **ADR-0016**                       | AI-2, AI-3, AI-4, K6 §17, `agent_executions`               | Execution model is load-bearing                             |
| **Trust Layer §8** citation object | K4 §6, AI-4 §5.0, `schema-future-phases.sql`               | They **reference** it; drift breaks binding                 |
| **Source Authority scale**         | K1 §4.3, K2 §8.1, K5 §3.4 §10, Trust Layer §4              | VERIFIED ≥ 4 is a safety control                            |
| **K3 chunk structure**             | K4 §5, K5 §3.4 §11, K7 §6                                  | Downstream contracts assume it                              |
| **`chunk_id`** semantics           | K3, K4, K5, K7, AI-4, Trust Layer                          | Single identity — §6 above                                  |
| **Embedding model** (KI1)          | K5 §3.8 §7 §12, K7 §3.1 §7                                 | Retrieval artifacts rebuild; Pack version does **not** move |
| **K6 §2A.2** penalty               | Trust Layer §5                                             | Score arithmetic                                            |
| **K6 §2A.3** cascade               | AI-2 §7A.5                                                 | Plan lifecycle                                              |
| **Retrieval config / ranking**     | K5 §3.8 §12, AI-12                                         | Reproducibility depends on persisted inputs                 |

---

## 8. Retired documents and harvested ownership

**Resolved 2026-08-08 — founder decisions D1–D5.** Four documents previously flagged here as
unregistered and unaudited have been audited, retired and registered in
`DOCUMENT_MANIFEST.md` with explicit non-canonical status. Content retained for history.
**Do not implement from any of them.**

```
   Retrieval Engine Specification ──🟡 SUPERSEDED──►  K5 · AI-3 Coordinator
   Knowledge Graph Architecture   ──⛔ ARCHIVED────►  (no single successor — D1)
   FoundryAI Reasoning Model      ──🟡 SUPERSEDED──►  ADR-0016 · ADR-0017 · AI-3 · AI-4
                                                       AI-1 Trust Layer · AI-2 Launch Plan
   Evidence & Citation Arch.      ──🟡 SUPERSEDED──►  Trust Layer §8 · K4 · ADR-0015 · K6 §2A.4
        (schema only)
```

**D1 — the retrieval architecture in §3 and §5 of this map is unchanged.** Graph-first
retrieval was **not** adopted. The Knowledge Graph is **not** the system of record, and graph
traversal is **not** a prerequisite for discovering legal obligations. **K5 and K3 were not
reopened**; K3 received an additive harvest only (§7.1).

**24 shadow ADRs retired** — `ADR-RE-001…006`, `ADR-KG-001…006`, `ADR-RM-001…006`,
`ADR-EC-001…006`. **None promoted.** Binding decisions live only in `docs/decisions/` as
ADR-0001 … ADR-0019. Full mapping in the manifest.

Two rejected outright as contradicting ratified decisions:

- `ADR-RM-004` "Coordinator agents orchestrate rather than specialise" ⊥ **ADR-0016** — _agents
  plan; the runner executes._
- `ADR-KG-001` "The Knowledge Graph is the canonical source of regulatory truth" ⊥ **K1 / K7** —
  the Knowledge Pack is the published unit.

### 8.1 Harvested material — new ownership

| Concept                       | Retired source                           | **New owner**            | Constraint carried with it                                                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Founder "Why?" evidence panel | Evidence & Citation §12                  | **AI-2 Launch Plan §5A** | Renders the Trust Layer §8 citation object; defines no schema. Copy obeys Article VII — _"Requirements we found"_. Badge labelled **Trust Level**, not "Confidence". Coverage Confidence not displayed in v1                                                                  |
| Business-taxonomy expansion   | Retrieval Engine §6                      | **AI-3 Coordinator §5A** | Classification and query-scope input only. **Not a retrieval stage** — K5 §4 unchanged. Feeds domain declaration, gated ≥99% by ADR-0018. Taxonomy is Knowledge Pack metadata (CO3)                                                                                           |
| Conditional requirement logic | Retrieval Engine §8 · Knowledge Graph §8 | **K3 §7.1**              | A property of a chunk _relationship_, never a trust dimension. Evaluated against the structured Business Profile, never conversation. `false` excludes from a plan; it does not unpublish. **Unevaluable ≠ false** — reported as unresolved. **No new specification created** |

**Not harvested, recorded as future ADR input only:** jurisdictional inheritance (KG §7), the
16-type relationship vocabulary (KG §6), the consolidated failure-mode taxonomy (RM §15 / EC
§14). These are gaps acknowledged, not filled — each needs its own founder decision.

**D5 — ADR-0018 unchanged.** Retrieval Engine §16's <2 s latency and ≥99% requirement recall
were **not** promoted into a binding ADR. ADR-0018 remains the sole owner of release gates;
K5 §14 remains the sole owner of stage latency targets.

### 8.2 Still unregistered

_FoundryAI Decision Engine Specification_ · _Trust Layer & Evidence Framework_ — present in
Notion, **not audited, not registered, not canonical.** Same rule applies: do not implement
from them.

---

## 9. Blocked dependencies

Six founder decisions gate implementation. Each blocks specific documents.

| ID             | Decision                             | Blocks                                                                  |
| -------------- | ------------------------------------ | ----------------------------------------------------------------------- |
| **KI1 / MP-1** | Embedding model, version, dimensions | K3 §6 · K5 §7 §3.8 §12 · K7 §3.1 §7 · AI-5 · the entire retrieval index |
| **EV1**        | Gold-standard curation               | AI-12 evaluation gates (ADR-0018) — and therefore every AI change       |
| **MP-2**       | Data residency                       | AI-13 provider selection · K7 staging                                   |
| **HR1**        | Reviewer staffing                    | K2 §11 · AI-10 human review — the pipeline assumes reviewers exist      |
| **SF1 / SF3**  | Legal disclaimer; accountability     | AI-14 safety framework · public launch                                  |
| **VR1**        | Reproducibility vs erasure           | AI-15 versioning · K5 §12 retention                                     |

**KI1 is the critical path.** It blocks four documents and the retrieval index, and EV1's
evaluation gates cannot be calibrated without a working retrieval stack. Nothing in the
knowledge subsystem reaches implementation before it is decided.

---

## 10. Position

- **Sprint 1 (Platform Foundation):** complete — 8 of 9 phases; Phase 2 partial, blocked on brand tokens.
- **AI Architecture series:** 15 of 15 · 1 retired (AI-6).
- **Knowledge Engineering series:** 7 of 7 · all mirrored 2026-08-08.
- **ADRs:** 0001–0019 ratified.
- **Conflicts:** C1–C3, R1–R3, A1–A12 — all resolved. ADR-0015 never modified.
- **TRL:** 2. Reaching TRL 3 requires a working retrieval path, which requires KI1.

**Out of scope until their phases:** AI agents, Knowledge, Nova, Funding, Compliance. No mock
data that could be mistaken for real regulatory guidance — including in seeds and demos.
