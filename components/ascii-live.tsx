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
const MAX_TILT = 6; // degrees of pointer parallax

/**
 * Draws the hero scene on a canvas at ~30fps over the server-rendered still
 * frame (`children`). Never re-renders React: the loop writes straight to the
 * canvas and the wrapper's transform. Pauses offscreen and in hidden tabs;
 * under reduced motion it draws one still frame and stops.
 *
 * Every glyph × color pair is rasterized once into an atlas at device
 * resolution, so a frame is ~1–2k pixel-aligned drawImage copies instead of
 * fillText calls, and glyphs sit on the same baseline the <pre> uses.
 */
export function AsciiLive({ children }: { children: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    const atlas = document.createElement("canvas");
    const actx = atlas.getContext("2d");
    if (!el || !cv || !ctx || !actx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    // the still frame CSS is currently showing (wide or narrow grid)
    const pre =
      Array.from(el.querySelectorAll("pre")).find((p) => p.getClientRects().length > 0) ??
      el.querySelector("pre");
    const style = pre ? getComputedStyle(pre) : null;
    const family = style?.fontFamily || "monospace";
    const weight = style?.fontWeight || "400";

    let scene: Scene | null = null;
    let tileW = 0;
    let tileH = 0;
    let pad = 0;
    let colX = new Int32Array(0); // device-pixel x of each column's tile
    let rowY = new Int32Array(0);
    let raf = 0;
    let last = 0;
    let t = STATIC_T;
    let visible = true;
    let tilt = { x: 0, y: 0, tx: 0, ty: 0 };

    // where the <pre> puts its baseline within a line, as a fraction of the
    // line height; measured from real layout because engines round the
    // half-leading differently
    let baseFrac = 0;
    const measureBaseline = () => {
      const lh = style ? parseFloat(style.lineHeight) : 0;
      actx.font = `${weight} ${style?.fontSize ?? "16px"} ${family}`;
      const m = actx.measureText("M");
      const asc = m.fontBoundingBoxAscent ?? 0;
      const row = pre?.firstElementChild;
      if (!pre || !row || !lh || !asc) return 0.72;
      const range = document.createRange();
      range.selectNodeContents(row);
      const top = range.getBoundingClientRect().top - pre.getBoundingClientRect().top;
      return (top + asc) / lh;
    };

    const fit = () => {
      // layout size (unaffected by the tilt), fractional like the <pre>'s cells
      const width = parseFloat(getComputedStyle(el).width);
      if (!width) return;
      // keep in step with the @container breakpoint that swaps the still frames
      const grid = width < 520 ? GRID_NARROW : GRID_WIDE;
      if (!scene || scene.W !== grid.W) scene = createScene(grid.W, grid.H);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const cellW = (width / grid.W) * dpr;
      const cellH = cellW * ASPECT;
      cv.width = Math.round(width * dpr);
      cv.height = Math.round(cellH * grid.H);
      // CSS size = bitmap size exactly, so the browser never resamples the glyphs
      cv.style.width = `${cv.width / dpr}px`;
      cv.style.height = `${cv.height / dpr}px`;

      const px = cellW / GLYPH_W;
      baseFrac ||= measureBaseline();
      const baseline = baseFrac * cellH;

      pad = Math.ceil(cellW * 0.3);
      tileW = Math.ceil(cellW) + pad * 2;
      tileH = Math.ceil(cellH) + pad * 2;
      atlas.width = tileW * GLYPHS.length;
      atlas.height = tileH * PALETTE.length;
      actx.font = `${weight} ${px}px ${family}`;
      actx.fontKerning = "none";
      actx.textBaseline = "alphabetic";
      for (let tone = 1; tone < PALETTE.length; tone++) {
        actx.fillStyle = PALETTE[tone];
        for (let g = 1; g < GLYPHS.length; g++)
          actx.fillText(GLYPHS[g], g * tileW + pad, tone * tileH + pad + baseline);
      }
      colX = Int32Array.from({ length: grid.W }, (_, c) => Math.round(c * cellW) - pad);
      rowY = Int32Array.from({ length: grid.H }, (_, r) => Math.round(r * cellH) - pad);
    };

    const draw = () => {
      if (!scene || !tileW) return;
      renderFrame(scene, t);
      const { W, chars, tones } = scene;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let k = 0; k < chars.length; k++) {
        const g = chars[k];
        if (g === 0 || tones[k] === 0) continue;
        const col = k % W;
        ctx.drawImage(atlas, g * tileW, tones[k] * tileH, tileW, tileH, colX[col], rowY[(k - col) / W], tileW, tileH);
      }
    };

    const applyTilt = () => {
      const dx = tilt.tx - tilt.x;
      const dy = tilt.ty - tilt.y;
      if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return; // settled: leave the style alone
      tilt.x += dx * 0.08;
      tilt.y += dy * 0.08;
      el.style.transform = `perspective(1100px) rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // a little slack so 60Hz displays land on every other vsync, not a 2/3 stutter
      if (now - last < FRAME_MS - 4) return;
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
      if (!finePointer.matches || reduce.matches || e.pointerType !== "mouse") return;
      const box = el.getBoundingClientRect();
      const nx = (e.clientX - (box.left + box.width / 2)) / window.innerWidth;
      const ny = (e.clientY - (box.top + box.height / 2)) / window.innerHeight;
      tilt.ty = Math.max(-1, Math.min(1, nx * 2)) * MAX_TILT;
      tilt.tx = Math.max(-1, Math.min(1, -ny * 2)) * MAX_TILT * 0.6;
    };
    // drift back to level when the mouse leaves the window
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) tilt.tx = tilt.ty = 0;
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

    // wait for the mono font so the atlas glyphs match the server frame
    let alive = true;
    const size = pre ? getComputedStyle(pre).fontSize : "16px";
    document.fonts
      .load(`${weight} ${size} ${family}`, GLYPHS)
      .catch(() => {})
      .then(() => document.fonts.ready)
      .then(() => {
        if (!alive) return;
        fit();
        draw();
        el.classList.add("is-live");
        io.observe(el);
        ro.observe(el);
        start();
      });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("mouseout", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    reduce.addEventListener("change", onReduce);

    return () => {
      alive = false;
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("mouseout", onLeave);
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
