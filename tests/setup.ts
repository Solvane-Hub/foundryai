import '@testing-library/jest-dom/vitest';

/**
 * lib/env.ts validates configuration eagerly and throws at import time when
 * anything is missing — that is deliberate (fail fast at boot, not three layers
 * deep at runtime). The test environment therefore has to be configured like any
 * other environment. These are non-secret placeholders; nothing here reaches a
 * real Supabase project.
 */
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';
