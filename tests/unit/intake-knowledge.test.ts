import { describe, expect, it } from 'vitest';
import type { BusinessProfile } from '@/types/business';
import {
  INTAKE_SLOTS,
  hasDeclinedFunding,
  isKnowledgeEstablished,
  isSlotKnownForStep,
  knowledgeCompleteness,
  readKnowledge,
} from '@/services/intake/knowledge';
import { intakeProgress } from '@/services/intake';

/**
 * Intake completeness is a property of the DATA, not of the founder's path
 * through the UI.
 *
 * These are the tests that will still hold once Nova can establish a fact
 * without the founder opening the page — the cursor (`last_completed_step`)
 * must never again be the thing that decides whether an answer exists.
 */
const EMPTY: BusinessProfile = {
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
  last_completed_step: 0,
  completed_at: null,
  created_at: '2026-08-01T00:00:00Z',
  updated_at: '2026-08-01T00:00:00Z',
} as unknown as BusinessProfile;

const FULL: BusinessProfile = {
  ...EMPTY,
  description: 'A seafood takeaway in Nassau.',
  business_stage: 'idea',
  location: 'Nassau',
  employee_count: 3,
  funding_requirement_amount: 50_000,
  funding_requirement_currency: 'BSD',
  founder_goals: 'Open a second location.',
  last_completed_step: 5,
};

describe('the five slots', () => {
  it('are the five intake steps, one vocabulary', () => {
    expect(INTAKE_SLOTS.map((s) => s.id)).toEqual([
      'business',
      'stage',
      'team',
      'funding',
      'goals',
    ]);
    expect(INTAKE_SLOTS.map((s) => s.step)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('knowledgeCompleteness', () => {
  it('counts nothing for an empty profile', () => {
    expect(knowledgeCompleteness(EMPTY)).toEqual({ known: 0, total: 5, isComplete: false });
  });

  it('counts a fully answered profile', () => {
    expect(knowledgeCompleteness(FULL)).toEqual({ known: 5, total: 5, isComplete: true });
  });

  it('treats a missing profile as no knowledge rather than throwing', () => {
    expect(knowledgeCompleteness(null).known).toBe(0);
  });

  it('counts values the founder never walked a screen to enter', () => {
    // The shape a Nova-populated profile will have: facts present, cursor at 0.
    const fromConversation: BusinessProfile = {
      ...EMPTY,
      description: 'A seafood takeaway in Nassau.',
      business_stage: 'idea',
      location: 'Nassau',
      employee_count: 3,
      last_completed_step: 0,
    };
    // Three established slots — description, stage+location, team. Funding was
    // never raised and goals were not established, so neither counts. The old
    // cursor-based reading would have said none of it existed.
    expect(knowledgeCompleteness(fromConversation).known).toBe(3);
    expect(intakeProgress(fromConversation).completed).toBe(3);
  });
});

describe('per-slot rules', () => {
  it('needs both halves of the stage question', () => {
    const stageOnly = { ...EMPTY, business_stage: 'idea' };
    expect(isSlotKnownForStep(stageOnly, 2)).toBe(false);
    expect(isSlotKnownForStep({ ...stageOnly, location: 'Nassau' }, 2)).toBe(true);
  });

  it('accepts zero as a real team size', () => {
    expect(isSlotKnownForStep({ ...EMPTY, employee_count: 0 }, 3)).toBe(true);
  });

  it('treats blank text as unknown, not as an answer', () => {
    expect(isSlotKnownForStep({ ...EMPTY, description: '   ' }, 1)).toBe(false);
  });

  it('counts funding from a figure or from an explicit decline, never from the cursor', () => {
    // "I don't know yet" is a real answer and is stored as one (ADR-0020).
    // Walking past the screen is not an answer, however far the cursor moved.
    expect(isSlotKnownForStep({ ...EMPTY, last_completed_step: 5 }, 4)).toBe(false);
    expect(isSlotKnownForStep({ ...EMPTY, funding_requirement_amount: 1000 }, 4)).toBe(true);
    expect(
      isSlotKnownForStep(
        { ...EMPTY, responses: { knowledge: { funding: { declined: true } } } },
        4,
      ),
    ).toBe(true);
  });

  it('keeps an explicit funding decline distinct from a provided amount', () => {
    const declined = readKnowledge({
      ...EMPTY,
      responses: { knowledge: { funding: { source: 'founder', declined: true } } },
    })[3]!;
    expect(declined).toMatchObject({ state: 'declined', source: 'founder' });
    expect(isKnowledgeEstablished(declined.state)).toBe(true);
  });

  it('reads the decline flag defensively', () => {
    expect(
      hasDeclinedFunding({ ...EMPTY, responses: { knowledge: { funding: { declined: true } } } }),
    ).toBe(true);
    expect(
      hasDeclinedFunding({ ...EMPTY, responses: { knowledge: { funding: { declined: false } } } }),
    ).toBe(false);
    expect(hasDeclinedFunding(EMPTY)).toBe(false);
    // Malformed jsonb must degrade to "nothing recorded", never throw.
    expect(hasDeclinedFunding({ ...EMPTY, responses: 'nonsense' as never })).toBe(false);
    expect(
      hasDeclinedFunding({ ...EMPTY, responses: { knowledge: { funding: 7 } } as never }),
    ).toBe(false);
  });
});

describe('provenance', () => {
  it('reports a source only for slots that are actually known', () => {
    const k = readKnowledge({ ...EMPTY, description: 'A seafood takeaway.' });
    expect(k[0]).toMatchObject({ state: 'known', source: 'founder' });
    expect(k[1]).toMatchObject({ state: 'unknown', source: null });
  });

  it('never claims a source it cannot substantiate', () => {
    // Until `responses.knowledge` is populated, the intake screens are the
    // only writer. Nothing may report `nova`.
    for (const k of readKnowledge(FULL)) expect(k.source).toBe('founder');
  });

  it('holds an unconfirmed Nova proposal out of progress until the founder confirms it', () => {
    const proposed = {
      ...EMPTY,
      description: 'A seafood takeaway in Nassau.',
      responses: {
        knowledge: {
          business: { source: 'nova', confidence: 'low', confirmed_at: null, run_id: 'run-1' },
        },
      },
    } as BusinessProfile;
    const business = readKnowledge(proposed)[0]!;
    expect(business).toMatchObject({ state: 'needs_confirmation', source: 'nova' });
    expect(isKnowledgeEstablished(business.state)).toBe(false);
    expect(knowledgeCompleteness(proposed).known).toBe(0);

    const confirmed = {
      ...proposed,
      responses: {
        knowledge: {
          business: { source: 'nova', confidence: 'low', confirmed_at: '2026-08-11T12:00:00Z' },
        },
      },
    } as BusinessProfile;
    expect(readKnowledge(confirmed)[0]).toMatchObject({ state: 'known', source: 'nova' });
  });
});

describe('intakeProgress', () => {
  it('keeps reporting completion from completed_at, not from the slot count', () => {
    // Every slot known, but the founder has not pressed Finish.
    expect(intakeProgress(FULL)).toEqual({
      completed: 5,
      total: 5,
      percent: 100,
      isComplete: false,
    });
    expect(intakeProgress({ ...FULL, completed_at: '2026-08-09T00:00:00Z' }).isComplete).toBe(true);
  });
});
