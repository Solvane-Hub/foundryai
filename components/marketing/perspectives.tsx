'use client';

import { useId, useRef, useState } from 'react';
import { Check, Compass, Layers, Scale, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Section 04 — four instruments, one system.
 *
 * Four vertical panels descending marine → abyss, left to right. The page has
 * read top-to-bottom since the hero; this one reads across, which is the
 * largest compositional change available without leaving the visual language.
 * Depth is the argument: "four ways to look at the same system" becomes four
 * depths of the same water.
 *
 * INTERACTION. §02 and §03 are both scroll-driven. A third would make the page
 * feel like it knows one trick, so this one is user-driven: click or keyboard
 * to open; hover only brightens a collapsed label. Hover-to-activate was
 * tried and removed — reaching the fourth panel drags the selection through
 * the second and third on the way.
 *
 * ARIA — a deliberate departure worth explaining. The brief asked to preserve
 * the tablist. A valid `tablist` may only contain `tab` children, with panels
 * as siblings outside it; here each trigger lives inside the column it opens
 * and the open column moves depending on selection, which cannot be expressed
 * as one tablist plus one panel region without absolute-positioning hacks.
 * This is the APG **accordion** shape instead — heading + button with
 * `aria-expanded`/`aria-controls`, panel as a labelled region — extended with
 * the arrow/Home/End key handling the tabs pattern would have given. Identical
 * behaviour for the reader, valid semantics underneath.
 *
 * TRUTHFULNESS. The previous version listed capabilities as flat statements
 * with no status anywhere, so a visitor could reasonably conclude all four
 * views shipped. Every row now carries its real state.
 */

type Status = 'available' | 'development';

interface View {
  id: string;
  label: string;
  icon: typeof Layers;
  tone: string;
  headline: string;
  body: string;
  capabilities: readonly { name: string; status: Status }[];
}

const VIEWS: readonly View[] = [
  {
    id: 'build',
    label: 'Build',
    icon: Layers,
    tone: 'bg-marine',
    headline: 'Start the business properly the first time.',
    body: 'Structure, registration and the filings that make a business real — in an order that accounts for what blocks what.',
    capabilities: [
      { name: 'Guided intake', status: 'available' },
      { name: 'Business setup', status: 'available' },
      { name: 'Registration sequence', status: 'development' },
    ],
  },
  {
    id: 'understand',
    label: 'Understand',
    icon: Compass,
    tone: 'bg-depth-2',
    headline: 'Know exactly what applies to you.',
    body: 'Requirements derived from your jurisdiction and industry, each carrying the source it came from. Nothing asserted without a citation.',
    capabilities: [
      { name: 'Requirements we found', status: 'development' },
      { name: 'Cited to legislation', status: 'development' },
      { name: 'Plain-language explanations', status: 'development' },
    ],
  },
  {
    id: 'operate',
    label: 'Operate',
    icon: Scale,
    tone: 'bg-depth-3',
    headline: 'Stay current without watching for changes.',
    body: 'Obligations recur and sources change. When a regulation moves, the plans that relied on it are flagged rather than quietly going stale.',
    capabilities: [
      { name: 'Recurring obligations', status: 'development' },
      { name: 'Change detection', status: 'development' },
      { name: 'Renewal awareness', status: 'development' },
    ],
  },
  {
    id: 'grow',
    label: 'Grow',
    icon: TrendingUp,
    tone: 'bg-abyss',
    headline: 'See what you are ready for next.',
    body: 'Funding programmes and growth steps assessed against where the business actually is, with the eligibility logic shown rather than hidden.',
    capabilities: [
      { name: 'Readiness signals', status: 'development' },
      { name: 'Programme matching', status: 'development' },
      { name: 'Eligibility logic shown', status: 'development' },
    ],
  },
];

export function Perspectives() {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);

  /** Arrow/Home/End move between panels, as the tabs pattern would. Both axes
   *  are handled because the layout is horizontal on desktop and vertical on
   *  mobile, and a reader should not have to know which. */
  function onKeyDown(e: React.KeyboardEvent) {
    const last = VIEWS.length - 1;
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = active === last ? 0 : active + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = active === 0 ? last : active - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    if (next === null) return;
    e.preventDefault();
    setActive(next);
    triggers.current[next]?.focus();
  }

  return (
    <div
      onKeyDown={onKeyDown}
      className="border-marine-line/60 flex flex-col overflow-hidden rounded-2xl border lg:h-[34rem] lg:flex-row"
    >
      {VIEWS.map((view, i) => {
        const open = i === active;
        const Icon = view.icon;
        const panelId = `${baseId}-panel-${view.id}`;
        const buttonId = `${baseId}-trigger-${view.id}`;

        return (
          <div
            key={view.id}
            data-open={open}
            className={cn(
              'depth-panel relative flex min-w-0 shrink-0 flex-col',
              'border-marine-line/60 border-t first:border-t-0 lg:border-t-0 lg:border-l lg:first:border-l-0',
              view.tone,
            )}
          >
            {/* Active rule. Draws across the open panel; a hairline otherwise. */}
            <span
              aria-hidden="true"
              className={cn(
                'bg-bahama-turquoise absolute top-0 left-0 h-0.5 transition-[width] duration-500 ease-out',
                open ? 'w-full' : 'w-0',
              )}
            />

            <h3 className={cn('m-0', !open && 'lg:flex-1')}>
              <button
                ref={(el) => {
                  triggers.current[i] = el;
                }}
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setActive(i)}
                className={cn(
                  'group flex w-full items-center gap-3 px-5 py-5 text-left transition-colors',
                  'hover:bg-on-ink/[0.03] focus-visible:outline-offset-[-3px]',
                  'lg:h-full lg:flex-col lg:items-start lg:justify-between lg:py-7',
                  open && 'lg:h-auto lg:flex-row lg:items-center lg:pb-0',
                )}
              >
                <span
                  data-numeric
                  aria-hidden="true"
                  className={cn(
                    'text-2xs shrink-0 font-medium tabular-nums transition-colors duration-300',
                    open ? 'text-bahama-turquoise' : 'text-on-ink-muted',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                {/* Collapsed columns turn their label on its side — the only way
                    a 6.5rem column can carry a readable name. */}
                <span
                  className={cn(
                    'text-base font-semibold tracking-[-0.015em] transition-colors duration-300',
                    open ? 'text-on-ink' : 'text-on-ink-muted group-hover:text-on-ink',
                    !open && 'lg:rotate-180 lg:[writing-mode:vertical-rl]',
                  )}
                >
                  {view.label}
                </span>

                <Icon
                  aria-hidden="true"
                  className={cn(
                    'ml-auto size-4 shrink-0 transition-colors duration-300 lg:ml-0',
                    open ? 'text-bahama-turquoise' : 'text-on-ink-muted',
                    !open && 'lg:mt-auto',
                  )}
                  strokeWidth={1.75}
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="min-h-0 flex-1 overflow-y-auto px-5 pt-1 pb-6 lg:px-7 lg:pb-8"
            >
              <div className="max-w-xl">
                <p className="text-on-ink text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-3xl">
                  {view.headline}
                </p>
                <p className="text-on-ink-muted mt-4 text-sm text-pretty sm:text-base">
                  {view.body}
                </p>

                <ul className="border-marine-line/50 mt-8 flex flex-col border-t">
                  {view.capabilities.map((c) => (
                    <li
                      key={c.name}
                      className="border-marine-line/50 flex items-center justify-between gap-4 border-b py-3"
                    >
                      <span className="text-on-ink text-sm">{c.name}</span>
                      <StatusChip status={c.status} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusChip({ status }: { status: Status }) {
  const available = status === 'available';
  return (
    <span
      className={cn(
        'text-2xs inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium tracking-wide whitespace-nowrap uppercase',
        available
          ? 'border-bahama-turquoise/35 bg-bahama-turquoise/12 text-bahama-turquoise'
          : 'border-marine-line/80 text-on-ink-muted',
      )}
    >
      {available ? <Check aria-hidden="true" className="size-3" strokeWidth={3} /> : null}
      {available ? 'Available now' : 'In development'}
    </span>
  );
}
