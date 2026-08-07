import { createAdminClient } from '@/lib/supabase/admin';
import { insertAuditEntry, type AuditEntry } from '@/lib/db/audit';

/**
 * Audit service.
 *
 * Security Architecture requires authentication, business creation, AI
 * generation, knowledge updates and administrative actions to be recorded.
 *
 * **Failure policy — deliberate.** An audit write failure is logged loudly but
 * does NOT fail the user's action. Failing a founder's sign-in because an audit
 * insert hiccupped would convert a logging fault into an availability fault, and
 * would be trivially abusable as a denial-of-service. The trade-off is that a
 * lost audit row is possible; it is made visible rather than silent.
 */
export async function recordAuditEvent(entry: AuditEntry): Promise<void> {
  const admin = createAdminClient();

  if (!admin) {
    console.error(
      `[audit] NOT RECORDED — SUPABASE_SERVICE_ROLE_KEY is not configured. event=${entry.event} correlationId=${entry.correlationId ?? 'none'}`,
    );
    return;
  }

  const { error } = await insertAuditEntry(admin, entry);
  if (error) {
    console.error(
      `[audit] WRITE FAILED event=${entry.event} correlationId=${entry.correlationId ?? 'none'} error=${error}`,
    );
  }
}
