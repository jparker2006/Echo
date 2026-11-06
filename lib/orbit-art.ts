// Drawing lists for the home hero planet and the footer horizon. Pure math,
// no DOM: components/orbit-canvas.tsx paints a list on a canvas every frame,
// and components/orbit-scene.tsx writes the same list out as SVG on the
// server for the still frame. Both use one list, so the two never disagree.
//
// Palette (design/targets-r1/palette.md, M1): #123f49 shadow, #3c8d9d engraving,
// #b9c9c6 glints, #d87532 burnt-orange light. Lime is UI only, never here.

export type Line = { k: "line"; c: string; w: number; a: number; p: number[] };
export type Disc = { k: "disc"; x: number; y: number; r: number; c: string };
export type Glow = { k: "glow"; x: number; y: number; r: number; c: string; a: number };
export type Item = Line | Disc | Glow;

export const PAPER = "#09090b";
export const FOOT_HORIZON = 0.44; // footer: where the limb's top sits, as a fraction of height
export const SVG_SIZE = { hero: [560, 500], foot: [1440, 288] } as const;

// engraving ramp, darkest to brightest (shadow → engraving → glint)
const TEAL = ["#0e2a35", "#123f49", "#1d5f6b", "#2f7f8c", "#3c8d9d", "#7fb5b8", "#b9c9c6"];
const ORANGE = "#d87532";
const OFFWHITE = "#eeeae3";

type V = [number, number, number];
type Pt = { x: number; y: number; z: number; d: number }; // screen x/y, depth (+ toward viewer), light dot

function rng(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Spin a point about the vertical axis, then tip the axis toward the viewer. */
function view(p: V, rot: number, tilt: number): V {
  const [x, y, z] = p;
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const xr = x * cr + z * sr;
  const zr = -x * sr + z * cr;
  const ct = Math.cos(tilt), st = Math.sin(tilt);
  return [xr, y * ct - zr * st, y * st + zr * ct];
}

/** Project a unit-space point into the box centred at (cx, cy) with radius R. */
function project(p: V, g: Geo, L: V): Pt {
  const [vx, vy, vz] = view(p, g.rot, g.tilt);
  return { x: g.cx + g.R * vx, y: g.cy - g.R * vy, z: vz, d: vx * L[0] + vy * L[1] + vz * L[2] };
}

type Geo = { cx: number; cy: number; R: number; rot: number; tilt: number };

/** Split a polyline into runs of one colour, dropping hidden points, and emit them as lines. */
function emitRuns(out: Item[], pts: (Pt | null)[], colour: (q: Pt) => string | null, w: number, a = 1) {
  let cur: number[] = [];
  let c = "";
  const flush = () => {
    if (cur.length >= 4) out.push({ k: "line", c, w, a, p: cur });
    cur = [];
  };
  for (const q of pts) {
    const col = q ? colour(q) : null;
    if (!q || col === null) {
      flush();
      continue;
    }
    if (col !== c) {
      flush();
      c = col;
    }
    cur.push(q.x, q.y);
  }
  flush();
}

/** Lat/long engraving of a sphere: meridians and parallels, front side only. */
function engrave(out: Item[], g: Geo, L: V, lats: number[], meridians: number, w: number) {
  const shade = (q: Pt) => {
    if (q.z <= 0) return null;
    const i = clamp((q.d + 0.25) / 1.25, 0, 1);
    return TEAL[Math.min(TEAL.length - 1, Math.floor(i * 7))];
  };
  const SEG = 72;
  for (const lat of lats) {
    const φ = (lat * Math.PI) / 180;
    const pts: (Pt | null)[] = [];
    for (let i = 0; i <= SEG; i++) {
      const θ = (i / SEG) * Math.PI * 2;
      pts.push(project([Math.cos(φ) * Math.sin(θ), Math.sin(φ), Math.cos(φ) * Math.cos(θ)], g, L));
    }
    emitRuns(out, pts, shade, w);
  }
  for (let m = 0; m < meridians; m++) {
    const θ0 = (m / meridians) * Math.PI;
    const pts: (Pt | null)[] = [];
    for (let i = 0; i <= SEG; i++) {
      const φ = -Math.PI / 2 + (i / SEG) * Math.PI;
      pts.push(project([Math.cos(φ) * Math.sin(θ0), Math.sin(φ), Math.cos(φ) * Math.cos(θ0)], g, L));
    }
    emitRuns(out, pts, shade, w);
  }
}

/** The limb of a sphere as a bright arc: faint wide stroke under a thin one. */
function limbArc(out: Item[], g: Geo, from: number, to: number, alpha: (α: number) => number, steps: number) {
  for (let s = 0; s < steps; s++) {
    const a0 = from + ((to - from) * s) / steps;
    const a1 = from + ((to - from) * (s + 1)) / steps;
    const a = alpha((a0 + a1) / 2);
    const p = [g.cx + g.R * Math.cos(a0), g.cy - g.R * Math.sin(a0), g.cx + g.R * Math.cos(a1), g.cy - g.R * Math.sin(a1)];
    out.push({ k: "line", c: ORANGE, w: 5, a: a * 0.16, p });
    out.push({ k: "line", c: ORANGE, w: 1.3, a: a * 0.95, p });
  }
}

function stars(out: Item[], seed: number, w: number, h: number, n: number, maxY: number) {
  const rnd = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h * maxY;
    const bright = rnd() > 0.8;
    out.push({ k: "line", c: bright ? OFFWHITE : TEAL[5], w: bright ? 1.4 : 1, a: bright ? 0.55 : 0.3 + rnd() * 0.3, p: [x, y, x + 0.01, y] });
  }
}

