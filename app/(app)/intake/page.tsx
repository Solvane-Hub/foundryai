import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { startOrResumeIntake, intakeProgress } from '@/services/intake';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import {
  BUSINESS_STAGES,
  BUSINESS_STAGE_LABELS,
  INTAKE_STEPS,
  stepFromParam,
  TOTAL_INTAKE_STEPS,
} from '@/lib/validation/intake';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { StepForm } from './_components/step-form';
import { IntakeProgress } from './_components/progress';

export const metadata: Metadata = { title: 'Business intake' };

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const db = await createClient();
  const [user, businesses, store, params] = await Promise.all([
    getCurrentUser(db),
    listBusinesses(db),
    cookies(),
    searchParams,
  ]);

  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);

  if (!current) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Business intake</h1>
        <EmptyState
          title="No business yet"
          explanation="Intake collects the details FoundryAI needs to work out your requirements — so it needs a business first."
          nextStep="Create a business to begin."
          action={
            <Link href="/businesses/new">
              <Button>Create a business</Button>
            </Link>
          }
        />
      </div>
    );
  }

  // Creating the profile on load is what makes the flow resumable: the row must
  // exist before the first answer is submitted.
  const profile = await startOrResumeIntake(db, current.id, user!.id);
  const progress = intakeProgress(profile);
  const step = stepFromParam(params.step, profile.last_completed_step);
  const meta = INTAKE_STEPS[step - 1]!;
  const isLastStep = step === TOTAL_INTAKE_STEPS;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Business intake</h1>
        <p className="text-foreground-muted text-sm">{current.name}</p>
      </div>

      <IntakeProgress completed={progress.completed} total={progress.total} />

      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{meta.title}</h2>
      </div>

      <StepForm step={step} totalSteps={TOTAL_INTAKE_STEPS} isLastStep={isLastStep}>
        {(fieldErrors) => {
          if (step === 1) {
            return (
              <Field
                id="description"
                label="What does the business do?"
                description="Plain language is best. FoundryAI uses this to work out which requirements apply."
                error={fieldErrors?.description?.[0]}
              >
                {(aria) => (
                  <textarea
                    {...aria}
                    name="description"
                    rows={5}
                    defaultValue={profile.description ?? ''}
                    className="border-border bg-surface text-foreground w-full rounded-md border px-3 py-2 text-sm"
                    required
                  />
                )}
              </Field>
            );
          }
          if (step === 2) {
            return (
              <>
                <Field
                  id="businessStage"
                  label="Where are you today?"
                  error={fieldErrors?.businessStage?.[0]}
                >
                  {(aria) => (
                    <Select
                      {...aria}
                      name="businessStage"
                      defaultValue={profile.business_stage ?? ''}
                      required
                    >
                      <option value="" disabled>
                        Choose one
                      </option>
                      {BUSINESS_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {BUSINESS_STAGE_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
                <Field
                  id="location"
                  label="Where will it operate?"
                  description="An island, city or area is enough."
                  error={fieldErrors?.location?.[0]}
                >
                  {(aria) => (
                    <Input
                      {...aria}
                      name="location"
                      defaultValue={profile.location ?? ''}
                      required
                    />
                  )}
                </Field>
              </>
            );
          }
          if (step === 3) {
            return (
              <Field
                id="employeeCount"
                label="How many people will work in the business?"
                description="Include yourself. Enter 0 if you are not sure yet."
                error={fieldErrors?.employeeCount?.[0]}
              >
                {(aria) => (
                  <Input
                    {...aria}
                    name="employeeCount"
                    type="number"
                    min={0}
                    defaultValue={profile.employee_count ?? 0}
                    required
                  />
                )}
              </Field>
            );
          }
          if (step === 4) {
            return (
              <Field
                id="fundingAmount"
                label="How much funding do you think you need?"
                description="Optional — leave blank if you don't know yet. A guess you're unsure of is worse than no answer."
                error={fieldErrors?.fundingAmount?.[0]}
              >
                {(aria) => (
                  <Input
                    {...aria}
                    name="fundingAmount"
                    type="number"
                    min={0}
                    step="1"
                    defaultValue={profile.funding_requirement_amount ?? ''}
                  />
                )}
              </Field>
            );
          }
          return (
            <Field
              id="founderGoals"
              label="What do you want to achieve?"
              description="What would success look like in the next year?"
              error={fieldErrors?.founderGoals?.[0]}
            >
              {(aria) => (
                <textarea
                  {...aria}
                  name="founderGoals"
                  rows={4}
                  defaultValue={profile.founder_goals ?? ''}
                  className="border-border bg-surface text-foreground w-full rounded-md border px-3 py-2 text-sm"
                  required
                />
              )}
            </Field>
          );
        }}
      </StepForm>
    </div>
  );
}
