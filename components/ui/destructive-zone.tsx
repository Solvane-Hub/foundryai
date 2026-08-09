import { cn } from '@/lib/utils/cn';

/**
 * Container for an irreversible-feeling action.
 *
 * Restrained on purpose: a red-washed panel makes every visit to Settings feel
 * like a warning. The border carries the signal and the action carries the
 * weight, so the page stays calm until the founder engages with it.
 */
export function DestructiveZone({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('border-danger-border bg-surface rounded-xl border p-5 sm:p-6', className)}>
      <div className="mb-4 flex flex-col gap-1">
        <h3 className="text-danger text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="text-foreground-muted max-w-prose text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}
