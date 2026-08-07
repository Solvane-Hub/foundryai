import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { BusinessProfile, IntakePatch } from '@/types/business';

/** Business profile repository — intake responses, 1:1 with a business. */
export async function findProfileByBusinessId(
  db: SupabaseClient<Database>,
  businessId: string,
): Promise<BusinessProfile | null> {
  const { data } = await db
    .from('business_profiles')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle();
  return data ?? null;
}

export async function insertProfile(
  db: SupabaseClient<Database>,
  businessId: string,
): Promise<{ data: BusinessProfile | null; error: string | null }> {
  const { data, error } = await db
    .from('business_profiles')
    .insert({ business_id: businessId })
    .select('*')
    .single();
  return { data: data ?? null, error: error?.message ?? null };
}

export type ProfilePatch = IntakePatch;

export async function updateProfile(
  db: SupabaseClient<Database>,
  businessId: string,
  patch: ProfilePatch,
): Promise<{ data: BusinessProfile | null; error: string | null }> {
  const { data, error } = await db
    .from('business_profiles')
    .update(patch)
    .eq('business_id', businessId)
    .select('*')
    .maybeSingle();
  return { data: data ?? null, error: error?.message ?? null };
}
