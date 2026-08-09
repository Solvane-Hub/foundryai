'use client';

import { cn } from '@/lib/utils/cn';

/**
 * The continuous route line.
 *
 * §02 ends with a turquoise rail at full fill. This picks the same line up at
 * the top of §03 and carries it down the section's left gutter, so the two
 * chapters read as one stroke rather than two components that happen to share
 * a colour. Route → system → action.
 *
 * A filled div rather than an SVG path: the line is straight, and measuring
 * geometry across two independently-laid-out sections to draw a curve between
 * them is fragile in a way that a reader would only ever notice when it broke.
 */
export function RouteLine({
  progress,
  nodes,
  active,
  className,
}: {
  /** 0–1 fill, normally from `useActiveStage`. */
  progress: number;
  /** Fractional positions (0–1) down the line where stage markers sit. */
  nodes: readonly number[];
  active: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn('relative w-px', className)}>
      <div className="bg-marine-line absolute inset-0" />
      <div
        className="bg-bahama-turquoise absolute inset-x-0 top-0 transition-[height] duration-700 ease-out"
        style={{ height: `${Math.round(progress * 100)}%` }}
      />
      {nodes.map((pos, i) => (
        <span
          key={pos}
          className={cn(
            'absolute left-1/2 size-2 -translate-x-1/2 rounded-full transition-colors duration-500',
            i < active && 'bg-bahama-turquoise',
            i === active && 'bg-bahama-turquoise ring-bahama-turquoise/25 ring-4',
            i > active && 'bg-marine-line',
          )}
          style={{ top: `calc(${pos * 100}% - 0.25rem)` }}
        />
      ))}
    </div>
  );
}
