import type { Metadata } from 'next';
import type { Milestone } from '@/services/progress';
import { Journey } from '@/app/(app)/_components/journey';
import { Hero } from '@/components/marketing/hero';
import { SiteHeader } from '@/components/marketing/site-header';
import { JourneyStages } from '@/components/marketing/journey-stages';
import { Perspectives } from '@/components/marketing/perspectives';
import { ProductReveal } from '@/components/marketing/product-reveal';
import { SectionHeading } from '@/components/marketing/section';
import { Territory } from '@/components/marketing/territory';
import { Closing } from '@/components/marketing/closing';
import { SiteFooter } from '@/components/marketing/site-footer';

export const metadata: Metadata = {
  title: 'FoundryAI — Build a business in The Bahamas',
  description:
    'FoundryAI works out what your business needs — formation, licences, compliance and funding — for the country and industry you operate in, with the legislation behind every requirement.',
};

/**
 * Visual Experience v1 — the landing page.
 *
 * Composed of six chapters that alternate between ink and canvas: deep water,
 * then the chart. The dark chapters exist because the FoundryAI mark is
 * metallic champagne and cannot be read on a light surface; the alternation
 * turned out to carry the argument as well.
 *
 * This file is a Server Component and stays one. The only client code on the
 * page is two leaf components that genuinely need state — the scroll-driven
 * stage rail and the perspectives tablist.
 *
 * `EXAMPLE_MILESTONES` is illustrative content, clearly labelled as such
 * wherever it renders. It is shaped as real `Milestone` values so the marketing
 * page renders the *actual* Journey component: if the product changes, this
 * page changes with it rather than drifting into fiction.
 */
const EXAMPLE_MILESTONES: Milestone[] = [
  {
    key: 'business',
    title: 'Create your business',
    description: 'Conch & Coast Ltd. · BS',
    state: 'complete',
  },
  {
    key: 'intake',
    title: 'Complete your intake',
    description: '3 of 5 questions answered.',
    state: 'current',
    href: '/signup',
    actionLabel: 'Continue intake',
  },
  {
    key: 'requirements',
    title: 'Requirements we found',
    description:
      'What your business needs to register, licence and file — each one cited to its source.',
    state: 'upcoming',
  },
  {
    key: 'plan',
    title: 'Your launch plan',
    description: 'Arriving in a later phase of the roadmap.',
    state: 'blocked',
  },
];

export default function HomePage() {
  return (
    <>
      {/* The landing page has no app chrome, so it carries its own skip link. */}
      <a
        href="#main"
        className="bg-on-ink text-ink sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>

      {/* The header is absolutely positioned over the hero photograph but stays
          a sibling of `main`, so it keeps its `banner` role and no content sits
          outside a landmark (axe `region`). */}
      <div className="relative">
        <SiteHeader />
        <main id="main">
          <Hero />
          {/* 02 — the route. Ink after the bright hero: the chapter break is
              the move from THE BAHAMAS to THE ROUTE. */}
          <section id="journey" className="bg-ink text-on-ink relative isolate overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(90% 55% at 15% 0%, oklch(76% 0.127 203 / 0.10) 0%, transparent 62%)',
              }}
            />
            <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:px-8 lg:px-12 lg:py-36">
              <SectionHeading
                tone="ink"
                index="02"
                eyebrow="The route"
                title="One route, from idea to operating business."
                lede="FoundryAI holds the whole path and works out which parts of it apply to you. Guided intake is available today; the stages beyond it are in development, and each one below says which it is."
              />
              <div className="mt-20 lg:mt-28">
                <JourneyStages />
              </div>
            </div>
          </section>

          {/* 03 — inside the system. Stays in the ink/marine family: §02 and
              §03 are the same environment at different depths, not two themes.
              The route line from §02 continues down this section's gutter. */}
          <section className="bg-marine text-on-ink relative isolate overflow-hidden">
            {/* Seam from §02's ink, and back down to ink for §04 — the section
                is a tonal band rather than a flat block. */}
            <div
              aria-hidden="true"
              className="from-ink pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b to-transparent"
            />
            <div
              aria-hidden="true"
              className="to-ink pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-b from-transparent"
            />
            {/* Light from the water surface far above. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  'radial-gradient(80% 45% at 30% 0%, oklch(76% 0.127 203 / 0.07) 0%, transparent 60%)',
              }}
            />

            <div className="mx-auto w-full max-w-[84rem] px-6 py-24 sm:px-8 lg:px-12 lg:py-36">
              <SectionHeading
                tone="ink"
                index="03"
                eyebrow="The system"
                title="Watch it work through the route."
                lede="The same journey, now from the inside. Your words go in, structure comes out, and the route resolves into one thing to do next."
              />
              <div className="mt-16 lg:mt-24">
                <ProductReveal journey={<Journey milestones={EXAMPLE_MILESTONES} />} />
              </div>
            </div>
          </section>

          {/* 04 — four instruments. Stays in the ink family; the variation is
              horizontal composition and a marine → abyss descent across the
              four panels rather than a change of tone for the section. */}
          <section className="bg-ink text-on-ink relative isolate overflow-hidden">
            <div className="mx-auto w-full max-w-[88rem] px-6 py-24 sm:px-8 lg:px-12 lg:py-36">
              <SectionHeading
                tone="ink"
                index="04"
                eyebrow="Perspectives"
                title="Four ways to look at the same system."
                lede="Build, understand, operate, grow. Not four products — four views of one, and each says plainly which parts exist today."
              />
              <div className="mt-14 lg:mt-20">
                <Perspectives />
              </div>
            </div>
          </section>

          {/* 05 — over the territory. The environment returns: a marine
              intro, then the approved photograph as a sticky stage the roadmap
              travels across. Relief for the lower half of the page without
              leaving the visual language. */}
          <section className="bg-marine text-on-ink relative isolate">
            <div
              aria-hidden="true"
              className="from-ink pointer-events-none absolute inset-x-0 top-0 -z-10 h-48 bg-gradient-to-b to-transparent"
            />
            <div className="mx-auto w-full max-w-6xl px-6 pt-24 pb-16 sm:px-8 lg:px-12 lg:pt-36 lg:pb-24">
              <SectionHeading
                tone="ink"
                index="05"
                eyebrow="The environment"
                title="Built for the place it operates in."
                lede="FoundryAI exists for businesses forming in The Bahamas. What follows is where the product is going — described as direction, not as capability."
              />
            </div>

            <Territory />
          </section>

          <Closing />
        </main>
      </div>

      <SiteFooter />
    </>
  );
}
