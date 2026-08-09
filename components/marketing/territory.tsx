'use client';

import Image from 'next/image';
import { Banknote, Check, FileText, ListChecks, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useActiveStage } from './use-active-stage';

/**
 * Section 05 — over the territory.
 *
 * The system comes back out into the world it operates in. The approved hero
 * photograph returns, but not as a second hero: it is a sticky stage that the
 * content travels across, cropped to the outer cays rather than the hero's
 * centre, and it holds still while the roadmap passes over it. Background
 * persistence rather than element persistence — a different mechanism from
 * §02's rail, §03's window and §04's panels.
 *
 * The scrim sits on the RIGHT here. The hero's is on the left, so the two
 * compositions mirror rather than repeat.
 *
 * TRUTHFULNESS. All five surfaces are unbuilt and every one says so. The strip
 * above them names what does exist today, so the section cannot be read as a
 * feature list. Vocabulary matches the application's own navigation.
 */

const BLUR_DESKTOP =
  'data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAADwAQCdASoQAAsAAwBSJbACdAEO9FoHCaAAzIKbdn0xHQy75i5tpmZfBNGGpSeWLBuADo1oW74eJC3bsKH78VWgnG8VH5o2tFt/Fwndfb0Rx1WLH/4Z1h93Ye/0eG8BH6e0Uu9AAAA=';
const BLUR_MOBILE =
  'data:image/webp;base64,UklGRoYAAABXRUJQVlA4IHoAAABQBACdASoQABQAPt1apkyopSOiMAgBEBuJbACdMoGv/gPC6MG6nWYXrb9gAPffaH/83GIZXt0HcPpYAR4NY9X9kmZ2ob8BEig7tTL+mYoMkXKJNx/twOhrv7GBvDRT6GiRK8mfnC/AoWaBj3z8OviSma5JebK+XpuAAA==';

const SURFACES = [
  {
    icon: ListChecks,
    name: 'Timeline',
    line: 'Every requirement in the order that dependencies allow.',
  },
  {
    icon: ShieldCheck,
    name: 'Compliance',
    line: 'Obligations traced back to the legislation that created them.',
  },
  {
    icon: Banknote,
    name: 'Funding',
    line: 'Programmes assessed against where the business genuinely is.',
  },
  {
    icon: FileText,
    name: 'Documents',
    line: 'Records held against the requirement each one satisfies.',
  },
  {
    icon: Sparkles,
    name: 'Assistant',
    line: 'Answers drawn from the same cited evidence as the workspace.',
  },
] as const;

const AVAILABLE = ['Accounts', 'Business setup', 'Guided intake'];

export function Territory() {
  const { active, register, progress } = useActiveStage(SURFACES.length);

  return (
    <div className="relative">
      {/* Sticky stage. The photograph holds; the reader moves across it. */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Slow scale as the reader advances — travelling over territory, not
            a decorative zoom. Five discrete steps, smoothed by the transition. */}
        <div
          className="absolute inset-0 transition-transform duration-1000 ease-out"
          style={{ transform: `scale(${1 + progress * 0.05})` }}
        >
          <Image
            src="/hero/banks-desktop.webp"
            alt="Aerial view of the outer Exuma cays — green limestone islands, white sandbars and deep cobalt channels running out toward open ocean."
            fill
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR_DESKTOP}
            className="hidden object-cover object-[78%_center] md:block"
          />
          <Image
            src="/hero/banks-mobile.webp"
            alt="Aerial view of a sandbar curving through turquoise shallows in The Bahamas, with deep blue ocean beyond."
            fill
            sizes="100vw"
            placeholder="blur"
            blurDataURL={BLUR_MOBILE}
            className="object-cover object-[45%_38%] md:hidden"
          />
        </div>

        {/* Scrim right on desktop, bottom on mobile. Measured 14.15:1 for white
            text over the composited photograph. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden md:block"
          style={{
            background:
              'linear-gradient(280deg, oklch(18% 0.055 245 / 0.88) 0%, oklch(18% 0.055 245 / 0.80) 34%, oklch(18% 0.055 245 / 0.20) 62%, transparent 78%)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 md:hidden"
          style={{
            background:
              'linear-gradient(to top, oklch(18% 0.055 245 / 0.90) 0%, oklch(18% 0.055 245 / 0.82) 46%, oklch(18% 0.055 245 / 0.15) 78%, transparent 100%)',
          }}
        />

        {/* Content sits in the scrimmed half. */}
        <div className="absolute inset-0 flex items-end md:items-center md:justify-end">
          <div className="w-full px-6 pb-10 sm:px-8 md:max-w-[34rem] md:pr-12 md:pb-0 lg:max-w-[38rem] lg:pr-16">
            <p className="text-champagne text-2xs font-medium tracking-[0.16em] uppercase">
              On the roadmap
            </p>

            <ol className="mt-5 flex flex-col md:mt-7">
              {SURFACES.map(({ icon: Icon, name, line }, i) => {
                const isActive = i === active;
                return (
                  <li
                    key={name}
                    className={cn(
                      'flex gap-4 border-l-2 py-3 pl-4 transition-colors duration-500 md:py-4',
                      isActive ? 'border-bahama-turquoise' : 'border-white/15',
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        'mt-0.5 size-4 shrink-0 transition-colors duration-500',
                        isActive ? 'text-bahama-turquoise' : 'text-white/60',
                      )}
                      strokeWidth={1.75}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3
                          className={cn(
                            'text-base font-semibold transition-colors duration-500 md:text-lg',
                            isActive ? 'text-white' : 'text-white/75',
                          )}
                        >
                          {name}
                        </h3>
                        <span className="text-2xs font-medium tracking-wide text-white/70 uppercase">
                          In development
                        </span>
                      </div>
                      <p
                        className={cn(
                          'mt-1 text-sm text-pretty transition-colors duration-500',
                          isActive ? 'text-white/85' : 'text-white/65',
                        )}
                      >
                        {line}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* The honest counterweight: what actually exists today. */}
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/15 pt-5 md:mt-8">
              <span className="text-2xs font-medium tracking-wide text-white/70 uppercase">
                Available today
              </span>
              {AVAILABLE.map((a) => (
                <span
                  key={a}
                  className="border-bahama-turquoise/40 bg-bahama-turquoise/15 text-bahama-turquoise text-2xs inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium"
                >
                  <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll length. These carry no content — every surface above is always
          rendered — so they only drive emphasis, per the primitive's contract. */}
      <div aria-hidden="true">
        {SURFACES.map((s, i) => (
          <div key={s.name} ref={register(i)} className="h-[55svh]" />
        ))}
      </div>
    </div>
  );
}
