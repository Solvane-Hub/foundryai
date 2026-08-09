'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  // A menu that stays open behind you when you navigate feels broken, and Escape
  // is the expected way out of any overlay.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="text-foreground-muted hover:bg-surface-muted hover:text-foreground -ml-2 flex size-9 items-center justify-center rounded-md transition-colors"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
        ) : (
          <Menu aria-hidden="true" className="size-5" strokeWidth={1.75} />
        )}
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="bg-foreground/10 fixed inset-0 top-14 z-20"
          />
          <div
            id="mobile-nav-panel"
            className="border-border bg-surface absolute inset-x-0 top-14 z-30 border-b px-3 py-4 shadow-md"
          >
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
