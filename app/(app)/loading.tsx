import { Skeleton } from '@/components/ui/skeleton';
import { WorkspaceSurface } from '@/components/ui/workspace-surface';

/**
 * Skeleton loader — every asynchronous action needs a loading state.
 *
 * Mirrors the briefing's actual shape (identity, next move, intake, snapshot,
 * route) on the real materials, so the page settles into place rather than
 * rearranging itself on arrival. Loading a dark composition behind a light
 * skeleton was the previous version's tell that something was about to move.
 */
export default function Loading() {
  return (
    <div className="workspace-env flex flex-col gap-6 sm:gap-8" role="status" aria-label="Loading">
      <div className="flex flex-col gap-3 px-1 pt-3 sm:pt-6">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <WorkspaceSurface className="flex flex-col divide-y divide-white/8">
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:p-7">
          <WorkspaceSurface tone="deep" className="flex flex-col gap-4 p-5 sm:p-7">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="mt-4 h-11 w-44 rounded-full" />
          </WorkspaceSurface>
          <WorkspaceSurface tone="inset" className="flex flex-col items-center gap-5 p-5 sm:p-6">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="size-32 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </WorkspaceSurface>
        </div>

        <div className="flex flex-col gap-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-7">
          <Skeleton className="h-2.5 w-40" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 xl:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-7 px-4 py-7 sm:px-6 sm:py-9 lg:px-7">
          <Skeleton className="h-2.5 w-24" />
          <div className="grid gap-7 lg:auto-cols-fr lg:grid-flow-col lg:gap-x-6 lg:gap-y-0">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-3.5 lg:flex-col lg:gap-0">
                <Skeleton className="size-3.5 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-2 lg:mt-4">
                  <Skeleton className="h-2.5 w-12" />
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="h-3 w-full max-w-xs" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </WorkspaceSurface>

      <span className="sr-only">Loading…</span>
    </div>
  );
}
