# Launch Plan Architecture

**Document:** Launch Plan Architecture
**Version:** 1.0
**Status:** Canonical
**Owner:** Jamil Nash (Co-Founder & CEO)
**Author:** Lead Software Engineer
**Last updated:** 2026-08-07
**Series:** AI Architecture, document 2 of 15

---

## 1. Executive Summary

The Launch Plan is FoundryAI's product. Everything else — intake, agents, retrieval, trust scoring — exists to produce it.

It is the artefact a founder actually uses: an ordered, dated, evidence-backed sequence of everything they must do to legally start their business, with what each step costs, who they must deal with, what blocks what, and what we could not determine.

This document defines what a Launch Plan _is_ as a structure, how it is assembled from agent output, how it changes over time without silently rewriting a founder's history, and how it behaves when the knowledge behind it changes.

Three decisions shape the design:

1. **A plan is a versioned snapshot, not a mutable document.** A founder acting on a plan must be able to see the plan they acted on, even after the law changes. Regeneration creates a new version; it never overwrites.
2. **Founder progress is separate from generated content.** Ticking off "register the business" is the founder's data. Regeneration must never destroy it.
3. **A plan states what it does not know.** `⚪ UNKNOWN` items appear in the plan as first-class entries. An absent requirement is indistinguishable from a requirement that does not exist, and that ambiguity is where founders get hurt.

---

## 2. Purpose

**Scope.** The Launch Plan data model, assembly pipeline, versioning and regeneration semantics, task dependency rules, progress tracking, and staleness behaviour.

**Not in scope.** How individual requirements are determined (_Specialist Agent Contract_), how agents are sequenced (_Coordinator Agent Specification_), how claims are validated (_Trust Layer Specification_), or how knowledge changes are detected (_Knowledge Freshness Specification_).

**Audience.** Engineers implementing plan generation and the founder workspace.

---

## 3. Architecture

A Launch Plan is assembled, not generated. No single agent produces it; the Action Plan Agent composes validated output from the specialists into an ordered, dependency-aware sequence.

```
Business Profile (intake)
        │
        ▼
  Coordinator ──► routes to specialists
        │
        ├──► Compliance Agent ──► requirements ─┐
        ├──► Funding Agent     ──► opportunities ┤
        └──► Research Agent    ──► evidence ─────┤
                                                 ▼
                                        ┌────────────────┐
                                        │  TRUST LAYER   │  ← every item, individually
                                        └───────┬────────┘
                                                ▼
                                    ┌───────────────────────┐
                                    │  ACTION PLAN AGENT    │
                                    │  order · depend · date│
                                    └───────────┬───────────┘
                                                ▼
                                    ┌───────────────────────┐
                                    │  PLAN ASSEMBLY        │
                                    │  (Application Service)│
                                    │  version · persist    │
                                    └───────────┬───────────┘
                                                ▼
                                      launch_plans + tasks
                                                │
                                                ▼
                                        Founder workspace
```

**The Trust Layer sits before assembly, not after.** Quarantined items never enter a plan. A plan therefore contains only validated content, and the plan-level coverage assessment is computed over what survived.

---

## 4. Design Principles

**P1 — A plan is immutable once generated.** Content is a snapshot. Corrections create a new version.

**P2 — Progress belongs to the founder, not the plan.** Completion state lives on a separate axis and survives regeneration.

**P3 — Order is derived from dependencies, not from agent preference.** If a licence requires a registration number, registration precedes it. This is graph structure, not narrative.

**P4 — Absence is stated.** A plan says what it could not determine.

**P5 — No fabricated specificity.** A plan never invents a fee, a deadline, or a processing time to appear complete. Unknown cost is `null`, rendered as "not published", never as an estimate.

**P6 — Dates are relative until anchored.** Government processing times are ranges, not promises. A plan expresses _"5–10 business days after step 3"_, not a calendar date, unless the founder anchors a start date.

---

## 5. The Plan Structure

### 5.1 Launch Plan (one current version per business)

