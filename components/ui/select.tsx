import { cn } from '@/lib/utils/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'border-border-control bg-surface text-foreground',
          'h-10 w-full appearance-none rounded-md border pr-9 pl-3 text-sm shadow-xs',
          'transition-colors outline-none',
          'hover:border-border-control-hover',
          'focus-visible:border-brand focus-visible:ring-brand/15 focus-visible:ring-[3px]',
          'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/15',
          'disabled:bg-surface-muted disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {/* Inline SVG rather than a lucide import: this is decorative chrome on a
          native control, and it must not be tab-reachable. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="text-foreground-subtle pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m4 6 4 4 4-4" />
      </svg>
    </div>
  );
}
