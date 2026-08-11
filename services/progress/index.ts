import type { Business, BusinessProfile } from '@/types/business';
import { TOTAL_INTAKE_STEPS } from '@/lib/validation/intake';
// The knowledge module only, not the Intake service: this needs the pure
// reader, and importing the service would drag Supabase and audit into a
// function that touches neither.
import { knowledgeCompleteness } from '@/services/intake/knowledge';

/**
 * Founder journey progress (Phase 7).
 *
 * Derives a single "what should I do next" answer from real state. Milestones
 * for capabilities that do not exist yet are marked `blocked` with an honest
 * reason rather than shown as pending work the founder could act on —
 * Constitution, Truth Before Fluency.
 */
export type MilestoneState = 'complete' | 'current' | 'upcoming' | 'blocked';

export interface Milestone {
  key: string;
  title: string;
  description: string;
  state: MilestoneState;
  href?: string;
  actionLabel?: string;
}

export interface JourneyProgress {
  milestones: Milestone[];
  completed: number;
  total: number;
  percent: number;
  next: Milestone | null;
}

export function buildJourney(
  business: Business | null,
  profile: BusinessProfile | null,
): JourneyProgress {
  const hasBusiness = Boolean(business);
  // Knowledge, not the guided-flow cursor (ADR-0020). The dashboard's "next
  // move" copy and the intake rail must report the same number, or a founder
  // whose profile Nova populated would read "0 of 5 answered" beside a dial
  // showing three.
  const answered = knowledgeCompleteness(profile).known;
  const intakeStarted = hasBusiness && answered > 0;
  const intakeDone = Boolean(profile?.completed_at);

  const milestones: Milestone[] = [
    {
      key: 'business',
      title: 'Create your business',
      description: hasBusiness
        ? `${business!.name} · ${business!.country_code}`
        : 'Tell us what you are building and where.',
      state: hasBusiness ? 'complete' : 'current',
      ...(hasBusiness ? {} : { href: '/businesses/new', actionLabel: 'Create business' }),
    },
    {
      key: 'intake',
      title: 'Complete your intake',
      description: intakeDone
        ? 'All questions answered.'
        : intakeStarted
          ? `${answered} of ${TOTAL_INTAKE_STEPS} questions answered.`
          : 'Five short questions about your business.',
      state: intakeDone ? 'complete' : hasBusiness ? 'current' : 'upcoming',
      ...(hasBusiness && !intakeDone
        ? { href: '/intake', actionLabel: intakeStarted ? 'Continue intake' : 'Start intake' }
        : {}),
      ...(intakeDone ? { href: '/intake/review', actionLabel: 'Review answers' } : {}),
    },
    {
      key: 'roadmap',
      title: 'Generate your launch roadmap',
      description:
        'Requires the Knowledge Pack and AI layers, which are not built yet. Nothing is shown here because nothing real exists to show.',
      state: 'blocked',
    },
    {
      key: 'compliance',
      title: 'Review your requirements',
      description:
        'Registrations, licences and permits, each traceable to the government source it came from.',
      state: 'blocked',
    },
    {
      key: 'funding',
      title: 'Explore funding',
      description: 'Programmes matched to your business, with eligibility evidence.',
      state: 'blocked',
    },
  ];

  // Only milestones a founder can actually act on count toward progress.
  // Including blocked ones would make the platform look permanently stalled.
  const actionable = milestones.filter((m) => m.state !== 'blocked');
  const completed = actionable.filter((m) => m.state === 'complete').length;

  return {
    milestones,
    completed,
    total: actionable.length,
    percent: Math.round((completed / actionable.length) * 100),
    next: milestones.find((m) => m.state === 'current') ?? null,
  };
}
