'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Scroll-driven stage tracking — the shared interaction primitive.
 *
 * This is deliberately the only place on the marketing site that decides "which
 * thing is the reader looking at". Roadmap sections, product previews,
 * compliance visualisations and the eventual Nova surfaces should all consume
 * this rather than each growing their own observer, because five slightly
 * different definitions of "active" is how a site starts feeling arbitrary.
 *
 * Design rules baked in:
 *
 *  • A narrow band across the middle of the viewport, not the edges. The active
 *    stage is what the reader is actually looking at, not whatever last clipped
 *    the bottom of the screen.
 *  • Degrades to stage 0 with everything still rendered. Callers must keep all
 *    content in the DOM — this drives emphasis, never existence, so no content
 *    is ever gated behind JavaScript or behind scrolling.
 *  • No wheel or scroll listeners. IntersectionObserver only, so there is
 *    nothing running on the main thread between intersections.
 */
export interface ActiveStage {
  /** Index of the stage currently in the reading band. */
  active: number;
  /** Ref callback to attach to each stage element, in order. */
  register: (index: number) => (el: HTMLElement | null) => void;
  /** 0–1 progress across the whole set, for rails and fills. */
  progress: number;
}

export function useActiveStage(count: number): ActiveStage {
  const [active, setActive] = useState(0);
  const nodes = useRef<(HTMLElement | null)[]>([]);

  const register = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      nodes.current[index] = el;
    },
    [],
  );

  useEffect(() => {
    const elements = nodes.current.filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    // Degrade rather than throw where the API is unavailable. Every stage is
    // still readable; only the emphasis is lost.
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = elements.indexOf(entry.target as HTMLElement);
          if (i !== -1) setActive(i);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [count]);

  const progress = count <= 1 ? 1 : active / (count - 1);
  return { active, register, progress };
}
