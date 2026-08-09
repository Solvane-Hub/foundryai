import { cn } from '@/lib/utils/cn';

/**
 * A raised surface.
 *
 * Used sparingly. Most groupings on a page want a heading and whitespace, not a
 * border — a screen where everything is in a card has no hierarchy at all.
 */
export function Card({
  className,
  children,
  padding = 'md',
}: {
  className?: string;
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}) {
  const pad = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' }[padding];
  return (
    <div className={cn('border-border bg-surface rounded-xl border shadow-xs', pad, className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        {description ? (
          <p className="text-foreground-muted max-w-prose text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
