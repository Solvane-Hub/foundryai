'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NAV_GROUPS } from './nav-items';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-6">
      {NAV_GROUPS.map((group, gi) => (
        <div key={group.label ?? `group-${gi}`} className="flex flex-col gap-1">
          {group.label ? (
            <h2 className="text-foreground-subtle text-2xs mb-1 px-3 font-medium tracking-wide uppercase">
              {group.label}
            </h2>
          ) : null}

          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            if (!item.available) {
              return (
                <span
                  key={item.href}
                  aria-disabled="true"
                  title="Arriving in a later phase of the roadmap"
                  className="text-foreground-subtle flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-surface-muted text-foreground font-medium'
                    : 'text-foreground-muted hover:bg-surface-muted/70 hover:text-foreground',
                )}
              >
                {/* A 2px rule rather than a filled pill: the active row should read
                    as "you are here", not as a second button competing with the
                    page's primary action. */}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="bg-brand absolute top-1.5 bottom-1.5 -left-px w-0.5 rounded-full"
                  />
                ) : null}
                <Icon
                  aria-hidden="true"
                  className={cn('size-4 shrink-0', active ? 'text-brand' : '')}
                  strokeWidth={1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
