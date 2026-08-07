/** Skeleton loader — every asynchronous action needs a loading state. */
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="bg-surface-muted h-7 w-56 animate-pulse rounded" />
      <div className="bg-surface-muted h-4 w-80 animate-pulse rounded" />
      <div className="bg-surface-muted mt-4 h-28 w-full animate-pulse rounded-lg" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
