"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createHorizon, HORIZON_REST, PALETTE, shadeHorizon, type Horizon, type HorizonLight } from "@/lib/ascii";

const EASE = 0.14; // how quickly the light catches up with the pointer, per frame

/**
 * Makes the footer horizon follow the mouse: the sun slides with the pointer,
 * sweeping the day side and the bright limb across the planet, and a soft
 * spotlight lifts the clouds, the atmosphere and nearby stars under it. When
 * the pointer leaves, the light eases back to rest. Mouse only; nothing runs
 * under reduced motion or until the pointer moves over the footer. The
 * server-rendered still frames (`children`) are re-lit in place.
 */
export function HorizonLive({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const footer = el?.closest<HTMLElement>(".site-foot");
    if (!el || !footer) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const scenes = new Map<HTMLPreElement, Horizon>();
    let cur: HorizonLight = { ...HORIZON_REST };
    let target: HorizonLight = { ...HORIZON_REST };
    let pre: HTMLPreElement | null = null;
    let raf = 0;

    // the still frame CSS is showing (wide or narrow grid), baked lazily
    const visible = () => Array.from(el.querySelectorAll("pre")).find((p) => p.getClientRects().length > 0) ?? null;
    const sceneFor = (p: HTMLPreElement) => {
      let h = scenes.get(p);
      if (!h) {
        h = createHorizon(Number(p.dataset.w), Number(p.dataset.h));
        scenes.set(p, h);
      }
      return h;
    };

    const paint = () => {
      if (!pre) return;
      let html = "";
      for (const runs of shadeHorizon(sceneFor(pre), cur)) {
        html += "<span>";
        for (const run of runs) {
          const text = run.text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
          html += run.tone ? `<span style="color:${PALETTE[run.tone]}">${text}</span>` : `<span>${text}</span>`;
        }
        html += "\n</span>";
      }
      pre.innerHTML = html;
    };

    const tick = () => {
      let moving = false;
      for (const key of ["sunX", "spot", "spotC", "spotR"] as const) {
        const d = target[key] - cur[key];
        if (Math.abs(d) > 0.002) {
          cur[key] += d * (key === "spotC" || key === "spotR" ? EASE * 2.5 : EASE);
          moving = true;
        } else cur[key] = target[key];
      }
      paint();
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !finePointer.matches || reduce.matches) return;
      const p = visible();
      if (!p) return;
      if (p !== pre) {
        pre = p;
        cur.spotC = target.spotC; // don't sweep the spotlight in from the old grid's position
      }
      const h = sceneFor(p);
      const box = p.getBoundingClientRect();
      const fx = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width));
      const fy = (e.clientY - box.top) / box.height;
      target = { sunX: (fx - 0.5) * 2.2, spot: 1, spotC: fx * h.W, spotR: fy * h.H };
      if (cur.spot < 0.01) {
        // start the spotlight where the pointer entered instead of gliding in from a corner
        cur.spotC = target.spotC;
        cur.spotR = target.spotR;
      }
      kick();
    };
    const onLeave = () => {
      if (!pre) return;
      target = { ...HORIZON_REST, spotC: cur.spotC, spotR: cur.spotR };
      kick();
    };

    footer.addEventListener("pointermove", onMove, { passive: true });
    footer.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      footer.removeEventListener("pointermove", onMove);
      footer.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className="foot-horizon" ref={wrap} aria-hidden="true">
      {children}
    </div>
  );
}
