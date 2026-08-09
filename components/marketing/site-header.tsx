import Link from 'next/link';
import { Logo } from '@/components/brand/logo-mark';

/**
 * Site header — the `banner` landmark, sitting directly on the photograph.
 *
 * The mark and wordmark used to live in ink lozenges. Removing them made the
 * header feel part of the composition rather than a UI layer floating on top —
 * but it also removed the only thing making "Sign in" legible. Measured on the
 * actual hero pixels: the hero's own scrim is ~86% at the top left, so the
 * wordmark was always fine at 16:1, while the top right is barely scrimmed at
 * all and "Sign in" fell to 3.17:1, under AA.
 *
 * So the lozenges are replaced by a single photographic scrim band across the
 * header. It reads as vignetting rather than chrome, and takes "Sign in" to
 * 8.69:1. Legibility solved by the photograph's own language instead of by a
 * black box.
 *
 * Positioned by the page so it can stay a sibling of `<main>` and keep its
 * landmark role.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      {/* Vignette, not chrome. Decorative and non-interactive. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32"
        style={{
          background:
            'linear-gradient(to bottom, oklch(18% 0.055 245 / 0.55) 0%, oklch(18% 0.055 245 / 0.28) 45%, transparent 100%)',
        }}
      />

      <div className="mx-auto flex w-full max-w-[92rem] items-center justify-between px-6 py-6 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="FoundryAI home"
          className="text-on-ink inline-flex items-center rounded-sm drop-shadow-sm"
        >
          <Logo height={22} priority />
        </Link>

        <Link
          href="/login"
          className="text-on-ink inline-flex min-h-11 items-center rounded-sm px-1 text-sm font-medium drop-shadow-sm transition-opacity hover:opacity-80"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
