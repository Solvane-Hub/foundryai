import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { getIntakeProfile, intakeProgress } from '@/services/intake';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { BUSINESS_STAGE_LABELS, TOTAL_INTAKE_STEPS } from '@/lib/validation/intake';
import { Alert } from '@/components/ui/alert';
import { Card, CardHeader } from '@/components/ui/card';
import { CompleteIntakeForm } from '../_components/complete-form';

export const metadata: Metadata = { title: 'Review your answers' };

function Row({ label, value, step }: { label: string; value: string | null; step: number }) {
  return (
    <div className="border-border flex flex-col gap-1 border-b py-3 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-foreground-muted text-sm">{label}</dt>
        <Link
          href={`/intake?step=${step}`}
          className="text-brand text-xs underline underline-offset-4"
        >
          Edit
        </Link>
      </div>
      <dd className="text-sm whitespace-pre-wrap">
        {value ?? <span className="text-foreground-muted">Not answered</span>}
      </dd>
    </div>
  );
}

export default async function IntakeReviewPage() {
  const db = await createClient();
  const [businesses, store] = await Promise.all([listBusinesses(db), cookies()]);
  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);
  if (!current) redirect('/intake');

  const profile = await getIntakeProfile(db, current.id);
  if (!profile) redirect('/intake');

  const progress = intakeProgress(profile);
  const money =
    profile.funding_requirement_amount !== null
      ? `${profile.funding_requirement_currency ?? ''} ${Number(profile.funding_requirement_amount).toLocaleString()}`.trim()
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Review your answers</h1>
        <p className="text-foreground-muted text-sm">
          Check these before finishing. You can change any answer later.
        </p>
      </div>

      {progress.isComplete ? (
        <Alert tone="success" title="Intake complete">
          You can still edit any answer.
        </Alert>
      ) : null}

      <Card>
        <CardHeader title={current.name} />
        <dl>
          <Row label="What the business does" value={profile.description} step={1} />
          <Row
            label="Stage"
            value={
              profile.business_stage
                ? (BUSINESS_STAGE_LABELS[
                    profile.business_stage as keyof typeof BUSINESS_STAGE_LABELS
                  ] ?? profile.business_stage)
                : null
            }
            step={2}
          />
          <Row label="Where it operates" value={profile.location} step={2} />
          <Row
            label="People in the business"
            value={profile.employee_count !== null ? String(profile.employee_count) : null}
            step={3}
          />
          <Row label="Funding needed" value={money} step={4} />
          <Row label="Goals" value={profile.founder_goals} step={5} />
        </dl>
      </Card>

      {progress.completed < TOTAL_INTAKE_STEPS ? (
        <Alert tone="info" title="A few questions are still unanswered">
          Finish the remaining steps before completing intake.{' '}
          <Link href="/intake" className="underline underline-offset-4">
            Continue intake
          </Link>
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <Alert tone="info" title="What happens next">
            FoundryAI will use these answers to work out your requirements once the knowledge and AI
            layers are built. Nothing is submitted to any government agency.
          </Alert>
          <CompleteIntakeForm />
        </div>
      )}
    </div>
  );
}
