/** SYNTHETIC fixtures that MUST be rejected. See README.md. */
import { syntheticRegistration } from './synthetic-source';

/** C1 regression: official guidance can never be Authority 5. */
export const guidanceClaimingAuthorityFive = {
  ...syntheticRegistration,
  legalSourceCategory: 'official_guidance' as const,
  sourceAuthority: 5,
};

/** K2 §8.1: a regulation is Authority 4, not 5. */
export const regulationClaimingAuthorityFive = {
  ...syntheticRegistration,
  legalSourceCategory: 'regulation' as const,
  sourceAuthority: 5,
};

/** K4 §5: publication date is required metadata. */
export const missingPublicationDate = {
  ...syntheticRegistration,
  publicationDate: null,
};

/** Dates out of order. */
export const invertedDates = {
  ...syntheticRegistration,
  effectiveDate: '2025-01-01',
  expiryDate: '2024-01-01',
};

/** K3 §5.1: claim-level trust must never arrive on a chunk. */
export const chunkWithClaimLevelTrust = {
  chunkIndex: 0,
  body: 'SYNTHETIC PLACEHOLDER TEXT',
  sectionReference: 'Section 1',
  trust_score: 92,
  evidence_strength: 5,
};
