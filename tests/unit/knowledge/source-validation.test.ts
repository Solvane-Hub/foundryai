import { describe, expect, it } from 'vitest';
import type { SourceAuthority } from '@/types/knowledge';
import { registerSourceSchema } from '@/lib/validation/knowledge';
import {
  classificationMatches,
  compareSourcePrecedence,
  deriveOutcome,
  mayPublish,
  validateSource,
} from '@/services/knowledge/validation';
import { syntheticRegistration } from '@/tests/fixtures/knowledge/synthetic-source';
import {
  guidanceClaimingAuthorityFive,
  invertedDates,
  missingPublicationDate,
  regulationClaimingAuthorityFive,
} from '@/tests/fixtures/knowledge/invalid-sources';

describe('source registration schema (K1 §4, K4 §5)', () => {
  it('accepts a well-formed source', () => {
    expect(registerSourceSchema.safeParse(syntheticRegistration).success).toBe(true);
  });

  it('rejects official guidance claiming Authority 5 — the C1 regression', () => {
    // This is the control ADR-0015 tightened: guidance is Level 3 and can reach
    // 🟡 DERIVED at most. If this test ever passes, VERIFIED is reachable from
    // a ministry web page.
    const result = registerSourceSchema.safeParse(guidanceClaimingAuthorityFive);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('sourceAuthority'))).toBe(true);
    }
  });

  it('rejects a regulation claiming Authority 5 (K2 §8.1 — regulations are 4)', () => {
    expect(registerSourceSchema.safeParse(regulationClaimingAuthorityFive).success).toBe(false);
  });

  it('rejects an effective date after the expiry date', () => {
    expect(registerSourceSchema.safeParse(invertedDates).success).toBe(false);
  });

  it('rejects an out-of-range Source Authority', () => {
    expect(
      registerSourceSchema.safeParse({ ...syntheticRegistration, sourceAuthority: 6 }).success,
    ).toBe(false);
    expect(
      registerSourceSchema.safeParse({ ...syntheticRegistration, sourceAuthority: 0 }).success,
    ).toBe(false);
  });
});

describe('K2 §8.1 category → authority mapping', () => {
  it.each([
    ['constitution', 5, true],
    ['primary_legislation', 5, true],
    ['regulation', 4, true],
    ['ministerial_order', 4, true],
    ['official_guidance', 3, true],
    ['agency_publication', 3, true],
    ['agency_publication', 2, true],
    ['official_guidance', 4, false],
    ['constitution', 4, false],
    ['regulation', 3, false],
  ] as const)('%s at authority %i → %s', (category, authority, expected) => {
    expect(classificationMatches(category, authority)).toBe(expected);
  });

  it('has no sixth level (finding A4)', () => {
    expect(classificationMatches('constitution', 6 as unknown as number)).toBe(false);
  });
});

describe('K2 §8.2 conflict ordering', () => {
  const make = (
    source_authority: SourceAuthority,
    legal_source_category: Parameters<typeof classificationMatches>[0],
    publication_date: string,
  ) => ({ source_authority, legal_source_category, publication_date });

  it('orders by Source Authority first', () => {
    expect(
      compareSourcePrecedence(
        make(5, 'primary_legislation', '2020-01-01'),
        make(4, 'regulation', '2026-01-01'),
      ),
    ).toBeLessThan(0);
  });

  it('breaks an authority tie by category — a Constitution outranks an Act', () => {
    // Both are Authority 5. This is exactly why A4 kept the six categories as
    // metadata instead of collapsing them into the five-level scale.
    expect(
      compareSourcePrecedence(
        make(5, 'constitution', '1973-07-10'),
        make(5, 'primary_legislation', '2024-01-01'),
      ),
    ).toBeLessThan(0);
  });

  it('falls back to recency when authority and category match', () => {
    expect(
      compareSourcePrecedence(
        make(4, 'regulation', '2026-01-01'),
        make(4, 'regulation', '2020-01-01'),
      ),
    ).toBeLessThan(0);
  });
});

describe('K2 §6 validation checks and §9 outcomes', () => {
  const candidate = {
    agency: 'Example Regulatory Authority',
    title: 'Example Act',
    sourceUrl: 'https://example.invalid/a',
    sourceAuthority: 5,
    legalSourceCategory: 'primary_legislation' as const,
    publicationDate: '2024-01-15',
    lastReviewedDate: '2026-07-01',
    sectionReferencePresent: true,
    bodyLength: 400,
  };

  it('validates a complete source', () => {
    const r = validateSource(candidate);
    expect(r.outcome).toBe('validated');
    expect(r.failureReasons).toHaveLength(0);
  });

  it('rejects — not merely downgrades — a classification mismatch', () => {
    // A wrong authority level is the failure that could otherwise reach
    // 🟢 VERIFIED, so it is rejected rather than left unverified.
    const r = validateSource({
      ...candidate,
      legalSourceCategory: 'official_guidance',
      sourceAuthority: 5,
    });
    expect(r.outcome).toBe('rejected');
    expect(mayPublish(r.outcome)).toBe(false);
  });

  it('downgrades to partially_validated when metadata is incomplete', () => {
    const r = validateSource({ ...candidate, publicationDate: null });
    expect(r.outcome).toBe('partially_validated');
    expect(mayPublish(r.outcome)).toBe(true);
  });

  it('marks a source unverified when no one could re-check it', () => {
    const r = validateSource({ ...candidate, sourceUrl: null, sectionReferencePresent: false });
    expect(r.outcome).toBe('unverified');
    expect(mayPublish(r.outcome)).toBe(false);
  });

  it('marks a source unverified when nothing could be extracted', () => {
    expect(validateSource({ ...candidate, bodyLength: 0 }).outcome).toBe('unverified');
  });

  it('never returns a Trust Level or claim-level dimension (ADR-0015)', () => {
    const r = validateSource(candidate);
    const keys = Object.keys({ ...r, ...r.checks });
    for (const forbidden of ['trustLevel', 'trust_level', 'evidenceStrength', 'trustScore']) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('fails closed — every check must pass for `validated`', () => {
    const all = {
      sourceValid: true,
      structureValid: true,
      metadataValid: true,
      provenanceValid: true,
      classificationValid: true,
    };
    expect(deriveOutcome(all)).toBe('validated');
    for (const k of Object.keys(all) as (keyof typeof all)[]) {
      expect(deriveOutcome({ ...all, [k]: false })).not.toBe('validated');
    }
  });
});

describe('registration rejects missing required metadata', () => {
  it('still parses when publication date is null but validation downgrades it', () => {
    // The schema permits null (some agency pages genuinely lack one); K2 is
    // where that becomes a downgrade. Two layers, two responsibilities.
    expect(registerSourceSchema.safeParse(missingPublicationDate).success).toBe(true);
  });
});
