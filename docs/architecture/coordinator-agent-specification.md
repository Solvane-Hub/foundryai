# Coordinator Agent Specification

**Document:** Coordinator Agent Specification
**Version:** 2.0
**Status:** Canonical — supersedes _Coordinator Agent Specification v1.0_ (Notion)
**Owner:** Jamil Nash (Co-Founder & CEO)
**Author:** Lead Software Engineer
**Last updated:** 2026-08-07
**Series:** AI Architecture, document 3 of 15

---

## 1. Executive Summary

The Coordinator is the first agent to see a founder's business and the only one that decides what happens next. It reads the business profile, classifies the business, determines jurisdiction, and produces an **execution plan** naming which specialist agents must run, in what order, with what inputs.

It gives no advice. It never touches the Knowledge Pack. It never speaks to a founder.

**v2.0 changes one thing fundamentally.** In v1.0 the Coordinator "launched specialised agents" and "assembled the final package" — it was an orchestrator that ran inside a request. Under ADR-0016 that is no longer possible or desirable: a workflow is a state machine in PostgreSQL, advanced one step per worker invocation.

So the Coordinator now **plans** the workflow; the workflow runner **executes** it. The Coordinator is step 1 of the run, not the thing running the steps. This is a smaller, more testable, and more reproducible responsibility — a pure function from business profile to routing decision.

v2.0 also resolves a contradiction in v1.0, which required the Coordinator to produce "no human-facing explanation" while also "asking a clarifying question" (§7).

---

## 2. Purpose

**Scope.** Business classification, jurisdiction determination, agent selection, step sequencing, context construction, and the clarification protocol.

**Not in scope.** Executing steps (ADR-0016) · retrieving knowledge (Research Agent) · determining requirements (Compliance Agent) · assembling the plan (Launch Plan Architecture §6) · validating claims (Trust Layer).

**Audience.** Engineers implementing orchestration; authors of downstream agent specifications.

---

## 3. Architecture

```
business_profiles (intake)
        │
        ▼
┌───────────────────────┐
│  COORDINATOR (step 1) │   pure function, no side effects
│  classify · route     │   no Knowledge Pack access
└───────────┬───────────┘
            │  ExecutionPlan (JSON)
            ▼
┌───────────────────────┐
│  WORKFLOW RUNNER      │   ADR-0016 — one step per invocation
│  workflow_runs        │
└───────────┬───────────┘
            ├─► step 2  Research Agent
            ├─► step 3  Compliance Agent
            ├─► step 4  Funding Agent
            └─► step 5  Action Plan Agent
                        │
                        ▼
                 Trust Layer ──► Plan Assembly
```

**The Coordinator does not call other agents.** It emits a plan describing which should run. This separation is what makes a run resumable: the routing decision is durable data, so a worker restarting at step 3 does not need to re-derive it.

---

## 4. Design Principles

**C1 — Decide, do not advise.** The Coordinator never produces content a founder reads. Its output is machine-facing.

**C2 — Plan, do not execute.** Consequence of ADR-0016.

**C3 — No knowledge access.** The Coordinator classifies from the founder's own words and structured profile. Giving it retrieval would let it form opinions about requirements, which is the Compliance Agent's job and subject to the Trust Layer.

**C4 — Deterministic where possible.** Jurisdiction comes from `businesses.country_code`, a database value — never inferred from prose. Only classification requires a model.

**C5 — Pause rather than guess.** Missing information produces a structured clarification request, not an assumption.

**C6 — Route by need, not by habit.** A business with no premises should not run a premises-licensing path. Unnecessary steps cost money and add latency.

---

## 5. Inputs

Supplied by the workflow runner. The Coordinator never queries for itself.

