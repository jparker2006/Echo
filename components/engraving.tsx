"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  drawContours,
  drawLimbGlow,
  drawRings,
  drawStars,
  EMBER,
  GLINT,
  norm3,
  SHADOW,
  type Sphere,
} from "@/lib/engrave";

// the still moment that reduced motion shows, and the first frame of live motion
const STILL_T = 1.3;
type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

/**
 * Runs `render` on a canvas that fills `wrap` at `fps`, with DPR-correct size.
 * Pauses offscreen and in hidden tabs; under reduced motion it draws one still
 * frame and stops. Until the first frame lands the CSS fallback shows instead.
 */
function useEngraving(
  wrap: RefObject<HTMLDivElement | null>,
  canvas: RefObject<HTMLCanvasElement | null>,
  render: RefObject<Draw>,
  fps: number,
) {
  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let t = STILL_T;
    let visible = true;
    let live = false;

    const frame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      render.current(ctx, w, h, t);
      if (!live) {
        live = true;
        el.classList.add("is-live");
      }
    };
    const size = () => {
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      w = box.width;
      h = box.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      return true;
    };
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < 1000 / fps - 4) return; // slack so 60Hz screens don't stutter
      t += Math.min((now - last) / 1000, 0.1); // a long pause doesn't jump the spin
      last = now;
      frame();
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (raf || !visible || document.hidden || reduce.matches) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const onReduce = () => {
      if (reduce.matches) {
        stop();
        t = STILL_T;
        if (size()) frame();
      } else start();
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    const ro = new ResizeObserver(() => {
      if (!size()) return;
      if (!raf) frame(); // keep a still frame in step while paused
    });
    ro.observe(el);
    io.observe(el);
    if (size()) frame();
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
  }, [wrap, canvas, render, fps]);
}

/* ------------------------------------------------------------------ hero */

const PLANET_LIGHT = norm3([0.7, -0.55, 0.55]); // lit limb sits upper right
const RING_TILT = -0.3;

/** The hero planet: a contour-engraved sphere with ringed halves, on a 1:1 box. */
export function PlanetEngraving() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const render = useRef<Draw>(null!);

  render.current = (ctx, w, h, t) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.25;
    const sphere: Sphere = { cx, cy, r, spin: t * 0.05, tilt: 0.3, light: PLANET_LIGHT };
    drawStars(ctx, w, h, 60, 7);
    drawRings(ctx, cx, cy, r, RING_TILT, "back");

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();
    const shade = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    shade.addColorStop(0, `rgb(${SHADOW[0] + 8},${SHADOW[1] + 30},${SHADOW[2] + 34})`);
    shade.addColorStop(1, `rgb(${SHADOW[0] - 12},${SHADOW[1] - 40},${SHADOW[2] - 40})`);
    ctx.fillStyle = shade;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    drawContours(ctx, sphere, { x0: cx - r, y0: cy - r, x1: cx + r, y1: cy + r }, Math.max(1.5, r / 80), 84);
    ctx.restore();

    drawLimbGlow(ctx, sphere, Math.max(1.1, r * 0.016));
    drawRings(ctx, cx, cy, r, RING_TILT, "front");
  };

  useEngraving(wrap, canvas, render, 30);

  return (
    <div className="engrave engrave--planet" ref={wrap} aria-hidden="true">
      <span className="engrave-fallback" />
      <canvas ref={canvas} className="engrave-canvas" role="presentation" />
    </div>
  );
}

/* ---------------------------------------------------------------- footer */

type Pointer = { x: number; y: number; k: number; sun: number; tx: number; ty: number; tk: number; tsun: number };
const EASE = 0.12;

/** The footer horizon: a wide engraved limb with orbits and a rocket on its exhaust.
    The light and a soft spotlight follow the mouse (never under reduced motion). */
