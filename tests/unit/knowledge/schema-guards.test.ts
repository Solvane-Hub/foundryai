import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Static guards over the Knowledge Foundation migration.
 *
 * These assert the rules that are cheap to state and expensive to discover
 * later — a claim-level trust column added to `knowledge_chunks`, or a vector
 * column committed before KI1 is decided, would each be a migration to undo
 * across the whole corpus.
 */
const MIGRATION = 'supabase/migrations/20260808120000_knowledge_foundation.sql';
const sql = readFileSync(MIGRATION, 'utf8');

/** Body of a `create table public.<name> ( ... );` block. */
function tableBody(name: string): string {
  const start = sql.indexOf(`create table public.${name} (`);
  expect(start, `table ${name} must exist`).toBeGreaterThan(-1);
  const end = sql.indexOf('\n);', start);
  return sql.slice(start, end);
}

describe('KI1 / MP-1 remains open in the schema', () => {
  it('creates no vector column', () => {
    expect(/^\s*[a-z_]+\s+vector\s*\(/im.test(sql)).toBe(false);
  });

  it('does not enable pgvector', () => {
    expect(/^\s*create extension[^\n]*vector/im.test(sql)).toBe(false);
  });

  it('creates no vector index', () => {
    for (const idx of ['ivfflat', 'hnsw', 'vector_cosine_ops', 'vector_l2_ops']) {
      expect(sql.toLowerCase()).not.toContain(idx);
    }
  });

  it('names no embedding provider or model', () => {
    for (const vendor of [
      'openai',
      'nebius',
      'minimax',
      'cohere',
      'voyage',
      'text-embedding',
      'ada-002',
    ]) {
      expect(sql.toLowerCase()).not.toContain(vendor);
    }
  });

  it('records dimensions as data, not as a column type', () => {
    // This is what lets the manifest table exist while KI1 is open.
    expect(tableBody('knowledge_embedding_manifests')).toMatch(/dimensions\s+integer\s+not null/);
  });
});

describe('K3 §5.1 — chunks carry Source Authority only', () => {
  const chunks = tableBody('knowledge_chunks');

  it('stores Source Authority', () => {
    expect(chunks).toMatch(/source_authority\s+smallint\s+not null/);
  });

  it.each([
    'evidence_strength',
    'reasoning_confidence',
    'coverage_confidence',
    'trust_level',
    'trust_score',
  ])('has no %s column', (column) => {
    expect(chunks).not.toContain(column);
  });

  it('bounds Source Authority to the ratified 1–5 scale', () => {
    expect(chunks).toMatch(/source_authority between 1 and 5/);
  });
});

describe('chunk_id is the single citation identity', () => {
  const chunks = tableBody('knowledge_chunks');

  it('is the primary key', () => {
    expect(chunks).toMatch(/chunk_id\s+uuid primary key/);
  });

  it('has no random default — identity is derived, not minted', () => {
    expect(chunks).not.toMatch(/chunk_id\s+uuid primary key default/);
  });

  it('introduces no competing identifier', () => {
    for (const rival of ['passage_hash', 'retrieval_index', 'citation_id', 'evidence_id']) {
      expect(sql).not.toContain(rival);
    }
  });
});

describe('C1 regression — authority derives from the document, not the publisher', () => {
  it('constrains category to authority in the database', () => {
    const sources = tableBody('knowledge_sources');
    expect(sources).toMatch(/ks_authority_matches_category/);
    expect(sources).toMatch(/'official_guidance' and source_authority = 3/);
    expect(sources).toMatch(/'primary_legislation'\) and source_authority = 5/);
  });

  it('defines exactly six legal source categories and no sixth trust level', () => {
    const enumBlock = sql.slice(
      sql.indexOf('create type public.legal_source_category'),
      sql.indexOf(');', sql.indexOf('create type public.legal_source_category')),
    );
    const values = enumBlock.match(/'[a-z_]+'/g) ?? [];
    expect(values).toHaveLength(6);
  });
});

describe('K7 publication guarantees', () => {
  it('permits at most one published pack per jurisdiction', () => {
    expect(sql).toMatch(/unique index knowledge_packs_one_published_per_country/);
    expect(sql).toMatch(/where status = 'published'/);
  });

  it('publishes atomically through a single function', () => {
    expect(sql).toMatch(/create or replace function public\.publish_knowledge_pack/);
  });

  it('requires an approval record on a published pack', () => {
    expect(tableBody('knowledge_packs')).toMatch(/kp_published_has_approval/);
  });

  it('freezes published packs and their chunks', () => {
    expect(sql).toMatch(/create trigger knowledge_packs_immutability/);
    expect(sql).toMatch(/create trigger knowledge_chunks_immutability/);
  });
});

describe('unpublished content cannot enter retrieval', () => {
  it('every knowledge table enables AND forces RLS', () => {
    for (const table of [
      'knowledge_packs',
      'knowledge_sources',
      'knowledge_source_validations',
      'knowledge_chunks',
      'knowledge_chunk_relations',
      'knowledge_embedding_manifests',
    ]) {
      expect(sql).toMatch(new RegExp(`alter table public\\.${table}\\s+enable row level security`));
      expect(sql).toMatch(new RegExp(`alter table public\\.${table}\\s+force row level security`));
    }
  });

  it('scopes every authenticated read policy to published packs', () => {
    const policies = sql.match(/create policy [\s\S]*?;/g) ?? [];
    expect(policies.length).toBeGreaterThan(0);
    for (const policy of policies) {
      expect(policy).toMatch(/status = 'published'/);
    }
  });

  it('exposes no authenticated policy on operational tables', () => {
    // Validation records and embedding manifests are pipeline-internal.
    expect(sql).not.toMatch(/create policy[^;]*knowledge_source_validations[^;]*to authenticated/);
    expect(sql).not.toMatch(/create policy[^;]*knowledge_embedding_manifests[^;]*to authenticated/);
  });
});
