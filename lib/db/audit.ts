import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

/**
 * Audit repository. The ONLY place audit rows are written.
 *
 * audit_log has RLS enabled with zero policies, so it is unreachable by the
 * authenticated role. Writes go through the service-role client, which is why
 * this takes an explicit client rather than creating one — the caller must have
 * deliberately obtained admin privileges.
 */
export type AuditEvent =
  | 'auth.registered'
  | 'auth.signed_in'
  | 'auth.signed_out'
  | 'auth.password_reset_requested'
  | 'auth.password_reset_completed'
  | 'business.created'
  | 'business.updated'
  | 'business.archived'
  | 'intake.started'
  | 'intake.step_saved'
  | 'intake.knowledge_applied'
  | 'intake.completed';

export interface AuditEntry {
  event: AuditEvent;
  actorId?: string | null;
  businessId?: string | null;
  correlationId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

export async function insertAuditEntry(
  admin: SupabaseClient<Database>,
  entry: AuditEntry,
): Promise<{ error: string | null }> {
  const { error } = await admin.from('audit_log').insert({
    event: entry.event,
    actor_id: entry.actorId ?? null,
    business_id: entry.businessId ?? null,
    correlation_id: entry.correlationId ?? null,
    ip_address: entry.ipAddress ?? null,
    user_agent: entry.userAgent?.slice(0, 500) ?? null,
    metadata: (entry.metadata ?? {}) as never,
  });
  return { error: error?.message ?? null };
}
