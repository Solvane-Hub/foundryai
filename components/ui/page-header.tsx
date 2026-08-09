import { cn } from '@/lib/utils/cn';

/**
 * The page title block, previously hand-rolled on nine screens with three
 * different spacings.
 *
 * `eyebrow` carries context (business name, section) so the `h1` can stay short.
 * A long title that has to explain where it is loses its shape.
 */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  meta,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: React.ReactNode;
  /** Primary action, right-aligned on wide screens and below the title on mobile. */
  actions?: React.ReactNode;
  /** Badges or status shown under the title. */
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow ? (
            <p className="text-foreground-subtle text-2xs font-medium tracking-wide uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-2xl font-semibold text-balance">{title}</h1>
          {description ? (
            <p className="text-foreground-muted max-w-prose text-sm">{description}</p>
          ) : null}
          {meta ? <div className="mt-1 flex flex-wrap items-center gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
