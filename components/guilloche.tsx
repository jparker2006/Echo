"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { canvasPainter, paintHero, STATIC_T } from "@/lib/guilloche";

const FRAME_MS = 1000 / 30; // engraved lines gain nothing from 60fps

/**
 * Draws the engraved planet on a canvas over its server-rendered still (`children`).
 * The loop writes straight to the canvas and never re-renders React. It pauses
 * offscreen and in hidden tabs; under reduced motion it draws one still frame.
 */
export function GuillocheLive({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");

    let W = 0;
    let H = 0;
    let dpr = 1;
    let t = STATIC_T;
    let last = 0;
    let raf = 0;
    let visible = true;

    const draw = () => {
      if (!W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      paintHero(canvasPainter(ctx), W, H, t, 1);
    };

    const size = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME_MS - 4) return;
      t += Math.min((now - last) / 1000, 0.1);
      last = now;
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

    const onReduce = () => {
      if (reduce.matches) {
        stop();
        t = STATIC_T;
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

    reduce.addEventListener("change", onReduce);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      reduce.removeEventListener("change", onReduce);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="guil" ref={wrap} aria-hidden="true">
      {children}
      <canvas ref={canvas} className="guil-canvas" role="presentation" />
    </div>
  );
}
