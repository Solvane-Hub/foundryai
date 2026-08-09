import { describe, expect, it } from 'vitest';
import { buildJourney } from '@/services/progress';
import type { Business, BusinessProfile } from '@/types/business';

function business(): Business {
  return {
    id: 'b1',
    name: 'Nassau Seafood Co',
    owner_id: 'u1',
    country_code: 'BS',
    industry: 'Restaurant',
    status: 'draft',
    archived_at: null,
    created_at: '2026-08-07T00:00:00Z',
    updated_at: '2026-08-07T00:00:00Z',
  };
}

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

describe('buildJourney', () => {
  it('directs a brand-new founder to create a business', () => {
    const j = buildJourney(null, null);
    expect(j.next?.key).toBe('business');
    expect(j.next?.href).toBe('/businesses/new');
    expect(j.percent).toBe(0);
  });

  it('directs a founder with a business to start intake', () => {
    const j = buildJourney(business(), null);
    expect(j.next?.key).toBe('intake');
    expect(j.next?.actionLabel).toBe('Start intake');
  });

  it('offers to continue a partially completed intake', () => {
    const j = buildJourney(business(), profile(2));
    expect(j.next?.actionLabel).toBe('Continue intake');
    expect(j.next?.description).toContain('2 of 5');
  });

  it('has no next step once intake is complete', () => {
    // Everything remaining is blocked on unbuilt capability, so there is
    // genuinely nothing for the founder to do.
    const j = buildJourney(business(), profile(5, '2026-08-07T00:00:00Z'));
    expect(j.next).toBeNull();
    expect(j.percent).toBe(100);
  });

  it('excludes unbuilt capabilities from progress', () => {
    // Counting blocked milestones would make the platform look permanently
    // stalled at 40% no matter what the founder does.
    const j = buildJourney(business(), profile(5, '2026-08-07T00:00:00Z'));
    expect(j.total).toBe(2);
    expect(j.completed).toBe(2);
  });

  it('marks unbuilt capabilities as blocked, not upcoming', () => {
    const j = buildJourney(business(), profile(5, '2026-08-07T00:00:00Z'));
    for (const key of ['roadmap', 'compliance', 'funding']) {
      const m = j.milestones.find((x) => x.key === key);
      expect(m?.state).toBe('blocked');
      // A blocked milestone must not offer an action the founder cannot take.
      expect(m?.href).toBeUndefined();
    }
  });

  it('never promises data that does not exist', () => {
    const j = buildJourney(business(), profile(5, '2026-08-07T00:00:00Z'));
    const roadmap = j.milestones.find((m) => m.key === 'roadmap');
    expect(roadmap?.description).toMatch(/not built yet|nothing real/i);
  });

  it('shows the business name once one exists', () => {
    const j = buildJourney(business(), null);
    expect(j.milestones[0]?.description).toContain('Nassau Seafood Co');
    expect(j.milestones[0]?.state).toBe('complete');
  });
});
