import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

/**
 * The FoundryAI mark.
 *
 * Authoritative brand asset — not redrawn, recoloured or reinterpreted. The
 * source PNG is cropped to its ink bounding box (510×623, aspect 0.8186) so a
 * height prop produces the width you expect; the original had 40% transparent
 * margin, which makes every layout containing it lie about its size.
 *
 * The mark is metallic champagne and measures 1.84:1 on the light canvas. It is
 * therefore only placed on `ink` surfaces, where it reads at 10:1. Callers on
 * light backgrounds should use the FoundryAI wordmark instead.
 */
const ASPECT = 510 / 623;

export function LogoMark({
  height = 28,
  className,
  priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/brand/foundryai-mark.png"
      // Decorative: the accessible name always comes from the adjacent
      // "FoundryAI" wordmark, so announcing the mark too would just stutter.
      alt=""
      aria-hidden="true"
      width={Math.round(height * ASPECT)}
      height={height}
      className={cn('h-auto w-auto select-none', className)}
      style={{ height, width: Math.round(height * ASPECT) }}
      {...(priority ? { priority: true } : {})}
    />
  );
}

/** Mark + wordmark. The accessible name lives on the text. */
export function Logo({
  height = 26,
  className,
  priority,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark height={height} {...(priority ? { priority: true } : {})} />
      <span className="text-[1.0625rem] font-semibold tracking-[-0.02em]">FoundryAI</span>
    </span>
  );
}
