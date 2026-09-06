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
 * `.workspace-env` is on the header and the rail, NOT on the root. Each route
 * owns its own material: most compose directly on the environment under
 * `.workspace-env` (dashboard, Nova, intake), and the long-form surfaces use
 * `WorkspaceCanvas`, which is itself a dark glass panel carrying the same scope.
 * The root stays neutral so a route is free to choose.
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

      {/*
        The floating application frame.

        The whole product is one premium application suspended in the
        environment: a single rounded, hairline-bordered, deep-glass surface
        with the water visible around it. The top bar and the navigation rail
        live INSIDE it, and the workspace scrolls within it — so the shell reads
        as a desktop application, not a full-bleed website with a sidebar. On
        mobile the frame goes full-bleed (no margin, no corners) and the rail
        collapses into `MobileNav`.

        `.workspace-env` is on the frame, so every route inside inherits the
        dark-surface token remap. The frame owns the height (`h-dvh` on the
        padded wrapper, `flex-1` here) and clips its own scroll, so the header
        and rail stay put while `main` scrolls.
      */}
      <div className="relative z-10 flex h-dvh items-stretch justify-center p-0 sm:items-center sm:p-6 lg:p-8">
        <div className="workspace-env app-frame bg-glass-deep/70 flex h-full w-full flex-col overflow-hidden border-white/12 backdrop-blur-2xl sm:h-[min(74vh,880px)] sm:w-[88vw] sm:max-w-[1600px] sm:rounded-3xl sm:border">
          {/* Internal top bar. */}
          <header className="bg-abyss/40 flex h-14 shrink-0 items-center gap-3 border-b border-white/8 px-4 sm:px-6">
            <MobileNav />

            <Link
              href="/dashboard"
              aria-label="FoundryAI dashboard"
              className="text-on-ink shrink-0 rounded-sm"
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
          </header>

          {/* Internal navigation rail + the scrolling workspace. */}
          <div className="flex min-h-0 flex-1">
            <aside className="hidden w-52 shrink-0 overflow-y-auto border-r border-white/8 px-3 py-5 md:block">
              <SidebarNav />
            </aside>

            <main id="main-content" className="min-w-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
