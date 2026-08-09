import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { KnowledgeSource, SourceAuthority, ValidationOutcome } from '@/types/knowledge';

type Db = SupabaseClient<Database>;

export interface InsertSourceValues {
  knowledge_pack_id: string;
  agency: string;
  title: string;
  source_url: string | null;
  source_type: KnowledgeSource['source_type'];
  country_code: string;
  region: string | null;
  municipality: string | null;
  source_authority: SourceAuthority;
  legal_source_category: KnowledgeSource['legal_source_category'];
  publication_date: string | null;
  effective_date: string | null;
  expiry_date: string | null;
  last_reviewed_date: string | null;
  accessed_at: string | null;
  content_hash: string | null;
  content_media_type: string | null;
}

export async function insertSource(
  db: Db,
  values: InsertSourceValues,
): Promise<{ data: KnowledgeSource | null; error: string | null }> {
  const { data, error } = await db.from('knowledge_sources').insert(values).select('*').single();
  return { data: (data as KnowledgeSource | null) ?? null, error: error?.message ?? null };
}

export async function findSourceById(db: Db, id: string): Promise<KnowledgeSource | null> {
  const { data } = await db.from('knowledge_sources').select('*').eq('id', id).maybeSingle();
  return (data as KnowledgeSource | null) ?? null;
}

export async function listSourcesForPack(db: Db, packId: string): Promise<KnowledgeSource[]> {
  const { data } = await db
    .from('knowledge_sources')
    .select('*')
    .eq('knowledge_pack_id', packId)
    .order('created_at', { ascending: true });
  return (data as KnowledgeSource[] | null) ?? [];
}

/** Append-only — revalidation adds a row, it never overwrites one (K2 §4.7). */
export async function insertValidationRecord(
  db: Db,
  values: {
    knowledge_source_id: string;
    outcome: ValidationOutcome;
    source_valid: boolean;
    structure_valid: boolean;
    metadata_valid: boolean;
    provenance_valid: boolean;
    classification_valid: boolean;
    validator: string;
    reviewer_notes: string | null;
    failure_reasons: string[];
  },
): Promise<{ error: string | null }> {
  const { error } = await db.from('knowledge_source_validations').insert(values);
  return { error: error?.message ?? null };
}
