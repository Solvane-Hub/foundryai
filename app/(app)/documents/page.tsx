import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { getIntakeProfile } from '@/services/intake';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { PageHeader } from '@/components/ui/page-header';
import { RoadmapSurface, type Prerequisite } from '@/components/ui/roadmap-surface';

export const metadata: Metadata = { title: 'Documents' };

export default async function DocumentsPage() {
  const db = await createClient();
  const [businesses, store] = await Promise.all([listBusinesses(db), cookies()]);
  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);
  const intake = current ? await getIntakeProfile(db, current.id) : null;
  const intakeComplete = Boolean(intake?.completed_at);

  const prerequisites: Prerequisite[] = [
    {
      // No Knowledge Pack has been published. Stating that plainly is the
      // whole point of this page.
      label: 'A published Knowledge Pack',
      detail:
        'Validated regulatory sources for your jurisdiction, each one citable. The schema exists; no pack has been published yet.',
      met: false,
    },
  ];

  return (
    <div className="workspace-env flex max-w-4xl flex-col gap-8 pt-3 sm:pt-6">
      <PageHeader eyebrow="In development" title="Documents" />
      <RoadmapSurface
        purpose="Forms and records held against the requirement each one satisfies, so nothing is filed without a reason attached to it."
        prerequisites={prerequisites}
        today={
          intakeComplete
            ? {
                text: 'Your intake is complete, so FoundryAI already holds the profile this surface will be built on. Nothing further is needed from you here.',
                href: '/dashboard',
                label: 'Back to your workspace',
              }
            : {
                text: 'Completing your intake is the part of this that depends on you. The rest is ours to build.',
                href: '/intake',
                label: 'Continue intake',
              }
        }
      />
    </div>
  );
}