| Field                             | Type        | Notes                                          |
| --------------------------------- | ----------- | ---------------------------------------------- |
| `id`                              | uuid        |                                                |
| `business_id`                     | uuid        | unique among non-superseded plans              |
| `version`                         | integer     | increments on regeneration                     |
| `status`                          | enum        | `generating` · `ready` · `stale` · `failed`    |
| `generated_at`                    | timestamptz |                                                |
| `superseded_at`                   | timestamptz | set when a newer version replaces it           |
| `knowledge_version`               | text        | the Knowledge Pack version it was built from   |
| `coverage_confidence`             | enum        | HIGH/MED/LOW — **stored, not displayed in v1** |
| `coverage_gaps`                   | jsonb       | named domains that returned nothing            |
| `model_version`, `prompt_version` | text        | reproducibility (Pattern A)                    |

### 5.2 Task (the unit a founder acts on)

Every task carries its own provenance and trust classification — a plan is not uniformly trustworthy, and presenting it as such would hide the weakest item.

| Field                            | Notes                                                                                    |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `title`, `description`           | Plain language. No jargon, no citation text inline                                       |
| `category`                       | `registration` · `licence` · `permit` · `tax` · `employment` · `funding` · `recommended` |
| `agency`                         | Who the founder deals with. `null` if not applicable                                     |
| `estimated_fee` / `fee_currency` | `null` when not published — **never estimated**                                          |
| `estimated_days_min` / `_max`    | Range. `null` when unknown                                                               |
| `priority`                       | `critical` · `high` · `medium` · `low`                                                   |
| `sort_order`                     | Derived from the dependency graph                                                        |
| `trust_level`, `trust_score`     | Per-item (Trust Layer §4.6)                                                              |
| `citations`                      | jsonb array; mandatory for verified/derived                                              |
| `status`, `completed_at`         | **Founder-owned. Never written by generation.**                                          |

### 5.3 Task dependencies

A separate edge table, not a column — a task may depend on several others, and a single column cannot express a graph.

**Cycle prevention is not expressible as a database constraint.** The Action Plan Agent's output must be validated as a directed acyclic graph in the services layer before insert. A cycle would render the plan unorderable and must fail the run, not be silently broken.

---

## 5A. Founder-facing evidence panel — "Why is this required?"

> **Harvested 2026-08-08 (founder decision D4.1)** from the retired _Evidence & Citation
> Architecture_ §12. That document is non-canonical; this section is now the owner of the
> concept. The citation object it renders is **Trust Layer §8** — this section does not define
> a citation schema and must never restate one.

Every plan item exposes an expandable evidence panel. The Trust Layer decides what a badge
says; this section decides how a founder inspects the reasoning behind it.

The panel exists because a badge alone asks the founder to trust us. Showing the evidence lets
them verify us instead — and lets an advisor, lender or regulator do the same without an
account.

### 5A.1 Panel contents

| Element                                                            | Source                                                           |
| ------------------------------------------------------------------ | ---------------------------------------------------------------- |
| Requirement title                                                  | plan item                                                        |
| "Why is this required?" — plain-English rationale                  | agent claim text                                                 |
| Supporting evidence — agency · document · section · effective date | canonical citation object, **Trust Layer §8**                    |
| Trust Level badge (🟢 🟡 🔵 ⚪)                                    | **derived** by the Trust Layer — never agent-assigned (ADR-0015) |
| Evidence status                                                    | K6 §2A.4 freshness state                                         |

Every cited passage resolves through its `chunk_id` (K5 §3.10). A panel that cannot resolve a
`chunk_id` renders no citation — it must not fall back to naming a document.

### 5A.2 Worked example

```
Food Handler Certificate                                    🟢 Verified

Why is this required?
  Businesses preparing food for public consumption must ensure staff
  hold valid food handler certification.

Supporting evidence
  Ministry of Health · Food Safety Regulations · Section 18
  Effective 2024-01-01 · Knowledge version BS-v1.4

Evidence status: current
```

### 5A.3 Copy constraints — binding

**Constitution Article VII applies to every string in this panel.**

- The panel header for a set of requirements reads **"Requirements we found"** — never "your
  requirements", "all requirements", or "your complete requirements".
