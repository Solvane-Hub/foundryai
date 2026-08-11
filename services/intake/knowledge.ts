import type { BusinessProfile } from '@/types/business';
import { INTAKE_STEPS, TOTAL_INTAKE_STEPS, knowledgeRecordSchema } from '@/lib/validation/intake';

/**
 * What FoundryAI knows about a business, and how much of it.
 *
 * Intake is five pieces of business knowledge, not five pages a founder has to
 * visit. That distinction is the whole point of this module.
 *
 * Progress used to be read off `last_completed_step` — a cursor recording how
 * far through the guided flow the founder had walked. That is a measure of
 * PAGE VISITATION, and it is the wrong measure the moment anything other than
 * the five screens can supply an answer. Nova will hold a conversation and
 * establish the description, the jurisdiction, the stage and the team size; if
 * completeness were still read off the cursor, the founder would be told they
 * had answered 0 of 5 questions they had just spent ten minutes answering.
 *
 * So completeness is read from the VALUES. A slot is known when the profile
 * actually holds the fact, whoever put it there. Nothing about that is
 * speculative — it is true today, with the five screens as the only writer,
 * and it stays true when there is a second one.
 *
 * ── The Nova extension point ────────────────────────────────────────────────
 *
 * The typed columns on `business_profiles` are the single source of truth for
 * the VALUES, and they stay that way. Nova does not get its own table and does
 * not get its own copy: it will call the Intake Application Service, which
 * performs the write, exactly as the five screens do (agents never write to
 * the database — CLAUDE.md, ADR-0016/0017).
 *
 * What the schema does NOT yet carry is PROVENANCE — who established a fact,
 * how confident the extraction was, and whether the founder has confirmed it.
 * `business_profiles.responses` (jsonb, `not null default '{}'`) already exists
 * and is currently unused by any code path. It is the intended home:
 *
 *   {
 *     "knowledge": {
 *       "business": { "source": "nova", "confidence": "low",
 *                     "run_id": "…", "confirmed_at": null },
 *       "team":     { "source": "founder", "confirmed_at": "2026-08-09T…" }
 *     }
 *   }
 *
 * Provenance only — never a second copy of the value. When that lands,
 * `KnowledgeState` gains `needs_confirmation` (a fact Nova extracted with low
 * confidence that the founder has not yet confirmed) and `readKnowledge` reads
 * it from `responses`. No migration, no new table, no change to the meaning of
 * the typed columns, and no change to any caller of `knowledgeCompleteness`.
 *
 * Until then this module reports `founder` for every known slot, because the
 * intake screens are the only writer that exists. It does not report a source
 * it cannot substantiate, and nothing in the UI renders provenance yet.
 */

/** One piece of business knowledge. Ids are the `INTAKE_STEPS` slugs — one vocabulary. */
export type IntakeSlotId = (typeof INTAKE_STEPS)[number]['slug'];

/**
 * `needs_confirmation` is DECLARED, not yet emitted. It is the state a
 * low-confidence Nova extraction will occupy, and declaring it here is what
 * stops a caller writing `known ? … : …` and having to be rewritten later.
 */
export type KnowledgeState = 'known' | 'needs_confirmation' | 'unknown';

/** Who established the fact. Only `founder` is reachable today. */
export type KnowledgeSource = 'founder' | 'nova';

export interface IntakeSlot {
  id: IntakeSlotId;
  /** The intake screen that collects it. */
  step: number;
  title: string;
}

export interface SlotKnowledge {
  slot: IntakeSlot;
  state: KnowledgeState;
  /** `null` when the slot is unknown. */
  source: KnowledgeSource | null;
}

export const INTAKE_SLOTS: readonly IntakeSlot[] = INTAKE_STEPS.map((s) => ({
  id: s.slug,
  step: s.step,
  title: s.title,
}));

/**
 * Anything recorded about the answers themselves, as opposed to the answers.
 *
 * Untrusted jsonb: a row written by an older build, a bad migration or a hand
 * edit must degrade to "nothing recorded" rather than throw inside a render.
 */
export function readKnowledgeRecord(profile: BusinessProfile | null) {
  const parsed = knowledgeRecordSchema.safeParse(profile?.responses ?? {});
  return parsed.success ? (parsed.data.knowledge ?? {}) : {};
}

/** The founder was asked for a figure and said they do not know one yet. */
export function hasDeclinedFunding(profile: BusinessProfile | null): boolean {
  return readKnowledgeRecord(profile).funding?.declined === true;
}

/**
 * Is the fact behind each slot actually held?
 *
 * Funding is the one slot with two ways to be answered. It is deliberately
 * optional — "a guess you're unsure of is worse than no answer" — so "I don't
 * know yet" is a real answer and is stored as one. It is NOT inferred from the
 * guided-flow cursor: that inference could not tell a founder who declined
 * from one who had simply walked past the screen, and it made completeness
 * depend on navigation, which is the thing ADR-0020 removed.
 */
function isKnown(profile: BusinessProfile, id: IntakeSlotId): boolean {
  switch (id) {
    case 'business':
      return hasText(profile.description);
    case 'stage':
      // Both halves of one question; either alone leaves the slot incomplete.
      return hasText(profile.business_stage) && hasText(profile.location);
    case 'team':
      return profile.employee_count !== null && profile.employee_count !== undefined;
    case 'funding':
      return (
        (profile.funding_requirement_amount !== null &&
          profile.funding_requirement_amount !== undefined) ||
        hasDeclinedFunding(profile)
      );
    case 'goals':
      return hasText(profile.founder_goals);
  }
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

export function readKnowledge(profile: BusinessProfile | null): SlotKnowledge[] {
  return INTAKE_SLOTS.map((slot) => {
    const known = profile !== null && isKnown(profile, slot.id);
    return {
      slot,
      state: known ? ('known' as const) : ('unknown' as const),
      // The five screens are the only writer today. When `responses.knowledge`
      // is populated this reads the recorded source instead of assuming one.
      source: known ? ('founder' as const) : null,
    };
  });
}

/**
 * How much of the business profile FoundryAI holds.
 *
 * `isComplete` means every slot is known — the condition for finishing intake.
 * It is deliberately NOT the same thing as `completed_at`, which records that
 * the founder pressed the button.
 */
export function knowledgeCompleteness(profile: BusinessProfile | null): {
  known: number;
  total: number;
  isComplete: boolean;
} {
  const known = readKnowledge(profile).filter((k) => k.state === 'known').length;
  return { known, total: TOTAL_INTAKE_STEPS, isComplete: known >= TOTAL_INTAKE_STEPS };
}

/** Whether the screen for one step already has its answer stored. */
export function isSlotKnownForStep(profile: BusinessProfile | null, step: number): boolean {
  return readKnowledge(profile).find((k) => k.slot.step === step)?.state === 'known';
}
