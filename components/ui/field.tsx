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
  optional,
  children,
  className,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  description?: string | undefined;
  optional?: boolean;
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
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
        {optional ? (
          <span className="text-foreground-subtle text-xs font-normal">Optional</span>
        ) : null}
      </div>
      {/* Description sits ABOVE the control: guidance a founder needs in order to
          answer is useless underneath the box they have already filled in. */}
      {description ? (
        <p id={descId} className="text-foreground-muted -mt-0.5 text-xs">
          {description}
        </p>
      ) : null}
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {error ? (
        <p id={errorId} className="text-danger text-xs font-medium" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