- Absence of an item is never presented as evidence that no such requirement exists.
- **Coverage Confidence is computed but not displayed in v1** (ADR-0015). The panel must not
  surface it, and must not imply completeness by omitting it.
- The badge is labelled **Trust Level**, not "Confidence". The retired source document labelled
  it "Confidence", which conflates a derived badge with a dimension.

⚠️ The example above shows one requirement in isolation. Wherever requirements are listed
together, the surrounding copy carries the Article VII framing.

---

## 6. Assembly Pipeline

| #   | Stage                   | Owner                   | Failure behaviour                                                                  |
| --- | ----------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| 1   | Gather validated items  | Plan Assembly Service   | No items → plan `failed`, founder told plainly                                     |
| 2   | Deduplicate             | Service                 | Two agents may both surface a business licence; merge, keep the union of citations |
| 3   | Build dependency graph  | Action Plan Agent       | Cycle → fail run, quarantine, alert                                                |
| 4   | Topological sort        | Service (deterministic) | —                                                                                  |
| 5   | Assign priority         | Action Plan Agent       | —                                                                                  |
| 6   | Compute coverage        | Trust Layer             | Always succeeds; may be LOW                                                        |
| 7   | Persist as new version  | Service                 | Transactional — a partial plan is never visible                                    |
| 8   | Supersede prior version | Service                 | Sets `superseded_at`; prior version retained                                       |

**Stage 4 is deliberately deterministic and outside the model.** Ordering is graph mathematics. Asking a model to sort a DAG introduces non-determinism into a step with exactly one correct answer.

---

## 7. Versioning and Regeneration

### 7.1 Why versioning is mandatory

A founder who registered a company in March acted on the plan as it existed in March. If the law changed in June, they must be able to see both: what they were told, and what is true now. Overwriting destroys the record and makes the platform unauditable — which the Constitution's reproducibility requirement forbids.

### 7.2 Regeneration triggers

| Trigger                                  | Behaviour                                      |
| ---------------------------------------- | ---------------------------------------------- |
| Intake answers change                    | Regenerate; plan marked `stale` until complete |
| Knowledge Pack updated in a cited domain | Mark `stale`, notify, regenerate on request    |
| Founder requests                         | Regenerate                                     |
| Agent or prompt version change           | Regenerate on next access; never silently      |

### 7.3 Progress preservation — the hard part

Regeneration must not destroy founder progress. Tasks are matched between versions by a **stable identity key** derived from `(category, agency, normalised title)` — not by database ID, which changes.

| Case                                        | Behaviour                                                                                                                  |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Task exists in both versions                | Carry `status` and `completed_at` forward                                                                                  |
| Task only in the new version                | Added as `not_started`                                                                                                     |
| Task only in the old version, **completed** | Retained, flagged **"no longer required"**. **Never silently deleted** — the founder did the work and may have paid for it |
| Task only in the old version, not started   | Dropped, listed in the version diff                                                                                        |

**A version diff is shown after regeneration.** A plan that silently changes underneath a founder is worse than one that changes visibly.

---

## 7A. Execution Strategy

A Launch Plan is not a document that is produced and filed. It is a **working instrument with a lifecycle**, and the platform's job continues after generation.

```
  GENERATION ──► APPROVAL ──► EXECUTION ──► MONITORING ──► REGENERATION
      │             │             │              │              │
  generating      ready         active        active          stale
      │             │             │              │              │
   agents +     founder        founder       knowledge      new version
   assembly     reviews        works the     changes /       + diff +
                & accepts      tasks         deadlines      re-approval
                                                  └──────────────┘
                                                   loop, indefinitely
```

### 7A.1 Generation — `generating`

Triggered by intake completion or an explicit request. Runs as a **persisted workflow, not a long-lived HTTP request** (ADR-0016). The founder is not blocked: the workspace shows progress and remains usable.

A plan in `generating` is never partially visible. Assembly is transactional (§6, stage 7).

### 7A.2 Approval — `ready`

**A generated plan is a proposal, not an instruction.** It waits for the founder to accept it.

This state exists for a reason grounded in the Constitution's _Human Agency_ article: FoundryAI supports decisions, it does not make them. A plan that silently becomes "your plan" without acknowledgement implies an authority the platform does not have.

