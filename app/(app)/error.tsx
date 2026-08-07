'use client';

import { Button } from '@/components/ui/button';

/** Errors must be human-readable and never expose internals. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <h1 className="text-xl font-semibold tracking-tight">We couldn&apos;t load that</h1>
      <p className="text-foreground-muted text-sm">
        Something went wrong on our side. Your work has not been lost.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
