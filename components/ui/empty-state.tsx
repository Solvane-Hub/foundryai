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
  className,
}: {
  title: string;
  explanation: string;
  nextStep?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border bg-surface-muted flex flex-col items-start gap-2 rounded-lg border border-dashed p-6',
        className,
      )}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-foreground-muted text-sm">{explanation}</p>
      {nextStep ? <p className="text-foreground text-sm">{nextStep}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
