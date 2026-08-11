'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NAV_GROUPS } from './nav-items';

/**
 * Primary navigation, on the floating rail.
 *
 * Turquoise is the system's active signal here exactly as it is on the landing
 * page — it marks where you are, and nothing else in the rail uses it. The
 * active row gets a filled surface AND a leading bar AND a coloured icon, so
 * state is never carried by colour alone.
 *
 * Unavailable routes stay visible and readable rather than being hidden or
 * dimmed into illegibility: `on-glass-subtle` measures 6.45:1 on the rail, so
 * a founder can read where the product is going.
 *
 * Rows are 40px rather than 44px now that the rail is a panel with its own
 * padding — the touch target on mobile comes from the sheet, which keeps the
 * larger rhythm.
 */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-6">
      {NAV_GROUPS.map((group, gi) => (
        <div
          key={group.label ?? `group-${gi}`}
          className={cn('flex flex-col gap-0.5', gi === NAV_GROUPS.length - 1 && 'mt-auto')}
        >
          {group.label ? (
            <h2 className="text-2xs text-on-glass-subtle mb-1.5 px-3 font-medium tracking-[0.14em] uppercase">
              {group.label}
            </h2>
          ) : null}

          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150',
                  active
                    ? 'text-on-ink bg-white/8 font-medium'
                    : item.available
                      ? 'text-on-ink-muted hover:text-on-ink hover:bg-white/5'
                      : 'text-on-glass-subtle hover:text-on-ink-muted hover:bg-white/5',
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="bg-bahama-turquoise absolute top-2.5 bottom-2.5 -left-0.5 w-0.5 rounded-full"
                  />
                ) : null}
                <Icon
                  aria-hidden="true"
                  className={cn('size-4 shrink-0', active && 'text-bahama-turquoise')}
                  strokeWidth={1.75}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {!item.available ? (
                  <span className="text-2xs text-on-glass-subtle font-medium tracking-wide uppercase">
                    Soon
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