| Input                                | Source              | Notes                                              |
| ------------------------------------ | ------------------- | -------------------------------------------------- |
| `business.name`                      | `businesses`        |                                                    |
| `business.country_code`              | `businesses`        | **Authoritative jurisdiction.** Never inferred     |
| `business.industry`                  | `businesses`        | Free text — taxonomy belongs to the Knowledge Pack |
| `profile.description`                | `business_profiles` | ≥ 20 chars, enforced at intake                     |
| `profile.business_stage`             | `business_profiles` | Five values (§5.1)                                 |
| `profile.location`                   | `business_profiles` | Free text                                          |
| `profile.employee_count`             | `business_profiles` | Integer ≥ 0                                        |
| `profile.funding_requirement_amount` | `business_profiles` | **Nullable — "unknown" is distinct from zero**     |
| `profile.founder_goals`              | `business_profiles` |                                                    |
| `conversation_context`               | `conversations`     | Optional. Clarifications only                      |

### 5.1 `business_stage` — implemented vocabulary

Intake collects one of: `idea` · `planning` · `pre_launch` · `operating` · `expanding`, stored as free text.

⚠️ These were provisional when intake shipped (Sprint 1 Phase 6). **This specification adopts them as the canonical Coordinator input vocabulary**, closing open question Q-S2. A change now requires a migration of collected data.

### 5.2 Conversation memory is not business knowledge

Per the AI System Architecture's context-separation rule, conversation context may inform _clarification_ only. Something a founder said is never promoted into something the platform knows. The Coordinator may not pass conversation text to downstream agents as evidence.

---

## 5A. Business-taxonomy expansion — classification input

> **Harvested 2026-08-08 (founder decision D4.2)** from the retired _Retrieval Engine
> Specification_ §6. That document is non-canonical and its graph-first retrieval model was
> **not** adopted (D1). This section takes only the taxonomy-expansion concept, as
> **classification and query-scope input** — it is not a retrieval architecture and introduces
> no retrieval stage.

A founder describes their business in one word. That word is rarely the full regulatory scope.

The Coordinator expands a stated business type into the broader set of categories it belongs
to, and that expanded set informs the **Knowledge Domains it declares** and the query scope it
passes to retrieval.

```
Restaurant
   ↓  is a form of
Prepared Food
   ↓  is a form of
Retail Food
   ↓  operates within
Hospitality
   ↓  may fall under
Tourism
```

A restaurant that never called itself a tourism business may still carry tourism obligations.
Expansion is how that obligation becomes visible to domain declaration.

### 5A.1 Boundaries — binding

- Expansion produces **classification and query scope only.** It does not retrieve, rank or
  filter. **K5 owns retrieval** (§4 pipeline unchanged).
- Expansion **does not discover legal obligations.** Requirements are found by retrieval over
  published chunks, exactly as K5 §4 specifies. The retired source document asserted the
  opposite ("Semantic retrieval never discovers legal obligations"); **that position was not
  adopted.**
- Expansion widens the **declared domains**, and domain-declaration recall is gated at ≥99%
  (ADR-0018). It therefore affects a measured gate and changes to it are an evaluated change.
- Where expansion is uncertain, the Coordinator applies its existing clarification policy
  (§7.1) — it does not guess silently, and per **CO2** it may proceed best-effort with reduced
  Coverage Confidence rather than blocking.
- The taxonomy itself is **Knowledge Pack metadata** (CO3, `knowledge_domains`), not a
  hard-coded table in application code (Constitution — no country-specific assumptions outside
  the Knowledge Pack).

---

## 6. Output — the Execution Plan

A single JSON object conforming to the platform envelope. **The Coordinator emits no prose.**

```json
{
  "status": "OK",
  "classification": {
    "business_type": "restaurant",
    "industry_domain": "hospitality",
    "jurisdiction": "BS",
    "premises": "fixed_commercial",
    "handles_food": true,
    "employs_staff": true,
    "seeks_funding": false,
    "complexity": "standard"
  },
  "classification_confidence": "HIGH",
  "knowledge_domains": [
    "business_formation",
    "licensing",
    "health_food_safety",
    "employment",
    "taxation"
  ],
  "steps": [
    { "sequence": 2, "agent": "research", "depends_on": [] },
    { "sequence": 3, "agent": "compliance", "depends_on": [2] },
    { "sequence": 4, "agent": "funding", "depends_on": [2] },
    { "sequence": 5, "agent": "action_plan", "depends_on": [3, 4] }
  ],
  "reasoning": "Fixed premises serving food with employees; no funding sought."
}
```

