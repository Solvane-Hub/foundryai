import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { signOutAction } from '../(auth)/actions';
import { Button } from '@/components/ui/button';

/**
 * Authenticated shell.
 *
 * Middleware already redirects unauthenticated requests, but this layout checks
 * again. Security Architecture: "No layer assumes another layer has already
 * performed validation." Middleware can be misconfigured by a matcher change;
 * this check cannot be bypassed by one.
 *
 * The full shell — sidebar, business selector, notifications — is Phase 4.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient();
  const user = await getCurrentUser(db);

  if (!user) redirect('/login');

  return (
    <div className="min-h-dvh">
      <header className="border-border flex items-center justify-between border-b px-6 py-3">
        <span className="font-semibold tracking-tight">FoundryAI</span>
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" size="sm">
            Sign out
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
