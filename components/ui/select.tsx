import { cn } from '@/lib/utils/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'border-border bg-surface text-foreground h-10 w-full rounded-md border px-3 text-sm',
        'aria-[invalid=true]:border-red-600',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
