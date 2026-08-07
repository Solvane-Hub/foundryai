'use client';

import { useState } from 'react';
import { SidebarNav } from './sidebar-nav';

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="border-border text-foreground rounded-md border px-3 py-1.5 text-sm"
      >
        {open ? 'Close' : 'Menu'}
      </button>

      {open ? (
        <div
          id="mobile-nav-panel"
          className="border-border bg-surface absolute inset-x-0 top-14 z-20 border-b p-3 shadow-sm"
        >
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
