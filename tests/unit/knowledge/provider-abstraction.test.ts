import { describe, expect, it } from 'vitest';
import {
  EmbeddingProviderNotConfiguredError,
  resolveEmbeddingProvider,
  type EmbeddingModelIdentity,
  type EmbeddingProvider,
} from '@/lib/ai/providers/embedding';
import {
  assertRetrievalResultValid,
  RetrievalIntegrityError,
  type RetrievalResult,
} from '@/lib/ai/retrieval/contract';

describe('embedding provider abstraction (ADR-0019) — KI1 still open', () => {
  it('throws rather than defaulting to a provider', () => {
    // A default would be a residency decision (MP-2) taken by accident.
    expect(() => resolveEmbeddingProvider()).toThrow(EmbeddingProviderNotConfiguredError);
  });

  it('explains that KI1/MP-1 is the blocker', () => {
    expect(() => resolveEmbeddingProvider()).toThrow(/KI1 \/ MP-1/);
  });

  it('accepts any adapter satisfying the contract', () => {
    const identity: EmbeddingModelIdentity = {
      provider: 'test-double',
      model: 'test-model',
      modelVersion: '0.0.0-test',
      dimensions: 8,
    };
    const stub: EmbeddingProvider = {
      describe: async () => identity,
      embed: async (req) => ({
        vectors: req.inputs.map((_, index) => ({ index, values: new Array(8).fill(0) })),
        identity,
        requestedAt: '2026-08-08T00:00:00.000Z',
      }),
    };
    expect(stub).toBeDefined();
  });

  it('reports model identity so an artifact can be replayed (K5 §3.8)', async () => {
    const identity: EmbeddingModelIdentity = {
      provider: 'test-double',
      model: 'test-model',
      modelVersion: '0.0.0-test',
      dimensions: 8,
    };
    const stub: EmbeddingProvider = {
      describe: async () => identity,
      embed: async () => ({ vectors: [], identity, requestedAt: '2026-08-08T00:00:00.000Z' }),
    };
    const described = await stub.describe();
    expect(described.dimensions).toBe(8);
    expect(described.modelVersion).toBe('0.0.0-test');
    // Reported by the provider, never assumed by the caller.
    expect((await stub.embed({ inputs: [], purpose: 'document' })).identity).toEqual(described);
  });

  it('names no real provider anywhere in the contract module', async () => {
    const src = await import('node:fs/promises').then((fs) =>
      fs.readFile('lib/ai/providers/embedding.ts', 'utf8'),
    );
    for (const vendor of ['openai', 'nebius', 'minimax', 'cohere', 'voyage', 'text-embedding']) {
      expect(src.toLowerCase()).not.toContain(vendor);
    }
  });
});

describe('retrieval contract (K5) — contract only in Phase 1', () => {
  const base: RetrievalResult = {
    chunks: [
      {
        chunkId: '55555555-5555-4555-8555-555555555555',
        knowledgeSourceId: 'src-1',
        body: 'SYNTHETIC',
        sectionReference: 'S1',
        sourceAuthority: 5,
        legalSourceCategory: 'primary_legislation',
        rank: 1,
        score: 0.9,
      },
    ],
    coverage: { emptyDomains: [], lowAuthorityDomains: [], exhaustedFilters: [] },
    reproducibility: {
      knowledgePackVersion: 'ZZ-v1.0',
      retrievalConfigVersion: 'rc-1',
      queryRepresentation: 'widget licensing',
      filters: { knowledgePackVersion: 'ZZ-v1.0' },
      rankingConfigVersion: 'rank-1',
      embeddingIdentity: null,
    },
    retrievedAt: '2026-08-08T00:00:00.000Z',
  };

  it('accepts a well-formed result', () => {
    expect(() => assertRetrievalResultValid(base)).not.toThrow();
  });

  it('rejects a chunk without chunk_id (K5 §3.10)', () => {
    const bad = { ...base, chunks: [{ ...base.chunks[0]!, chunkId: '' }] };
    expect(() => assertRetrievalResultValid(bad)).toThrow(/chunk_id is mandatory/);
  });

  it('rejects duplicate chunk_ids in one result set', () => {
    const bad = { ...base, chunks: [base.chunks[0]!, { ...base.chunks[0]!, rank: 2 }] };
    expect(() => assertRetrievalResultValid(bad)).toThrow(RetrievalIntegrityError);
  });

  it('rejects an unordered result set (K5 §3.8 — order is part of the contract)', () => {
    const bad = {
      ...base,
      chunks: [
        { ...base.chunks[0]!, rank: 2 },
        { ...base.chunks[0]!, chunkId: '66666666-6666-4666-8666-666666666666', rank: 1 },
      ],
    };
    expect(() => assertRetrievalResultValid(bad)).toThrow(/strictly ordered/);
  });

  it('rejects a run with no persisted replay inputs (K5 §12)', () => {
    const bad = {
      ...base,
      reproducibility: { ...base.reproducibility, retrievalConfigVersion: '' },
    };
    expect(() => assertRetrievalResultValid(bad)).toThrow(/not reproducible/);
  });

  it('carries Source Authority but no claim-level trust on a retrieved chunk', () => {
    const keys = Object.keys(base.chunks[0]!);
    expect(keys).toContain('sourceAuthority');
    for (const forbidden of [
      'evidenceStrength',
      'reasoningConfidence',
      'trustLevel',
      'trustScore',
    ]) {
      expect(keys).not.toContain(forbidden);
    }
  });

  it('allows a null embedding identity while KI1 is open', () => {
    expect(base.reproducibility.embeddingIdentity).toBeNull();
    expect(() => assertRetrievalResultValid(base)).not.toThrow();
  });
});
