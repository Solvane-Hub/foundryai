'use client';

import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceCanvas } from '@/components/ui/workspace-canvas';

/** Errors must be human-readable and never expose internals. */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <WorkspaceCanvas>
      <div className="flex max-w-md flex-col items-start gap-4">
        <h1 className="text-xl font-semibold">We couldn&apos;t load that</h1>
        <p className="text-foreground-muted text-sm">
          Something went wrong on our side. Your work has not been lost — nothing you have saved is
          affected.
        </p>
        <Button onClick={reset}>
          <RotateCw aria-hidden="true" strokeWidth={2} />
          Try again
        </Button>
      </div>
    </WorkspaceCanvas>
  );
}
