import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { WorkspaceSurface, SurfaceLabel } from '@/components/ui/workspace-surface';
import { cn } from '@/lib/utils/cn';

/**
 * Intake, as an instrument.
 *
 * One segment per question, lit when answered. A continuous progress bar would
 * be a percentage of something the founder does not think in percentages
 * about; five discrete marks say "five questions, three done" at a glance,
 * which is the actual shape of the data.
 *
 * `completed` and `total` come from `intakeProgress()`. Nothing is scaled,
 * smoothed or projected — if the service says 0 of 5, the dial shows 0 of 5.
 *
 * The arc is `aria-hidden`; the readable statement below it is the accessible
 * one, so a screen reader gets "3 of 5 answered" rather than a path element.
 */
export function IntakeDial({
  completed,
  total,
  className,
}: {
  completed: number;
  total: number;
  className?: string;
}) {
  const remaining = Math.max(total - completed, 0);
  const complete = remaining === 0 && total > 0;

  return (
    <WorkspaceSurface
      as="section"
      tone="inset"
      aria-labelledby="intake-dial-heading"
      className={cn('flex flex-col items-center p-5 text-center sm:p-6', className)}
    >
      <SurfaceLabel id="intake-dial-heading">Your intake</SurfaceLabel>

      <div className="relative mt-6 flex items-center justify-center">
        <SegmentedArc completed={completed} total={total} />
        <span className="absolute flex flex-col items-center">
          <span
            data-numeric
            className="text-on-ink text-4xl leading-none font-semibold tracking-[-0.03em]"
          >
            {pad(completed)}
          </span>
          <span data-numeric className="text-on-glass-subtle mt-1.5 text-xs tracking-[0.08em]">
            / {pad(total)}
          </span>
        </span>
      </div>

      <p className="text-on-ink-muted mt-5 text-sm text-balance">
        {complete
          ? 'Every question answered.'
          : `${remaining} ${remaining === 1 ? 'question' : 'questions'} still to answer.`}
      </p>

      <Link
        href={complete ? '/intake/review' : '/intake'}
        className="text-bahama-turquoise hover:text-on-ink mt-3 inline-flex items-center gap-1.5 rounded-sm text-sm font-medium transition-colors duration-150"
      >
        {complete ? 'Review your answers' : 'Continue intake'}
        <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
      </Link>
    </WorkspaceSurface>
  );
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * `total` segments across 264°, opening downward so the numerals sit in a
 * closed shape rather than a ring. Guards against `total === 0` because a
 * division by zero here would render an invalid path rather than throw.
 */
function SegmentedArc({ completed, total }: { completed: number; total: number }) {
  if (total <= 0) return null;

  const SIZE = 132;
  const R = 56;
  const START = 138;
  const SWEEP = 264;
  const GAP = total > 1 ? 7 : 0;
  const step = SWEEP / total;

  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="size-32 sm:size-[8.25rem]"
      fill="none"
    >
      {Array.from({ length: total }, (_, i) => {
        const a0 = START + i * step + GAP / 2;
        const a1 = START + (i + 1) * step - GAP / 2;
        return (
          <path
            key={i}
            d={arc(SIZE / 2, SIZE / 2, R, a0, a1)}
            strokeWidth={5}
            strokeLinecap="round"
            className={i < completed ? 'stroke-bahama-turquoise' : 'stroke-white/12'}
          />
        );
      })}
    </svg>
  );
}

function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p = (a: number) => {
    const rad = ((a - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${p(a0)} A ${r} ${r} 0 ${large} 1 ${p(a1)}`;
}