function norm(v: V): V {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
}

/** The hero: an engraved planet with rings, a burnt-orange limb, faint stars. */
export function heroScene(w: number, h: number, t: number): Item[] {
  const out: Item[] = [];
  const g: Geo = { cx: w * 0.5, cy: h * 0.5, R: Math.min(w, h) * 0.25, rot: t * 0.09, tilt: 0.42 };
  const L = norm([0.7, 0.45, 0.55]);
  stars(out, 3, w, h, 70, 1);

  // rings: concentric fine lines in the equatorial plane, back half first
  const ringPts = (k: number): (Pt | null)[] => {
    const pts: (Pt | null)[] = [];
    for (let i = 0; i <= 140; i++) {
      const θ = (i / 140) * Math.PI * 2;
      const v: V = [Math.cos(θ) * k, 0, Math.sin(θ) * k];
      const q = project(v, g, L);
      pts.push({ ...q, d: q.d / k });
    }
    return pts;
  };
  const rings: number[] = [];
  for (let k = 1.5; k <= 1.96; k += 0.04) rings.push(k);
  for (const k of rings) emitRuns(out, ringPts(k), (q) => (q.z < 0 ? TEAL[1] : null), 0.7, 0.9);

  // halo on the lit side, then the planet disc that hides the back half
  out.push({ k: "glow", x: g.cx + g.R * L[0], y: g.cy - g.R * L[1], r: g.R * 1.4, c: ORANGE, a: 0.3 });
  out.push({ k: "disc", x: g.cx, y: g.cy, r: g.R, c: "#06151a" });
  engrave(out, g, L, Array.from({ length: 33 }, (_, i) => -80 + i * 5), 36, 0.7);

  // front rings over the planet, orange where they catch the light
  for (const k of rings)
    emitRuns(
      out,
      ringPts(k),
      (q) => (q.z < 0 ? null : q.d > 0.6 ? ORANGE : TEAL[Math.min(5, Math.floor(clamp((q.d + 0.3) / 1.1, 0, 1) * 6))]),
      0.8,
      0.95
    );

  // the lit limb: burnt orange, brightest where the light falls
  const lit = Math.atan2(L[1], L[0]);
  limbArc(out, g, lit - 1.5, lit + 1.5, (α) => 0.15 + 0.85 * Math.exp(-((α - lit) ** 2) / 0.4), 16);
  return out;
}

