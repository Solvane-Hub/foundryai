import { cn } from '@/lib/utils/cn';

/**
 * Loading placeholder.
 *
 * Decorative by default — `aria-hidden`. The surrounding region owns the
 * `role="status"` and the screen-reader text, so a skeleton grid does not
 * announce itself a dozen times.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-surface-muted animate-pulse rounded-md', className)}
    />
  );
}
