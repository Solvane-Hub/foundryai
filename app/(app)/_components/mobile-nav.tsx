'use client';

import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { SidebarNav } from './sidebar-nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  // A menu that stays open behind you when you navigate feels broken, and
  // Escape is the expected way out of any overlay.
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
        className="text-on-ink-muted hover:text-on-ink -ml-1.5 flex size-11 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-white/8"
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
            className="bg-abyss/70 fixed inset-0 top-14 z-20 backdrop-blur-sm"
          />
          <div
            id="mobile-nav-panel"
            className="workspace-env bg-glass-deep/92 shadow-glass absolute inset-x-0 top-14 z-30 border-b border-white/10 px-4 py-5 backdrop-blur-xl"
          >
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </>
      ) : null}
    </div>
  );
}
