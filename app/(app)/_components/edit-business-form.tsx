'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { Result } from '@/lib/errors';
import { renameBusinessAction } from '../actions';

export function EditBusinessForm({
  businessId,
  name,
  industry,
}: {
  businessId: string;
  name: string;
  industry: string | null;
}) {
  const [state, formAction, pending] = useActionState<Result<{ id: string }> | null, FormData>(
    renameBusinessAction,
    null,
  );

  const err = (n: string) => (state && !state.ok ? state.fieldErrors?.[n]?.[0] : undefined);
  const formError = state && !state.ok && !state.fieldErrors ? state : null;

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4" noValidate>
      <input type="hidden" name="businessId" value={businessId} />

      {state?.ok ? <Alert tone="success">Saved.</Alert> : null}
      {formError ? (
        <Alert tone="error">
          <p>{formError.message}</p>
          <p className="mt-1 text-xs opacity-70">
            Reference: {formError.correlationId.slice(0, 8)}
          </p>
        </Alert>
      ) : null}

      <Field id="biz-name" label="Business name" error={err('name')}>
        {(aria) => <Input {...aria} name="name" defaultValue={name} required />}
      </Field>
      <Field id="biz-industry" label="Industry" error={err('industry')}>
        {(aria) => <Input {...aria} name="industry" defaultValue={industry ?? ''} />}
      </Field>

      <Button type="submit" loading={pending} className="w-fit">
        Save changes
      </Button>
    </form>
  );
}
