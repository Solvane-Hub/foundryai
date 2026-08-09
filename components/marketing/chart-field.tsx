import { cn } from '@/lib/utils/cn';

/**
 * Bathymetric contour field — the recurring motif of the landing page.
 *
 * The Bahamas is, geographically, a limestone bank: hundreds of miles of
 * shallow, navigable water that ends in an abrupt drop into deep ocean. On a
 * nautical chart that reads as widely spaced contours suddenly compressing at
 * the shelf edge. That is the whole product argument in one image — most of the
 * route is knowable, and the danger is where the lines bunch up.
 *
 * Deliberately a chart rather than a seascape: this is infrastructure for
 * operators, not a tourism site. Pure inline SVG — no photography, no external
 * request, ~2 KB, and it scales to any viewport without art direction.
 *
 * Entirely decorative, so `aria-hidden`.
 */
export function ChartField({
  className,
  tone = 'ink',
  flip,
}: {
  className?: string;
  tone?: 'ink' | 'canvas';
  flip?: boolean;
}) {
  const stroke = tone === 'ink' ? 'var(--color-champagne)' : 'var(--color-brand)';

  // Contours run wide on the left (the bank) and compress toward the right
  // (the drop-off). Hand-authored rather than generated so the spacing is
  // musical instead of merely random.
  const contours: { d: string; o: number; w: number }[] = [
    { d: 'M-40 300 C 220 268, 430 258, 700 246 S 1180 214, 1480 176', o: 0.32, w: 1 },
    { d: 'M-40 352 C 210 322, 440 310, 706 296 S 1176 258, 1480 214', o: 0.28, w: 1 },
    { d: 'M-40 404 C 200 376, 450 362, 712 346 S 1172 302, 1480 252', o: 0.24, w: 1 },
    { d: 'M-40 458 C 196 432, 456 416, 718 398 S 1168 348, 1480 292', o: 0.2, w: 1 },
    { d: 'M-40 516 C 192 492, 462 474, 724 454 S 1164 396, 1480 334', o: 0.17, w: 1 },
    { d: 'M-40 580 C 190 558, 468 538, 730 516 S 1160 450, 1480 380', o: 0.14, w: 1 },
    { d: 'M-40 654 C 188 634, 474 612, 736 588 S 1156 512, 1480 432', o: 0.11, w: 1 },
    { d: 'M-40 742 C 186 724, 480 700, 742 674 S 1152 586, 1480 494', o: 0.08, w: 1 },
    // The shelf edge itself — the one line allowed to be thicker.
    { d: 'M-40 246 C 230 212, 424 202, 694 190 S 1184 158, 1480 118', o: 0.5, w: 1.5 },
  ];

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className={cn('pointer-events-none absolute inset-0 h-full w-full', className)}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
    >
      <defs>
        {/* Contours fade out before the edges so the field reads as a fragment
            of a much larger chart rather than a graphic that stops. */}
        <linearGradient id="cf-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.22" stopColor="white" stopOpacity="1" />
          <stop offset="0.78" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="cf-mask">
          <rect width="1440" height="900" fill="url(#cf-fade)" />
        </mask>
      </defs>

      <g mask="url(#cf-mask)" fill="none" stroke={stroke} strokeLinecap="round">
        {contours.map((c, i) => (
          <path key={i} d={c.d} strokeWidth={c.w} strokeOpacity={c.o} />
        ))}
        {/* Sounding marks: depth figures on a chart. Three only — a scatter of
            them would be decoration, and this is meant to read as a document. */}
        <g stroke={stroke} strokeOpacity="0.35" strokeWidth="1">
          <path d="M300 330 v10 M295 335 h10" />
          <path d="M812 372 v10 M807 377 h10" />
          <path d="M1120 300 v10 M1115 305 h10" />
        </g>
      </g>
    </svg>
  );
}
