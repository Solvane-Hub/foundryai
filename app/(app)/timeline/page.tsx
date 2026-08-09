import type { Metadata } from 'next';
import { NotBuiltYet } from '@/components/ui/not-built-yet';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Timeline' };

export default function TimelinePage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title="Timeline" />
      <NotBuiltYet
        feature="Your launch timeline"
        explanation="A sequenced plan of every registration, licence and deadline your business needs, ordered by what blocks what."
      />
    </div>
  );
}
