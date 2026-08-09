import type { LegalSourceCategory, SourceAuthority } from '@/types/knowledge';
import type { EmbeddingModelIdentity } from '@/lib/ai/providers/embedding';

/**
 * Retrieval contract — K5.
 *
 * ⚠ CONTRACT ONLY. No semantic search is implemented in Phase 1, and no
 *   competing retrieval architecture is introduced. K5 owns retrieval; this file
 *   expresses K5's pipeline in types so the eventual implementation has a shape
 *   to satisfy.
 *
 * K5 §4 pipeline: context resolution → jurisdiction → industry → domain →
 * metadata filters → semantic search → trust filtering → ranking → assembly.
 * Deterministic filters run BEFORE semantic search (K5 §3.7).
 */

/** K5 §5. Retrieval never runs without an established context. */
export interface RetrievalContext {
  /** K5 §3.2 jurisdiction isolation — mandatory, never inferred. */
  countryCode: string;
  region?: string | null;
  municipality?: string | null;
  industry?: string | null;
  regulatoryDomains?: readonly string[];
}

/** K5 §6. Applied deterministically before ranking. */
export interface DeterministicFilters {
  knowledgePackVersion: string;
  regulatoryDomains?: readonly string[];
  /** Requirements in force on this date. */
  effectiveOn?: string;
  /** K5 §10 — Authority 1 sources are excluded from compliance retrieval. */
  minimumSourceAuthority?: SourceAuthority;
}

/**
 * Everything that must be fixed for K5 §3.8 deterministic reproducibility.
 * Persisted per run (K5 §12): without these a historical retrieval cannot be
 * replayed, only approximated.
 */
export interface RetrievalReproducibilityInputs {
  knowledgePackVersion: string;
  retrievalConfigVersion: string;
  queryRepresentation: string;
  filters: DeterministicFilters;
  rankingConfigVersion: string;
  /** Null until KI1 is decided. Non-null once vectors participate in ranking. */
  embeddingIdentity: EmbeddingModelIdentity | null;
}

/**
 * A retrieved chunk.
 *
 * ⚠ Carries Source Authority ONLY (K5 §3.4, K3 §5.1). Evidence Strength,
 * Reasoning Confidence, Trust Level and Trust Score are absent by design — they
 * do not exist until a claim is evaluated against a passage.
 */
export interface RetrievedChunk {
  /** MANDATORY (K5 §3.10). A result without this is invalid and must be rejected. */
  chunkId: string;
  knowledgeSourceId: string;
  body: string;
  sectionReference: string | null;
  sourceAuthority: SourceAuthority;
  legalSourceCategory: LegalSourceCategory;
  /** Why this ranked where it did (K5 §3.5 explainability). */
  rank: number;
  score: number | null;
}

/**
 * K5 §10 — retrieval REPORTS; the Coordinator DECIDES.
 * Nothing in this type may trigger a founder-facing question (A8).
 */
export interface CoverageSignal {
  /** Domains expected by the Coordinator that returned nothing. */
  emptyDomains: readonly string[];
  /** Domains whose best available evidence is below Authority 4. */
  lowAuthorityDomains: readonly string[];
  /** Filters that removed every candidate. */
  exhaustedFilters: readonly string[];
}

/** K5 §11 context assembly. Ordered — the order is part of the result (§3.8). */
export interface RetrievalResult {
  chunks: readonly RetrievedChunk[];
  coverage: CoverageSignal;
  reproducibility: RetrievalReproducibilityInputs;
  retrievedAt: string;
}

export interface RetrievalQuery {
  context: RetrievalContext;
  filters: DeterministicFilters;
  /** Structured, from the Business Profile. Never raw conversation (ADR-0017). */
  queryRepresentation: string;
  topK: number;
}

export interface RetrievalEngine {
  retrieve(query: RetrievalQuery): Promise<RetrievalResult>;
}

export class RetrievalIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetrievalIntegrityError';
  }
}

/**
 * Reject a malformed result set before an agent ever sees it.
 *
 * Fails closed. A chunk without a `chunk_id` cannot be cited or verified, so
 * passing it to an agent would create a claim that can never be grounded.
 */
export function assertRetrievalResultValid(result: RetrievalResult): void {
  const missing = result.chunks.filter((c) => !c.chunkId);
  if (missing.length > 0) {
    throw new RetrievalIntegrityError(
      `K5 §3.10: ${missing.length} retrieved chunk(s) have no chunk_id. chunk_id is mandatory on every result.`,
    );
  }
  const ids = new Set(result.chunks.map((c) => c.chunkId));
  if (ids.size !== result.chunks.length) {
    throw new RetrievalIntegrityError('K5 §3.10: duplicate chunk_id in a single retrieval result.');
  }
  const ranks = result.chunks.map((c) => c.rank);
  const ordered = ranks.every((r, i) => i === 0 || r > ranks[i - 1]!);
  if (!ordered) {
    throw new RetrievalIntegrityError(
      'K5 §3.8: results must be strictly ordered — the ordered set is part of the reproducibility contract.',
    );
  }
  if (
    !result.reproducibility.knowledgePackVersion ||
    !result.reproducibility.retrievalConfigVersion
  ) {
    throw new RetrievalIntegrityError(
      'K5 §12: a retrieval run without persisted replay inputs is not reproducible and must not be represented as such.',
    );
  }
}
