import Link from 'next/link';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { WorkspaceSurface, SurfaceLabel } from './workspace-surface';

/**
 * A surface that is not built yet, presented as a room coming online rather
 * than a dead end.
 *
 * Every one of these answers four questions: what this area is for, what it
 * depends on, whether those dependencies exist yet, and what the founder can
 * do today. That last one is what stops the page feeling like a 404 with
 * better typography.
 *
 * It sits in the same water as the dashboard, on the same materials, because a
 * founder arriving here from the rail has not left the workspace. Beautiful is
 * not available, though: nothing in the copy or the composition implies the
 * capability exists, and the prerequisite states are REAL — `met` comes from
 * actual application state, so the checklist is a genuine progress signal
 * rather than decoration. Presentation only: the page computes the booleans
 * and passes them in.
 */
export interface Prerequisite {
  label: string;
  detail: string;
  met: boolean;
}

export function RoadmapSurface({
  purpose,
  prerequisites,
  today,
  className,
}: {
  /** One sentence on what this surface will do. Never phrased as if it exists. */
  purpose: string;
  prerequisites: readonly Prerequisite[];
  /** What the founder can usefully do right now, if anything. */
  today: { text: string; href?: string; label?: string };
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <WorkspaceSurface className="flex flex-col divide-y divide-white/8">
        <p className="text-on-ink max-w-2xl p-6 text-lg text-pretty sm:p-8 sm:text-xl">{purpose}</p>

        <section aria-labelledby="prereq-heading" className="flex flex-col gap-6 p-6 sm:p-8">
          <SurfaceLabel id="prereq-heading">What this depends on</SurfaceLabel>

          <ul className="grid gap-3 sm:grid-cols-2">
            {prerequisites.map((p) => (
              <WorkspaceSurface
                as="li"
                tone="inset"
                key={p.label}
                className="flex min-w-0 gap-3.5 p-4 sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                    p.met ? 'bg-bahama-turquoise text-abyss' : 'ring-1 ring-white/44',
                  )}
                >
                  {p.met ? <Check className="size-2.5" strokeWidth={4} /> : null}
                </span>

                <div className="min-w-0 flex-1">
                  {/* Text, not just the tick — state is never colour alone. */}
                  <span
                    className={cn(
                      'text-2xs block font-medium tracking-[0.14em] uppercase',
                      p.met ? 'text-bahama-turquoise' : 'text-on-glass-subtle',
                    )}
                  >
                    {p.met ? 'Ready' : 'Not yet'}
                  </span>
                  <h3 className="text-on-ink mt-1.5 text-sm font-medium">{p.label}</h3>
                  <p className="text-on-ink-muted mt-1 text-xs text-pretty">{p.detail}</p>
                </div>
              </WorkspaceSurface>
            ))}
          </ul>
        </section>
      </WorkspaceSurface>

      <WorkspaceSurface
        as="section"
        tone="deep"
        aria-labelledby="today-heading"
        className="flex flex-col gap-3 p-6 sm:p-8"
      >
        <div className="flex items-center gap-2.5">
          <Lock aria-hidden="true" className="text-champagne size-3.5" strokeWidth={2} />
          <SurfaceLabel id="today-heading">What you can do today</SurfaceLabel>
        </div>
        <p className="text-on-ink-muted max-w-2xl text-sm text-pretty">{today.text}</p>
        {today.href && today.label ? (
          <Link
            href={today.href}
            className="text-bahama-turquoise hover:text-on-ink w-fit rounded-sm text-sm font-medium underline underline-offset-4 transition-colors duration-150"
          >
            {today.label}
          </Link>
        ) : null}
      </WorkspaceSurface>
    </div>
  );
}
