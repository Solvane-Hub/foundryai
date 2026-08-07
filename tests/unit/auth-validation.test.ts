import { describe, expect, it } from 'vitest';
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validation/auth';

describe('signUpSchema', () => {
  const valid = {
    fullName: 'Ada Lovelace',
    email: 'ADA@Example.com',
    password: 'correct-horse-battery',
  };

  it('accepts valid input', () => {
    expect(signUpSchema.safeParse(valid).success).toBe(true);
  });

  it('normalises email to lowercase', () => {
    const parsed = signUpSchema.parse(valid);
    expect(parsed.email).toBe('ada@example.com');
  });

  it('trims the full name', () => {
    expect(signUpSchema.parse({ ...valid, fullName: '  Ada  ' }).fullName).toBe('Ada');
  });

  it('rejects a password under 12 characters', () => {
    const r = signUpSchema.safeParse({ ...valid, password: 'short123' });
    expect(r.success).toBe(false);
  });

  it('rejects a password over 72 bytes (bcrypt truncation boundary)', () => {
    const r = signUpSchema.safeParse({ ...valid, password: 'a'.repeat(73) });
    expect(r.success).toBe(false);
  });

  it('accepts a long passphrase without symbols — length over composition', () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: 'a quiet morning in nassau' }).success,
    ).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(signUpSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects a blank full name', () => {
    expect(signUpSchema.safeParse({ ...valid, fullName: '   ' }).success).toBe(false);
  });

  it('reports errors per field so the form can highlight them', () => {
    const r = signUpSchema.safeParse({ fullName: '', email: 'x', password: 'y' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = new Set(r.error.issues.map((i) => i.path[0]));
      expect(fields).toContain('fullName');
      expect(fields).toContain('email');
      expect(fields).toContain('password');
    }
  });
});

describe('signInSchema', () => {
  it('does not impose a length rule on sign-in passwords', () => {
    // Rejecting a short password at sign-in would leak that the policy changed,
    // and would lock out accounts created under an older policy.
    expect(signInSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('requires a password', () => {
    expect(signInSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const r = resetPasswordSchema.safeParse({
      password: 'a quiet morning in nassau',
      confirmPassword: 'a quiet morning in nassau',
    });
    expect(r.success).toBe(true);
  });

  it('rejects mismatched passwords against the confirm field', () => {
    const r = resetPasswordSchema.safeParse({
      password: 'a quiet morning in nassau',
      confirmPassword: 'a different passphrase',
    });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0]?.path[0]).toBe('confirmPassword');
  });
});

describe('requestPasswordResetSchema', () => {
  it('normalises email', () => {
    expect(requestPasswordResetSchema.parse({ email: '  A@B.COM ' }).email).toBe('a@b.com');
  });
});
