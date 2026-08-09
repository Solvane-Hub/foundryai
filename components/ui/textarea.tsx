import { cn } from '@/lib/utils/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

/**
 * Extracted from two copy-pasted blocks in the intake flow. Mirrors Input's
 * treatment exactly so a form never mixes two field languages.
 */
export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'border-border-control bg-surface text-foreground placeholder:text-foreground-subtle',
        'w-full rounded-md border px-3 py-2.5 text-sm shadow-xs',
        'transition-colors outline-none',
        'hover:border-border-control-hover',
        'focus-visible:border-brand focus-visible:ring-brand/15 focus-visible:ring-[3px]',
        'aria-[invalid=true]:border-danger aria-[invalid=true]:focus-visible:ring-danger/15',
        'disabled:bg-surface-muted disabled:cursor-not-allowed',
        'resize-y',
        className,
      )}
      {...props}
    />
  );
}
