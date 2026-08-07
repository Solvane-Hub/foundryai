import { describe, expect, it } from 'vitest';
import { toFieldErrors } from '@/lib/validation/field-errors';

describe('toFieldErrors', () => {
  it('groups messages by field', () => {
    expect(
      toFieldErrors([
        { path: ['email'], message: 'Bad email.' },
        { path: ['password'], message: 'Too short.' },
      ]),
    ).toEqual({ email: ['Bad email.'], password: ['Too short.'] });
  });

  it('collects multiple messages for one field', () => {
    const r = toFieldErrors([
      { path: ['password'], message: 'Too short.' },
      { path: ['password'], message: 'Too simple.' },
    ]);
    expect(r.password).toHaveLength(2);
  });

  it('buckets path-less issues under _', () => {
    expect(toFieldErrors([{ path: [], message: 'Form invalid.' }])).toEqual({
      _: ['Form invalid.'],
    });
  });
});
