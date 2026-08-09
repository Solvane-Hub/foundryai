import { cn } from '@/lib/utils/cn';

/**
 * Editorial section shell.
 *
 * Chapter numbering in champagne is what makes the page read as a document
 * rather than a stack of marketing blocks — it tells the reader there is an
 * order and how far through it they are.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  lede,
  tone = 'canvas',
  className,
}: {
  /** Chapter number, e.g. "02". Rendered decoratively — not announced. */
  index: string;
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  tone?: 'canvas' | 'ink';
  className?: string;
}) {
  const dark = tone === 'ink';
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          data-numeric
          className={cn('text-2xs font-medium', dark ? 'text-champagne' : 'text-brand')}
        >
          {index}
        </span>
        <span aria-hidden="true" className={cn('h-px w-8', dark ? 'bg-ink-line' : 'bg-border')} />
        <span
          className={cn(
            'text-2xs font-medium tracking-wide uppercase',
            dark ? 'text-on-ink-muted' : 'text-foreground-muted',
          )}
        >
          {eyebrow}
        </span>
      </div>

      <h2
        className={cn(
          'max-w-3xl text-3xl font-semibold text-balance sm:text-4xl',
          dark ? 'text-on-ink' : 'text-foreground',
        )}
      >
        {title}
      </h2>

      {lede ? (
        <p
          className={cn(
            'max-w-2xl text-base text-pretty',
            dark ? 'text-on-ink-muted' : 'text-foreground-muted',
          )}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}
