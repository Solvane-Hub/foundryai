'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import type { Result } from '@/lib/errors';
import { createBusinessAction } from '../actions';

export function CreateBusinessForm({ countries }: { countries: { code: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<Result<{ id: string }> | null, FormData>(
    createBusinessAction,
    null,
  );

  const err = (n: string) => (state && !state.ok ? state.fieldErrors?.[n]?.[0] : undefined);
  const formError = state && !state.ok && !state.fieldErrors ? state : null;

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4" noValidate>
      {formError ? (
        <Alert tone="error">
          <p>{formError.message}</p>
          <p className="mt-1 text-xs opacity-70">
            Reference: {formError.correlationId.slice(0, 8)}
          </p>
        </Alert>
      ) : null}

      <Field id="name" label="Business name" error={err('name')}>
        {(aria) => <Input {...aria} name="name" autoComplete="organization" required />}
      </Field>

      <Field
        id="countryCode"
        label="Country"
        description="Where the business will be registered. This determines which government requirements apply."
        error={err('countryCode')}
      >
        {(aria) => (
          <Select {...aria} name="countryCode" defaultValue={countries[0]?.code ?? ''} required>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field
        id="industry"
        label="Industry"
        description="Optional. In your own words — for example, restaurant, construction, consulting."
        error={err('industry')}
      >
        {(aria) => <Input {...aria} name="industry" />}
      </Field>

      <Button type="submit" loading={pending} className="w-fit">
        Create business
      </Button>
    </form>
  );
}
