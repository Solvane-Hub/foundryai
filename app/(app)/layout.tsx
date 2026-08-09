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
        className="bg-brand text-brand-foreground sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow-md"
      >
        Skip to content
      </a>

      {/* Header sits on the canvas with a hairline rule rather than its own
          surface — one less horizontal band competing with the page title. */}
      <header className="border-border bg-canvas/85 sticky top-0 z-30 h-14 border-b backdrop-blur-sm">
        <div className="mx-auto flex h-full max-w-[88rem] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <MobileNav />

          <Link
            href="/dashboard"
            className="text-foreground shrink-0 text-[0.9375rem] font-semibold tracking-[-0.015em]"
          >
            FoundryAI
          </Link>

          {current ? (
            <>
              <span aria-hidden="true" className="bg-border hidden h-4 w-px sm:block" />
              <div className="hidden min-w-0 sm:block">
                <BusinessSelector businesses={businesses} currentId={current.id} />
              </div>
            </>
          ) : null}

          <div className="ml-auto">
            <UserMenu email={user.email ?? null} fullName={profile?.full_name ?? null} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[88rem] gap-10 px-4 py-8 sm:px-6 lg:gap-14 lg:px-8 lg:py-12">
        {/* Sticky so the nav stays put on long pages without a second scrollbar. */}
        <aside className="hidden w-52 shrink-0 md:block lg:w-56">
          <div className="sticky top-[4.5rem]">
            <SidebarNav />
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1 pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}
