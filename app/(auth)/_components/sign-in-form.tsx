'use client';

import { useActionState } from 'react';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signInAction } from '../actions';
import { fieldError, FormShell } from './form-shell';
import type { Result } from '@/lib/errors';

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<Result<{ next: string }> | null, FormData>(
    signInAction,
    null,
  );

  return (
    <FormShell
      state={state}
      pending={pending}
      action={formAction}
      submitLabel="Sign in"
      {...(next ? { hidden: { next } } : {})}
    >
      <Field id="email" label="Email" error={fieldError(state, 'email')}>
        {(aria) => <Input {...aria} name="email" type="email" autoComplete="email" required />}
      </Field>
      <Field id="password" label="Password" error={fieldError(state, 'password')}>
        {(aria) => (
          <Input
            {...aria}
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        )}
      </Field>
    </FormShell>
  );
}
