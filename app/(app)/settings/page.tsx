import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { getOwnProfile } from '@/services/profile';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { EditBusinessForm } from '../_components/edit-business-form';
import { EditProfileForm } from '../_components/edit-profile-form';
import { ArchiveBusinessForm } from '../_components/archive-business-form';

export const metadata: Metadata = { title: 'Settings' };

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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader title="Your account" />
        <p className="text-foreground-muted mb-4 text-sm">
          Signed in as <span className="text-foreground">{user?.email ?? '—'}</span>. Your email
          address is managed by your sign-in and cannot be changed here yet.
        </p>
        <EditProfileForm fullName={profile?.full_name ?? null} />
      </Card>

      <Card>
        <CardHeader
          title="Business details"
          description="Changes apply to the business currently selected."
        />
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
      </Card>

      {current ? (
        <Card className="border-red-200">
          <CardHeader title="Archive business" />
          <ArchiveBusinessForm businessId={current.id} name={current.name} />
        </Card>
      ) : null}
    </div>
  );
}
