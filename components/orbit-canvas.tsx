"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FOOT_HORIZON, footerScene, heroScene, paint } from "@/lib/orbit-art";

const FRAME_MS = 1000 / 30; // the engraving gains nothing from 60fps, and the CPU matters
const EASE = 0.12; // how quickly the footer light catches up with the pointer, per frame

/**
 * Paints one of the two scenes on a canvas over the server-rendered SVG still
 * (`children`). `hero` slowly turns the planet. `footer` also lets the mouse
 * move the light: the limb glow and the lit side of the planet follow the
 * pointer and ease back to centre when it leaves. Mouse only; under reduced
 * motion the canvas draws one still frame and nothing moves. Pauses offscreen
 * and in hidden tabs. The loop never touches React state.
 */
export function OrbitCanvas({ kind, children }: { kind: "hero" | "footer"; children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;
    const host = (kind === "footer" && el.closest<HTMLElement>(".site-foot")) || el;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let t = 0;
    let drawnAt = 0;
    let raf = 0;
    let visible = true;
    let cur: { x: number; y: number } | null = null; // footer light, eased
    let target: { x: number; y: number } | null = null; // pointer position; null = rest

    const size = () => {
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
    };

    const restLight = () => ({ x: w * 0.5, y: h * FOOT_HORIZON });

    const ease = () => {
      if (kind !== "footer") return false;
      cur ??= restLight();
      const goal = target ?? restLight();
      const dx = goal.x - cur.x;
      const dy = goal.y - cur.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) {
        cur = { ...goal };
        return false;
      }
      cur = { x: cur.x + dx * EASE, y: cur.y + dy * EASE };
      return true;
    };

    const draw = () => {
      if (!w) return;
      const items = kind === "hero" ? heroScene(w, h, t) : footerScene(w, h, t, cur ?? restLight());
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      paint(ctx, items);
    };

    const canAnimate = () => visible && !document.hidden && !reduce.matches;

    let easing = false; // the footer light is still moving toward its goal
    const frame = (now: number) => {
      raf = 0;
      if (!drawnAt || now - drawnAt >= FRAME_MS - 4) {
        // time since the last drawn frame, clamped so a long pause doesn't jump
        const dt = drawnAt ? Math.min((now - drawnAt) / 1000, 0.1) : 0;
        drawnAt = now;
        if (!reduce.matches) t += dt;
        easing = ease();
        draw();
      }
      if (easing || canAnimate()) kick();
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !finePointer.matches || reduce.matches) return;
      const box = cv.getBoundingClientRect();
      target = {
        x: Math.max(0, Math.min(w, e.clientX - box.left)),
        y: Math.max(0, Math.min(h, e.clientY - box.top)),
      };
      kick();
    };
    const onLeave = () => {
      target = null;
      kick();
    };
    const onVisibility = () => kick();
    const onReduce = () => {
      if (reduce.matches) {
        cancelAnimationFrame(raf);
        raf = 0;
        t = 0;
        target = null;
        cur = null;
        draw();
      } else kick();
    };

    const ro = new ResizeObserver(() => {
      size();
      draw();
    });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) kick();
    });

    // a first still frame straight away; the canvas then takes over
    size();
    draw();
    el.classList.add("is-live");
    ro.observe(el);
    io.observe(el);
    kick();

    if (kind === "footer") {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
    }
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onReduce);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onReduce);
    };
  }, [kind]);

  return (
    <div className={`orbit-scene orbit-scene--${kind}`} ref={wrap} aria-hidden="true">
      {children}
      <canvas ref={canvas} className="orbit-canvas" role="presentation" />
    </div>
  );
}
