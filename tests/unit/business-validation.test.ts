import { describe, expect, it } from 'vitest';
import { createBusinessSchema, updateBusinessSchema } from '@/lib/validation/business';

describe('createBusinessSchema', () => {
  const valid = { name: 'Nassau Seafood Co', countryCode: 'BS', industry: 'Restaurant' };

  it('accepts valid input', () => {
    expect(createBusinessSchema.safeParse(valid).success).toBe(true);
  });

  it('trims the name', () => {
    expect(createBusinessSchema.parse({ ...valid, name: '  Nassau  ' }).name).toBe('Nassau');
  });

  it('rejects a blank name', () => {
    expect(createBusinessSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
  });

  it('rejects a name over 200 characters', () => {
    expect(createBusinessSchema.safeParse({ ...valid, name: 'a'.repeat(201) }).success).toBe(false);
  });

  it('uppercases the country code', () => {
    expect(createBusinessSchema.parse({ ...valid, countryCode: 'bs' }).countryCode).toBe('BS');
  });

  it('rejects a malformed country code', () => {
    for (const c of ['B', 'BSX', '12', '']) {
      expect(createBusinessSchema.safeParse({ ...valid, countryCode: c }).success).toBe(false);
    }
  });

  it('treats industry as optional', () => {
    const r = createBusinessSchema.safeParse({ name: 'X Ltd', countryCode: 'BS' });
    expect(r.success).toBe(true);
  });

  it('normalises an empty industry to undefined', () => {
    expect(createBusinessSchema.parse({ ...valid, industry: '   ' }).industry).toBeUndefined();
  });

  it('accepts free-text industry — taxonomy belongs to the Knowledge Pack (D8)', () => {
    expect(
      createBusinessSchema.safeParse({ ...valid, industry: 'mobile conch salad stand' }).success,
    ).toBe(true);
  });
});

describe('updateBusinessSchema', () => {
  it('requires a uuid business id', () => {
    expect(updateBusinessSchema.safeParse({ businessId: 'not-a-uuid', name: 'X' }).success).toBe(
      false,
    );
  });

  it('accepts a valid uuid', () => {
    expect(
      updateBusinessSchema.safeParse({
        businessId: '00000000-0000-4000-8000-00000000000a',
        name: 'X Ltd',
      }).success,
    ).toBe(true);
  });
});