On the approval screen the founder sees the plan, its scope, and — critically — the honest framing required by Trust Layer §7.4: _"Requirements we found for your business"_, never _"everything you need"_.

Approval is recorded (`approved_at`, `approved_by`) and audited. **Approval is not a legal acceptance and must never be presented as one.**

### 7A.3 Execution — `active`

The founder works the plan. The platform's role narrows to three things:

| Responsibility          | Behaviour                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| Track progress          | Task `status` transitions, owned entirely by the founder (P2)                              |
| Surface the next action | Derived from the dependency graph — the earliest task whose prerequisites are complete     |
| Stay out of the way     | No nagging, no fabricated urgency. A deadline is shown only where a statutory one is cited |

Progress is **never** written by generation. This is the invariant that makes regeneration safe.

### 7A.4 Monitoring — `active`, continuously

Monitoring is what makes the plan an operating system rather than a report. Three watchers run against an active plan:

| Watcher              | Trigger                                                                | Action                                                     |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Knowledge change** | Knowledge Pack version changes in a domain cited by this plan          | Mark `stale`, notify, name the affected tasks              |
| **Deadline**         | A cited statutory deadline approaches                                  | Notify. Only for _cited_ deadlines — never an invented one |
| **Coverage**         | Knowledge Pack gains coverage in a domain previously returning nothing | Re-assess coverage; may prompt regeneration                |

The third is easy to overlook and matters most. If a plan was generated when the Knowledge Pack had no food-safety coverage, and that coverage later arrives, **the founder's plan was incomplete and now can be improved**. Monitoring is the mechanism by which an omission gets corrected — the only one the platform has.

### 7A.5 Regeneration — `stale` → new version

Regeneration produces a **new version** and preserves progress by stable identity (§7.3). The founder sees a diff and re-approves.

**An approved plan is never silently replaced.** The prior version remains readable, because the founder acted on it.

| Prior state           | On regeneration                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `ready`, not approved | Replaced directly; diff shown                                                                         |
| `active`, approved    | New version enters `ready`; the approved version stays `active` until the founder accepts the new one |

That distinction matters: a founder mid-execution must not have the ground move under them without consent.

### 7A.6 Terminal states

| State        | Meaning                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------ |
| `superseded` | A newer version was approved. Retained, read-only                                          |
| `failed`     | Generation could not complete. Founder told plainly what is missing; no partial plan shown |
| `abandoned`  | Business archived. Plan retained, hidden from the workspace                                |

Nothing is deleted, consistent with ADR-0009.

---

## 8. Decision Flow — item to plan position

```
validated item
   │
   ├─ legally required? ── no ──► category = recommended, priority = low
   │        │ yes
   │        ▼
   ├─ has prerequisite? ── yes ─► add dependency edge
   │        │ no
   │        ▼
   ├─ blocks others? ────── yes ─► priority = critical
   │
   ├─ has statutory deadline? ─ yes ─► priority = high, deadline recorded
   │
   └─ trust_level == unknown ──► include, priority = high,
                                 labelled "we could not confirm this"
                     │
              topological sort
                     │
              assign sort_order
                     │
                  PERSIST
```

**Unknown items get high priority deliberately.** They are the places a founder is most likely to be caught out, and the ones most worth a phone call to the agency.

---

## 9. Security

| Concern                       | Control                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------ |
| Cross-tenant plan access      | RLS via `app.business_access(business_id)`; `business_id` denormalised onto `tasks` (ADR-0011)   |
| Progress tampering            | `status` and `completed_at` writable only through the progress service, never by generation      |
| Plan forgery                  | Only Plan Assembly may insert into `launch_plans`; agents never write (Engineering Standards §8) |
| Superseded-version disclosure | Prior versions readable by the owner only; retained, never deleted                               |
| Deletion                      | No `DELETE` policy — consistent with ADR-0009                                                    |

---

## 10. Failure Modes

