import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

/**
 * Minimum primitive set required by Phase 3 (Authentication).
 * Styling is expressed entirely in design tokens, so the Phase 2 brand palette
 * lands as a change to app/globals.css alone — no component hard-codes a colour.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-brand text-brand-foreground hover:opacity-90',
        secondary: 'border border-border bg-surface text-foreground hover:bg-surface-muted',
        ghost: 'text-foreground hover:bg-surface-muted',
      },
      size: {
        md: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        full: 'h-10 w-full px-4 py-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Renders a loading state and blocks interaction. */
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      // Frontend Architecture — users should always understand when the system is working.
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? 'Working…' : children}
    </button>
  );
}