### 6.1 `classification_confidence` is **not** a trust dimension

It describes how confidently the Coordinator classified the business. It is **never** surfaced to a founder, never written to `trust_level` or `trust_score`, and is not a fifth trust dimension (ADR-0015 defines exactly four).

Its only effects: `LOW` triggers clarification (§7), and it is recorded for evaluation.

Naming this explicitly because confusing it with trust is exactly how a fifth scale would creep back in.

### 6.2 `knowledge_domains` drives coverage

This list is the **domain expectation** the Trust Layer assesses coverage against (Trust Layer §7). If the Coordinator declares `health_food_safety` and retrieval returns nothing in that domain, coverage drops and the gap is named.

**The Coordinator therefore determines what "complete" means for this business.** An under-declared domain list produces a plan that looks complete because we never asked for the missing part. This is the single highest-leverage failure in the system, and §11 F1 treats it accordingly.

**Ownership (CO3, resolved 2026-08-07): the `knowledge_domains` vocabulary is owned by Knowledge Pack metadata.** The Coordinator _consumes_ it; it does not define it.

This matters more than it looks. Domains are jurisdiction-specific — a Bahamian food business faces BAHFSA; another country's equivalent may not map one-to-one. If the Coordinator owned the vocabulary, every new country would require an application change, breaking the Platform Architecture's rule that country-specific logic never lives in code.

The Coordinator therefore reads the available domains for the jurisdiction from Knowledge Pack metadata and selects from them. Requesting a domain the Knowledge Pack does not declare is an error, not an empty result — it means the Coordinator and the corpus disagree about what exists, which must be surfaced rather than silently producing zero coverage.

Ownership of the vocabulary belongs to the _Knowledge Ingestion Pipeline_ (5) and _Knowledge Freshness Specification_ (6).

---

## 7. Clarification Protocol — resolving the v1.0 contradiction

v1.0 stated both that the Coordinator produces "no human-facing explanation" and that it "asks a clarifying question", giving a natural-language example. Both cannot be true.

**Resolution.** The Coordinator emits a **structured** clarification request. The UI renders it. The agent writes no prose.

```json
{
  "status": "NEEDS_CLARIFICATION",
  "classification_confidence": "LOW",
  "questions": [
    {
      "key": "premises",
      "field": "profile.premises_type",
      "prompt_key": "clarify.premises",
      "options": ["fixed_commercial", "home_based", "mobile", "online_only"]
    }
  ]
}
```

`prompt_key` references copy owned by the product, not text generated by the model. This keeps founder-facing language reviewable, translatable, and consistent — and prevents an agent from inventing a question that implies a requirement.

### 7.0 Retrieval reports; the Coordinator decides (A8)

Retrieval may **report** coverage limitations — which expected Knowledge Domains returned
nothing — but it must never independently trigger a founder clarification (K5 §10).

Clarification is a Coordinator decision, made from classification confidence and the domain
expectation it declared. The separation matters: retrieval sees one query's results; the
Coordinator sees the whole business context. A retrieval-triggered question would fire
per-query and could interrupt a founder several times in one run for gaps the Coordinator had
already accounted for.

### 7.1 Best-effort generation on LOW confidence (CO2, resolved 2026-08-07)

A `LOW`-confidence classification does **not** block generation.

```
classification_confidence = LOW
        │
        ├─► emit ExecutionPlan anyway (best effort)
        ├─► Coverage Confidence reduced — the plan is explicitly less certain
        ├─► clarification questions surfaced alongside the plan
        └─► on answer ─► regenerate (Launch Plan §7A.5), coverage re-assessed
```

The reasoning is founder-centred. Blocking leaves someone staring at a question with nothing to react to, and people answer questions about their business far better when they can see what the answer would change. A partial plan with honest uncertainty is more useful than an empty screen — provided the uncertainty is real and visible, which reducing Coverage Confidence guarantees.

