import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Placeholder for a route whose capability is not built.
 *
 * Replaces five verbatim copies of the same block. It has to do something
 * awkward well: look deliberate rather than broken, without implying the
 * feature is nearly here. Constitution — Truth Before Fluency applies to
 * roadmap claims too, so there is no date and no progress bar.
 *
 * The phrase "nothing real exists to show yet" is asserted by the e2e suite.
 * It is also the honest sentence, which is why it was written that way.
 */
export function NotBuiltYet({
  feature,
  explanation,
  className,
}: {
  /** What this route will eventually do, in one sentence fragment. */
  feature: string;
  explanation: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface/60 rounded-xl border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      <div className="text-foreground-subtle bg-surface-muted mx-auto flex size-11 items-center justify-center rounded-full">
        <Clock aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </div>
      <h2 className="mt-5 text-base font-semibold">{feature}</h2>
      <p className="text-foreground-muted mx-auto mt-2 max-w-md text-sm text-pretty">
        {explanation}
      </p>
      <p className="text-foreground-subtle mx-auto mt-4 max-w-md text-sm">
        Nothing is shown here because nothing real exists to show yet.
      </p>
    </div>
  );
}
