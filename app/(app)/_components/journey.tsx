import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { Milestone } from '@/services/progress';

const STATE_STYLE: Record<Milestone['state'], string> = {
  complete: 'border-green-300 bg-green-50',
  current: 'border-brand bg-surface',
  upcoming: 'border-border bg-surface',
  blocked: 'border-border bg-surface-muted opacity-70',
};

const STATE_LABEL: Record<Milestone['state'], string> = {
  complete: 'Done',
  current: 'Next',
  upcoming: 'Later',
  blocked: 'Not built yet',
};

export function Journey({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {milestones.map((m, i) => (
        <li
          key={m.key}
          className={cn('flex items-start gap-3 rounded-lg border p-4', STATE_STYLE[m.state])}
        >
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
              m.state === 'complete'
                ? 'border-green-600 bg-green-600 text-white'
                : 'border-border text-foreground-muted',
            )}
          >
            {m.state === 'complete' ? '✓' : i + 1}
          </span>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{m.title}</h3>
              <span className="text-foreground-muted text-[10px] tracking-wide uppercase">
                {STATE_LABEL[m.state]}
              </span>
            </div>
            <p className="text-foreground-muted text-sm">{m.description}</p>
            {m.href && m.actionLabel ? (
              <Link href={m.href} className="mt-2 w-fit">
                <Button size="sm" variant={m.state === 'current' ? 'primary' : 'secondary'}>
                  {m.actionLabel}
                </Button>
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
