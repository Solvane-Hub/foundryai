import { cn } from '@/lib/utils/cn';

/**
 * Single progress bar for the whole app.
 *
 * Replaces two near-identical implementations (dashboard + intake). They had
 * already drifted apart in label wording, which is how the next one drifts too.
 */
export function Progress({
  value,
  max = 100,
  label,
  caption,
  showPercent = true,
  className,
}: {
  value: number;
  max?: number;
  /** Accessible name. Required — a bare progressbar tells a screen reader nothing. */
  label: string;
  /** Visible text on the left, e.g. "3 of 5 answered". */
  caption?: React.ReactNode;
  showPercent?: boolean;
  className?: string;
}) {
  const percent = max === 0 ? 0 : Math.round((value / max) * 100);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {caption || showPercent ? (
        <div className="text-foreground-muted flex items-baseline justify-between text-xs">
          {caption ? <span>{caption}</span> : <span />}
          {showPercent ? (
            <span data-numeric className="text-foreground font-medium">
              {percent}%
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className="bg-surface-sunken h-1.5 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="bg-brand h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