| #   | Failure                                   | Severity    | Mitigation                                                                    |
| --- | ----------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| F1  | **Incomplete plan presented as complete** | 🔴 Critical | Coverage computed; copy must say _"Requirements we found"_ (Trust Layer §7.4) |
| F2  | Regeneration destroys founder progress    | 🔴 Critical | Stable identity matching (§7.3); completed tasks never deleted                |
| F3  | Dependency cycle                          | 🟠 High     | DAG validation in services; fail the run                                      |
| F4  | Fabricated fee or deadline                | 🔴 Critical | `null` when unpublished; P5; Trust Layer grounding                            |
| F5  | Plan built from stale knowledge           | 🟠 High     | `knowledge_version` recorded; staleness marking                               |
| F6  | Partial plan visible mid-generation       | 🟡 Medium   | Transactional persistence; `generating` status                                |
| F7  | Duplicate items from two agents           | 🟡 Medium   | Deduplication with citation union                                             |
| F8  | Plan generation exceeds request timeout   | 🟠 High     | **Unresolved** — see §13                                                      |

---

## 11. Success Metrics

| Metric                                            | Target                |
| ------------------------------------------------- | --------------------- |
| Plans containing an uncited required item         | **0**                 |
| Founder progress lost across regeneration         | **0**                 |
| Plans with a dependency cycle reaching a founder  | **0**                 |
| Coverage recall vs gold-standard requirement sets | ≥ 95% _(gates TRL 3)_ |
| Median generation time                            | ≤ 90 s                |
| Plans regenerated without a founder-visible diff  | **0**                 |

---

## 12. Relationships to Other Documents

**Depends on:** Trust Layer Specification (1) — every item is validated before assembly · Database Architecture — `launch_plans`, `tasks`, `task_dependencies` · PRD — the Launch Plan is the MVP's core value proposition.

**Constrains:** _Coordinator Agent Specification_ (3) — must produce output the assembly can consume · _Specialist Agent Contract_ (4) — every item must carry category, agency, dependencies and citations · _Frontend Architecture_ — plan rendering, version diffs, and the "Requirements we found" framing.

**Related:** _Knowledge Freshness Specification_ (6) — staleness triggers · _Human Review Workflow_ (10) — quarantined items · _Versioning & Reproducibility_ (15) — version semantics.

---

## 13. Open Questions

| #      | Question                                                                       | Blocks                                                                             | Owner   |
| ------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------- |
| ~~L1~~ | ~~Generation exceeds serverless timeout~~                                      | **RESOLVED by ADR-0016** — persisted workflow runs, one step per worker invocation | —       |
| L2     | How many plan versions are retained before archival?                           | Storage policy                                                                     | Founder |
| L3     | Do founders anchor a start date, converting relative ranges to calendar dates? | Timeline UI                                                                        | Founder |
| L4     | Should a `stale` plan still be viewable, or blocked until regenerated?         | Frontend                                                                           | Founder |

**L1 is resolved.** ADR-0016 (ratified 2026-08-07) specifies persisted workflow runs advanced one step per worker invocation, which bounds every invocation well inside serverless limits and makes runs resumable by construction.

---

## 14. Future Evolution

| Change                                             | Trigger                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| Calendar-anchored timelines                        | L3 resolved                                      |
| Cross-border plans (business in two jurisdictions) | Second active country                            |
| Plan sharing with an accountant or lender          | Institutional partnerships (PRD secondary users) |
| Regulation-change alerts on affected tasks         | Knowledge Freshness Specification                |
| Founder feedback correcting a requirement          | Learning Layer (concept only)                    |
| Coverage displayed to founders                     | Recall measured (Trust Layer §7.4, v2)           |

---

## 15. ADR References

| ADR      | Relevance                                                                                     |
| -------- | --------------------------------------------------------------------------------------------- |
| **0015** | Four-dimension trust model; per-item classification                                           |
| 0007     | Business lifecycle — `launch_plan_generated` state                                            |
| 0009     | RLS pattern; no DELETE policy                                                                 |
| 0011     | `business_id` denormalised onto `tasks` for single-lookup RLS                                 |
| 0014     | Structured logging of generation runs                                                         |
| **0016** | **Long-running AI workflow execution — resolves L1.** Generation runs as a persisted workflow |
