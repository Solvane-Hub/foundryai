'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { resetPasswordAction } from '../actions';
import { fieldError, FormShell } from './form-shell';
import type { Result } from '@/lib/errors';

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<Result<{ reset: true }> | null, FormData>(
    resetPasswordAction,
    null,
  );

  if (state?.ok) {
    return (
      <Alert tone="success" title="Password updated">
        <Link href="/dashboard" className="underline underline-offset-4">
          Continue to your dashboard
        </Link>
      </Alert>
    );
  }

  return (
    <FormShell state={state} pending={pending} action={formAction} submitLabel="Update password">
      <Field
        id="password"
        label="New password"
        description="At least 12 characters."
        error={fieldError(state, 'password')}
      >
        {(aria) => (
          <Input {...aria} name="password" type="password" autoComplete="new-password" required />
        )}
      </Field>
      <Field
        id="confirmPassword"
        label="Confirm new password"
        error={fieldError(state, 'confirmPassword')}
      >
        {(aria) => (
          <Input
            {...aria}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
          />
        )}
      </Field>
    </FormShell>
  );
}
