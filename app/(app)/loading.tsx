import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader — every asynchronous action needs a loading state.
 *
 * Mirrors the dashboard's actual shape (title, meta row, progress, timeline) so
 * the page settles into place rather than rearranging itself on arrival.
 */
export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-10" role="status" aria-label="Loading">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-44" />
      </div>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>

      <div className="flex flex-col gap-7">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="size-[1.375rem] shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full max-w-sm" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
