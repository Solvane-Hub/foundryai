'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { Result } from '@/lib/errors';
import { saveIntakeStepAction } from '../actions';

/**
 * One intake step.
 *
 * Each submit persists immediately, so closing the browser mid-flow loses
 * nothing (acceptance criteria C3/C4). Advancing is a client-side route change
 * only after the server confirms the save.
 */
export function StepForm({
  step,
  totalSteps,
  children,
  isLastStep,
}: {
  step: number;
  totalSteps: number;
  children: (fieldErrors: Record<string, string[]> | undefined) => React.ReactNode;
  isLastStep: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    Result<{ nextStep: number }> | null,
    FormData
  >(saveIntakeStepAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.push(isLastStep ? '/intake/review' : `/intake?step=${state.data.nextStep}`);
    }
  }, [state, router, isLastStep]);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const formError = state && !state.ok && !state.fieldErrors ? state : null;

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5" noValidate>
      <input type="hidden" name="step" value={step} />

      {formError ? (
        <Alert tone="error">
          <p>{formError.message}</p>
          <p className="mt-1 text-xs opacity-70">
            Reference: {formError.correlationId.slice(0, 8)}
          </p>
        </Alert>
      ) : null}

      {children(fieldErrors)}

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pending}>
          {isLastStep ? 'Save and review' : 'Save and continue'}
        </Button>
        {step > 1 ? (
          <a
            href={`/intake?step=${step - 1}`}
            className="text-foreground-muted text-sm underline underline-offset-4"
          >
            Back
          </a>
        ) : null}
        <span className="text-foreground-muted ml-auto text-xs">
          Step {step} of {totalSteps}
        </span>
      </div>

      <p className="text-foreground-muted text-xs">
        Your answers are saved as you go. You can close this and come back later.
      </p>
    </form>
  );
}
