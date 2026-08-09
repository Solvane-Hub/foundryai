import type { KnowledgeSource, LegalSourceCategory, ValidationOutcome } from '@/types/knowledge';
import { AUTHORITY_BY_CATEGORY, CATEGORY_PRECEDENCE } from '@/types/knowledge';

/**
 * K2 validation boundary.
 *
 * ⚠ This produces Source Authority confirmation ONLY. It never assigns a Trust
 * Level, an Evidence Strength or a Reasoning Confidence: those are claim-level
 * and are derived by the Trust Layer once a claim exists (ADR-0015, K3 §5.1).
 *
 * Pure functions — no I/O — so the rules are testable without a database.
 */

export interface ValidationChecks {
  /** The source exists, is reachable and is authoritative (K2 §6). */
  sourceValid: boolean;
  /** The document parsed into the expected structure. */
  structureValid: boolean;
  /** Required K4 §5 metadata is present. */
  metadataValid: boolean;
  /** Citation location is precise enough to reproduce (K2 §4.3). */
  provenanceValid: boolean;
  /** Legal source category and derived authority agree (K2 §8.1). */
  classificationValid: boolean;
}

export interface ValidationResult {
  outcome: ValidationOutcome;
  checks: ValidationChecks;
  failureReasons: string[];
}

export interface ValidationCandidate {
  agency: string;
  title: string;
  sourceUrl: string | null;
  sourceAuthority: number;
  legalSourceCategory: LegalSourceCategory;
  publicationDate: string | null;
  lastReviewedDate: string | null;
  sectionReferencePresent: boolean;
  bodyLength: number;
}

/** K2 §8.1 — authority derives from the document's legal category. */
export function classificationMatches(category: LegalSourceCategory, authority: number): boolean {
  return (AUTHORITY_BY_CATEGORY[category] as readonly number[]).includes(authority);
}

/**
 * K2 §8.2 conflict ordering: Source Authority, then the finer Legal Source
 * Category within a level, then recency. Returns < 0 when `a` prevails.
 *
 * The category tiebreak is why the six categories were kept as metadata (A4):
 * a Constitution outranks an ordinary Act although both are Authority 5, and
 * that distinction matters legally.
 */
export function compareSourcePrecedence(
  a: Pick<KnowledgeSource, 'source_authority' | 'legal_source_category' | 'publication_date'>,
  b: Pick<KnowledgeSource, 'source_authority' | 'legal_source_category' | 'publication_date'>,
): number {
  if (a.source_authority !== b.source_authority) return b.source_authority - a.source_authority;
  const ai = CATEGORY_PRECEDENCE.indexOf(a.legal_source_category);
  const bi = CATEGORY_PRECEDENCE.indexOf(b.legal_source_category);
  if (ai !== bi) return ai - bi;
  return (b.publication_date ?? '').localeCompare(a.publication_date ?? '');
}

/**
 * Run the K2 §6 checks.
 *
 * Fails closed: anything short of every check passing is withheld or downgraded,
 * never published as verified (K2 §4.5 — uncertainty must never be hidden).
 */
export function validateSource(candidate: ValidationCandidate): ValidationResult {
  const failureReasons: string[] = [];

  const sourceValid = candidate.agency.trim().length > 0 && candidate.title.trim().length > 0;
  if (!sourceValid) failureReasons.push('K2 §6: issuing agency and document title are required.');

  const structureValid = candidate.bodyLength > 0;
  if (!structureValid) failureReasons.push('K2 §6: source produced no extractable content.');

  const metadataValid = candidate.publicationDate !== null;
  if (!metadataValid) failureReasons.push('K4 §5: publication date is required metadata.');

  // A source with no URL and no section reference cannot be independently
  // re-checked by a reviewer, which is the whole point of K2 §4.4.
  const provenanceValid = candidate.sectionReferencePresent || candidate.sourceUrl !== null;
  if (!provenanceValid) {
    failureReasons.push(
      'K2 §4.3/§4.4: a citation must be precise enough for another reviewer to locate the passage.',
    );
  }

  const classificationValid = classificationMatches(
    candidate.legalSourceCategory,
    candidate.sourceAuthority,
  );
  if (!classificationValid) {
    failureReasons.push(
      `K2 §8.1: Source Authority ${candidate.sourceAuthority} is not derivable from category '${candidate.legalSourceCategory}'.`,
    );
  }

  const checks: ValidationChecks = {
    sourceValid,
    structureValid,
    metadataValid,
    provenanceValid,
    classificationValid,
  };

  return { outcome: deriveOutcome(checks), checks, failureReasons };
}

/**
 * K2 §9 outcomes.
 *
 * A classification failure is `rejected`, not `unverified`: a wrong authority
 * level is evidence that contradicts the extracted claim about the document,
 * and it is the failure that could otherwise reach 🟢 VERIFIED.
 */
export function deriveOutcome(checks: ValidationChecks): ValidationOutcome {
  if (!checks.classificationValid) return 'rejected';
  if (!checks.sourceValid || !checks.structureValid) return 'unverified';
  if (!checks.provenanceValid) return 'unverified';
  if (!checks.metadataValid) return 'partially_validated';
  return 'validated';
}

/** K7 §6 — only these outcomes may proceed to publication. */
export function mayPublish(outcome: ValidationOutcome): boolean {
  return outcome === 'validated' || outcome === 'partially_validated';
}
