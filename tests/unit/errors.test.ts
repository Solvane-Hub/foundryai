import { describe, expect, it } from 'vitest';
import { AppError, fail, ok } from '@/lib/errors';

describe('AppError', () => {
  it('separates the human message from the developer message', () => {
    const e = new AppError({
      code: 'AUTH_INVALID_CREDENTIALS',
      humanMessage: 'That email or password is incorrect.',
      developerMessage: 'supabase: invalid login credentials (400)',
    });
    expect(e.humanMessage).not.toContain('supabase');
    expect(e.message).toContain('supabase');
  });

  it('always carries a correlation id', () => {
    const e = new AppError({ code: 'UNEXPECTED', humanMessage: 'Oops.' });
    expect(e.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('Result', () => {
  it('ok carries data', () => {
    const r = ok({ x: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.x).toBe(1);
  });

  it('fail exposes only the human message', () => {
    const r = fail(
      new AppError({
        code: 'UNEXPECTED',
        humanMessage: 'Something went wrong. Please try again.',
        developerMessage: 'stack trace with internals',
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toBe('Something went wrong. Please try again.');
      expect(JSON.stringify(r)).not.toContain('stack trace');
    }
  });

  it('fail can carry per-field errors', () => {
    const r = fail(new AppError({ code: 'VALIDATION_FAILED', humanMessage: 'Fix fields.' }), {
      email: ['Bad email.'],
    });
    if (!r.ok) expect(r.fieldErrors?.email).toEqual(['Bad email.']);
  });
});