export function HorizonEngraving() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ptr = useRef<Pointer>({ x: 0, y: 0, k: 0, sun: 0.5, tx: 0, ty: 0, tk: 0, tsun: 0.5 });
  const render = useRef<Draw>(null!);

  render.current = (ctx, w, h, t) => {
    const p = ptr.current;
    for (const key of ["x", "y", "k", "sun"] as const) {
      const target = key === "x" ? p.tx : key === "y" ? p.ty : key === "k" ? p.tk : p.tsun;
      p[key] += (target - p[key]) * EASE;
    }

    const R = w * 1.05; // the limb spans the full width
    const cx = w / 2;
    const limbY = h * 0.42;
    const cy = limbY + R;
    const light = norm3([0.3 + p.sun * 0.6, -0.35, 0.8]);
    const sphere: Sphere = {
      cx,
      cy,
      r: R,
      spin: t * 0.03,
      tilt: 0.12,
      light,
      spot: { x: p.x, y: p.y, k: p.k },
    };

    drawStars(ctx, w, limbY, 110, 3);

    // sweeping light-trail orbits, behind the planet
    ctx.save();
    ctx.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) {
      const f = i / 3;
      const rot = -0.2 + 0.4 * f + Math.sin(t * 0.04 + i) * 0.03;
      ctx.strokeStyle = `rgba(60,141,157,${(0.22 - f * 0.06).toFixed(2)})`;
      for (let k = 0; k < 2; k++) {
        ctx.beginPath();
        ctx.ellipse(cx, limbY + h * 0.12, w * (0.36 + 0.2 * f) + k * 1.5, h * (0.2 + 0.08 * f) + k * 1.5, rot, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, limbY, w, h - limbY);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    const shade = ctx.createLinearGradient(0, limbY, 0, h);
    shade.addColorStop(0, `rgb(${SHADOW[0]},${SHADOW[1]},${SHADOW[2]})`);
    shade.addColorStop(1, "rgb(8,20,24)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, limbY, w, h - limbY);
    drawContours(ctx, sphere, { x0: 0, y0: limbY, x1: w, y1: h }, 2, 64);
    ctx.restore();

    drawLimbGlow(ctx, sphere, Math.max(1.2, h * 0.006));

    // rocket lifting straight off the limb on its plume
    const plume = Math.min(54, Math.max(24, h * 0.2));
    const tailY = limbY - plume;
    const rocketH = Math.max(12, Math.min(22, h * 0.09));
    ctx.save();
    const flame = ctx.createLinearGradient(0, limbY, 0, tailY);
    flame.addColorStop(0, `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},0.95)`);
    flame.addColorStop(1, `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},0)`);
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(cx - 5, limbY);
    ctx.lineTo(cx + 5, limbY);
    ctx.lineTo(cx + 1.2, tailY);
    ctx.lineTo(cx - 1.2, tailY);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, tailY - 1);
    const s = rocketH / 20;
    ctx.scale(s, s);
    ctx.fillStyle = `rgba(${GLINT[0]},${GLINT[1]},${GLINT[2]},0.95)`;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.bezierCurveTo(4, -14, 4.5, -6, 4.5, 0);
    ctx.lineTo(-4.5, 0);
    ctx.bezierCurveTo(-4.5, -6, -4, -14, 0, -20);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4.5, -6);
    ctx.lineTo(8, 2);
    ctx.lineTo(4.5, 1);
    ctx.closePath();
    ctx.moveTo(-4.5, -6);
    ctx.lineTo(-8, 2);
    ctx.lineTo(-4.5, 1);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // mouse only: the sun slides with the pointer and a soft spotlight lifts the lines under it
  useEffect(() => {
    const footer = wrap.current?.closest<HTMLElement>(".site-foot");
    const el = wrap.current;
    if (!footer || !el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !finePointer.matches || reduce.matches) return;
      const box = el.getBoundingClientRect();
      const p = ptr.current;
      p.tx = e.clientX - box.left;
      p.ty = e.clientY - box.top;
      p.tk = 1;
      p.tsun = Math.max(0, Math.min(1, p.tx / box.width));
    };
    const onLeave = () => {
      ptr.current.tk = 0;
      ptr.current.tsun = 0.5;
    };
    footer.addEventListener("pointermove", onMove, { passive: true });
    footer.addEventListener("pointerleave", onLeave);
    return () => {
      footer.removeEventListener("pointermove", onMove);
      footer.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  useEngraving(wrap, canvas, render, 15);

  return (
    <div className="engrave engrave--horizon" ref={wrap} aria-hidden="true">
      <span className="engrave-fallback" />
      <canvas ref={canvas} className="engrave-canvas" role="presentation" />
    </div>
  );
}
