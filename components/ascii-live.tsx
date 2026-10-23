"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  ASPECT,
  createScene,
  GLYPH_W,
  GLYPHS,
  GRID_NARROW,
  GRID_WIDE,
  PALETTE,
  renderFrame,
  STATIC_T,
  type Scene,
} from "@/lib/ascii";

const FRAME_MS = 1000 / 30; // the ASCII look gains nothing from 60fps
const MAX_TILT = 7; // degrees of pointer parallax

/**
 * Draws the hero scene on a canvas at ~30fps over the server-rendered still
 * frame (`children`). Never re-renders React: the loop writes straight to the
 * canvas and the wrapper's transform. Pauses offscreen and in hidden tabs;
 * under reduced motion it draws one still frame and stops.
 */
export function AsciiLive({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!el || !cv || !ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const pre = el.querySelector("pre");
    const family = pre ? getComputedStyle(pre).fontFamily : "monospace";

    let scene: Scene | null = null;
    let cellW = 0;
    let cellH = 0;
    let raf = 0;
    let last = 0;
    let t = STATIC_T;
    let visible = true;
    let tilt = { x: 0, y: 0, tx: 0, ty: 0 };

    const fit = () => {
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      const grid = box.width < 520 ? GRID_NARROW : GRID_WIDE;
      if (!scene || scene.W !== grid.W) scene = createScene(grid.W, grid.H);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(box.width * dpr);
      cv.height = Math.round(box.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cellW = box.width / grid.W;
      cellH = cellW * ASPECT;
      ctx.font = `${cellW / GLYPH_W}px ${family}`;
      ctx.textBaseline = "middle";
      ctx.fontKerning = "none";
    };

    const draw = () => {
      if (!scene) return;
      renderFrame(scene, t);
      const { W, chars, tones } = scene;
      ctx.clearRect(0, 0, cv.width, cv.height);
      // one fillStyle per palette color instead of one per cell
      for (let tone = 1; tone < PALETTE.length; tone++) {
        ctx.fillStyle = PALETTE[tone];
        for (let k = 0; k < chars.length; k++) {
          if (tones[k] !== tone || chars[k] === 0) continue;
          ctx.fillText(GLYPHS[chars[k]], (k % W) * cellW, ((k / W) | 0) * cellH + cellH / 2);
        }
      }
    };

    const applyTilt = () => {
      tilt.x += (tilt.tx - tilt.x) * 0.08;
      tilt.y += (tilt.ty - tilt.y) * 0.08;
      el.style.transform = `perspective(1100px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      t += Math.min((now - last) / 1000, 0.1); // clamp so a long pause doesn't jump the orbit
      last = now;
      draw();
      applyTilt();
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
      if (!finePointer.matches || reduce.matches) return;
      const box = el.getBoundingClientRect();
      const nx = (e.clientX - (box.left + box.width / 2)) / window.innerWidth;
      const ny = (e.clientY - (box.top + box.height / 2)) / window.innerHeight;
      tilt.ty = Math.max(-1, Math.min(1, nx * 2)) * MAX_TILT;
      tilt.tx = Math.max(-1, Math.min(1, -ny * 2)) * MAX_TILT * 0.6;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onReduce = () => {
      if (reduce.matches) {
        stop();
        tilt = { x: 0, y: 0, tx: 0, ty: 0 };
        el.style.transform = "";
        t = STATIC_T;
        draw();
      } else start();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    const ro = new ResizeObserver(() => {
      fit();
      draw();
    });

    // wait for the mono font so canvas glyphs match the server frame
    document.fonts.ready.then(() => {
      fit();
      draw();
      el.classList.add("is-live");
      io.observe(el);
      ro.observe(el);
      start();
    });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onReduce);

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  return (
    <div className="ascii-scene" ref={wrap} aria-hidden="true">
      {children}
      <canvas ref={canvas} className="ascii-canvas" role="presentation" />
    </div>
  );
}
