import { cn } from '@/lib/utils/cn';

/**
 * Accessible form field wrapper.
 *
 * Wires label, description and error to the control via aria-describedby and
 * aria-invalid so screen readers announce validation failures. Accessibility is
 * a core requirement, not an enhancement (Frontend Architecture).
 */
export function Field({
  id,
  label,
  error,
  description,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  description?: string | undefined;
  children: (aria: {
    id: string;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  }) => React.ReactNode;
  className?: string;
}) {
  const errorId = `${id}-error`;
  const descId = `${id}-description`;
  const describedBy =
    [error ? errorId : null, description ? descId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-foreground text-sm font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {description ? (
        <p id={descId} className="text-foreground-muted text-xs">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
