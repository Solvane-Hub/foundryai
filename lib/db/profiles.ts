import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '@/types/database';

/** Profile repository. Reads are RLS-scoped to the caller's own row. */
export async function findOwnProfile(
  db: SupabaseClient<Database>,
): Promise<Tables<'profiles'> | null> {
  const { data } = await db.from('profiles').select('*').maybeSingle();
  return data ?? null;
}

export async function updateOwnProfile(
  db: SupabaseClient<Database>,
  userId: string,
  patch: { full_name?: string | null },
): Promise<{ error: string | null }> {
  const { error } = await db.from('profiles').update(patch).eq('id', userId);
  return { error: error?.message ?? null };
}
