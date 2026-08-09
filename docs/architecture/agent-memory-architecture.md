# Agent Memory Architecture

**Version:** 1.0 · **Status:** Canonical · **Owner:** Jamil Nash · **Last updated:** 2026-08-07
**Series:** AI Architecture, document 9 of 15

## 1. Executive Summary

FoundryAI has two kinds of memory and they must never mix.

**Knowledge** is what the platform can prove: government documents, versioned and cited. **Conversation** is what a founder told us: context, preferences, corrections, and sometimes mistakes.

The AI System Architecture states the rule; this document makes it structural. The reason is blunt: if conversation could become knowledge, a founder could talk the platform into a false regulatory claim — and it would then repeat that claim, with a citation, to them and potentially to others.

## 2. Purpose

**Scope.** What is remembered, where, for how long, what may enter model context, and the boundary between conversation and knowledge.

**Not in scope.** Knowledge storage (documents 5–6) · Nova's conversational behaviour (its own specification) · workflow state (ADR-0016).

## 3. Architecture

```
┌──────────────── CONVERSATION MEMORY ────────────────┐
│ conversations · conversation_messages               │
│ business-scoped · founder-owned · never authoritative│
└─────────────────────┬───────────────────────────────┘
                      │  may inform: clarification, tone, what to ask next
                      │  may NEVER become: evidence, citation, requirement
                      ✗
┌──────────────── KNOWLEDGE CONTEXT ──────────────────┐
│ knowledge_documents · knowledge_chunks              │
│ global · versioned · cited · human-reviewed         │
└─────────────────────────────────────────────────────┘
```

**The two stores never join at retrieval time.** This is enforced by data shape: conversation rows carry `business_id` and no authority level; knowledge rows carry `country_code` and no owner. There is no query that returns both as evidence.

## 4. Design Principles

**M1 — Conversation is never evidence.** A founder's statement may be _recorded_ and _acted upon_, never _cited_.

**M2 — Structured facts get columns, not chat history.** If something matters — employee count, premises type — it is written to `business_profiles`, not left in a transcript to be re-parsed.

**M3 — Memory is business-scoped.** Conversation belongs to one business, under the same RLS as everything else.

**M4 — Bounded context.** What enters a prompt is selected and capped, not "the whole history".

**M5 — Forgettable by design.** A founder can delete conversation history. Deleting it must not corrupt a plan — which is why M2 matters.

## 5. What Is Remembered

| Kind                     | Store                   | Enters agent context?             | Retention            |
| ------------------------ | ----------------------- | --------------------------------- | -------------------- |
| Structured profile facts | `business_profiles`     | ✅ Yes — via the Execution Plan   | Life of the business |
| Clarification answers    | `business_profiles`     | ✅ Yes — promoted to columns (M2) | Life of the business |
| Nova conversation turns  | `conversation_messages` | ⚠️ Nova only, windowed            | Founder-deletable    |
| Agent reasoning          | `agent_executions`      | ❌ Never re-fed                   | Audit retention      |
| Plan state               | `launch_plans`, `tasks` | ✅ Read as data                   | Versioned            |

**Agent reasoning is deliberately never re-fed into a later run.** Doing so would let a model's own unvalidated output become an input, compounding errors across steps with no evidence chain. Each step receives evidence and structured context — never a previous step's rationale.

## 6. Promotion — the only path from conversation to fact

```
founder states something in conversation
        │
   is it a structured fact we model?
        │ yes                          │ no
        ▼                              ▼
  write to business_profiles      remains conversation only
  (typed, validated)              (never enters an agent as fact)
        │
   becomes agent input via the Execution Plan
```

Promotion is **explicit and typed**. There is no implicit path — nothing scrapes the transcript for facts. A founder saying "I think I need three staff" does not silently set `employee_count`; it prompts a question whose answer is written to the column.

## 7. Context Windowing (Nova)

| Rule            | Value                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------- |
| Turns included  | Last 10, or 4,000 tokens, whichever is smaller                                                     |
| Always included | Current business profile summary, current plan status                                              |
| Never included  | Other businesses · other founders · agent reasoning · raw knowledge chunks not retrieved this turn |
| Summarisation   | Older turns summarised; **the summary is conversation, not knowledge**                             |

## 8. Security

| Concern                                           | Control                                                                                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Talking the platform into a false requirement** | M1 — conversation cannot become evidence; the Trust Layer requires a `chunk_id` from retrieval |
| Cross-tenant memory leakage                       | RLS via `app.business_access`; context assembled per business                                  |
| PII to models                                     | Conversation may contain PII by nature. Minimised, never logged (ADR-0014 redacts free text)   |
| Prompt injection via conversation                 | Delimited and framed as data (document 8 §6)                                                   |
| Right to deletion                                 | M5 — deletable without breaking plans                                                          |

## 9. Failure Modes

| #   | Failure                                           | Severity    | Mitigation                                                |
| --- | ------------------------------------------------- | ----------- | --------------------------------------------------------- |
| F1  | **Conversation promoted to evidence**             | 🔴 Critical | Structural — no `chunk_id`, no citation, no join          |
| F2  | Agent reasoning re-fed, compounding error         | 🔴 Critical | `agent_executions` is write-only for audit                |
| F3  | Context window overflow drops the profile         | 🟠 High     | Profile always included; conversation truncated first     |
| F4  | Deleting history corrupts a plan                  | 🟠 High     | M2 — facts live in columns, not transcripts               |
| F5  | Summarisation invents detail                      | 🟡 Medium   | Summaries are conversation-class; never citable           |
| F6  | Stale profile facts contradict newer conversation | 🟡 Medium   | Promotion is explicit; conflicts surface as clarification |

## 10. Success Metrics

| Metric                                 | Target                          |
| -------------------------------------- | ------------------------------- |
| Claims citing conversation as evidence | **0** — structurally impossible |
| Cross-business context leakage         | **0**                           |
| Plans broken by history deletion       | **0**                           |
| Context assembly latency               | ≤ 200 ms                        |
| Prompts exceeding the context budget   | ≤ 1%                            |

## 11. Relationships

**Depends on:** AI System Architecture (context separation) · Database Architecture · Trust Layer (1).
**Constrains:** Nova · Coordinator (3) §5.2 · Specialist Agent Contract (4).
**Related:** Safety (14) · Observability (11) · Human Review (10).

## 12. Future Evolution

Cross-business memory for founders running several companies (explicit, opt-in) · long-horizon memory of what a founder has completed · learned preferences (tone, detail level) — all of which remain conversation-class and never become evidence.

## 13. Open Questions

| #   | Question                                                                        |
| --- | ------------------------------------------------------------------------------- |
| AM1 | Conversation retention period, and does deletion cascade to `agent_executions`? |
| AM2 | Is conversation history exportable under a data-subject request?                |
| AM3 | Should summarisation be a model call, or extractive to avoid invention (F5)?    |

## 14. ADR References

**0015** (evidence requires a chunk) · **0016** (steps are stateless) · 0014 (redaction) · 0011 · 0009.
