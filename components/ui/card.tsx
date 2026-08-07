import { cn } from '@/lib/utils/cn';

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('border-border bg-surface rounded-lg border p-5', className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-3 flex flex-col gap-1">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {description ? <p className="text-foreground-muted text-sm">{description}</p> : null}
    </div>
  );
}
