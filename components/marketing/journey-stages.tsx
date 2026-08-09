'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useActiveStage } from './use-active-stage';

/**
 * Section 02 — the route.
 *
 * The hero establishes the environment; this establishes the journey through
 * it. Deep ink after a bright photograph: the chapter break is the transition
 * from THE BAHAMAS to THE ROUTE, and it lets the turquoise pulled from the
 * water do the work of showing progress.
 *
 * Structure is a sticky instrument beside normally-flowing content, rather than
 * a pinned panel that cross-fades. That matters for accessibility: reading
 * order stays natural, nothing is hidden behind scroll position, and the
 * instrument — which only duplicates what the prose already says — can be
 * `aria-hidden` without losing anything.
 *
 * TRUTHFULNESS: only stage 01 is available. Guided intake exists; formation
 * guidance, compliance, funding and growth do not. Each stage carries its real
 * status and the section says so in the open. The product's own vocabulary
 * ("In development") is reused rather than invented.
 */

type Status = 'available' | 'development';

interface Stage {
  id: string;
  name: string;
  status: Status;
  line: string;
  body: string;
  covers: readonly string[];
}

const STAGES: readonly Stage[] = [
  {
    id: 'idea',
    name: 'Idea',
    status: 'available',
    line: 'What are you actually building?',
    body: 'A short structured intake — what the business does, where it operates, how many people, what you need. Plain language, saved as you go, resumable at any point.',
    covers: ['Guided intake', 'Business profile', 'Resumable answers'],
  },
  {
    id: 'formation',
    name: 'Formation',
    status: 'development',
    line: 'Becoming a business on paper.',
    body: 'Registration, structure and the filings that make the business real — sequenced so you do them in an order that works rather than discovering a dependency halfway through.',
    covers: ['Legal structure', 'Registration order', 'Filing dependencies'],
  },
  {
    id: 'compliance',
    name: 'Compliance',
    status: 'development',
    line: 'What the law actually asks of you.',
    body: 'Licences, permits and obligations for your industry and jurisdiction, each one traced back to the Act, regulation or notice it came from. Nothing asserted without a source.',
    covers: ['Licences and permits', 'Cited to legislation', 'Renewal dates'],
  },
  {
    id: 'funding',
    name: 'Funding',
    status: 'development',
    line: 'What you are ready for.',
    body: 'Programmes and facilities matched against your stage and sector, with the eligibility rules that decided the match shown alongside rather than hidden behind a score.',
    covers: ['Readiness signals', 'Programme matching', 'Eligibility logic'],
  },
  {
    id: 'growth',
    name: 'Growth',
    status: 'development',
    line: 'Keeping the business current.',
    body: 'Obligations recur and rules change. When a source changes, the plans that cited it are flagged for review rather than quietly going stale in the background.',
    covers: ['Recurring obligations', 'Change detection', 'Plan review'],
  },
];

const STATUS_LABEL: Record<Status, string> = {
  available: 'Available now',
  development: 'In development',
};

export function JourneyStages() {
  const { active, register, progress } = useActiveStage(STAGES.length);

  return (
    <div className="relative grid gap-x-16 gap-y-12 lg:grid-cols-[19rem_minmax(0,1fr)]">
      {/* ---- Instrument. Duplicates the prose, so it is hidden from AT. ---- */}
      <aside aria-hidden="true" className="hidden lg:block">
        <div className="sticky top-28 flex flex-col">
          <span
            data-numeric
            className="text-bahama-turquoise/85 text-[8rem] leading-[0.8] font-semibold tracking-[-0.05em] tabular-nums"
          >
            {String(active + 1).padStart(2, '0')}
          </span>
          <span className="text-on-ink mt-6 text-3xl font-semibold tracking-[-0.02em]">
            {STAGES[active]!.name}
          </span>

          {/* Route rail. One continuous line with a fill that advances — the
              progress is the line's own length, not a separate widget. */}
          <div className="mt-10 flex gap-5">
            <div className="relative w-px shrink-0 bg-white/12">
              <div
                className="bg-bahama-turquoise absolute inset-x-0 top-0 origin-top transition-[height] duration-500 ease-out"
                style={{ height: `${progress * 100}%` }}
              />
            </div>

            <ol className="flex flex-col gap-5">
              {STAGES.map((stage, i) => (
                <li key={stage.id} className="relative flex items-center gap-3">
                  <span
                    className={cn(
                      'absolute -left-[1.4375rem] flex size-2.5 items-center justify-center rounded-full transition-colors duration-500',
                      i < active && 'bg-bahama-turquoise',
                      i === active && 'bg-bahama-turquoise ring-bahama-turquoise/25 ring-4',
                      // white/25 measured 2.19:1 — effectively invisible while
                      // still carrying state. 40% clears the 3:1 floor.
                      i > active && 'bg-white/40',
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm transition-colors duration-500',
                      i === active
                        ? 'text-on-ink font-medium'
                        : i < active
                          ? 'text-on-ink-muted'
                          : 'text-on-ink-subtle',
                    )}
                  >
                    {stage.name}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </aside>

      {/* ---- Stages. Normal flow, full content, always present. ---- */}
      <div className="flex flex-col">
        {STAGES.map((stage, i) => {
          const isActive = i === active;
          return (
            <div
              key={stage.id}
              ref={register(i)}
              className={cn(
                'border-t border-white/8 py-12 first:border-t-0 first:pt-0 lg:py-20',
                'transition-opacity duration-500',
                // Emphasis only, and floored at 75%: at 55% the body copy
                // measured 3.23:1 on ink, which fails AA for real prose. The
                // active stage is carried by the turquoise numeral, the chips
                // and the rail — the opacity dip is a secondary cue, so it can
                // afford to be gentle.
                'lg:opacity-100',
                !isActive && 'lg:opacity-75',
              )}
            >
              <div className="flex items-center gap-4">
                <span
                  data-numeric
                  aria-hidden="true"
                  className={cn(
                    'text-2xs font-medium tabular-nums transition-colors duration-500',
                    isActive ? 'text-bahama-turquoise' : 'text-on-ink-muted',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <StatusChip status={stage.status} />
              </div>

              <h3 className="text-on-ink mt-5 text-3xl font-semibold tracking-[-0.025em] lg:text-4xl">
                {stage.name}
              </h3>

              <p className="text-on-ink mt-4 max-w-xl text-lg text-pretty">{stage.line}</p>
              <p className="text-on-ink-muted mt-3 max-w-xl text-sm text-pretty">{stage.body}</p>

              <ul className="mt-7 flex flex-wrap gap-2">
                {stage.covers.map((c) => (
                  <li
                    key={c}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs transition-colors duration-500',
                      isActive
                        ? 'border-bahama-turquoise/30 bg-bahama-turquoise/10 text-on-ink'
                        : 'text-on-ink-muted border-white/12',
                    )}
                  >
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  const available = status === 'available';
  return (
    <span
      className={cn(
        'text-2xs inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium tracking-wide uppercase',
        available
          ? 'border-bahama-turquoise/35 bg-bahama-turquoise/12 text-bahama-turquoise'
          : 'text-on-ink-subtle border-white/15',
      )}
    >
      {available ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : null}
      {STATUS_LABEL[status]}
    </span>
  );
}
