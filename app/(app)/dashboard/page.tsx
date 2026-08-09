import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { getOwnProfile } from '@/services/profile';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { getIntakeProfile } from '@/services/intake';
import { buildJourney } from '@/services/progress';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Journey } from '../_components/journey';

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
 * Founder workspace (Phase 7).
 *
 * Shows only real data. No placeholder compliance requirements, funding matches
 * or tasks appear anywhere — Constitution, Truth Before Fluency: a fabricated
 * requirement is indistinguishable from a real one to a founder acting on it.
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {current ? current.name : greeting ? `Welcome, ${greeting}` : 'Welcome'}
          </h1>
          {current ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{STATUS_LABEL[current.status] ?? current.status}</Badge>
              <span className="text-foreground-muted text-sm">
                {current.country_code}
                {current.industry ? ` · ${current.industry}` : ''}
              </span>
            </div>
          ) : (
            <p className="text-foreground-muted text-sm">
              You&apos;re signed in{user?.email ? ` as ${user.email}` : ''}.
            </p>
          )}
        </div>
        {current ? (
          <Link href="/businesses/new">
            <Button variant="secondary" size="sm">
              Add another business
            </Button>
          </Link>
        ) : null}
      </div>

      {current ? (
        <div className="flex flex-col gap-1.5">
          <div className="text-foreground-muted flex justify-between text-xs">
            <span>
              {journey.completed} of {journey.total} steps done
            </span>
            <span>{journey.percent}%</span>
          </div>
          <div
            className="bg-surface-muted h-2 w-full overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={journey.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
          >
            <div
              className="bg-brand h-full rounded-full transition-all"
              style={{ width: `${journey.percent}%` }}
            />
          </div>
        </div>
      ) : null}

      {current ? (
        <Card>
          <CardHeader
            title="Your next steps"
            description="What FoundryAI needs from you, and what it can do once it has it."
          />
          <Journey milestones={journey.milestones} />
        </Card>
      ) : (
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
      )}
    </div>
  );
}
