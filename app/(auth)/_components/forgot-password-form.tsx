'use client';

import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { requestPasswordResetAction } from '../actions';
import { fieldError, FormShell } from './form-shell';
import type { Result } from '@/lib/errors';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<Result<{ sent: true }> | null, FormData>(
    requestPasswordResetAction,
    null,
  );

  if (state?.ok) {
    return (
      <Alert tone="success" title="Check your email">
        {/* Deliberately does not confirm whether an account exists — this endpoint
            must not be usable to enumerate registered addresses. */}
        If an account exists for that address, we&apos;ve sent a reset link.
      </Alert>
    );
  }

  return (
    <FormShell state={state} pending={pending} action={formAction} submitLabel="Send reset link">
      <Field id="email" label="Email" error={fieldError(state, 'email')}>
        {(aria) => <Input {...aria} name="email" type="email" autoComplete="email" required />}
      </Field>
    </FormShell>
  );
}