The safeguard is that reduced coverage is **computed, not cosmetic**: it flows into the same coverage assessment as any other gap, and clarification is not optional — the run records that it is outstanding.

Runs that pause entirely (`needs_clarification`) are reserved for **missing hard inputs**, not low confidence — for example, an inactive jurisdiction, where no amount of best effort produces anything truthful.

`premises_type` is deliberately **not** collected at intake (CO1). Most businesses never need it, and asking every founder a question relevant to a minority lengthens intake for everyone. It is requested through targeted clarification only when classification requires it.

The workflow run enters `needs_clarification` only for hard-input gaps and **pauses** (ADR-0016). It resumes at step 1 with the answer appended. Answers are written to `business_profiles`, so a clarification is asked once, not every run.

---

## 8. Decision Flow

```
business profile
   │
   ├─ jurisdiction ← businesses.country_code        (deterministic, C4)
   │       └─ country not active? ──► FAILED "not supported yet"
   │
   ├─ classify business type & attributes           (model)
   │       └─ confidence LOW? ──► NEEDS_CLARIFICATION, pause
   │
   ├─ derive knowledge_domains from classification
   │       always: business_formation · licensing · taxation
   │       + handles_food      → health_food_safety
   │       + employs_staff     → employment
   │       + fixed premises    → premises_planning
   │       + seeks_funding     → funding
   │
   ├─ select agents
   │       research      always
   │       compliance    always
   │       funding       only if seeks_funding or funding amount present
   │       action_plan   always
   │
   ├─ sequence by dependency (research → {compliance, funding} → action_plan)
   │
   └─ emit ExecutionPlan
```

`funding` is skipped when a founder has not indicated interest — C6. A null funding amount means _unknown_, not _none_, and does **not** by itself skip the step; only an explicit absence of funding interest does.

---

## 9. Security

| Concern                                | Control                                                                                                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Prompt injection via founder input** | `description` and `founder_goals` are untrusted. The system prompt states that profile content is data to classify, never instructions. Output is schema-validated; a non-conforming response is rejected, not parsed leniently |
| Jurisdiction spoofing                  | Jurisdiction comes from the database, never from prose. A founder writing "I am in Jamaica" in their description cannot change it                                                                                               |
| Over-routing to inflate cost           | Step count is bounded; routing rules are deterministic given a classification and are asserted in tests                                                                                                                         |
| PII to the model                       | Only fields listed in §5 are sent. No email, no name (Security Architecture — AI Safety)                                                                                                                                        |
| Trust laundering                       | The Coordinator cannot write `trust_level` or `trust_score`; those are Trust Layer-derived                                                                                                                                      |
| Database access                        | None. Agents never touch the database (Engineering Standards §8)                                                                                                                                                                |

---

## 10. Failure Modes

| #   | Failure                                                                                                    | Severity    | Mitigation                                                                                                                       |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Under-declared `knowledge_domains`** — plan looks complete because we never asked for the missing domain | 🔴 Critical | Domain derivation is **rule-based, not model-chosen** (§8). Rules are asserted in tests and measured by the Evaluation Framework |
| F2  | Misclassification routes to the wrong specialist path                                                      | 🟠 High     | `classification_confidence`; clarification on LOW; evaluation against a labelled set                                             |
| F3  | Schema-invalid output                                                                                      | 🟠 High     | Validate, retry once with the error appended, then fail (ADR-0016)                                                               |
| F4  | Prompt injection redirects routing                                                                         | 🟠 High     | Deterministic jurisdiction; schema validation; profile framed as data                                                            |
| F5  | Clarification loop — repeated questions                                                                    | 🟡 Medium   | Answers persisted to `business_profiles`; **max 2 clarification rounds**, then proceed at best effort with coverage reduced      |
| F6  | Over-routing inflating cost and latency                                                                    | 🟡 Medium   | Deterministic routing rules; token and step budgets (document 13)                                                                |
| F7  | Country inactive                                                                                           | 🟡 Medium   | Fail fast with a plain message. Never generate against a jurisdiction with no Knowledge Pack                                     |

