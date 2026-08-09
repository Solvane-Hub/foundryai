import type { KnowledgeChunk, KnowledgeSource } from '@/types/knowledge';

/**
 * The canonical citation object — Trust Layer §8.
 *
 * ⚠ This file is the ONLY place the citation shape is expressed in code. K4 §6
 * references Trust Layer §8 rather than restating it, and so does this. Conflict
 * C3 arose from two documents describing one citation shape; a second builder
 * here would recreate it in TypeScript.
 *
 * `chunk_id` is MANDATORY. It is the only field that proves a cited passage was
 * actually retrieved in the current run. A citation naming a real document that
 * retrieval never returned is fabrication, and `chunk_id` is what detects it.
 */
export interface Citation {
  /** MANDATORY — retrieval identity. Binds the claim to the exact chunk. */
  chunk_id: string;
  agency: string;
  document: string;
  section: string | null;
  publication_date: string | null;
  last_reviewed_date: string | null;
  knowledge_version: string;
  url: string | null;
  accessed_at: string | null;
  /** Optional, retained from K4 — aids human verification. */
  clause?: string | null;
  page?: number | null;
}

export class CitationIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CitationIntegrityError';
  }
}

/**
 * Build a citation from a retrieved chunk and its source.
 *
 * `knowledgeVersion` is passed explicitly rather than read from the chunk row:
 * a citation records the Pack version of the RUN that produced it, and taking
 * it from anywhere else would let a replay silently re-label old evidence.
 */
export function buildCitation(params: {
  chunk: Pick<KnowledgeChunk, 'chunk_id' | 'section_reference' | 'clause' | 'page'>;
  source: Pick<
    KnowledgeSource,
    'agency' | 'title' | 'source_url' | 'publication_date' | 'last_reviewed_date' | 'accessed_at'
  >;
  knowledgeVersion: string;
}): Citation {
  const { chunk, source, knowledgeVersion } = params;
  if (!chunk.chunk_id) {
    throw new CitationIntegrityError(
      'Trust Layer §8: chunk_id is mandatory. A citation without it cannot be bound to a retrieval run.',
    );
  }
  if (!knowledgeVersion) {
    throw new CitationIntegrityError('Trust Layer §8: knowledge_version is mandatory.');
  }
  return {
    chunk_id: chunk.chunk_id,
    agency: source.agency,
    document: source.title,
    section: chunk.section_reference,
    publication_date: source.publication_date,
    last_reviewed_date: source.last_reviewed_date,
    knowledge_version: knowledgeVersion,
    url: source.source_url,
    accessed_at: source.accessed_at,
    clause: chunk.clause,
    page: chunk.page,
  };
}

/**
 * Evidence binding (ADR-0017): every cited `chunk_id` must have been returned by
 * THIS run's retrieval. Fails closed — an unverifiable citation is worse than none.
 */
export function assertCitationsGrounded(
  citations: readonly Citation[],
  retrievedChunkIds: readonly string[],
): void {
  const retrieved = new Set(retrievedChunkIds);
  const ungrounded = citations.filter((c) => !retrieved.has(c.chunk_id)).map((c) => c.chunk_id);
  if (ungrounded.length > 0) {
    throw new CitationIntegrityError(
      `ADR-0017: ${ungrounded.length} citation(s) reference chunks not returned by this retrieval run: ${ungrounded.join(', ')}`,
    );
  }
}
