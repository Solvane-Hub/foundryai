import { describe, expect, it } from 'vitest';
import { isSafeInternalPath } from '@/lib/utils/safe-path';

/**
 * Open-redirect protection for the post-sign-in `next` parameter.
 * A user who has just entered credentials is maximally phishable, so this is
 * treated as a security control rather than a convenience.
 */
describe('isSafeInternalPath', () => {
  it.each(['/dashboard', '/intake', '/settings/profile', '/'])('allows %s', (p) => {
    expect(isSafeInternalPath(p)).toBe(true);
  });

  it.each([
    '//evil.com',
    'https://evil.com',
    'http://evil.com',
    'javascript:alert(1)',
    '/\\evil.com',
    'dashboard',
    '',
    '\\\\evil.com',
  ])('rejects %s', (p) => {
    expect(isSafeInternalPath(p)).toBe(false);
  });
});
