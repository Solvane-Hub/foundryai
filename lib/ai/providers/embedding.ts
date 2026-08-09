/**
 * Embedding provider capability — ADR-0019.
 *
 * ⚠ KI1 / MP-1 IS OPEN. No provider, model or dimensionality is chosen here, and
 *   no implementation of this interface exists yet. This file defines the shape
 *   an eventual adapter must satisfy so that the decision, when taken, is a new
 *   file in this directory rather than a change across the codebase.
 *
 * ADR-0019: callers request a CAPABILITY TIER, never a model name. Everything
 * model-specific is reported BY the provider, not requested FROM it — which is
 * what lets the retrieval layer record what actually produced a vector rather
 * than what it assumed would.
 *
 * Layer note: `lib/ai/**` must not import `lib/db` or `services` (ESLint-enforced,
 * Engineering Standards §8). This file is types only.
 */

/** Identity of the model that produced a vector. Required for K5 §3.8 replay. */
export interface EmbeddingModelIdentity {
  provider: string;
  model: string;
  /** Same model, different version, different vectors. Must be pinned. */
  modelVersion: string;
  /** A column type downstream — see K7 §3.1. Reported, never assumed. */
  dimensions: number;
}

export interface EmbeddingRequest {
  inputs: readonly string[];
  /** 'document' when embedding chunks, 'query' at retrieval time. */
  purpose: 'document' | 'query';
  /** Propagated for tracing (ADR-0014). */
  correlationId?: string;
}

export interface EmbeddingVector {
  /** Index into the originating `inputs` array. */
  index: number;
  values: readonly number[];
}

export interface EmbeddingResponse {
  vectors: readonly EmbeddingVector[];
  /** What actually produced these vectors. Persisted into the manifest (K7 §7). */
  identity: EmbeddingModelIdentity;
  /** Reproducibility metadata — K5 §3.8, §12. */
  requestedAt: string;
  /** Provider-reported usage, where available. Advisory only. */
  usage?: { inputTokens?: number };
}

/**
 * The capability an adapter implements.
 *
 * `describe()` is separate from `embed()` on purpose: the publishing pipeline
 * must be able to record dimensions in the manifest (K7 §7) and validate the
 * vector column width BEFORE spending a full corpus embedding run.
 */
export interface EmbeddingProvider {
  describe(): Promise<EmbeddingModelIdentity>;
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

/** Thrown when embedding is attempted while KI1 is unresolved. */
export class EmbeddingProviderNotConfiguredError extends Error {
  constructor() {
    super(
      'No embedding provider is configured. KI1 / MP-1 (embedding model, version and dimensionality) ' +
        'is an open founder decision; MP-2 (data residency) gates it. See DOCUMENT_MANIFEST.md.',
    );
    this.name = 'EmbeddingProviderNotConfiguredError';
  }
}

/**
 * Resolve the configured provider.
 *
 * Deliberately always throws. This is the seam a future adapter plugs into, and
 * an explicit failure is safer than a default that quietly selects a provider —
 * which would be a residency decision (MP-2) taken by accident.
 */
export function resolveEmbeddingProvider(): EmbeddingProvider {
  throw new EmbeddingProviderNotConfiguredError();
}
