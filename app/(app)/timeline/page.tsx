import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Timeline' };

export default function TimelinePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
      <EmptyState
        title="Not built yet"
        explanation="This part of the workspace arrives in a later phase of the roadmap."
        nextStep="Nothing is shown here because nothing real exists to show yet."
      />
    </div>
  );
}
