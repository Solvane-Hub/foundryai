'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Result } from '@/lib/errors';
import { updateProfileAction } from '../actions';

export function EditProfileForm({ fullName }: { fullName: string | null }) {
  const [state, formAction, pending] = useActionState<Result<{ saved: true }> | null, FormData>(
    updateProfileAction,
    null,
  );

  const err = state && !state.ok ? state.fieldErrors?.fullName?.[0] : undefined;
  const formError = state && !state.ok && !state.fieldErrors ? state : null;

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4" noValidate>
      {state?.ok ? <Alert tone="success">Saved.</Alert> : null}
      {formError ? (
        <Alert tone="error">
          <p>{formError.message}</p>
          <p className="mt-1 text-xs opacity-70">
            Reference: {formError.correlationId.slice(0, 8)}
          </p>
        </Alert>
      ) : null}

      <Field id="fullName" label="Your name" error={err}>
        {(aria) => (
          <Input
            {...aria}
            name="fullName"
            defaultValue={fullName ?? ''}
            autoComplete="name"
            required
          />
        )}
      </Field>

      <Button type="submit" loading={pending} className="w-fit">
        Save
      </Button>
    </form>
  );
}
