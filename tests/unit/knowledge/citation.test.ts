import { describe, expect, it } from 'vitest';
import {
  assertCitationsGrounded,
  buildCitation,
  CitationIntegrityError,
} from '@/lib/knowledge/citation';
import {
  SYNTHETIC_KNOWLEDGE_VERSION,
  syntheticSourceRow,
} from '@/tests/fixtures/knowledge/synthetic-source';

const chunk = {
  chunk_id: '33333333-3333-4333-8333-333333333333',
  section_reference: 'Section 4',
  clause: '4(1)',
  page: 3,
};

const args = {
  chunk,
  source: syntheticSourceRow,
  knowledgeVersion: SYNTHETIC_KNOWLEDGE_VERSION,
};

describe('canonical citation object (Trust Layer §8)', () => {
  it('includes every mandatory field', () => {
    const c = buildCitation(args);
    for (const field of [
      'chunk_id',
      'agency',
      'document',
      'section',
      'publication_date',
      'last_reviewed_date',
      'knowledge_version',
      'url',
      'accessed_at',
    ]) {
      expect(c).toHaveProperty(field);
    }
  });

  it('carries chunk_id as the retrieval identity', () => {
    expect(buildCitation(args).chunk_id).toBe(chunk.chunk_id);
  });

  it('retains K4’s optional clause and page', () => {
    const c = buildCitation(args);
    expect(c.clause).toBe('4(1)');
    expect(c.page).toBe(3);
  });

  it('refuses to build a citation without chunk_id', () => {
    expect(() => buildCitation({ ...args, chunk: { ...chunk, chunk_id: '' } })).toThrow(
      CitationIntegrityError,
    );
  });

  it('refuses to build a citation without a knowledge version', () => {
    expect(() => buildCitation({ ...args, knowledgeVersion: '' })).toThrow(CitationIntegrityError);
  });

  it('takes the knowledge version from the run, not the source row', () => {
    // A replay must not silently re-label old evidence with today's version.
    expect(buildCitation({ ...args, knowledgeVersion: 'ZZ-v9.9' }).knowledge_version).toBe(
      'ZZ-v9.9',
    );
  });

  it('defines no competing identity field', () => {
    const keys = Object.keys(buildCitation(args));
    for (const rival of ['citation_id', 'evidence_id', 'passage_hash', 'retrieval_index']) {
      expect(keys).not.toContain(rival);
    }
  });
});

describe('evidence binding (ADR-0017)', () => {
  it('accepts citations grounded in this run', () => {
    const c = buildCitation(args);
    expect(() => assertCitationsGrounded([c], [chunk.chunk_id])).not.toThrow();
  });

  it('rejects a citation naming a chunk this run never retrieved', () => {
    // A real document cited from a chunk that was not retrieved is fabrication,
    // and chunk_id is the only field that can detect it.
    const c = buildCitation(args);
    expect(() => assertCitationsGrounded([c], ['44444444-4444-4444-8444-444444444444'])).toThrow(
      /not returned by this retrieval run/,
    );
  });

  it('rejects when retrieval returned nothing at all', () => {
    expect(() => assertCitationsGrounded([buildCitation(args)], [])).toThrow(
      CitationIntegrityError,
    );
  });

  it('passes trivially for a claim with no citations', () => {
    expect(() => assertCitationsGrounded([], [])).not.toThrow();
  });
});
