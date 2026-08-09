import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TONES = {
  error: {
    box: 'border-danger-border bg-danger-subtle text-danger',
    Icon: XCircle,
  },
  success: {
    box: 'border-success-border bg-success-subtle text-success',
    Icon: CheckCircle2,
  },
  warning: {
    box: 'border-warning-border bg-warning-subtle text-warning',
    Icon: AlertTriangle,
  },
  info: {
    box: 'border-border bg-surface-muted text-foreground',
    Icon: Info,
  },
} as const;

export function Alert({
  tone = 'error',
  title,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { box, Icon } = TONES[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border px-3.5 py-3 text-sm', box, className)}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
        <div className="[&_a]:underline [&_a]:underline-offset-2">{children}</div>
      </div>
    </div>
  );
}
