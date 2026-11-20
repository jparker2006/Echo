"use client";

import { useEffect, useRef } from "react";

/**
 * A quiet 2px reading-progress hairline pinned to the top edge of post pages.
 * --p (0 → 1) tracks how far you are through the article. Position is
 * information, so it still tracks under reduced motion (no easing there).
 */
export function ReadingProgress() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const article = document.querySelector<HTMLElement>(".article");
    if (!el || !article) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const box = article.getBoundingClientRect();
      const top = box.top + window.scrollY;
      const end = top + box.height - window.innerHeight;
      const p = end > top ? (window.scrollY - top) / (end - top) : 1;
      el.style.setProperty("--p", Math.max(0, Math.min(1, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return <div className="reading-progress" ref={root} aria-hidden="true" />;
}
