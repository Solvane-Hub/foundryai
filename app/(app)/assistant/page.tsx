import type { Metadata } from 'next';
import { NotBuiltYet } from '@/components/ui/not-built-yet';
import { PageHeader } from '@/components/ui/page-header';

export const metadata: Metadata = { title: 'Nova' };

export default function AssistantPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader title="Nova" />
      <NotBuiltYet
        feature="Nova, your AI adviser"
        explanation="A conversation with FoundryAI about your business, grounded in the same evidence as the rest of your workspace."
      />
    </div>
  );
}
