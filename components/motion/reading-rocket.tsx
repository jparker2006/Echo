"use client";

import { useEffect, useRef, useState } from "react";

const IDLE_MS = 220; // the flame goes out this long after scrolling stops

/**
 * A small ASCII rocket that tracks how far you are into a post.
 *  - wide screens: it descends a dotted track in the left margin, nose down
 *  - narrow screens: it flies along the top edge, nose right
 * The flame burns while you scroll and goes out when you stop. At the end of
 * the post it lands, and becomes a button that takes you back to the top.
 * Position is information, so it still tracks under reduced motion (only the
 * flicker and easing are dropped).
 */
export function ReadingRocket() {
  const root = useRef<HTMLDivElement>(null);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    const el = root.current;
    const article = document.querySelector<HTMLElement>(".article");
    if (!el || !article) return;

    let raf = 0;
    let idle = 0;
    let wasLanded = false;

    const measure = () => {
      raf = 0;
      const box = article.getBoundingClientRect();
      const top = box.top + window.scrollY;
      const end = top + box.height - window.innerHeight;
      const p = end > top ? (window.scrollY - top) / (end - top) : 1;
      const clamped = Math.max(0, Math.min(1, p));
      el.style.setProperty("--p", clamped.toFixed(4));
      const nowLanded = clamped >= 0.995;
      if (nowLanded !== wasLanded) {
        wasLanded = nowLanded;
        setLanded(nowLanded);
      }
    };

    const onScroll = () => {
      el.classList.add("is-burning");
      window.clearTimeout(idle);
      idle = window.setTimeout(() => el.classList.remove("is-burning"), IDLE_MS);
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toTop = () => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.querySelector<HTMLElement>(".brand")?.focus({ preventScroll: true });
  };

  return (
    <div className={`reading-rocket${landed ? " is-landed" : ""}`} ref={root}>
      <div className="rr-track" aria-hidden="true" />
      <button
        type="button"
        className="rr-ship"
        onClick={toTop}
        disabled={!landed}
        aria-hidden={!landed}
        tabIndex={landed ? 0 : -1}
        aria-label="Back to top"
        title={landed ? "Back to top" : undefined}
      >
        {/* nose-down rocket for the margin track: fins and exhaust trail above */}
        <pre className="rr-art rr-art--down" aria-hidden="true">
          <span className="rr-flame">{"  .\n ':'\n"}</span>
          {"\\|=|/\n |o|\n | |\n \\ /\n  V"}
        </pre>
        {/* nose-right rocket for the top edge on narrow screens */}
        <pre className="rr-art rr-art--right" aria-hidden="true">
          <span className="rr-flame">{".:"}</span>
          {"}=[o]>"}
        </pre>
        <span className="rr-label" aria-hidden="true">
          ↑ top
        </span>
      </button>
    </div>
  );
}
