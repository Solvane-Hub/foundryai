'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { NAV_ITEMS } from './nav-items';

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        if (!item.available) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              title="Arriving in a later phase of Sprint 1"
              className="text-foreground-muted flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm opacity-55"
            >
              {item.label}
              <span className="text-[10px] tracking-wide uppercase">soon</span>
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
              'rounded-md px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-surface-muted text-foreground font-medium'
                : 'text-foreground-muted hover:bg-surface-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
