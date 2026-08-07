import Link from 'next/link';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { getIntakeProfile, intakeProgress } from '@/services/intake';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Dashboard' };

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  intake_started: 'Intake in progress',
  intake_complete: 'Intake complete',
  launch_plan_generated: 'Launch plan ready',
  active: 'Active',
  archived: 'Archived',
};

/**
 * Founder workspace.
 *
 * Shows only real data. No placeholder compliance requirements, funding matches,
 * or tasks appear anywhere — Constitution, Truth Before Fluency: a fabricated
 * requirement is indistinguishable from a real one to a founder acting on it.
 */
export default async function DashboardPage() {
  const db = await createClient();
  const [user, businesses, store] = await Promise.all([
    getCurrentUser(db),
    listBusinesses(db),
    cookies(),
  ]);

  const { data: profile } = await db.from('profiles').select('full_name').maybeSingle();
  const greeting = profile?.full_name?.split(' ')[0] ?? null;
  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);
  const intake = current ? intakeProgress(await getIntakeProfile(db, current.id)) : null;

  if (!current) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting ? `Welcome, ${greeting}` : 'Welcome'}
          </h1>
          <p className="text-foreground-muted text-sm">
            You&apos;re signed in{user?.email ? ` as ${user.email}` : ''}.
          </p>
        </div>

        <EmptyState
          title="You haven't created a business yet"
          explanation="FoundryAI works out what your business needs — registrations, licences, permits and funding — from the country and industry you're operating in."
          nextStep="Start by telling us what you're building."
          action={
            <Link href="/businesses/new">
              <Button>Create your first business</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{current.name}</h1>
          <div className="flex items-center gap-2">
            <Badge>{STATUS_LABEL[current.status] ?? current.status}</Badge>
            <span className="text-foreground-muted text-sm">
              {current.country_code}
              {current.industry ? ` · ${current.industry}` : ''}
            </span>
          </div>
        </div>
        <Link href="/businesses/new">
          <Button variant="secondary" size="sm">
            Add another business
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader
          title="Business intake"
          description="The details FoundryAI needs before it can work out your requirements."
        />
        {intake && intake.isComplete ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">All questions answered.</p>
            <Link
              href="/intake/review"
              className="text-brand w-fit text-sm underline underline-offset-4"
            >
              Review your answers
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-foreground-muted text-sm">
              {intake && intake.completed > 0
                ? `${intake.completed} of ${intake.total} questions answered.`
                : 'Not started yet.'}
            </p>
            <Link href="/intake">
              <Button size="sm">
                {intake && intake.completed > 0 ? 'Continue intake' : 'Start intake'}
              </Button>
            </Link>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Your launch roadmap"
          description="Your personalised list of registrations, licences, permits and funding."
        />
        <EmptyState
          title="Not generated yet"
          explanation="FoundryAI builds your roadmap from your intake answers and the government sources in your country's Knowledge Pack."
          nextStep="The knowledge and AI layers arrive in later sprints. Nothing is shown here because nothing real exists to show."
        />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Compliance" />
          <p className="text-foreground-muted text-sm">
            Requirements are generated from authoritative government sources, each with a citation.
            Not yet available.
          </p>
        </Card>
        <Card>
          <CardHeader title="Funding" />
          <p className="text-foreground-muted text-sm">
            Programmes are matched against your business profile, with eligibility evidence. Not yet
            available.
          </p>
        </Card>
      </div>
    </div>
  );
}
