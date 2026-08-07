import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getActiveCountries } from '@/services/business';
import { Alert } from '@/components/ui/alert';
import { CreateBusinessForm } from '../../_components/create-business-form';

export const metadata: Metadata = { title: 'Create a business' };

export default async function NewBusinessPage() {
  const db = await createClient();
  const countries = await getActiveCountries(db);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create a business</h1>
        <p className="text-foreground-muted text-sm">
          You can change any of this later. Nothing here is submitted to any government agency.
        </p>
      </div>

      {countries.length === 0 ? (
        <Alert tone="info" title="No jurisdictions are available yet">
          FoundryAI needs an active country before a business can be created. Please contact
          support.
        </Alert>
      ) : (
        <CreateBusinessForm countries={countries.map((c) => ({ code: c.code, name: c.name }))} />
      )}
    </div>
  );
}
