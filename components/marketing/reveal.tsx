'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Scroll-reveal — the second shared motion primitive, alongside
 * `useActiveStage`. Sections 04–06 should use this rather than growing their
 * own transition classes.
 *
 * The rule it enforces is the one that is easy to get wrong: a reveal is
 * EMPHASIS, NEVER EXISTENCE. Content is fully visible on the server render and
 * before hydration, and the pre-reveal state is only applied once JavaScript is
 * running. So a reader with JS disabled, a crawler, or anything reading the
 * initial HTML gets the whole page — they simply do not get the animation.
 *
 * The naive version (`opacity-0` in the markup, class swapped on intersect)
 * hides content permanently whenever the script fails, which is a correctness
 * bug wearing an animation's clothes.
 *
 * Reduced motion is handled globally: `globals.css` collapses transition
 * duration to 0.01ms, so the reveal resolves instantly rather than being
 * removed — no content is ever left mid-transition.
 */
/**
 * Returns false on the server and during hydration, true afterwards.
 *
 * `useSyncExternalStore` rather than `setState` in an effect: the store never
 * changes, so the subscribe callback is a no-op and React simply uses the
 * server snapshot until hydration completes. This is the sanctioned way to ask
 * "have we hydrated yet" — the effect version trips
 * `react-hooks/set-state-in-effect` and causes an extra render besides.
 */
const subscribe = () => () => {};

export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true, // client
    () => false, // server + first hydration pass
  );
}

export function Reveal({
  show,
  children,
  className,
  /** Stagger within a group, in ms. Keep small — this is emphasis, not theatre. */
  delay = 0,
}: {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const mounted = useHasMounted();
  // Before hydration `mounted` is false, so `revealed` is true and nothing is
  // hidden. This is the whole safety property of the component.
  const revealed = !mounted || show;

  return (
    <div
      className={cn(
        'transition-[opacity,transform] duration-500 ease-out',
        revealed ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
        className,
      )}
      style={delay && !revealed ? undefined : { transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/**
 * Latching in-view flag — the third shared motion primitive.
 *
 * `useActiveStage` answers "which of these is the reader on"; this answers "has
 * the reader arrived here yet", and never goes back to false. Use it for
 * entry-triggered motion that should happen once, not for anything that tracks
 * scroll position.
 *
 * Same safety rule as `Reveal`: it reports true until hydration, so server HTML
 * and no-JS readers get the settled state. Only after mounting can it report
 * false, and only for content the reader has not reached — which below the fold
 * means there is nothing to flash.
 */
export function useInView<T extends HTMLElement>(rootMargin = '-15% 0px -15% 0px') {
  const mounted = useHasMounted();
  const [seen, setSeen] = useState(false);
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [seen, rootMargin]);

  return { ref, inView: !mounted || seen };
}
