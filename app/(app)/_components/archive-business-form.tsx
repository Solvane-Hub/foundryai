'use client';

import { useActionState, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Result } from '@/lib/errors';
import { archiveBusinessAction } from '../actions';

/**
 * Archiving is the only removal path — there is no DELETE policy on any table
 * (ADR-0009). The confirmation step exists because this is destructive from the
 * founder's point of view even though the data is retained.
 */
export function ArchiveBusinessForm({ businessId, name }: { businessId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<Result<{ archived: true }> | null, FormData>(
    archiveBusinessAction,
    null,
  );

  if (state?.ok) {
    return (
      <Alert tone="success">Archived. It is hidden from your workspace but not deleted.</Alert>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {state && !state.ok ? (
        <Alert tone="error">
          <p>{state.message}</p>
          <p className="mt-1 text-xs opacity-70">Reference: {state.correlationId.slice(0, 8)}</p>
        </Alert>
      ) : null}

      <p className="text-foreground-muted text-sm">
        Archiving hides <span className="text-foreground font-medium">{name}</span> from your
        workspace. Nothing is deleted, and your answers are kept.
      </p>

      {confirming ? (
        <form action={formAction} className="flex items-center gap-3">
          <input type="hidden" name="businessId" value={businessId} />
          <Button type="submit" loading={pending} variant="secondary">
            Yes, archive it
          </Button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="text-foreground-muted text-sm underline underline-offset-4"
          >
            Cancel
          </button>
        </form>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className="w-fit"
          onClick={() => setConfirming(true)}
        >
          Archive this business
        </Button>
      )}
    </div>
  );
}
