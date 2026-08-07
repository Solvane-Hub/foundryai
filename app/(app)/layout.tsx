import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { SidebarNav } from './_components/sidebar-nav';
import { MobileNav } from './_components/mobile-nav';
import { BusinessSelector } from './_components/business-selector';
import { UserMenu } from './_components/user-menu';

/**
 * Authenticated application shell (Phase 4).
 *
 * Middleware already redirects unauthenticated requests; this checks again.
 * Security Architecture: "No layer assumes another layer has already performed
 * validation." A proxy matcher change must not be able to silently expose a
 * protected route.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) redirect('/login');

  const [{ data: profile }, businesses, store] = await Promise.all([
    db.from('profiles').select('full_name').maybeSingle(),
    listBusinesses(db),
    cookies(),
  ]);

  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);

  return (
    <div className="min-h-dvh">
      {/* Accessibility: keyboard users should be able to skip the nav. */}
      <a
        href="#main-content"
        className="bg-brand text-brand-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="border-border bg-surface sticky top-0 z-10 flex h-14 items-center gap-3 border-b px-4 md:px-6">
        <MobileNav />
        <Link href="/dashboard" className="font-semibold tracking-tight">
          FoundryAI
        </Link>
        {current ? (
          <div className="ml-2 hidden sm:block">
            <BusinessSelector businesses={businesses} currentId={current.id} />
          </div>
        ) : null}
        <div className="ml-auto">
          <UserMenu email={user.email ?? null} fullName={profile?.full_name ?? null} />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8 md:px-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <SidebarNav />
        </aside>
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
