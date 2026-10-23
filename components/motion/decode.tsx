"use client";

import { useEffect, useRef } from "react";

const NOISE = "ABCDEFGHJKLMNPQRSTUVWXYZ#%&@$*+=<>/\\|01";
const DURATION = 900; // ms

/**
 * A headline that "decodes" from scrambled characters into its real text on
 * load. The real text is always in the DOM (so it's what search engines and
 * screen readers get, and what shows with JS off); while decoding it's held
 * transparent to keep layout fixed, and an aria-hidden overlay shows the
 * scramble. Skipped entirely under reduced motion.
 */
export function Decode({ text }: { text: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const overlay = document.createElement("span");
    overlay.className = "decode-overlay";
    overlay.setAttribute("aria-hidden", "true");
    const done = document.createElement("span");
    const noise = document.createElement("span");
    noise.className = "decode-noise";
    overlay.append(done, noise);
    el.append(overlay);
    el.classList.add("is-decoding");

    // each character settles at its own moment, roughly left to right
    const settleAt = Array.from(text, (_, i) => (i / text.length) * 0.7 + Math.random() * 0.3);
    const start = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      let solved = 0;
      while (solved < text.length && settleAt[solved] <= p) solved++;
      done.textContent = text.slice(0, solved);
      let rest = "";
      for (let i = solved; i < text.length; i++) {
        const ch = text[i];
        rest += ch === " " ? " " : settleAt[i] <= p ? ch : NOISE[(Math.random() * NOISE.length) | 0];
      }
      noise.textContent = rest;
      if (p < 1) raf = requestAnimationFrame(frame);
      else finish();
    };
    const finish = () => {
      overlay.remove();
      el.classList.remove("is-decoding");
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      finish();
    };
  }, [text]);

  return (
    <span className="decode" ref={root}>
      {text}
    </span>
  );
}
