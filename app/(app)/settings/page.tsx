import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/services/auth';
import { listBusinesses, resolveCurrentBusiness } from '@/services/business';
import { CURRENT_BUSINESS_COOKIE } from '@/lib/business-cookie';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { EditBusinessForm } from '../_components/edit-business-form';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const db = await createClient();
  const [user, businesses, store] = await Promise.all([
    getCurrentUser(db),
    listBusinesses(db),
    cookies(),
  ]);
  const { data: profile } = await db.from('profiles').select('full_name').maybeSingle();
  const current = resolveCurrentBusiness(businesses, store.get(CURRENT_BUSINESS_COOKIE)?.value);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Card>
        <CardHeader title="Your account" />
        <dl className="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-foreground-muted">Name</dt>
          <dd>{profile?.full_name ?? '—'}</dd>
          <dt className="text-foreground-muted">Email</dt>
          <dd>{user?.email ?? '—'}</dd>
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Business details"
          description="Changes apply to the selected business."
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
            explanation="Business details appear here once you've created a business."
            nextStep="Create one from the dashboard."
          />
        )}
      </Card>
    </div>
  );
}
