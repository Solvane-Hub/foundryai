'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Result } from '@/lib/errors';
import { completeIntakeAction } from '../actions';

export function CompleteIntakeForm() {
  const [state, formAction, pending] = useActionState<Result<{ done: true }> | null, FormData>(
    () => completeIntakeAction(null),
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state && !state.ok ? (
        <Alert tone="error">
          <p>{state.message}</p>
          <p className="mt-1 text-xs opacity-70">Reference: {state.correlationId.slice(0, 8)}</p>
        </Alert>
      ) : null}
      <Button type="submit" loading={pending} className="w-fit">
        Finish intake
      </Button>
    </form>
  );
}
