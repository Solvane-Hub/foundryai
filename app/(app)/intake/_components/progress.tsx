export function IntakeProgress({ completed, total }: { completed: number; total: number }) {
  const percent = Math.round((completed / total) * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-foreground-muted flex justify-between text-xs">
        <span>
          {completed} of {total} answered
        </span>
        <span>{percent}%</span>
      </div>
      <div
        className="bg-surface-muted h-2 w-full overflow-hidden rounded-full"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Intake progress"
      >
        <div
          className="bg-brand h-full rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
