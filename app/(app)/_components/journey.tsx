import Link from 'next/link';
import { Check, Circle, Dot, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { Milestone, MilestoneState } from '@/services/progress';

/**
 * The founder journey as a vertical timeline.
 *
 * Previously bordered rows: four boxes stacked in a card, each with its own
 * outline. Nothing about that shape said "these happen in order", which is the
 * only thing the journey is trying to communicate. A connected rail does.
 *
 * All four states from `buildJourney()` are preserved exactly. No milestone is
 * invented and none is hidden.
 */
const MARKER: Record<
  MilestoneState,
  { ring: string; icon: React.ReactNode; rail: string; label: string }
> = {
  complete: {
    ring: 'border-success bg-success text-white',
    icon: <Check aria-hidden="true" className="size-3.5" strokeWidth={2.75} />,
    rail: 'bg-success/25',
    label: 'Done',
  },
  current: {
    ring: 'border-brand bg-brand text-white',
    icon: <Dot aria-hidden="true" className="size-5" strokeWidth={4} />,
    rail: 'bg-border',
    label: 'Next',
  },
  upcoming: {
    ring: 'border-border bg-surface text-foreground-subtle',
    icon: <Circle aria-hidden="true" className="size-2" strokeWidth={0} fill="currentColor" />,
    rail: 'bg-border',
    label: 'Later',
  },
  blocked: {
    ring: 'border-border bg-surface-muted text-foreground-subtle',
    icon: <Lock aria-hidden="true" className="size-3" strokeWidth={2} />,
    rail: 'bg-border',
    label: 'Not built yet',
  },
};

export function Journey({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="flex flex-col">
      {milestones.map((m, i) => {
        const marker = MARKER[m.state];
        const isLast = i === milestones.length - 1;
        const muted = m.state === 'blocked';

        return (
          <li key={m.key} className="relative flex gap-4 pb-7 last:pb-0">
            {/* Rail. Drawn behind the marker and stopped before the last row so
                the timeline does not trail off into nothing. */}
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn('absolute top-7 bottom-1 left-[0.6875rem] w-px', marker.rail)}
              />
            ) : null}

            <span
              aria-hidden="true"
              className={cn(
                'relative z-10 mt-0.5 flex size-[1.375rem] shrink-0 items-center justify-center rounded-full border',
                marker.ring,
              )}
            >
              {marker.icon}
            </span>

            <div className={cn('flex min-w-0 flex-1 flex-col gap-1', muted && 'opacity-65')}>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h3
                  className={cn(
                    'text-sm',
                    m.state === 'current' ? 'font-semibold' : 'font-medium',
                    m.state === 'complete' && 'text-foreground-muted',
                  )}
                >
                  {m.title}
                </h3>
                {/* State is conveyed by text as well as colour and shape — the
                    marker alone would fail SC 1.4.1. */}
                <span
                  className={cn(
                    'text-2xs font-medium tracking-wide uppercase',
                    m.state === 'current' ? 'text-brand' : 'text-foreground-subtle',
                  )}
                >
                  {marker.label}
                </span>
              </div>

              <p className="text-foreground-muted max-w-prose text-sm">{m.description}</p>

              {m.href && m.actionLabel ? (
                <Link href={m.href} className="mt-2.5 w-fit">
                  <Button size="sm" variant={m.state === 'current' ? 'primary' : 'secondary'}>
                    {m.actionLabel}
                  </Button>
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
