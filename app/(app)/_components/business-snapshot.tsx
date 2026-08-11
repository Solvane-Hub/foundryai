import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * What FoundryAI knows about the business.
 *
 * A typeset operating profile, not a form summary and not a table of rows:
 * each value gets a cell, the label sits above it in small caps and the value
 * is set large enough to be read as a fact rather than as a field. That is the
 * difference between a definition list and an instrument panel, and it is what
 * lets six pieces of real information carry a section on their own.
 *
 * Empty values are OMITTED rather than rendered as "—". A row of dashes is a
 * database record wearing a design; leaving the field out and saying plainly
 * how much of intake is answered is the honest version.
 *
 * Editing reuses routes that already exist — Settings for the business record,
 * `/intake?step=n` for each answer. No new persistence, no new contract.
 */
export interface SnapshotRow {
  label: string;
  value: string;
  /** Where this value is edited. Existing routes only. */
  href: string;
}

export function BusinessSnapshot({
  rows,
  unanswered,
  className,
}: {
  rows: readonly SnapshotRow[];
  /** How many intake questions remain, for the honest footnote. */
  unanswered: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col', className)}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 sm:gap-x-8 xl:grid-cols-6">
        {rows.map((row) => (
          <div key={row.label} className="group flex min-w-0 flex-col gap-1.5">
            <dt className="text-2xs text-on-glass-subtle font-medium tracking-[0.14em] uppercase">
              {row.label}
            </dt>
            <dd className="flex min-w-0 items-baseline gap-2">
              <span className="text-on-ink min-w-0 truncate text-base font-medium tracking-[-0.01em]">
                {row.value}
              </span>
              <Link
                href={row.href}
                aria-label={`Edit ${row.label.toLowerCase()}`}
                className="text-on-glass-subtle hover:text-bahama-turquoise shrink-0 rounded-sm opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Pencil aria-hidden="true" className="size-3" strokeWidth={1.75} />
              </Link>
            </dd>
          </div>
        ))}
      </dl>

      {unanswered > 0 ? (
        <p className="text-on-ink-muted mt-7 text-sm">
          <span data-numeric>{unanswered}</span>{' '}
          {unanswered === 1 ? 'question is' : 'questions are'} still unanswered.{' '}
          <Link
            href="/intake"
            className="text-bahama-turquoise hover:text-on-ink underline underline-offset-4 transition-colors duration-150"
          >
            Continue intake
          </Link>
        </p>
      ) : null}
    </div>
  );
}
