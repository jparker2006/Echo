"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { canvasPainter, paintFooter, paintHero, STATIC_T, type Light } from "@/lib/guilloche";

const FRAME_MS = 1000 / 30; // engraved lines gain nothing from 60fps
const LIGHT_EASE = 0.12; // how fast the footer light catches up with the pointer

/**
 * Draws the guilloche art on a canvas over its server-rendered still (`children`).
 * The loop writes straight to the canvas and never re-renders React. It pauses
 * offscreen and in hidden tabs; under reduced motion it draws one still frame.
 * Footer only: the light slides with the mouse pointer (fine pointers only).
 */
export function GuillocheLive({ scene, children }: { scene: "hero" | "footer"; children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const footer = scene === "footer" ? el.closest<HTMLElement>(".site-foot") : null;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let t = STATIC_T;
    let last = 0;
    let raf = 0;
    let visible = true;
    const light: Light = { sunX: 0, spotX: 0, spotY: 0, spot: 0 };
    const target: Light = { sunX: 0, spotX: 0, spotY: 0, spot: 0 };

    const draw = () => {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const p = canvasPainter(ctx);
      if (scene === "hero") paintHero(p, W, H, t, 1);
      else paintFooter(p, W, H, t, light, 1);
    };

    const size = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      if (!light.sunX && scene === "footer") {
        light.sunX = target.sunX = W / 2;
      }
    };

    const easeLight = () => {
      light.sunX += (target.sunX - light.sunX) * LIGHT_EASE;
      light.spotX += (target.spotX - light.spotX) * LIGHT_EASE;
      light.spotY += (target.spotY - light.spotY) * LIGHT_EASE;
      light.spot += (target.spot - light.spot) * LIGHT_EASE;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME_MS - 4) return;
      t += Math.min((now - last) / 1000, 0.1);
      last = now;
      if (scene === "footer") easeLight();
      draw();
    };
    const start = () => {
      if (raf || !visible || document.hidden || reduce.matches) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !finePointer.matches || reduce.matches) return;
      const box = el.getBoundingClientRect();
      target.spotX = e.clientX - box.left;
      target.spotY = e.clientY - box.top;
      target.spot = 1;
      target.sunX = Math.max(0, Math.min(W, target.spotX));
      start();
    };
    const onLeave = () => {
      target.spot = 0;
      target.sunX = W / 2;
      start();
    };
    const onReduce = () => {
      if (reduce.matches) {
        stop();
        t = STATIC_T;
        light.spot = target.spot = 0;
        light.sunX = target.sunX = W / 2;
        draw();
      } else start();
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    const ro = new ResizeObserver(() => {
      size();
      draw();
    });

    size();
    draw();
    el.classList.add("is-live");
    io.observe(el);
    ro.observe(el);
    start();

    footer?.addEventListener("pointermove", onPointer, { passive: true });
    footer?.addEventListener("pointerleave", onLeave);
    reduce.addEventListener("change", onReduce);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      footer?.removeEventListener("pointermove", onPointer);
      footer?.removeEventListener("pointerleave", onLeave);
      reduce.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [scene]);

  return (
    <div className={`guil guil--${scene}`} ref={wrap} aria-hidden="true">
      {children}
      <canvas ref={canvas} className="guil-canvas" role="presentation" />
    </div>
  );
}
