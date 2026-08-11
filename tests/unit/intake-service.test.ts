import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BusinessProfile } from '@/types/business';

const mocks = vi.hoisted(() => ({
  profile: null as BusinessProfile | null,
  updateProfile: vi.fn(),
  findBusinessById: vi.fn(),
}));

vi.mock('@/lib/db/business-profiles', () => ({
  findProfileByBusinessId: async () => mocks.profile,
  insertProfile: vi.fn(),
  updateProfile: mocks.updateProfile,
}));
vi.mock('@/lib/db/businesses', () => ({
  findBusinessById: mocks.findBusinessById,
  updateBusiness: vi.fn(),
}));
vi.mock('@/services/business', () => ({ assertTransition: vi.fn() }));
vi.mock('@/services/audit', () => ({ recordAuditEvent: vi.fn() }));

const { applyKnowledge, saveStep } = await import('@/services/intake');

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
    mocks.findBusinessById.mockReset();
    mocks.findBusinessById.mockResolvedValue({
      id: 'b1',
      country_code: 'BS',
      status: 'intake_started',
    });
  });

  it('preserves other provenance and records a founder funding decline', async () => {
    await saveStep({} as never, 'b1', 'u1', 4, { funding_requirement_amount: null }, {}, true);

    expect(mocks.updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      'b1',
      expect.objectContaining({
        responses: {
          untouched: { value: 'keep this' },
          knowledge: {
            business: { source: 'nova', confidence: 'low' },
            funding: { source: 'founder', declined: true, confirmed_at: expect.any(String) },
          },
        },
      }),
    );
  });

  it('writes a Nova proposal through the profile service without moving the intake cursor', async () => {
    await applyKnowledge({} as never, 'b1', 'u1', {
      patch: { description: 'A seafood takeaway in Nassau.' },
      provenance: {
        business: { source: 'nova', confidence: 'low', confirmed_at: null, run_id: 'run-1' },
      },
    });

    expect(mocks.updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      'b1',
      expect.objectContaining({
        description: 'A seafood takeaway in Nassau.',
        responses: expect.objectContaining({
          knowledge: expect.objectContaining({
            business: { source: 'nova', confidence: 'low', confirmed_at: null, run_id: 'run-1' },
          }),
        }),
      }),
    );
    expect(mocks.updateProfile.mock.calls[0]?.[2]).not.toHaveProperty('last_completed_step');
  });
});
