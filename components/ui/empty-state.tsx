import { cn } from '@/lib/utils/cn';

/**
 * Frontend Architecture — empty states must guide toward action.
 *
 * "No data" is forbidden: an empty state must explain WHAT will appear, WHY it
 * is missing, and WHAT to do next. Through Sprints 1–2 most of the workspace is
 * empty states, so they are what communicates that the platform is working
 * rather than broken.
 */
export function EmptyState({
  title,
  explanation,
  nextStep,
  action,
  icon,
  className,
}: {
  title: string;
  explanation: string;
  nextStep?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface flex flex-col items-center rounded-xl border px-6 py-12 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="bg-surface-muted text-foreground-subtle mb-5 flex size-11 items-center justify-center rounded-full">
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-foreground-muted mt-2 max-w-md text-sm text-pretty">{explanation}</p>
      {nextStep ? <p className="text-foreground mt-3 max-w-md text-sm">{nextStep}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
