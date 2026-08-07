'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signUpAction } from '../actions';
import { fieldError, FormShell } from './form-shell';
import type { Result } from '@/lib/errors';

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<
    Result<{ requiresEmailConfirmation: boolean }> | null,
    FormData
  >(signUpAction, null);

  if (state?.ok) {
    return state.data.requiresEmailConfirmation ? (
      <Alert tone="success" title="Check your email">
        We&apos;ve sent you a confirmation link. Open it to activate your account.
      </Alert>
    ) : (
      <Alert tone="success" title="Account created">
        <Link href="/dashboard" className="underline underline-offset-4">
          Continue to your dashboard
        </Link>
      </Alert>
    );
  }

  return (
    <FormShell state={state} pending={pending} action={formAction} submitLabel="Create account">
      <Field id="fullName" label="Full name" error={fieldError(state, 'fullName')}>
        {(aria) => <Input {...aria} name="fullName" autoComplete="name" required />}
      </Field>
      <Field id="email" label="Email" error={fieldError(state, 'email')}>
        {(aria) => <Input {...aria} name="email" type="email" autoComplete="email" required />}
      </Field>
      <Field
        id="password"
        label="Password"
        description="At least 12 characters. Length matters more than symbols."
        error={fieldError(state, 'password')}
      >
        {(aria) => (
          <Input {...aria} name="password" type="password" autoComplete="new-password" required />
        )}
      </Field>
    </FormShell>
  );
}
