import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { AppError, newCorrelationId } from '@/lib/errors';
import { findOwnProfile, updateOwnProfile } from '@/lib/db/profiles';
import type { UpdateProfileInput } from '@/lib/validation/profile';

/** Account profile Application Service. */
export async function getOwnProfile(db: SupabaseClient<Database>) {
  return findOwnProfile(db);
}

export async function updateAccountProfile(
  db: SupabaseClient<Database>,
  userId: string,
  input: UpdateProfileInput,
  correlationId = newCorrelationId(),
): Promise<void> {
  const { error } = await updateOwnProfile(db, userId, { full_name: input.fullName });
  if (error) {
    throw new AppError({
      code: 'UNEXPECTED',
      humanMessage: 'We could not save your details. Please try again.',
      developerMessage: error,
      correlationId,
    });
  }
}
