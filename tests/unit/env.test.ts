import { describe, expect, it } from 'vitest';
import { __testing } from '@/lib/env';

const { parseClientEnv, parseServerEnv } = __testing;

const validClient: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
};

describe('environment validation', () => {
  it('accepts a valid public configuration', () => {
    const env = parseClientEnv(validClient);
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co');
  });

  it('defaults the app URL when omitted', () => {
    expect(parseClientEnv(validClient).NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });

  it('fails fast when a required variable is missing', () => {
    expect(() => parseClientEnv({})).toThrow(/Invalid or missing/);
  });

  it('names the offending variable in the error', () => {
    expect(() => parseClientEnv({})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('rejects a malformed URL rather than accepting it silently', () => {
    expect(() => parseClientEnv({ ...validClient, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' })).toThrow(
      /Invalid or missing/,
    );
  });

  it('treats the service role key as optional but typed', () => {
    expect(parseServerEnv({ NODE_ENV: 'test' }).NODE_ENV).toBe('test');
  });
});
