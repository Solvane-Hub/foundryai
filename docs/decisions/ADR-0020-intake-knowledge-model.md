# ADR-0020 — One business profile; intake measures knowledge, not visitation

**Date:** 2026-08-09 · **Status:** ✅ Accepted (founder-directed) · Nova not implemented

## Context

Nova is intended to become the conversational front door. A founder will describe
their business in prose — _"a small seafood takeaway in The Bahamas with three
people, I don't know what licences I need"_ — and Nova will progressively
establish the same facts the five intake screens collect.

If nothing is decided now, the obvious implementations are both wrong:

- **A second store.** Nova writes conversation-derived facts somewhere of its
  own and intake keeps its columns. Two sources of truth for "what does this
  business do", and every downstream consumer has to reconcile them.
- **Ask twice.** The founder tells Nova, then types the same answers into five
  screens. The product's core promise — that FoundryAI remembers — is broken on
  the first session.

There is also a live defect underneath this. `intakeProgress()` derived
completeness from `business_profiles.last_completed_step`, which is a **cursor
recording how far through the guided flow the founder has walked**. That is a
measure of page visitation. A profile whose facts were established by any
writer other than the five screens would have reported 0 of 5. `completeIntake()`
gated on the same cursor, so such a profile would have been permanently
unfinishable.

## Options considered

1. **Nova-owned tables, reconciled later.** Fastest to build; guarantees a
   reconciliation problem and two answers to every question.
2. **A generic key/value fact store replacing the typed columns.** Flexible;
   throws away the schema constraints, the Coordinator Agent's documented input
   contract, and every check the database currently enforces.
3. **One profile. Typed columns stay the values. Provenance is additive.**

## Decision

**Option 3.**

- **`business_profiles` is the single source of truth for the values.** The
  typed columns (`description`, `business_stage`, `location`, `employee_count`,
  `funding_requirement_amount`, `founder_goals`) remain exactly as they are.
  Nova does not get a table and does not get a copy.

- **Nova writes through the Intake Application Service**, the same path the
  screens use. Consistent with the standing rule that an AI agent never writes
  to the database: agents return validated JSON, Application Services perform
  every write (ADR-0016, ADR-0017). Nova's extraction will be proposed output,
  validated against the existing Zod schemas before any column is touched.

- **Completeness is read from the values, not the cursor.**
  `services/intake/knowledge.ts` defines the five slots and computes what the
  profile actually holds. `intakeProgress()` and `completeIntake()` are both
  built on it. `last_completed_step` survives with a narrowed meaning: the
  founder's position in the guided flow. It is not evidence that any fact is
  known.

- **Provenance lives in `business_profiles.responses`**, the jsonb column that
  already exists (`not null default '{}'`) and is currently written by nothing:

  ```jsonc
  {
    "knowledge": {
      "business": { "source": "nova", "confidence": "low", "run_id": "…", "confirmed_at": null },
      "team": { "source": "founder", "confirmed_at": "2026-08-09T…" },
    },
  }
  ```

  **Provenance only — never a second copy of a value.** A reader that wants to
  know what the business does reads the column; a reader that wants to know who
  said so reads `responses.knowledge`. There is no state in which those two can
  disagree about the fact itself.

- **No migration.** The column exists, the constraint (`jsonb_typeof = 'object'`)
  already permits this shape, and the typed columns are unchanged.

- **`KnowledgeState` distinguishes confirmed, declined, unknown, and proposed
  facts.** `readKnowledge()` consumes the documented `responses.knowledge`
  provenance record. An unconfirmed Nova value is `needs_confirmation` and is
  not counted as complete; an explicit funding decline is `declined` and is a
  resolved answer without an invented figure. Any record without provenance
  remains founder-established, so the reader never claims a source it cannot
  substantiate.

## Consequences

- One profile. Nova populates it, intake structures and reviews it, the
  dashboard summarises it, the journey acts on it. No reconciliation layer.
- Progress becomes truthful under a second writer without any UI change: the
  intake rail, the dashboard dial and the review screen all read
  `intakeProgress()` and will reflect Nova-established facts automatically.
- `completeIntake()` no longer refuses a complete profile because the founder
  did not walk the screens.
- **Behaviour is unchanged today.** With the five screens as the only writer,
  knowledge and cursor agree on every reachable state; the existing tests were
  updated because their fixtures asserted the cursor semantics directly, not
  because any user-visible behaviour moved.
- Cost: one more concept (slots) between the columns and the UI, and a jsonb
  shape that is documented here before it is enforced anywhere.

## Amendment, 2026-08-11 — provenance is now a live, constrained seam

The profile service now writes founder provenance for each saved intake step
and exposes `applyKnowledge()` as the only future external knowledge write
path. It normalises funding currency, merges only the `responses.knowledge`
metadata, preserves unrelated response data, and does not advance the founder's
guided-flow cursor. A founder correction replaces Nova confidence and run
metadata with founder provenance.

The dashboard, intake route, and review route all consume `readKnowledge()`.
They show the same five slots; confirmed and declined slots count as progress,
while `needs_confirmation` remains actionable but unfinished. This does not add
Nova conversation, extraction, analytics, or another database model.

## Amendment, 2026-08-09 — the funding ambiguity, resolved

The original decision left funding leaning on the cursor: a null amount with
`last_completed_step >= 4` counted as known. That could not tell a founder who
had considered funding and had no figure from one who had walked past the
screen, and it leaked into the UI — the rail reported 5 of 5 while the review
screen showed funding as "Not answered".

**Founder decision: make "I don't know yet" an explicit answer.**

- Step 4 now requires one of two answers: a figure, or a ticked
  "I don't know yet". A blank submission is a validation error.
- The tick is recorded at `responses.knowledge.funding.declined` — the first
  real use of the jsonb column this ADR reserved. Still no migration.
- **The cursor fallback is gone.** `isKnown('funding')` reads the amount or the
  decline, nothing else. Completeness no longer depends on navigation anywhere
  in the model.
- Nova will set the same flag when a founder says so in conversation, through
  the same Application Service.

Consequences worth stating: a profile written before this change, where the
founder passed the funding step blank, now reads as four of five known until
they revisit the step. That is honest — the system genuinely does not know
which of the two things happened. A profile with `completed_at` already set
stays complete, and the review screen keeps showing its completion state.

## Explicitly not decided

Nova's extraction model, confidence thresholds, when a low-confidence fact is
surfaced for confirmation, and the conversational UI. None of it is built. This
ADR only guarantees that building it will not require moving the business
profile or asking the founder the same question twice.

## References

`services/intake/knowledge.ts` · ADR-0005 (Zod as the single validation layer) ·
ADR-0007 (business lifecycle states) · ADR-0016 · ADR-0017 ·
Coordinator Agent input contract · PRD (Nova)
