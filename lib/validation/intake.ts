import { z } from 'zod';

/**
 * Founder intake contract (ADR-0005).
 *
 * The step set is derived from the Coordinator Agent's documented input
 * contract: business type, industry, country, stage, goals, location,
 * employees, funding requirements. Name/industry/country are captured at
 * business creation, so intake covers the remainder.
 *
 * ⚠️ `business_stage` values are NOT defined in any canonical document
 * (open question Q-S2). The vocabulary below is generic business language, not
 * a regulatory classification, and is stored as free text so it can be replaced
 * without a migration. It must be confirmed before the Coordinator Agent
 * consumes it in Phase 4, or the agent contract will drift.
 */
export const BUSINESS_STAGES = [
  'idea',
  'planning',
  'pre_launch',
  'operating',
  'expanding',
] as const;

export const BUSINESS_STAGE_LABELS: Record<(typeof BUSINESS_STAGES)[number], string> = {
  idea: 'Just an idea',
  planning: 'Planning it out',
  pre_launch: 'Getting ready to launch',
  operating: 'Already operating',
  expanding: 'Growing or expanding',
};

/** ISO 4217. Sourced from the business's country at save time, never typed in. */
export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/);

export const stepDescriptionSchema = z.object({
  description: z
    .string()
    .trim()
    .min(20, 'Tell us a little more — at least a sentence or two.')
    .max(5000, 'That is longer than we can store. Please shorten it.'),
});

export const stepStageSchema = z.object({
  businessStage: z.enum(BUSINESS_STAGES, { message: 'Choose where you are today.' }),
  location: z
    .string()
    .trim()
    .min(1, 'Where will the business operate?')
    .max(200, 'That location is too long.'),
});

export const stepTeamSchema = z.object({
  employeeCount: z.coerce
    .number({ message: 'Enter a number.' })
    .int('Enter a whole number.')
    .min(0, 'This cannot be negative.')
    .max(1_000_000, 'That seems too high.'),
});

/**
 * Funding — a figure, or an explicit "I don't know yet".
 *
 * Many founders genuinely do not know, and forcing a number would produce
 * fabricated data the Funding Agent would later treat as real. But a silently
 * blank submission is indistinguishable from never having been asked, which is
 * the ambiguity ADR-0020 flagged: the profile could not tell "declined" from
 * "not reached", so completeness had to fall back on the guided-flow cursor.
 *
 * So one of the two must be given. "I don't know yet" is a first-class answer
 * and is recorded as one — see `responses.knowledge.funding.declined`.
 */
export const stepFundingSchema = z
  .object({
    fundingAmount: z
      .union([
        z.literal(''),
        z.coerce.number().min(0, 'This cannot be negative.').max(9_999_999_999),
      ])
      .optional()
      .transform((v) => (v === '' || v === undefined ? undefined : Number(v))),
    // An unchecked checkbox is absent from the form data entirely.
    fundingUnknown: z
      .unknown()
      .optional()
      .transform((v) => v === 'on' || v === 'true' || v === true),
  })
  .transform(({ fundingAmount, fundingUnknown }) => ({
    // The two are the same answer and cannot both hold. Ticking the box wins,
    // so a stale number left in the input cannot be stored alongside it.
    fundingAmount: fundingUnknown ? undefined : fundingAmount,
    fundingUnknown,
  }))
  .refine((v) => v.fundingUnknown || v.fundingAmount !== undefined, {
    message: 'Enter an amount, or tick “I don’t know yet”.',
    path: ['fundingAmount'],
  });

/**
 * The shape of `business_profiles.responses` (ADR-0020).
 *
 * Provenance and answer metadata — never a second copy of a value. Parsed
 * defensively because this is untrusted jsonb: a malformed object must degrade
 * to "nothing recorded", never break a page render.
 *
 * `declined` is the only key written today. Nova will add `source`,
 * `confidence` and `confirmed_at` alongside it.
 */
export const knowledgeRecordSchema = z.object({
  knowledge: z
    .object({
      funding: z.object({ declined: z.boolean().optional() }).optional(),
    })
    .optional(),
});

export type KnowledgeRecord = z.infer<typeof knowledgeRecordSchema>;

export const stepGoalsSchema = z.object({
  founderGoals: z
    .string()
    .trim()
    .min(10, 'A sentence is enough.')
    .max(5000, 'That is longer than we can store. Please shorten it.'),
});

export const INTAKE_STEPS = [
  { step: 1, slug: 'business', title: 'About the business', schema: stepDescriptionSchema },
  { step: 2, slug: 'stage', title: 'Stage and location', schema: stepStageSchema },
  { step: 3, slug: 'team', title: 'Your team', schema: stepTeamSchema },
  { step: 4, slug: 'funding', title: 'Funding', schema: stepFundingSchema },
  { step: 5, slug: 'goals', title: 'Your goals', schema: stepGoalsSchema },
] as const;

export const TOTAL_INTAKE_STEPS = INTAKE_STEPS.length;

export function stepFromParam(raw: string | undefined, lastCompleted: number): number {
  const parsed = Number(raw);
  if (Number.isInteger(parsed) && parsed >= 1 && parsed <= TOTAL_INTAKE_STEPS) {
    // Never let a founder jump ahead of what they've answered — later steps
    // would have nothing to resume from.
    return Math.min(parsed, lastCompleted + 1);
  }
  return Math.min(lastCompleted + 1, TOTAL_INTAKE_STEPS);
}

export type BusinessStage = (typeof BUSINESS_STAGES)[number];
