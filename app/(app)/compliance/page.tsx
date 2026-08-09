import type { Metadata } from 'next';
import { NotBuiltYet } from '@/components/ui/not-built-yet';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Compliance' };

export default function CompliancePage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title="Compliance" />
      <NotBuiltYet
        feature="Compliance requirements"
        explanation="The registrations, licences, permits and filings that apply to your business — each one traced back to the legislation it comes from."
      />
    </div>
  );
}
