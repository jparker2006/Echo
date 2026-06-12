"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";

/**
 * A thin bar pinned to the top edge of the viewport that fills left→right as
 * the page is scrolled. It maps scroll position directly to scaleX (scrub),
 * so it is information rather than decoration — kept even under reduced
 * motion. Animates transform only; never affects layout.
 */
export function ReadingProgress() {
  const bar = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.to(bar.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          start: 0,
          end: "max",
          scrub: true,
        },
      });
      // Recompute end once layout (web fonts, code blocks) has settled.
      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: bar }
  );

  return <div ref={bar} className="reading-progress" aria-hidden="true" />;
}
