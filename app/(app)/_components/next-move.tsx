import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceSurface, SurfaceLabel } from '@/components/ui/workspace-surface';
import { cn } from '@/lib/utils/cn';
import type { Milestone } from '@/services/progress';

/**
 * The one thing to do next.
 *
 * The deepest surface in the workspace, which is what makes it dominant. On a
 * light page the focal element is the one that lifts; in water it is the one
 * pushed furthest in — `glass-deep` measures 17.41:1 for `on-ink` against
 * 12.68:1 on the shell, so the type is simply harder-edged here than anywhere
 * else on the page. No size arms race, no accent fill, no shadow.
 *
 * Fed entirely by `journey.next`, which `buildJourney()` computes from real
 * state. No new task model, no invented milestone: if there is no current
 * step, that is reported as the truth rather than papered over with a
 * fabricated next action.
 */
export function NextMove({
  milestone,
  className,
}: {
  milestone: Milestone | null;
  className?: string;
}) {
  const done = milestone === null;

  return (
    <WorkspaceSurface
      as="section"
      tone="deep"
      aria-labelledby="next-move-heading"
      className={cn('flex flex-col justify-between overflow-hidden p-5 sm:p-7', className)}
    >
      {/* A single luminous edge, the direction the route runs. Decorative. */}
      <span
        aria-hidden="true"
        className="via-bahama-turquoise/45 absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />

      <div className="min-w-0">
        <SurfaceLabel
          as="p"
          className={cn(done ? 'text-on-glass-subtle' : 'text-bahama-turquoise')}
        >
          {done ? 'Up to date' : 'Your next move'}
        </SurfaceLabel>

        <h2
          id="next-move-heading"
          className="text-on-ink mt-4 max-w-md text-2xl font-semibold tracking-[-0.022em] text-balance sm:text-3xl"
        >
          {done ? 'Everything available today is done' : milestone.title}
        </h2>

        <p className="text-on-ink-muted mt-3 max-w-md text-sm text-pretty sm:text-base">
          {done
            ? 'The remaining stages need capabilities that are still in development. Nothing is waiting on you.'
            : milestone.description}
        </p>
      </div>

      <div className="mt-8 flex items-center gap-4">
        {!done && milestone.href && milestone.actionLabel ? (
          <Link href={milestone.href} className="inline-flex">
            <Button size="lg" className="rounded-full pr-4 pl-5">
              {milestone.actionLabel}
              <ArrowRight aria-hidden="true" strokeWidth={2} />
            </Button>
          </Link>
        ) : (
          <span className="text-on-glass-subtle inline-flex items-center gap-2 text-sm">
            <Check aria-hidden="true" className="text-bahama-turquoise size-4" strokeWidth={2.5} />
            Nothing waiting on you
          </span>
        )}
      </div>
    </WorkspaceSurface>
  );
}
