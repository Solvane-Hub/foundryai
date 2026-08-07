import { describe, expect, it } from 'vitest';
import {
  stepDescriptionSchema,
  stepFromParam,
  stepFundingSchema,
  stepGoalsSchema,
  stepStageSchema,
  stepTeamSchema,
  TOTAL_INTAKE_STEPS,
} from '@/lib/validation/intake';
import { intakeProgress } from '@/services/intake';
import type { BusinessProfile } from '@/types/business';

describe('stepFromParam — resume logic', () => {
  it('resumes at the next unanswered step', () => {
    expect(stepFromParam(undefined, 2)).toBe(3);
  });

  it('starts at step 1 for a fresh intake', () => {
    expect(stepFromParam(undefined, 0)).toBe(1);
  });

  it('honours an explicit step the founder has already reached', () => {
    expect(stepFromParam('2', 4)).toBe(2);
  });

  it('refuses to jump ahead of what has been answered', () => {
    // Step 5 with nothing answered would have nothing to resume from.
    expect(stepFromParam('5', 0)).toBe(1);
    expect(stepFromParam('4', 1)).toBe(2);
  });

  it('clamps at the final step', () => {
    expect(stepFromParam(undefined, TOTAL_INTAKE_STEPS)).toBe(TOTAL_INTAKE_STEPS);
  });

  it('ignores junk input', () => {
    for (const junk of ['abc', '-1', '0', '999', '', '2.5']) {
      const r = stepFromParam(junk, 1);
      expect(r).toBeGreaterThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(TOTAL_INTAKE_STEPS);
    }
  });
});

describe('intake step validation', () => {
  it('requires a substantive description', () => {
    expect(stepDescriptionSchema.safeParse({ description: 'food' }).success).toBe(false);
    expect(
      stepDescriptionSchema.safeParse({
        description: 'A seafood restaurant in Nassau serving local catch.',
      }).success,
    ).toBe(true);
  });

  it('rejects an unknown business stage', () => {
    expect(
      stepStageSchema.safeParse({ businessStage: 'unicorn', location: 'Nassau' }).success,
    ).toBe(false);
  });

  it('accepts a documented stage', () => {
    expect(stepStageSchema.safeParse({ businessStage: 'idea', location: 'Nassau' }).success).toBe(
      true,
    );
  });

  it('accepts zero employees but rejects negatives', () => {
    expect(stepTeamSchema.safeParse({ employeeCount: '0' }).success).toBe(true);
    expect(stepTeamSchema.safeParse({ employeeCount: '-1' }).success).toBe(false);
  });

  it('rejects fractional employee counts', () => {
    expect(stepTeamSchema.safeParse({ employeeCount: '2.5' }).success).toBe(false);
  });

  it('treats funding as genuinely optional', () => {
    // "I don't know" must be representable. Forcing a number would fabricate
    // data the Funding Agent would later treat as real.
    expect(stepFundingSchema.parse({ fundingAmount: '' }).fundingAmount).toBeUndefined();
    expect(stepFundingSchema.parse({}).fundingAmount).toBeUndefined();
  });

  it('accepts a funding figure', () => {
    expect(stepFundingSchema.parse({ fundingAmount: '50000' }).fundingAmount).toBe(50000);
  });

  it('rejects negative funding', () => {
    expect(stepFundingSchema.safeParse({ fundingAmount: '-5' }).success).toBe(false);
  });

  it('requires goals of at least a sentence', () => {
    expect(stepGoalsSchema.safeParse({ founderGoals: 'grow' }).success).toBe(false);
    expect(
      stepGoalsSchema.safeParse({ founderGoals: 'Open a second location within a year.' }).success,
    ).toBe(true);
  });
});

function profile(step: number, completedAt: string | null = null): BusinessProfile {
  return {
    id: 'p1',
    business_id: 'b1',
    description: null,
    founder_goals: null,
    location: null,
    business_stage: null,
    employee_count: null,
    funding_requirement_amount: null,
    funding_requirement_currency: null,
    responses: {},
    last_completed_step: step,
    completed_at: completedAt,
    created_at: '2026-08-07T00:00:00Z',
    updated_at: '2026-08-07T00:00:00Z',
  };
}

describe('intakeProgress', () => {
  it('reports zero for a fresh intake', () => {
    expect(intakeProgress(profile(0)).percent).toBe(0);
  });

  it('reports 100% when every step is answered', () => {
    expect(intakeProgress(profile(TOTAL_INTAKE_STEPS)).percent).toBe(100);
  });

  it('never exceeds 100% if the stored step is somehow larger', () => {
    expect(intakeProgress(profile(99)).percent).toBe(100);
  });

  it('handles a missing profile', () => {
    expect(intakeProgress(null).completed).toBe(0);
  });

  it('distinguishes answered-all from formally completed', () => {
    expect(intakeProgress(profile(TOTAL_INTAKE_STEPS)).isComplete).toBe(false);
    expect(intakeProgress(profile(TOTAL_INTAKE_STEPS, '2026-08-07T00:00:00Z')).isComplete).toBe(
      true,
    );
  });
});
