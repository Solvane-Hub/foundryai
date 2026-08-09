import { describe, expect, it } from 'vitest';
import { ChunkingError, prepareChunks } from '@/services/knowledge/chunking';
import { assertNoClaimLevelTrust } from '@/lib/validation/knowledge';
import { FORBIDDEN_CHUNK_TRUST_FIELDS } from '@/types/knowledge';
import {
  SYNTHETIC_KNOWLEDGE_VERSION,
  syntheticDraftChunks,
  syntheticSourceRow,
} from '@/tests/fixtures/knowledge/synthetic-source';
import { chunkWithClaimLevelTrust } from '@/tests/fixtures/knowledge/invalid-sources';

const source = syntheticSourceRow;

function prepare(drafts: readonly unknown[]) {
  return prepareChunks({ source, knowledgeVersion: SYNTHETIC_KNOWLEDGE_VERSION, drafts });
}

describe('K3 chunk preparation', () => {
  it('derives a chunk_id for every chunk', () => {
    const chunks = prepare(syntheticDraftChunks);
    expect(chunks).toHaveLength(2);
    for (const c of chunks) expect(c.chunk_id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('is idempotent — re-preparing yields identical ids', () => {
    // ADR-0016 makes retries normal operation. If this fails, a retried
    // ingestion step orphans every citation the first attempt issued.
    expect(prepare(syntheticDraftChunks).map((c) => c.chunk_id)).toEqual(
      prepare(syntheticDraftChunks).map((c) => c.chunk_id),
    );
  });

  it('propagates source-level provenance onto each chunk', () => {
    const [first] = prepare(syntheticDraftChunks);
    expect(first).toBeDefined();
    expect(first!.knowledge_source_id).toBe(source.id);
    expect(first!.knowledge_pack_id).toBe(source.knowledge_pack_id);
    expect(first!.country_code).toBe(source.country_code);
    expect(first!.section_reference).toBe('Section 4');
    expect(first!.clause).toBe('4(1)');
    expect(first!.page).toBe(3);
  });

  it('carries Source Authority and Legal Source Category from the source', () => {
    const [first] = prepare(syntheticDraftChunks);
    expect(first!.source_authority).toBe(5);
    expect(first!.legal_source_category).toBe('primary_legislation');
  });

  it('NEVER emits claim-level trust fields (K3 §5.1)', () => {
    // The load-bearing assertion of this suite. A chunk has no claim to be
    // strong evidence *for*; the same chunk can be Evidence Strength 5 for one
    // claim and 2 for another.
    for (const chunk of prepare(syntheticDraftChunks)) {
      for (const forbidden of FORBIDDEN_CHUNK_TRUST_FIELDS) {
        expect(Object.keys(chunk)).not.toContain(forbidden);
      }
    }
  });

  it('refuses a draft carrying claim-level trust rather than silently stripping it', () => {
    // Zod strips unknown keys. Silence is how these fields get added by accident.
    expect(() => prepare([chunkWithClaimLevelTrust])).toThrow(/K3 §5.1/);
  });

  it('rejects every forbidden key individually', () => {
    for (const key of FORBIDDEN_CHUNK_TRUST_FIELDS) {
      expect(() => assertNoClaimLevelTrust({ [key]: 1 })).toThrow(/claim-level trust/);
    }
  });

  it('accepts a clean object', () => {
    expect(() => assertNoClaimLevelTrust({ body: 'x', source_authority: 5 })).not.toThrow();
  });

  it('rejects duplicate chunk indices within one source', () => {
    expect(() =>
      prepare([
        { chunkIndex: 0, body: 'a', sectionReference: 'S1' },
        { chunkIndex: 0, body: 'b', sectionReference: 'S2' },
      ]),
    ).toThrow(ChunkingError);
  });

  it('rejects an empty body', () => {
    expect(() => prepare([{ chunkIndex: 0, body: '' }])).toThrow(ChunkingError);
  });

  it('gives different ids to different chunks of the same source', () => {
    const ids = prepare(syntheticDraftChunks).map((c) => c.chunk_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('computes a content hash distinct from the identity', () => {
    const [first] = prepare(syntheticDraftChunks);
    expect(first!.content_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(first!.content_hash).not.toBe(first!.chunk_id);
  });
});
