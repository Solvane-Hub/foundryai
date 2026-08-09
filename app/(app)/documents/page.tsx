import type { Metadata } from 'next';
import { NotBuiltYet } from '@/components/ui/not-built-yet';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Documents' };

export default function DocumentsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title="Documents" />
      <NotBuiltYet
        feature="Your documents"
        explanation="Forms, applications and records for your business, kept alongside the requirement each one satisfies."
      />
    </div>
  );
}
