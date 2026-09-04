import type { Metadata } from 'next';
import { RoadmapRoute } from '../_components/roadmap-route';

export const metadata: Metadata = { title: 'Documents' };

/**
 * Documents is not built yet.
 *
 * Everything except the title and the purpose sentence is shared with the other
 * roadmap surfaces, including the prerequisite states — which are COMPUTED from
 * the database rather than asserted here. See `RoadmapRoute`.
 */
export default function DocumentsPage() {
  return (
    <RoadmapRoute
      title="Documents"
      purpose="Forms and records held against the requirement each one satisfies, so nothing is filed without a reason attached to it."
    />
  );
}