**F1 deserves emphasis.** Every other failure is visible — a wrong classification produces wrong-looking output. An under-declared domain produces output that looks _right_, and is incomplete. This is why domain derivation is rules-based: a model may classify the business, but it may not decide what counts as complete.

---

## 11. Success Metrics

| Metric                                                  | Target        | Measured by                       |
| ------------------------------------------------------- | ------------- | --------------------------------- |
| Business-type classification accuracy                   | ≥ 95%         | Labelled evaluation set           |
| **Domain-declaration recall** (required domain omitted) | **≥ 99%**     | Evaluation Framework              |
| Jurisdiction errors                                     | **0**         | Deterministic — asserted in tests |
| Unnecessary agent invocations                           | ≤ 5%          | Execution telemetry               |
| Clarification rate                                      | ≤ 15% of runs | Telemetry                         |
| Runs needing > 2 clarification rounds                   | ≤ 1%          | Telemetry                         |
| Median Coordinator latency                              | ≤ 5 s         | Observability                     |
| Founder-facing prose emitted                            | **0**         | Schema — structurally impossible  |

Domain-declaration recall is set higher than classification accuracy deliberately: misclassifying a restaurant as a café is recoverable; failing to declare `health_food_safety` is not.

---

## 12. Relationships to Other Documents

**Supersedes:** _Coordinator Agent Specification v1.0_ (Notion). v1.0's "Coordinator launches agents and assembles the package" is replaced by plan-and-delegate (§3).

**Depends on:** ADR-0016 (execution model) · Trust Layer Specification (1) · Launch Plan Architecture (2) · Database Architecture · AI System Architecture (context separation).

**Constrains:** _Specialist Agent Contract_ (4) — every specialist consumes the Execution Plan's context shape and must be idempotent per ADR-0016 · _Knowledge Ingestion Pipeline_ (5) — domain vocabulary must exist in the Knowledge Pack · _Agent Memory Architecture_ (9) — conversation context boundary.

**Related:** _AI Evaluation Framework_ (7) — owns classification and domain-recall measurement · _Prompt Engineering Standard_ (8) · _AI Cost Optimisation_ (13).

---

## 13. Future Evolution

| Change                                                   | Trigger                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------- |
| Parallel step execution (compliance ∥ funding)           | Runner supports fan-out; both depend only on research                      |
| Multi-jurisdiction businesses                            | Second active country                                                      |
| Industry-specific specialist routing (Property, Tourism) | Those agents exist                                                         |
| Re-classification when intake changes                    | Regeneration flow (Launch Plan §7A.5)                                      |
| Learned routing from outcomes                            | Learning Layer — concept only, requires human review of any routing change |

Deliberately **not** planned: giving the Coordinator knowledge access (C3), or letting it emit founder-facing prose (C1).

---

## 14. ADR References

| ADR      | Relevance                                                            |
| -------- | -------------------------------------------------------------------- |
| **0016** | **Execution model — the Coordinator plans, the runner executes**     |
| **0015** | Four trust dimensions; `classification_confidence` is not among them |
| 0014     | Structured logging per step                                          |
| 0007     | Business lifecycle states                                            |

---

## 15. Open Questions

| #       | Question                          | Blocks                                                                                       | Owner |
| ------- | --------------------------------- | -------------------------------------------------------------------------------------------- | ----- |
| ~~CO1~~ | ~~`premises_type` in intake?~~    | **RESOLVED 2026-08-07** — not added. Requested via targeted clarification only when required | —     |
| ~~CO2~~ | ~~Block on LOW confidence?~~      | **RESOLVED 2026-08-07** — best-effort plan, reduced coverage, clarify, regenerate (§7.1)     | —     |
| ~~CO3~~ | ~~Who owns `knowledge_domains`?~~ | **RESOLVED 2026-08-07** — Knowledge Pack metadata (§6.2)                                     | —     |
