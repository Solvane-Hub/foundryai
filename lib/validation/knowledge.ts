import { z } from 'zod';
import type { SourceAuthority } from '@/types/knowledge';
import { AUTHORITY_BY_CATEGORY } from '@/types/knowledge';

/**
 * Knowledge validation schemas — K2 §6, K4 §5, K4 §9.
 *
 * Validation is a boundary, not a formality: K7 §6's quality gate does not warn,
 * it stops. These schemas are that gate expressed in code.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be an ISO date (YYYY-MM-DD)');

export const legalSourceCategorySchema = z.enum([
  'constitution',
  'primary_legislation',
  'regulation',
  'ministerial_order',
  'official_guidance',
  'agency_publication',
]);

export const knowledgeSourceTypeSchema = z.enum([
  'act',
  'regulation',
  'statutory_instrument',
  'gazette_notice',
  'guidance_note',
  'agency_page',
  'form',
  'fee_schedule',
]);

/** K1 §3 — jurisdiction-scoped version identity, e.g. 'BS-v1.4'. */
export const knowledgeVersionSchema = z
  .string()
  .regex(/^[A-Z]{2}-v\d+\.\d+$/, "Knowledge Pack version must look like 'BS-v1.4'");

export const sourceAuthoritySchema = z
  .number()
  .int()
  .min(1, 'Source Authority is 1–5 (ADR-0015)')
  .max(5, 'Source Authority is 1–5 (ADR-0015)')
  // Narrowed after the range checks have run, so the rest of the codebase gets
  // the ratified 1–5 union rather than an open `number`. Written as a transform
  // rather than a literal union to keep the range error message readable.
  .transform((v): SourceAuthority => v as SourceAuthority);

/**
 * Source registration — K1 §4, K4 §5.
 *
 * The category↔authority refinement is the important line in this file. C1 was
 * caused by authority being assignable from the publisher rather than derived
 * from the document; permitting a free-typed authority here would reopen it and
 * make 🟢 VERIFIED reachable from official guidance.
 */
export const registerSourceSchema = z
  .object({
    knowledgePackId: z.uuid(),
    agency: z.string().min(1).max(200),
    title: z.string().min(1).max(500),
    sourceUrl: z.url().nullable().optional(),
    sourceType: knowledgeSourceTypeSchema,
    countryCode: z
      .string()
      .length(2)
      .regex(/^[A-Z]{2}$/),
    region: z.string().max(200).nullable().optional(),
    municipality: z.string().max(200).nullable().optional(),
    sourceAuthority: sourceAuthoritySchema,
    legalSourceCategory: legalSourceCategorySchema,
    publicationDate: isoDate.nullable().optional(),
    effectiveDate: isoDate.nullable().optional(),
    expiryDate: isoDate.nullable().optional(),
    lastReviewedDate: isoDate.nullable().optional(),
    accessedAt: z.iso.datetime().nullable().optional(),
    contentMediaType: z.string().max(120).nullable().optional(),
  })
  .refine(
    (v) =>
      (AUTHORITY_BY_CATEGORY[v.legalSourceCategory] as readonly number[]).includes(
        v.sourceAuthority,
      ),
    {
      path: ['sourceAuthority'],
      message:
        'Source Authority must be derived from the legal source category (K2 §8.1). Authority is a property of the document, not the publisher.',
    },
  )
  .refine((v) => !v.effectiveDate || !v.expiryDate || v.effectiveDate <= v.expiryDate, {
    path: ['expiryDate'],
    message: 'Effective date must not fall after the expiry date.',
  });

export type RegisterSourceInput = z.infer<typeof registerSourceSchema>;

/** K3 §5 — the ingestion-time shape of a chunk, before an id is derived. */
export const draftChunkSchema = z.object({
  chunkIndex: z.number().int().min(0),
  title: z.string().max(300).nullable().optional(),
  body: z.string().min(1, 'A chunk must have a body'),
  sectionReference: z.string().max(200).nullable().optional(),
  clause: z.string().max(100).nullable().optional(),
  page: z.number().int().positive().nullable().optional(),
  industry: z.string().max(120).nullable().optional(),
  regulatoryDomain: z.string().max(120).nullable().optional(),
  keywords: z.array(z.string().max(80)).max(50).optional(),
  effectiveDate: isoDate.nullable().optional(),
});

export type DraftChunkInput = z.infer<typeof draftChunkSchema>;

/**
 * ⚠ Guard against claim-level trust arriving on a chunk (K3 §5.1).
 *
 * Zod strips unknown keys rather than rejecting them, so a caller passing
 * `trust_score` would be silently ignored — and silence is how these fields get
 * added by accident. This checks explicitly and refuses.
 */
export const CLAIM_LEVEL_TRUST_KEYS = [
  'evidence_strength',
  'evidenceStrength',
  'reasoning_confidence',
  'reasoningConfidence',
  'coverage_confidence',
  'coverageConfidence',
  'trust_level',
  'trustLevel',
  'trust_score',
  'trustScore',
] as const;

export function assertNoClaimLevelTrust(candidate: Record<string, unknown>): void {
  const found = CLAIM_LEVEL_TRUST_KEYS.filter((k) => k in candidate);
  if (found.length > 0) {
    throw new Error(
      `K3 §5.1: claim-level trust must never be stored on a chunk (found: ${found.join(', ')}). ` +
        'A chunk has no claim to be strong evidence for — the same chunk can be Evidence Strength 5 ' +
        'for one claim and 2 for another. These dimensions are derived per claim by the Trust Layer.',
    );
  }
}
