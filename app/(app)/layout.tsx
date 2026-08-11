import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { Logo } from '@/components/brand/logo-mark';
import { Environment } from './_components/environment';
import { SidebarNav } from './_components/sidebar-nav';
import { MobileNav } from './_components/mobile-nav';
import { BusinessSelector } from './_components/business-selector';
import { UserMenu } from './_components/user-menu';

/**
 * Authenticated application shell.
 *
 * The shell is an environment, not a chrome. A fixed photograph of the
 * territory sits behind everything; the header and the rail are translucent
 * panels suspended in it; the working area is transparent, so each route
 * decides its own material. That is the bridge from the landing page — a
 * founder crosses from the deep-water world into the instrument that operates
 * inside it, rather than into a different product. It is also the only surface
 * in the app dark enough for the champagne mark, which measures 1.84:1 on
 * canvas and 11.39:1 on ink.
 *
 * The rail floats with a margin rather than running edge to edge. A permanent
 * black column reads as an admin panel; a panel with water visible around it
 * reads as part of the environment, which is what the references do and what
 * makes the shell feel spatial rather than divided.
 *
 * `.workspace-env` is on the header and the rail, NOT on the root. Routes that
 * render `WorkspaceCanvas` are still light and need the global tokens exactly
 * as they are; the dashboard opts into the dark scope itself.
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
    <div className="relative min-h-dvh">
      <Environment />

      {/* Accessibility: keyboard users should be able to skip the nav. */}
      <a
        href="#main-content"
        className="bg-bahama-turquoise text-abyss sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <header className="workspace-env bg-abyss/70 sticky top-0 z-30 h-14 border-b border-white/8 backdrop-blur-xl">
        <div className="flex h-full items-center gap-3 px-4 sm:px-6">
          <MobileNav />

          <Link
            href="/dashboard"
            aria-label="FoundryAI dashboard"
            className="text-on-ink shrink-0 rounded-sm md:w-48 lg:w-52"
          >
            <Logo height={20} />
          </Link>

          {current ? (
            <>
              <span aria-hidden="true" className="hidden h-4 w-px bg-white/12 sm:block" />
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

      <div className="relative z-10 flex gap-0 lg:gap-2">
        <aside className="workspace-env hidden w-48 shrink-0 md:block lg:w-52">
          <div className="sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto px-3 py-5 lg:px-4">
            <div className="bg-glass-deep/72 shadow-glass flex min-h-full flex-col rounded-2xl border border-white/8 p-2.5 backdrop-blur-xl">
              <SidebarNav />
            </div>
          </div>
        </aside>

        <main id="main-content" className="min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
