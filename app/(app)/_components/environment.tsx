import Image from 'next/image';

/**
 * The water the workspace sits in.
 *
 * A tidal channel cutting through the banks — the same territory as the
 * landing hero, photographed somewhere else in it. That is the whole idea of
 * the authenticated shell: the hero is the territory seen from outside, this
 * is the operating environment inside it. Reusing the hero frame would have
 * said "same page", not "further in".
 *
 * The frame is graded and blurred at build time (public/workspace/) rather
 * than in CSS: it ships at 29 KB, it cannot be knocked out of range by a
 * filter change, and every contrast figure in this file was measured against
 * the actual pixels.
 *
 * The scrim is a single gradient, top- and bottom-weighted. The top band
 * carries the identity zone and the header, which are the only text that sits
 * directly on the environment; the bottom band carries the surface tiles. The
 * clear middle is where the workspace shell floats, so nothing needs to be
 * legible there.
 *
 * `aria-hidden` throughout, and `alt=""`: this is atmosphere. A screen reader
 * describing an aerial photograph of water before the founder's next action is
 * noise.
 *
 * `z-0`, deliberately not a negative index. A negative-z child paints after
 * its stacking context's own background but before that context's in-flow
 * descendants, so `-z-10` would have been covered by any background colour on
 * the shell root and the environment would simply never have appeared. The
 * fallback colour therefore lives on this element, beneath the photograph, and
 * the shell's content sits above it on `z-10`.
 */
export function Environment() {
  return (
    <div
      aria-hidden="true"
      className="bg-abyss pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <Image
        src="/workspace/channel-mobile.webp"
        alt=""
        fill
        sizes="100vw"
        quality={70}
        className="object-cover object-center sm:hidden"
      />
      <Image
        src="/workspace/channel-desktop.webp"
        alt=""
        fill
        sizes="100vw"
        quality={70}
        className="hidden object-cover object-center sm:block"
      />

      {/* Minimum alpha 0.45, where the shell sits. White measures 10.63:1 and
          `on-ink-muted` 4.53:1 against the brightest pixel even there. */}
      <div className="from-abyss/88 via-abyss/45 to-abyss/82 absolute inset-0 bg-gradient-to-b" />

      {/* A second, heavier wash under the identity zone and header. Text on
          the bare environment only ever appears inside this band. */}
      <div className="from-abyss/80 absolute inset-x-0 top-0 h-96 bg-gradient-to-b to-transparent" />
    </div>
  );
}
