import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { Alert } from '@/components/ui/alert';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * Phase 3 dashboard.
 *
 * Deliberately minimal and deliberately honest: it proves authentication and
 * route protection work, and it states plainly what has not been built.
 *
 * It shows NO placeholder compliance requirements, funding matches, or tasks.
 * Constitution — Truth Before Fluency applies to demo surfaces: a fabricated
 * requirement is indistinguishable from a real one to a founder.
 */
export default async function DashboardPage() {
  const db = await createClient();
  const user = await getCurrentUser(db);

  const { data: profile } = await db.from('profiles').select('full_name').maybeSingle();
  const greeting = profile?.full_name?.split(' ')[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting ? `Welcome, ${greeting}` : 'Welcome'}
        </h1>
        <p className="text-foreground-muted text-sm">
          You&apos;re signed in{user?.email ? ` as ${user.email}` : ''}.
        </p>
      </div>

      <Alert tone="info" title="Your workspace is being built">
        <p className="mt-1">
          Business creation, intake and your launch roadmap arrive in the next phases of Sprint 1.
          Nothing is shown here yet because there is nothing real to show.
        </p>
      </Alert>
    </div>
  );
}
