'use client';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Result } from '@/lib/errors';

/**
 * Presentation shell shared by the auth forms.
 *
 * Takes only serializable props plus children — function props cannot cross the
 * Server/Client boundary, so each form is a self-contained Client Component and
 * this shell holds the parts they have in common.
 */
export function FormShell({
  state,
  pending,
  action,
  submitLabel,
  children,
  hidden,
}: {
  state: Result<unknown> | null;
  pending: boolean;
  action: (formData: FormData) => void;
  submitLabel: string;
  children: React.ReactNode;
  hidden?: Record<string, string>;
}) {
  const formError = state && !state.ok && !state.fieldErrors ? state : null;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}

      {formError ? (
        <Alert tone="error">
          <p>{formError.message}</p>
          {/* Shown so a founder can quote a reference to support. The underlying
              error is never exposed. */}
          <p className="mt-1 text-xs opacity-70">
            Reference: {formError.correlationId.slice(0, 8)}
          </p>
        </Alert>
      ) : null}

      {children}

      <Button type="submit" size="full" loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}

export function fieldError(state: Result<unknown> | null, name: string): string | undefined {
  if (!state || state.ok) return undefined;
  return state.fieldErrors?.[name]?.[0];
}
