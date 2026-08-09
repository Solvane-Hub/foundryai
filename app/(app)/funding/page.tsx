import type { Metadata } from 'next';
import { NotBuiltYet } from '@/components/ui/not-built-yet';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Funding' };

export default function FundingPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title="Funding" />
      <NotBuiltYet
        feature="Funding opportunities"
        explanation="Grants, loans and programmes matched to your industry, stage and jurisdiction, with the eligibility rules that decided the match."
      />
    </div>
  );
}