/** The footer: a huge planet limb with a burnt-orange horizon, light-trail orbits, and a rocket on a plume. */
export function footerScene(w: number, h: number, t: number, light?: { x: number; y: number }): Item[] {
  const out: Item[] = [];
  const horizonY = h * FOOT_HORIZON;
  const R = w * 1.1;
  const g: Geo = { cx: w * 0.5, cy: horizonY + R, R, rot: t * 0.035, tilt: -0.3 };
  const lx = light ? light.x : w * 0.5;
  const ly = light ? light.y : horizonY;
  const Lx = clamp((lx - g.cx) / (w * 0.5), -1, 1) * 0.8;
  const Ly = 0.45;
  const L = norm([Lx, Ly, Math.sqrt(Math.max(0, 1 - Lx * Lx - Ly * Ly))]);
  const limbY = (x: number) => g.cy - Math.sqrt(Math.max(0, R * R - (x - g.cx) ** 2));

  stars(out, 11, w, h, 120, FOOT_HORIZON + 0.05);

  // light-trail orbits: long thin ellipses, a bright head with a fading tail
  const rnd = rng(29);
  for (let o = 0; o < 6; o++) {
    const cx = w * (0.5 + (rnd() - 0.5) * 0.2);
    const cy = horizonY + h * (0.1 + rnd() * 0.12);
    const rx = w * (0.26 + rnd() * 0.32);
    const ry = h * (0.2 + rnd() * 0.22);
    const rho = (rnd() - 0.5) * 0.7;
    const speed = (0.12 + rnd() * 0.14) * (rnd() < 0.5 ? -1 : 1);
    const phase = rnd() * Math.PI * 2;
    for (let loop = 0; loop < 4; loop++) {
      const s = 1 - loop * 0.012;
      const at = (θ: number) => {
        const ex = Math.cos(θ) * rx * s;
        const ey = Math.sin(θ) * ry * s;
        return [cx + ex * Math.cos(rho) - ey * Math.sin(rho), cy + ex * Math.sin(rho) + ey * Math.cos(rho)];
      };
      const full: number[] = [];
      for (let i = 0; i <= 64; i++) full.push(...at((i / 64) * Math.PI * 2));
      out.push({ k: "line", c: TEAL[3], w: 0.6, a: 0.2, p: full });
      const head = phase + t * speed;
      const trail: number[] = [];
      for (let i = 0; i <= 24; i++) trail.push(...at(head - 1.4 + (1.4 * i) / 24));
      out.push({ k: "line", c: TEAL[4], w: 1, a: 0.55, p: trail });
    }
  }

  // sky light over the limb, then the disc, then the lit surface and limb
  out.push({ k: "glow", x: lx, y: limbY(lx), r: w * 0.22, c: ORANGE, a: 0.3 });
  out.push({ k: "disc", x: g.cx, y: g.cy, r: R, c: "#071a1f" });
  out.push({ k: "glow", x: lx, y: clamp(ly, horizonY, h), r: w * 0.14, c: TEAL[4], a: 0.2 });
  engrave(out, g, L, Array.from({ length: 19 }, (_, i) => -72 + i * 8), 40, 0.75);

  const lit = Math.PI / 2 - ((lx - g.cx) / R) * 1.2;
  limbArc(out, g, 0.02, Math.PI - 0.02, (α) => 0.2 + 0.8 * Math.exp(-((α - lit) ** 2) / 0.2), 24);
  out.push({ k: "glow", x: lx, y: limbY(lx), r: w * 0.07, c: ORANGE, a: 0.4 });

  // rocket lifting off the limb on an orange plume
  const s = clamp(h / 288, 0.7, 1.3);
  const base = horizonY - 2 - (10 + 5 * Math.sin(t * 0.9)) * s;
  const x0 = g.cx;
  const flick = 1 + 0.12 * Math.sin(t * 17) + 0.06 * Math.sin(t * 29);
  out.push({ k: "glow", x: x0, y: horizonY, r: 42 * s, c: ORANGE, a: 0.5 });
  for (let i = 0; i < 9; i++) {
    const f = (i - 4) / 4;
    out.push({ k: "line", c: ORANGE, w: 1, a: 0.14, p: [x0 + f * 1.2 * s, horizonY, x0 + f * 5 * s * flick, base + 8 * s] });
  }
  out.push({ k: "line", c: ORANGE, w: 2 * flick, a: 0.95, p: [x0, horizonY, x0, base + 6 * s] });
  const body: [number, number][] = [[0, -17], [4, -9], [4, 7], [7, 11], [0, 8], [-7, 11], [-4, 7], [-4, -9], [0, -17]];
  const shipPts = body.flatMap(([px, py]) => [x0 + px * s, base + py * s]);
  out.push({ k: "line", c: OFFWHITE, w: 1.1, a: 1, p: shipPts });
  const win: number[] = [];
  for (let i = 0; i <= 12; i++) win.push(x0 + Math.cos((i / 12) * Math.PI * 2) * 2 * s, base - 4 * s + Math.sin((i / 12) * Math.PI * 2) * 2 * s);
  out.push({ k: "line", c: OFFWHITE, w: 0.9, a: 1, p: win });
  return out;
}

/** Paint an item list on a 2D context whose transform is already set to CSS px. */
export function paint(ctx: CanvasRenderingContext2D, items: Item[]) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const it of items) {
    if (it.k === "line") {
      ctx.globalAlpha = it.a;
      ctx.strokeStyle = it.c;
      ctx.lineWidth = it.w;
      ctx.beginPath();
      ctx.moveTo(it.p[0], it.p[1]);
      for (let i = 2; i < it.p.length; i += 2) ctx.lineTo(it.p[i], it.p[i + 1]);
      ctx.stroke();
    } else if (it.k === "disc") {
      ctx.globalAlpha = 1;
      ctx.fillStyle = it.c;
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(it.x, it.y, 0, it.x, it.y, it.r);
      grad.addColorStop(0, it.c);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = it.a;
      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = "lighter";
      ctx.fillRect(it.x - it.r, it.y - it.r, it.r * 2, it.r * 2);
      ctx.globalCompositeOperation = "source-over";
    }
  }
  ctx.globalAlpha = 1;
}
