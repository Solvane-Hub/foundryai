import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { getOwnProfile } from '@/services/profile';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { DestructiveZone } from '@/components/ui/destructive-zone';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Separator } from '@/components/ui/separator';
import { EditBusinessForm } from '../_components/edit-business-form';
import { EditProfileForm } from '../_components/edit-profile-form';
import { ArchiveBusinessForm } from '../_components/archive-business-form';

export const metadata: Metadata = { title: 'Settings' };

/**
 * Settings as labelled sections rather than stacked cards.
 *
 * A two-column split puts the section name and its explanation on the left and
 * the controls on the right, so the page can be scanned by heading. Three
 * identical boxes could only be read top to bottom.
 */
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description ? (
          <p className="text-foreground-muted max-w-prose text-sm">{description}</p>
        ) : null}
      </div>
      <div className="max-w-xl min-w-0">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const db = await createClient();
  const [user, businesses, store, profile] = await Promise.all([
    getCurrentUser(db),
    listBusinesses(db),
    cookies(),
    getOwnProfile(db),
  ]);
  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);

  return (
    <div className="flex max-w-4xl flex-col gap-10">
      <PageHeader
        title="Settings"
        description="Your account and the business currently selected in the workspace."
      />

      <Separator />

      <Section
        title="Your account"
        description="Your email address is managed by your sign-in and cannot be changed here yet."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-foreground-muted text-xs font-medium">Signed in as</span>
            <span className="text-foreground text-sm">{user?.email ?? '—'}</span>
          </div>
          <EditProfileForm fullName={profile?.full_name ?? null} />
        </div>
      </Section>

      <Separator />

      <Section
        title="Business details"
        description="Changes apply to the business currently selected."
      >
        {current ? (
          <EditBusinessForm
            businessId={current.id}
            name={current.name}
            industry={current.industry}
          />
        ) : (
          <EmptyState
            title="No business selected"
            explanation="Business details appear here once you have created a business."
            nextStep="Create one from the dashboard."
          />
        )}
      </Section>

      {current ? (
        <>
          <Separator />
          <Section title="Danger zone" description="Actions that change what you can see.">
            <DestructiveZone title="Archive this business">
              <ArchiveBusinessForm businessId={current.id} name={current.name} />
            </DestructiveZone>
          </Section>
        </>
      ) : null}
    </div>
  );
}
