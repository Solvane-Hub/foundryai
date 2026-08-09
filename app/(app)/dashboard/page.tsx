import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Plus, Rocket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { getOwnProfile } from '@/services/profile';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { getIntakeProfile } from '@/services/intake';
import { buildJourney } from '@/services/progress';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Journey } from '../_components/journey';

export const metadata: Metadata = { title: 'Dashboard' };

const STATUS: Record<string, { label: string; tone: 'neutral' | 'brand' | 'success' }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  intake_started: { label: 'Intake in progress', tone: 'brand' },
  intake_complete: { label: 'Intake complete', tone: 'success' },
  launch_plan_generated: { label: 'Launch plan ready', tone: 'success' },
  active: { label: 'Active', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

/**
 * Founder workspace (Phase 7).
 *
 * Shows only real data. No placeholder compliance requirements, funding matches
 * or tasks appear anywhere — Constitution, Truth Before Fluency: a fabricated
 * requirement is indistinguishable from a real one to a founder acting on it.
 *
 * Deliberately NOT a grid of cards. There is one thing to look at — what to do
 * next — and the layout says so.
 */
export default async function DashboardPage() {
  const db = await createClient();
  const [user, businesses, store, profile] = await Promise.all([
    getCurrentUser(db),
    listBusinesses(db),
    cookies(),
    getOwnProfile(db),
  ]);

  const greeting = profile?.full_name?.split(' ')[0] ?? null;
  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);
  const intake = current ? await getIntakeProfile(db, current.id) : null;
  const journey = buildJourney(current, intake);
  const status = current
    ? (STATUS[current.status] ?? { label: current.status, tone: 'neutral' })
    : null;

  if (!current) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          title={greeting ? `Welcome, ${greeting}` : 'Welcome'}
          description={
            user?.email
              ? `You're signed in as ${user.email}. Let's set up your first business.`
              : "Let's set up your first business."
          }
        />
        <EmptyState
          icon={<Rocket aria-hidden="true" className="size-5" strokeWidth={1.75} />}
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
    <div className="flex max-w-3xl flex-col gap-10">
      <PageHeader
        eyebrow="Workspace"
        title={current.name}
        meta={
          <>
            <Badge tone={status!.tone}>{status!.label}</Badge>
            <span className="text-foreground-muted text-sm">
              {current.country_code}
              {current.industry ? ` · ${current.industry}` : ''}
            </span>
          </>
        }
        actions={
          <Link href="/businesses/new">
            <Button variant="secondary" size="sm">
              <Plus aria-hidden="true" strokeWidth={2} />
              Add business
            </Button>
          </Link>
        }
      />

      <Progress
        label="Setup progress"
        value={journey.completed}
        max={journey.total}
        caption={
          <>
            <span data-numeric>
              {journey.completed} of {journey.total}
            </span>{' '}
            steps done
          </>
        }
      />

      <Separator />

      {/* No card. A heading and space do the same job with less furniture. */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold tracking-[-0.01em]">Your next steps</h2>
          <p className="text-foreground-muted max-w-prose text-sm">
            What FoundryAI needs from you, and what it can do once it has it.
          </p>
        </div>
        <Journey milestones={journey.milestones} />
      </section>
    </div>
  );
}
