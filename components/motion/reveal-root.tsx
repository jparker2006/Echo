"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "./gsap";
import { motion, queries } from "@/lib/motion/tokens";

/**
 * The animated `.wrap` shared by every page. It owns the global entrance:
 *   - [data-reveal]      → top-level blocks (masthead, prompt, title) that
 *                          fade + rise on mount, staggered.
 *   - [data-reveal-row]  → list rows that cascade in. On desktop they reveal
 *                          via a one-shot ScrollTrigger batch (so below-fold
 *                          rows print in as you reach them and never replay);
 *                          on mobile they simply ride the on-mount stagger.
 *
 * All motion is gated by gsap.matchMedia(): desktop / mobile / reduce. Targets
 * are pre-hidden in CSS (html[data-motion]) so there's no flash before this
 * effect runs; entrances use fromTo with an explicit opacity:1 end so the
 * settled state is the natural one, and clearProps:"transform" hands the
 * element back to CSS (so :hover transforms work). Only opacity + transform
 * ever animate — zero layout shift.
 */
export function RevealRoot({
  children,
  className = "wrap",
}: {
  children: ReactNode;
  /** container class for the animated root. Defaults to the centered `.wrap`
      reading column; pages with their own layout (e.g. the snake-eyes demo)
      pass their own wrapper so the same entrance applies without forcing the
      reading column on them. */
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;
      const blocks = gsap.utils.toArray<HTMLElement>("[data-reveal]", el);
      const rows = gsap.utils.toArray<HTMLElement>("[data-reveal-row]", el);

      const mm = gsap.matchMedia();

      // ── desktop ──────────────────────────────────────────────
      mm.add(queries.desktop, () => {
        if (blocks.length) {
          gsap.fromTo(
            blocks,
            { opacity: 0, y: motion.travel },
            {
              opacity: 1,
              y: 0,
              duration: motion.duration,
              ease: motion.ease,
              stagger: motion.stagger,
              clearProps: "transform",
            }
          );
        }
        if (rows.length) {
          gsap.set(rows, { opacity: 0, y: motion.travel });
          const triggers = ScrollTrigger.batch(rows, {
            start: "top 92%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, {
                opacity: 1,
                y: 0,
                duration: motion.duration,
                ease: motion.ease,
                stagger: motion.stagger,
                clearProps: "transform",
                overwrite: true,
              }),
          });
          return () => triggers.forEach((t) => t.kill());
        }
      });

      // ── mobile: lighter, all on mount, no scroll triggers ────
      mm.add(queries.mobile, () => {
        const all = [...blocks, ...rows];
        if (all.length) {
          gsap.fromTo(
            all,
            { opacity: 0, y: motion.travelMobile },
            {
              opacity: 1,
              y: 0,
              duration: motion.duration,
              ease: motion.ease,
              stagger: motion.stagger,
              clearProps: "transform",
            }
          );
        }
      });

      // ── reduce: no motion. Targets were never hidden (the inline
      //    script skips data-motion under reduce), so nothing to do. ──
      mm.add(queries.reduce, () => {});
    },
    { scope: root }
  );

  return (
    <div className={className} ref={root}>
      {children}
    </div>
  );
}
