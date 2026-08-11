import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusinessProfile } from '@/types/business';

const mocks = vi.hoisted(() => ({
  profile: null as BusinessProfile | null,
  updateProfile: vi.fn(),
}));

vi.mock('@/lib/db/business-profiles', () => ({
  findProfileByBusinessId: async () => mocks.profile,
  insertProfile: vi.fn(),
  updateProfile: mocks.updateProfile,
}));
vi.mock('@/lib/db/businesses', () => ({
  findBusinessById: vi.fn(),
  updateBusiness: vi.fn(),
}));
vi.mock('@/services/business', () => ({ assertTransition: vi.fn() }));
vi.mock('@/services/audit', () => ({ recordAuditEvent: vi.fn() }));

const { saveStep } = await import('@/services/intake');

function profile(): BusinessProfile {
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
    responses: {
      untouched: { value: 'keep this' },
      knowledge: {
        business: { source: 'nova', confidence: 'low' },
        funding: { source: 'nova', confidence: 'medium' },
      },
    },
    last_completed_step: 3,
    completed_at: null,
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-08-10T00:00:00Z',
  } as unknown as BusinessProfile;
}

describe('saveStep', () => {
  beforeEach(() => {
    mocks.profile = profile();
    mocks.updateProfile.mockReset();
    mocks.updateProfile.mockResolvedValue({ data: mocks.profile, error: null });
  });

  it('preserves existing provenance while recording a funding decline', async () => {
    await saveStep({} as never, 'b1', 'u1', 4, { funding_requirement_amount: null }, {}, true);

    expect(mocks.updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      'b1',
      expect.objectContaining({
        responses: {
          untouched: { value: 'keep this' },
          knowledge: {
            business: { source: 'nova', confidence: 'low' },
            funding: { source: 'nova', confidence: 'medium', declined: true },
          },
        },
      }),
    );
  });
});
