import { z } from 'zod';

/**
 * Single validation layer (ADR-0005). These schemas are the versioned contract
 * for the auth Server Actions — Server Actions have no URL to version, so the
 * schema is the contract.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .max(254, 'That email address is too long.')
  .pipe(z.email('Enter a valid email address.'))
  .transform((v) => v.toLowerCase());

/**
 * Minimum 12 characters rather than the more common 8.
 *
 * NIST SP 800-63B favours length over composition rules, and this platform will
 * hold business and (later) funding information for founders in a jurisdiction
 * where credential reuse is common. Composition rules are deliberately NOT
 * imposed — they push users toward predictable substitutions without adding
 * meaningful entropy.
 */
export const passwordSchema = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(72, 'Use no more than 72 characters.'); // bcrypt truncates beyond 72 bytes

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, 'Enter your name.')
  .max(150, 'That name is too long.');

export const signUpSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.'),
});

export const requestPasswordResetSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Those passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
