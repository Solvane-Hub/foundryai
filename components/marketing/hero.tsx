import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspacePanel } from './workspace-panel';

/**
 * The landing hero.
 *
 * A photograph of the Bahama Banks fills the viewport and the product sits
 * inside it. Two separate images, art-directed rather than cropped: the desktop
 * frame is a high-altitude view of the Exuma chain, the mobile frame is a
 * vertical sandbar composition with its own headline zone. One is not a resize
 * of the other, because a 3:2 aerial cropped to 4:5 loses the geography that
 * makes it worth showing.
 *
 * Legibility comes from a directional scrim in the photograph's own cobalt hue,
 * not a grey wash — the image reads as deepening water rather than as a picture
 * with something laid over it. White text on it measures 18.7:1.
 *
 * No client JavaScript. The entrance is a CSS keyframe, so the whole hero stays
 * a Server Component and `prefers-reduced-motion` neutralises it through the
 * global rule in globals.css.
 */
const BLUR_DESKTOP =
  'data:image/webp;base64,UklGRnIAAABXRUJQVlA4IGYAAADwAQCdASoQAAsAAwBSJbACdAEO9FoHCaAAzIKbdn0xHQy75i5tpmZfBNGGpSeWLBuADo1oW74eJC3bsKH78VWgnG8VH5o2tFt/Fwndfb0Rx1WLH/4Z1h93Ye/0eG8BH6e0Uu9AAAA=';
const BLUR_MOBILE =
  'data:image/webp;base64,UklGRoYAAABXRUJQVlA4IHoAAABQBACdASoQABQAPt1apkyopSOiMAgBEBuJbACdMoGv/gPC6MG6nWYXrb9gAPffaH/83GIZXt0HcPpYAR4NY9X9kmZ2ob8BEig7tTL+mYoMkXKJNx/twOhrv7GBvDRT6GiRK8mfnC/AoWaBj3z8OviSma5JebK+XpuAAA==';

export function Hero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      {/* ---- Environment ------------------------------------------------- */}
      <Image
        src="/hero/banks-desktop.webp"
        alt="Aerial view of the Exuma cays in The Bahamas — green limestone islands and white sandbars scattered through turquoise shallows, with deep cobalt channels running between them."
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={BLUR_DESKTOP}
        className="hidden object-cover object-center md:block"
      />
      <Image
        src="/hero/banks-mobile.webp"
        alt="Aerial view of a white sandbar curving through brilliant turquoise shallows in The Bahamas, with small green cays and deep blue ocean beyond."
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        blurDataURL={BLUR_MOBILE}
        className="object-cover object-[58%_center] md:hidden"
      />

      {/* Directional scrim. Strong at the origin, gone by two-thirds across, so
          most of the photograph is untouched. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-0"
        style={{
          background:
            'linear-gradient(168deg, oklch(18% 0.055 245 / 0.86) 0%, oklch(18% 0.055 245 / 0.72) 26%, oklch(18% 0.055 245 / 0.18) 58%, transparent 76%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40 md:hidden"
        style={{
          background: 'linear-gradient(to top, oklch(18% 0.055 245 / 0.75), transparent)',
        }}
      />

      {/* ---- Composition -------------------------------------------------- */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[92rem] flex-col px-6 pt-28 pb-16 sm:px-8 lg:px-12 lg:pt-32">
        <div className="grid flex-1 items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-8">
          {/* Type */}
          <div className="flex max-w-2xl flex-col items-start">
            <p className="text-bahama-sand text-2xs font-medium tracking-[0.18em] uppercase">
              The Bahamas
            </p>

            <h1 className="mt-6 text-[clamp(2.75rem,7.2vw,5.25rem)] leading-[0.98] font-semibold tracking-[-0.035em] text-balance text-white">
              Every business
              <br />
              has a route.
              <br />
              <span className="text-bahama-turquoise">Yours starts here.</span>
            </h1>

            <p className="mt-8 max-w-md text-base text-pretty text-white/80 sm:text-lg">
              FoundryAI works out what your business actually needs — formation, licences,
              compliance, funding — and shows you the legislation behind every requirement.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="text-ink bg-white shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-white"
                >
                  Start building
                  <ArrowRight aria-hidden="true" strokeWidth={2} />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="border-white/30 bg-white/10 text-white shadow-none backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/20"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          {/* Product. Tilted and pushed past the container on wide screens so it
              is cropped by the viewport — an object continuing beyond the frame
              rather than a card parked in a column. */}
          <div className="hero-panel lg:-mr-24 lg:[perspective:2000px] xl:-mr-32">
            <WorkspacePanel className="lg:[transform:rotateY(-9deg)_rotateX(2.5deg)_translateZ(0)]" />
          </div>
        </div>

        {/* Scroll invitation */}
        <div className="mt-14 flex items-center gap-3">
          <span className="text-2xs font-medium tracking-[0.18em] text-white/70 uppercase">
            Scroll to explore
          </span>
          <span aria-hidden="true" className="relative h-px w-14 overflow-hidden bg-white/25">
            <span className="hero-rule absolute inset-y-0 left-0 w-5 bg-white/90" />
          </span>
        </div>
      </div>
    </section>
  );
}
