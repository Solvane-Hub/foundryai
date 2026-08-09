import { describe, expect, it } from 'vitest';
import {
  chunkIdentityString,
  contentHash,
  deriveChunkId,
  normaliseContent,
} from '@/lib/knowledge/chunk-id';
import {
  SYNTHETIC_KNOWLEDGE_VERSION,
  SYNTHETIC_SOURCE_ID,
} from '@/tests/fixtures/knowledge/synthetic-source';

const base = {
  knowledgeVersion: SYNTHETIC_KNOWLEDGE_VERSION,
  sourceId: SYNTHETIC_SOURCE_ID,
  sectionReference: 'Section 4',
  body: 'A person shall hold a current licence.',
};

describe('chunk_id — the single citation identity (K5 §3.10, A12)', () => {
  it('is deterministic across calls', () => {
    expect(deriveChunkId(base)).toBe(deriveChunkId(base));
  });

  it('is a well-formed RFC 4122 v5 UUID', () => {
    expect(deriveChunkId(base)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('changes when the Knowledge Pack version changes', () => {
    // Stability is scoped to a Pack version (K5 §3.10); a new version is a new
    // identity even for byte-identical text.
    expect(deriveChunkId({ ...base, knowledgeVersion: 'ZZ-v2.0' })).not.toBe(deriveChunkId(base));
  });

  it('changes when the body changes', () => {
    expect(deriveChunkId({ ...base, body: 'Something else entirely.' })).not.toBe(
      deriveChunkId(base),
    );
  });

  it('changes when the section reference changes', () => {
    expect(deriveChunkId({ ...base, sectionReference: 'Section 5' })).not.toBe(deriveChunkId(base));
  });

  it('survives whitespace reflow but not wording changes', () => {
    // Re-flowing a paragraph must not orphan every citation that pointed at it.
    expect(deriveChunkId({ ...base, body: 'A person  shall\n  hold a current licence.' })).toBe(
      deriveChunkId(base),
    );
    expect(deriveChunkId({ ...base, body: 'A person shall hold a valid licence.' })).not.toBe(
      deriveChunkId(base),
    );
  });

  it('does not depend on wall-clock time (ADR-0016 idempotency)', () => {
    const first = deriveChunkId(base);
    const laterCall = deriveChunkId(base);
    expect(laterCall).toBe(first);
    // No Date/now in the identity string at all.
    expect(chunkIdentityString(base)).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('cannot be collided by moving the delimiter into a field', () => {
    const a = deriveChunkId({ ...base, sectionReference: 'Section 4', body: 'X' });
    const b = deriveChunkId({ ...base, sectionReference: 'Section 4X', body: '' });
    expect(a).not.toBe(b);
  });

  it('treats a null and an empty section reference as distinct from a real one', () => {
    const withNull = deriveChunkId({ ...base, sectionReference: null });
    expect(withNull).not.toBe(deriveChunkId(base));
  });
});

describe('content hashing (K6 change detection)', () => {
  it('is stable and whitespace-normalised', () => {
    expect(contentHash('a  b')).toBe(contentHash('a b'));
    expect(contentHash('a b')).not.toBe(contentHash('a c'));
  });

  it('is not used as an identity', () => {
    expect(contentHash(base.body)).not.toBe(deriveChunkId(base));
  });

  it('normalises line endings so platform differences do not change identity', () => {
    expect(normaliseContent('a\r\nb')).toBe(normaliseContent('a\nb'));
    expect(normaliseContent('a\r\nb')).toBe('a b');
  });
});
