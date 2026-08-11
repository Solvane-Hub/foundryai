import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Plus, Rocket } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { getOwnProfile } from '@/services/profile';
import { getActiveCountries, listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { getIntakeProfile, intakeProgress } from '@/services/intake';
import { buildJourney } from '@/services/progress';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { BUSINESS_STAGE_LABELS, type BusinessStage } from '@/lib/validation/intake';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { WorkspaceCanvas } from '@/components/ui/workspace-canvas';
import { WorkspaceSurface, SurfaceLabel } from '@/components/ui/workspace-surface';
import { BusinessSnapshot, type SnapshotRow } from '../_components/business-snapshot';
import { IntakeDial } from '../_components/intake-dial';
import { NextMove } from '../_components/next-move';
import { RouteSummary } from '../_components/route-summary';
import { SurfaceTiles } from '../_components/surface-tiles';

export const metadata: Metadata = { title: 'Dashboard' };

const STATUS: Record<string, string> = {
  draft: 'Draft',
  intake_started: 'Intake in progress',
  intake_complete: 'Intake complete',
  launch_plan_generated: 'Launch plan ready',
  active: 'Active',
  archived: 'Archived',
};

/**
 * The founder briefing.
 *
 * Four questions in order: where am I, what do I do next, what does FoundryAI
 * know, where am I on the route. Everything on the page comes from data the
 * founder already supplied or from `buildJourney()` — no metrics, no activity,
 * no charts of nothing.
 *
 * The composition is one instrument panel, not a grid of cards. The identity
 * zone sits directly on the water; the shell below it holds four modules
 * separated by hairlines rather than by gaps, because they are sections of one
 * reading rather than four independent widgets. The tiles underneath are the
 * only free-standing objects, and that is deliberate — they are the surfaces
 * that are not part of the instrument yet.
 *
 * Constitution, Truth Before Fluency: a fabricated requirement is
 * indistinguishable from a real one to a founder acting on it. Nothing here is
 * invented, and unanswered fields are omitted rather than filled with dashes.
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

  if (!current) {
    return (
      <WorkspaceCanvas>
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
      </WorkspaceCanvas>
    );
  }

  const [intake, countries] = await Promise.all([
    getIntakeProfile(db, current.id),
    getActiveCountries(db),
  ]);
  const journey = buildJourney(current, intake);
  const progress = intakeProgress(intake);
  const intakeComplete = Boolean(intake?.completed_at);
  const status = STATUS[current.status] ?? current.status;

  // The country is stored as an ISO code; the founder should read the name.
  const countryName =
    countries.find((c) => c.code === current.country_code)?.name ?? current.country_code;

  // Only rows with a real value. An unanswered question is left out entirely
  // and accounted for in the footnote instead.
  const rows: SnapshotRow[] = [{ label: 'Jurisdiction', value: countryName, href: '/settings' }];
  if (current.industry)
    rows.push({ label: 'Industry', value: current.industry, href: '/settings' });
  if (intake?.business_stage) {
    rows.push({
      label: 'Stage',
      value: BUSINESS_STAGE_LABELS[intake.business_stage as BusinessStage] ?? intake.business_stage,
      href: '/intake?step=2',
    });
  }
  if (intake?.location)
    rows.push({ label: 'Location', value: intake.location, href: '/intake?step=2' });
  if (typeof intake?.employee_count === 'number') {
    rows.push({
      label: 'Team',
      value: intake.employee_count === 1 ? 'Just you' : `${intake.employee_count} people`,
      href: '/intake?step=3',
    });
  }
  if (
    intake?.funding_requirement_amount !== null &&
    intake?.funding_requirement_amount !== undefined
  ) {
    rows.push({
      label: 'Funding needed',
      value: `${intake.funding_requirement_currency ?? ''} ${Number(
        intake.funding_requirement_amount,
      ).toLocaleString()}`.trim(),
      href: '/intake?step=4',
    });
  }

  return (
    <div className="workspace-env flex flex-col gap-6 sm:gap-8">
      {/* 1 — where am I. On the water, not on a surface. */}
      <header className="flex flex-col gap-5 px-1 pt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8 sm:pt-8 lg:pt-10">
        <div className="min-w-0">
          <p className="text-2xs text-champagne font-medium tracking-[0.18em] uppercase">
            {greeting ? `${greeting}’s workspace` : 'Workspace'}
          </p>
          <h1 className="text-on-ink mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-4xl lg:text-5xl">
            {current.name}
          </h1>
          <p className="text-on-ink-muted mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
            <span>{countryName}</span>
            {current.industry ? (
              <>
                <span aria-hidden="true" className="text-on-ink-muted">
                  ·
                </span>
                <span>{current.industry}</span>
              </>
            ) : null}
            <span aria-hidden="true" className="h-3 w-px bg-white/20" />
            <span className="text-on-ink">{status}</span>
          </p>
        </div>

        <Link href="/businesses/new" className="shrink-0">
          <Button variant="secondary" size="sm" className="rounded-full">
            <Plus aria-hidden="true" strokeWidth={2} />
            Add business
          </Button>
        </Link>
      </header>

      {/* 2 — the instrument. One surface, four sections, hairlines between. */}
      <WorkspaceSurface className="flex flex-col divide-y divide-white/8">
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)] lg:p-7">
          <NextMove milestone={journey.next} />
          <IntakeDial completed={progress.completed} total={progress.total} />
        </div>

        <section
          aria-labelledby="snapshot-heading"
          className="flex flex-col gap-6 px-4 py-7 sm:px-6 sm:py-9 lg:px-7"
        >
          <div className="flex flex-col gap-2">
            <SurfaceLabel id="snapshot-heading">What FoundryAI knows</SurfaceLabel>
            {intake?.description ? (
              <p className="text-on-ink-muted max-w-2xl text-sm text-pretty italic">
                “{intake.description}”
              </p>
            ) : null}
          </div>
          <BusinessSnapshot rows={rows} unanswered={progress.total - progress.completed} />
        </section>

        <section
          aria-labelledby="route-heading"
          className="flex flex-col gap-7 px-4 py-7 sm:px-6 sm:py-9 lg:px-7"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <SurfaceLabel id="route-heading">Your route</SurfaceLabel>
            <p className="text-on-ink-muted text-xs">
              What FoundryAI needs from you, and what it can do once it has it.
            </p>
          </div>
          <RouteSummary milestones={journey.milestones} />
        </section>
      </WorkspaceSurface>

      {/* 3 — the rooms that are coming online. */}
      <section aria-labelledby="surfaces-heading" className="flex flex-col gap-4">
        <SurfaceLabel id="surfaces-heading" className="px-1">
          Coming online
        </SurfaceLabel>
        <SurfaceTiles intakeComplete={intakeComplete} />
      </section>
    </div>
  );
}
