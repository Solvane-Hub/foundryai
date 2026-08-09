import { describe, expect, it } from 'vitest';
import { formatLine, redact } from '@/lib/logger';

describe('redact', () => {
  it('removes known-sensitive keys', () => {
    const out = redact({ email: 'a@b.com', password: 'hunter2', userId: 'u1' });
    expect(out.email).toBe('[redacted]');
    expect(out.password).toBe('[redacted]');
    expect(out.userId).toBe('u1');
  });

  it('redacts founder free-text answers', () => {
    // Intake answers are personal business information and must never be logged.
    const out = redact({ description: 'my secret business idea', founderGoals: 'retire early' });
    expect(out.description).toBe('[redacted]');
    expect(out.founderGoals).toBe('[redacted]');
  });

  it('redacts credentials', () => {
    for (const k of [
      'token',
      'access_token',
      'refresh_token',
      'apikey',
      'authorization',
      'cookie',
    ]) {
      expect(redact({ [k]: 'secret' })[k]).toBe('[redacted]');
    }
  });

  it('drops undefined rather than emitting nulls', () => {
    expect('businessId' in redact({ businessId: undefined })).toBe(false);
  });

  it('preserves safe operational fields', () => {
    const out = redact({ correlationId: 'c1', businessId: 'b1', durationMs: 12, operation: 'x' });
    expect(out).toEqual({ correlationId: 'c1', businessId: 'b1', durationMs: 12, operation: 'x' });
  });
});

describe('formatLine', () => {
  it('produces a parseable structured line', () => {
    const line = formatLine('info', 'business.created', { correlationId: 'c1' });
    expect(line.level).toBe('info');
    expect(line.message).toBe('business.created');
    expect(line.correlationId).toBe('c1');
    expect(() => new Date(line.timestamp).toISOString()).not.toThrow();
  });

  it('never emits a sensitive value even if passed', () => {
    const serialized = JSON.stringify(formatLine('error', 'failed', { email: 'a@b.com' }));
    expect(serialized).not.toContain('a@b.com');
  });
});
