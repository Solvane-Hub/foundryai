import { z } from 'zod';

/**
 * Business validation contract (ADR-0005).
 *
 * `industry` is free text by design (schema-design.md D8): the industry taxonomy
 * belongs to the Knowledge Pack and varies by jurisdiction, so it must not be
 * frozen into an application-level enum.
 */
export const businessNameSchema = z
  .string()
  .trim()
  .min(1, 'Give your business a name.')
  .max(200, 'That name is too long.');

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, 'Select a country.');

export const industrySchema = z
  .string()
  .trim()
  .max(120, 'That industry name is too long.')
  .optional()
  .transform((v) => (v === '' ? undefined : v));

export const createBusinessSchema = z.object({
  name: businessNameSchema,
  countryCode: countryCodeSchema,
  industry: industrySchema,
});

export const updateBusinessSchema = z.object({
  businessId: z.uuid('Unknown business.'),
  name: businessNameSchema,
  industry: industrySchema,
});

export const archiveBusinessSchema = z.object({
  businessId: z.uuid('Unknown business.'),
});

export type CreateBusinessInput = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;
