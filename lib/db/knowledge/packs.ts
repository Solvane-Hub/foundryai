import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { KnowledgePack, KnowledgePackStatus } from '@/types/knowledge';

/**
 * Knowledge Pack repository — K1/K7.
 *
 * Reads go through the request-scoped client so RLS applies: authenticated
 * callers see published packs only. Pipeline writes use the admin client.
 */

type Db = SupabaseClient<Database>;

export async function insertPack(
  db: Db,
  values: { country_code: string; version: string; notes?: string | null },
): Promise<{ data: KnowledgePack | null; error: string | null }> {
  const { data, error } = await db
    .from('knowledge_packs')
    .insert({
      country_code: values.country_code,
      version: values.version,
      notes: values.notes ?? null,
    })
    .select('*')
    .single();
  return { data: (data as KnowledgePack | null) ?? null, error: error?.message ?? null };
}

export async function findPackById(db: Db, id: string): Promise<KnowledgePack | null> {
  const { data } = await db.from('knowledge_packs').select('*').eq('id', id).maybeSingle();
  return (data as KnowledgePack | null) ?? null;
}

/** The single published pack for a jurisdiction, if one exists (K7 §4.2). */
export async function findPublishedPack(
  db: Db,
  countryCode: string,
): Promise<KnowledgePack | null> {
  const { data } = await db
    .from('knowledge_packs')
    .select('*')
    .eq('country_code', countryCode)
    .eq('status', 'published')
    .maybeSingle();
  return (data as KnowledgePack | null) ?? null;
}

export async function updatePackStatus(
  db: Db,
  id: string,
  status: KnowledgePackStatus,
): Promise<{ data: KnowledgePack | null; error: string | null }> {
  const { data, error } = await db
    .from('knowledge_packs')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  return { data: (data as KnowledgePack | null) ?? null, error: error?.message ?? null };
}

/**
 * Atomic publication (K7 §4.2). Delegates to `publish_knowledge_pack`, which
 * supersedes the previous pack and promotes this one in one statement — a
 * partial failure cannot leave a jurisdiction with two published packs or none.
 */
export async function publishPack(
  db: Db,
  params: { packId: string; approvedBy: string; approvalNote?: string | null },
): Promise<{ data: KnowledgePack | null; error: string | null }> {
  const { data, error } = await db.rpc('publish_knowledge_pack', {
    p_pack_id: params.packId,
    p_approved_by: params.approvedBy,
    ...(params.approvalNote !== null && params.approvalNote !== undefined
      ? { p_approval_note: params.approvalNote }
      : {}),
  });
  return { data: (data as KnowledgePack | null) ?? null, error: error?.message ?? null };
}
