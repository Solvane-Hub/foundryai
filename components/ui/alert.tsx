import { cn } from '@/lib/utils/cn';

export function Alert({
  tone = 'error',
  title,
  children,
  className,
}: {
  tone?: 'error' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    error: 'border-red-300 bg-red-50 text-red-900',
    success: 'border-green-300 bg-green-50 text-green-900',
    info: 'border-border bg-surface-muted text-foreground',
  } as const;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('rounded-md border px-3 py-2 text-sm', tones[tone], className)}
    >
      {title ? <p className="font-medium">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}
