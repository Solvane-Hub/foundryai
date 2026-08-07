import { cn } from '@/lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'border-border bg-surface text-foreground placeholder:text-foreground-muted h-10 w-full rounded-md border px-3 py-2 text-sm',
        'aria-[invalid=true]:border-red-600',
        className,
      )}
      {...props}
    />
  );
}
