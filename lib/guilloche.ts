/* ============================================================
   guilloche — the engraved planet (hero) and horizon (footer).
   One drawing routine, two painters: a canvas painter for the live
   frames and an SVG painter for the server-rendered still. Lines are
   dense parallel curves displaced by smooth waves and noise; brightness
   sets each stroke's weight and colour, so light reads as line density.
   ============================================================ */

export type RGB = readonly [number, number, number];
/** [offset 0..1, colour, alpha] */
export type Stop = readonly [number, RGB, number];

/** The only three operations the drawing needs. */
export interface Painter {
  /** flat [x0,y0,x1,y1,…] polyline */
  line(pts: number[], rgb: RGB, alpha: number, width: number, dash?: number[]): void;
  /** flat closed polygon */
  fill(pts: number[], rgb: RGB, alpha: number): void;
  /** circle with a radial gradient; the gradient starts at (fx, fy) */
  disc(cx: number, cy: number, r: number, stops: Stop[], fx?: number, fy?: number): void;
}

export interface Light {
  sunX: number; // footer: where the light falls across the width (px)
  spotX: number; // footer: pointer spotlight (px, relative to the art box)
  spotY: number;
  spot: number; // 0..1 strength of the spotlight
}

/** the still frame's time; the canvas starts on the same frame */
export const STATIC_T = 4.2;

const TAU = Math.PI * 2;
const VIEW_TILT = 0.42; // the hero planet's north pole tips toward the viewer
const TEAL_SHADOW: RGB = [18, 63, 73]; // #123f49
const TEAL: RGB = [60, 141, 157]; // #3c8d9d
const GLINT: RGB = [185, 201, 198]; // #b9c9c6
const ORANGE: RGB = [216, 117, 50]; // #d87532 — light only
const ORANGE_HOT: RGB = [255, 214, 170];
const STAR: RGB = [214, 236, 238];
const ROCKET: RGB = [226, 233, 233];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
/** engraving ramp: shadow → mid teal → glint */
function tealFor(b: number): RGB {
  return b < 0.7 ? mix(TEAL_SHADOW, TEAL, b / 0.7) : mix(TEAL, GLINT, (b - 0.7) / 0.3);
}
/** hero ramp: deep-teal shadow → teal → light teal. Never reaches icy white. */
const HERO_DEEP: RGB = [13, 50, 60];
const HERO_LIGHT: RGB = [104, 178, 190];
function heroTealFor(b: number): RGB {
  return b < 0.7 ? mix(HERO_DEEP, TEAL, b / 0.7) : mix(TEAL, HERO_LIGHT, (b - 0.7) / 0.3);
}

// ---- noise: seeded starfields and smooth value noise (periodic when fed a circle) ----

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hash(i: number, j: number) {
  let h = Math.imul(i, 374761393) + Math.imul(j, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** smooth value noise in [0, 1] */
function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ---- stroking: split a series into runs, then bucket runs by brightness ----

/** Strokes xy[i0..i1] as polylines grouped by brightness bucket. Each bucket
    sets the colour, alpha and width; `warm` runs take the orange light. */
function strokeRun(
  p: Painter,
  xy: number[],
  bright: number[],
  warm: boolean[] | null,
  i0: number,
  i1: number,
  B: number,
  gain: number,
  ramp: (b: number) => RGB
) {
  let cur: number[] = [];
  let key = -1;
  const flush = () => {
    if (cur.length >= 4) {
      const bi = key >> 1;
      const b = (bi + 0.5) / B;
      if (key & 1) p.line(cur, mix(ORANGE, ORANGE_HOT, b), (0.25 + 0.7 * b) * gain, 0.5 + 0.9 * b);
      else p.line(cur, ramp(b), (0.2 + 0.75 * b) * gain, 0.4 + 0.9 * b);
    }
    cur = [];
  };
  for (let i = i0; i < i1; i++) {
    const b = (bright[i] + bright[i + 1]) / 2;
    const bi = Math.min(B - 1, Math.floor(clamp01(b) * B));
    const k = bi * 2 + (warm && warm[i] ? 1 : 0);
    if (k !== key) {
      flush();
      key = k;
      cur.push(xy[2 * i], xy[2 * i + 1]);
    }
    cur.push(xy[2 * i + 2], xy[2 * i + 3]);
  }
  flush();
}

/** Strokes a series, skipping points where `ok` is false. */
function strokeSeries(
  p: Painter,
  xy: number[],
  bright: number[],
  ok: boolean[] | null,
  warm: boolean[] | null,
  B: number,
  gain = 1,
  ramp: (b: number) => RGB = tealFor
) {
  const n = bright.length;
  let i = 0;
  while (i < n) {
    if (ok && !ok[i]) {
      i++;
      continue;
    }
    let j = i;
    while (j + 1 < n && (!ok || ok[j + 1])) j++;
    if (j > i) strokeRun(p, xy, bright, warm, i, j, B, gain, ramp);
    i = j + 1;
  }
}

function starfield(p: Painter, x0: number, y0: number, w: number, h: number, n: number, seed: number) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * w;
    const y = y0 + r() * h;
    const size = 0.5 + r() * 1.1;
    const a = 0.2 + 0.6 * r() * r();
    p.disc(x, y, size * 2.2, [
      [0, STAR, a],
      [0.45, STAR, a * 0.45],
      [1, STAR, 0],
    ]);
  }
}

// ============================================================
// hero planet
// ============================================================

type V3 = [number, number, number];

/** smooth 3D value noise in [0, 1]; fed points on the sphere, it has no seam */
function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const f = (v: number) => v * v * (3 - 2 * v);
  const u = f(x - xi);
  const v = f(y - yi);
  const w = f(z - zi);
  const h = (i: number, j: number, k: number) => hash(i + Math.imul(k, 1013), j - Math.imul(k, 7919));
  const lerp = (a: number, b: number, s: number) => a + (b - a) * s;
  const plane = (k: number) =>
    lerp(lerp(h(xi, yi, k), h(xi + 1, yi, k), u), lerp(h(xi, yi + 1, k), h(xi + 1, yi + 1, k), u), v);
  return lerp(plane(zi), plane(zi + 1), w);
}

/** Eddies on the body: [centre longitude, latitude, twist (rad), size]. Each one
    turns the surface round its centre, most at the core, curling the bands into a swirl. */
const EDDIES: readonly [number, number, number, number][] = [
  [0.4, 0.32, 3.4, 0.2],
  [1.9, -0.42, -3.0, 0.24],
  [2.9, 0.62, 2.6, 0.16],
  [3.9, 0.05, -3.6, 0.22],
  [4.8, -0.2, 2.8, 0.17],
  [5.6, 0.48, -2.9, 0.19],
  [1.2, 0.95, 2.4, 0.15],
  [3.3, -0.88, -2.5, 0.18],
  // small eddies along the stormier bands
  [1.0, -0.05, 2.2, 0.09],
  [2.4, 0.18, -2.4, 0.08],
  [4.3, 0.42, 2.1, 0.08],
  [5.1, -0.55, -2.3, 0.1],
  [0.1, -0.7, 2.0, 0.09],
  [3.0, -0.28, 2.6, 0.07],
];
/** eddy centres as unit vectors, with the falloff scale: [cx, cy, cz, twist, 1 / (size² / 2)] */
const EDDY_AXES = EDDIES.map(([lon, lat, tw, sz]) => [
  Math.cos(lat) * Math.sin(lon),
  Math.sin(lat),
  Math.cos(lat) * Math.cos(lon),
  tw,
  2 / (sz * sz),
]);

/** Directional waves across the surface: [direction (unit, mostly round the equator), frequency, amplitude, phase]. */
const WAVES: readonly [V3, number, number, number][] = (
  [
    [[1, 0.25, 0.2], 7, 0.05, 0.3],
    [[-0.3, 0.15, 1], 11, 0.03, 1.7],
    [[0.7, -0.3, -0.65], 17, 0.017, 4.1],
    [[0.2, 0.4, -0.9], 5, 0.04, 2.6],
    [[0.9, -0.1, 0.4], 29, 0.008, 0.9],
  ] as [V3, number, number, number][]
).map(([d, f, a, ph]) => {
  const m = Math.hypot(d[0], d[1], d[2]);
  return [[d[0] / m, d[1] / m, d[2] / m], f, a, ph];
});

/** The engraving's scalar field on the unit sphere. Its contours are the
    engraved lines: latitude bands, waved, roughened and curled into eddies.
    Returns [field, local relief in -1..1]. Smooth everywhere, so no seam. */
function terrain(p: V3): [number, number] {
  let [x, y, z] = p;
  for (const [c0, c1, c2, tw, k2] of EDDY_AXES) {
    const dot = x * c0 + y * c1 + z * c2;
    const e = (1 - dot) * k2;
    if (e > 9) continue; // too far from this eddy to turn
    const ang = tw * Math.exp(-e);
    const c: V3 = [c0, c1, c2];
    // Rodrigues: rotate p round c by ang
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const cxp: V3 = [c[1] * z - c[2] * y, c[2] * x - c[0] * z, c[0] * y - c[1] * x];
    const k = dot * (1 - ca);
    x = x * ca + cxp[0] * sa + c[0] * k;
    y = y * ca + cxp[1] * sa + c[1] * k;
    z = z * ca + cxp[2] * sa + c[2] * k;
  }
  const lat = Math.asin(Math.max(-1, Math.min(1, y)));
  // bands of calmer and rougher water, by latitude
  const rough = 0.55 + 0.45 * Math.sin(5.3 * lat + 0.8) * Math.sin(2.1 * lat - 0.4);
  let wv = 0;
  for (const [d, f, a, ph] of WAVES) wv += a * Math.sin(f * (d[0] * x + d[1] * y + d[2] * z) + ph + 1.5 * Math.sin(3 * lat));
  const n =
    0.07 * (noise3(3.2 * x + 5, 3.2 * y + 9, 3.2 * z + 1) - 0.5) +
    0.035 * (noise3(7 * x, 7 * y, 7 * z) - 0.5) +
    0.016 * (noise3(16 * x + 2, 16 * y, 16 * z + 7) - 0.5);
  const rel = (wv + n) * rough;
  // calm near the poles so the polar caps stay clean circles
  const calm = clamp01((1.44 - Math.abs(lat)) / 0.25);
  return [lat + rel * calm, Math.tanh(rel * 5)];
}

/** One engraved contour: per point, its body-fixed position on the unit sphere and relief w. */
interface Contour {
  x: Float64Array;
  y: Float64Array;
  z: Float64Array;
  w: Float64Array;
  closed: boolean;
}

const contourCache = new Map<number, Contour[]>();

/** Contours of the terrain field (marching squares on a longitude × latitude grid
    that wraps in longitude), chained into polylines. Body-fixed, so it is built
    once per quality and the planet just turns underneath the view. */
function heroContours(q: number): Contour[] {
  const hit = contourCache.get(q);
  if (hit) return hit;
  const NL = Math.round(150 * q); // levels over the latitude span
  const NT = Math.round(520 * q); // grid columns (longitude, wrapping)
  const NP = Math.round(340 * q); // grid rows (latitude)
  const P0 = -1.566;
  const P1 = 1.566;
  const L0 = -1.548; // the outermost levels ring the poles tightly, so no bare cap shows
  const step = (2 * -L0) / NL;
  const F = new Float64Array(NT * (NP + 1));
  const Wr = new Float64Array(NT * (NP + 1));
  for (let j = 0; j <= NP; j++) {
    const ph = P0 + ((P1 - P0) * j) / NP;
    for (let i = 0; i < NT; i++) {
      const th = (TAU * i) / NT;
      const [f, w] = terrain([Math.cos(ph) * Math.sin(th), Math.sin(ph), Math.cos(ph) * Math.cos(th)]);
      F[j * NT + i] = (f - L0) / step - 0.5; // level l sits where this crosses an integer
      Wr[j * NT + i] = w;
    }
  }
  const val = (i: number, j: number) => F[j * NT + (i % NT)];
  // edge key: horizontal edge (i,j)-(i+1,j) → dir 0, vertical (i,j)-(i,j+1) → dir 1
  const key = (l: number, i: number, j: number, dir: number) => ((l * (NP + 1) + j) * NT + (i % NT)) * 2 + dir;
  const pos = new Map<number, [number, number, number]>();
  const adj = new Map<number, number[]>();
  const edgePoint = (l: number, i: number, j: number, dir: number) => {
    const k = key(l, i, j, dir);
    if (!pos.has(k)) {
      const i2 = dir ? i : i + 1;
      const j2 = dir ? j + 1 : j;
      const a = val(i, j);
      const b = val(i2, j2);
      const s = (l - a) / (b - a);
      const th = (TAU * (i + (i2 - i) * s)) / NT;
      const ph = P0 + ((P1 - P0) * (j + (j2 - j) * s)) / NP;
      const w = Wr[j * NT + (i % NT)] * (1 - s) + Wr[j2 * NT + (i2 % NT)] * s;
      pos.set(k, [th, ph, w]);
    }
    return k;
  };
  const link = (a: number, b: number) => {
    (adj.get(a) ?? adj.set(a, []).get(a)!).push(b);
    (adj.get(b) ?? adj.set(b, []).get(b)!).push(a);
  };
  for (let j = 0; j < NP; j++) {
    for (let i = 0; i < NT; i++) {
      const v0 = val(i, j); // corners: 0 (i,j) 1 (i+1,j) 2 (i+1,j+1) 3 (i,j+1)
      const v1 = val(i + 1, j);
      const v2 = val(i + 1, j + 1);
      const v3 = val(i, j + 1);
      const lo = Math.max(0, Math.ceil(Math.min(v0, v1, v2, v3)));
      const hi = Math.min(NL - 1, Math.floor(Math.max(v0, v1, v2, v3)));
      for (let l = lo; l <= hi; l++) {
        const c = (v0 > l ? 1 : 0) | (v1 > l ? 2 : 0) | (v2 > l ? 4 : 0) | (v3 > l ? 8 : 0);
        if (c === 0 || c === 15) continue;
        const eB = () => edgePoint(l, i, j, 0); // bottom: 0-1
        const eR = () => edgePoint(l, i + 1, j, 1); // right: 1-2
        const eT = () => edgePoint(l, i, j + 1, 0); // top: 3-2
        const eL = () => edgePoint(l, i, j, 1); // left: 0-3
        const centreHigh = (v0 + v1 + v2 + v3) / 4 > l;
        switch (c) {
          case 1: case 14: link(eL(), eB()); break;
          case 2: case 13: link(eB(), eR()); break;
          case 3: case 12: link(eL(), eR()); break;
          case 4: case 11: link(eR(), eT()); break;
          case 6: case 9: link(eB(), eT()); break;
          case 7: case 8: link(eL(), eT()); break;
          case 5: // 0 and 2 high
            if (centreHigh) { link(eL(), eT()); link(eB(), eR()); } else { link(eL(), eB()); link(eR(), eT()); }
            break;
          case 10: // 1 and 3 high
            if (centreHigh) { link(eL(), eB()); link(eR(), eT()); } else { link(eL(), eT()); link(eB(), eR()); }
            break;
        }
      }
    }
  }
  // chain: start from loose ends first, then walk the remaining closed loops
  const seen = new Set<number>();
  const out: Contour[] = [];
  const walk = (start: number) => {
    const ids = [start];
    seen.add(start);
    let prev = -1;
    let cur = start;
    let closed = false;
    for (;;) {
      const nb = adj.get(cur)!;
      const next = nb.find((n) => n !== prev && !seen.has(n));
      if (next === undefined) {
        closed = nb.length === 2 && nb.includes(start) && ids.length > 2;
        break;
      }
      seen.add(next);
      ids.push(next);
      prev = cur;
      cur = next;
    }
    if (ids.length < 3) return;
    const n = ids.length;
    const f = () => new Float64Array(n);
    const c: Contour = { x: f(), y: f(), z: f(), w: f(), closed };
    ids.forEach((id, m) => {
      const [th, ph, w] = pos.get(id)!;
      c.x[m] = Math.cos(ph) * Math.sin(th);
      c.y[m] = Math.sin(ph);
      c.z[m] = Math.cos(ph) * Math.cos(th);
      c.w[m] = w;
    });
    out.push(c);
  };
  for (const [k, nb] of adj) if (nb.length === 1 && !seen.has(k)) walk(k);
  for (const k of adj.keys()) if (!seen.has(k)) walk(k);
  contourCache.set(q, out);
  return out;
}

/** Ring plane is XZ, tipped round Z and then viewed at VIEW_TILT. */
function ringPoint(a: number, u: number, psi: number, cT: number, sT: number): [number, number, number] {
  const x0 = a * Math.cos(u);
  const z0 = a * Math.sin(u);
  const x1 = x0 * Math.cos(psi);
  const y1 = x0 * Math.sin(psi);
  return [x1, y1 * cT - z0 * sT, y1 * sT + z0 * cT]; // [screen x, screen y (up), depth]
}

/** Draws the planet and its rings. Back ring runs go under the body, front runs over it. */
export function paintHero(p: Painter, W: number, H: number, t: number, q: number) {
  const cx = W / 2;
  const cy = H / 2;
  const R = Math.min(W * 0.24, H * 0.3);
  const cT = Math.cos(VIEW_TILT);
  const sT = Math.sin(VIEW_TILT);
  const lm = Math.hypot(0.55, 0.5, 0.42);
  const L: [number, number, number] = [0.55 / lm, 0.5 / lm, 0.42 / lm]; // light: right, up, toward viewer
  const spin = t * 0.05;
  const B = q >= 1 ? 20 : 8; // fine light steps live; the still keeps its markup small
  const NU = Math.round(180 * q);
  const NR = Math.round(28 * q);
  const psi = -0.32;

  starfield(p, 0, 0, W, H, Math.round(90 * q), 7);

  // rings. Teal everywhere; burnt orange only where the ring catches the sun.
  const ringPass = (front: boolean) => {
    for (let i = 0; i < NR; i++) {
      const a = R * (1.32 + (0.66 * i) / Math.max(1, NR - 1));
      const xy: number[] = [];
      const bright: number[] = [];
      const warm: boolean[] = [];
      const ok: boolean[] = [];
      for (let j = 0; j <= NU; j++) {
        const u = (TAU * j) / NU;
        const [sx, sy, z] = ringPoint(a, u, psi, cT, sT);
        xy.push(cx + sx, cy - sy);
        const lit = (sx * L[0] + sy * L[1]) / a;
        ok.push(z > 0 === front);
        warm.push(lit > 0.45);
        bright.push(front ? 0.3 + 0.55 * Math.max(0, lit) : 0.14);
      }
      strokeSeries(p, xy, bright, ok, warm, B, front ? 1.5 : 0.5, heroTealFor);
    }
  };
  // one dotted outer orbit
  const orbit: number[] = [];
  for (let j = 0; j <= 180; j++) {
    const [sx, sy] = ringPoint(R * 2.45, (TAU * j) / 180, -0.26, cT, sT);
    orbit.push(cx + sx, cy - sy);
  }
  p.line(orbit, TEAL, 0.3, 0.8, [1, 5]);
  ringPass(false);

  // body: a dark teal disc lit from the sun side
  p.disc(
    cx,
    cy,
    R,
    [
      [0, [18, 58, 68], 1],
      [0.6, [6, 24, 29], 1],
      [1, [2, 10, 13], 1],
    ],
    cx + L[0] * R * 0.4,
    cy - L[1] * R * 0.4
  );

  // engraving: the terrain's contours, turned with the planet. A closed contour
  // starts its stroke on the far side, so no line ever breaks on the visible face.
  const thin = q < 1 ? 3 : 1; // the still keeps every third point
  // live frames size the contour grid to the planet: a small planet needs fewer lines
  const cq = q >= 1 ? Math.max(0.6, Math.min(1, Math.round(R / 15) / 10)) : q;
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  for (const c of heroContours(cq)) {
    const n = c.x.length;
    // turn round the polar axis, then tip toward the viewer: depth of point m
    const depth = (m: number) => c.y[m] * sT + (c.z[m] * cs - c.x[m] * ss) * cT;
    let s0 = 0;
    if (c.closed) for (let m = 0; m < n; m += 4) if (depth(m) <= 0) { s0 = m; break; }
    const last = c.closed ? n : n - 1; // a closed loop ends back on its first point
    const xy: number[] = [];
    const bright: number[] = [];
    const ok: boolean[] = [];
    for (let k = 0; k <= last; k = k < last && k + thin > last ? last : k + thin) {
      const m = (s0 + k) % n;
      const X = c.x[m] * cs + c.z[m] * ss;
      const Z = c.z[m] * cs - c.x[m] * ss;
      const y2 = c.y[m] * cT - Z * sT;
      const z2 = c.y[m] * sT + Z * cT;
      xy.push(cx + R * X, cy - R * y2);
      ok.push(z2 > 0);
      const d = X * L[0] + y2 * L[1] + z2 * L[2];
      bright.push(clamp01(0.24 + 0.7 * Math.max(0, d) + 0.06 * c.w[m] + 0.12 * (1 - z2) ** 4));
    }
    strokeSeries(p, xy, bright, ok, null, B, 1.35, heroTealFor);
  }

  // crisp limb, and a thin burnt-orange glow on the lit side
  const limb: number[] = [];
  for (let j = 0; j <= 120; j++) {
    const a = (TAU * j) / 120;
    limb.push(cx + R * Math.cos(a), cy + R * Math.sin(a));
  }
  p.line(limb, TEAL, 0.6, 1.1);
  const sunAng = Math.atan2(-L[1], L[0]);
  for (const [span, rad, width, alpha] of [
    [0.9, 0.8, 2.4, 0.22],
    [0.9, 0.8, 1.1, 0.95],
  ] as const) {
    const arc: number[] = [];
    for (let j = 0; j <= 40; j++) {
      const a = sunAng - span + (2 * span * j) / 40;
      arc.push(cx + (R + rad) * Math.cos(a), cy + (R + rad) * Math.sin(a));
    }
    p.line(arc, ORANGE, alpha, width);
  }

  // rings, front half (over the body)
  ringPass(true);
}

// ============================================================
// footer horizon
// ============================================================

/** Vertical wave on each concentric arc of the horizon. */
function arcWave(xs: number, k: number, t: number) {
  return (
    0.5 * Math.sin(11 * xs + 0.35 * k + 0.22 * t) +
    0.35 * Math.sin(23 * xs - 0.2 * k - 0.31 * t + 1.7) +
    0.6 * (2 * noise(xs * 5 + 3, k * 0.22 + 0.04 * t) - 1)
  );
}

/** Draws the planet limb, its trails, stars and the rocket on its exhaust.
    The horizon's top sits at 46% of the height, and its curve drops to the bottom corners. */
export function paintFooter(p: Painter, W: number, H: number, t: number, light: Light, q: number) {
  const cx = W / 2;
  const y0 = H * 0.46;
  const s = H - y0;
  const Rf = (s * s + (W / 2) * (W / 2)) / (2 * s);
  const cy = y0 + Rf;
  const B = q >= 1 ? 8 : 2;
  const step = q >= 1 ? Math.max(2.4, H / 120) : Math.max(5, H / 50);
  const NX = Math.round(240 * q);
  const K = Math.ceil(s / step) + 2;
  const sunX = light.sunX;
  const spotR2 = (0.1 * W) ** 2;
  const sun = (x: number) => Math.exp(-(((x - sunX) / (0.32 * W)) ** 2));
  const spot = (x: number, y: number) =>
    light.spot * Math.exp(-((x - light.spotX) ** 2 + (y - light.spotY) ** 2) / spotR2);

  starfield(p, 0, 0, W, y0 * 1.02, Math.round(120 * q), 11);

  // light trails: loops sweeping behind the planet, with a bright head moving along each
  const trails = [
    { x: 0.3, y: 0.42, a: 0.15, b: 0.11, rot: -0.28 },
    { x: 0.7, y: 0.36, a: 0.19, b: 0.09, rot: 0.22 },
    { x: 0.5, y: 0.5, a: 0.13, b: 0.1, rot: -0.12 },
    { x: 0.84, y: 0.44, a: 0.12, b: 0.08, rot: 0.5 },
  ];
  const NT = Math.round(200 * q);
  const lines = Math.max(2, Math.round(6 * q));
  trails.forEach((tr, m) => {
    const head = t * 0.25 + m * 2;
    const dir = m % 2 ? 1 : -1;
    for (let l = 0; l < lines; l++) {
      const off = (l - lines / 2) * 1.5;
      const xy: number[] = [];
      const bright: number[] = [];
      for (let j = 0; j <= NT; j++) {
        const u = (TAU * j) / NT;
        const a = tr.a * W + off;
        const b = tr.b * H + off * 0.5;
        const ex = a * Math.cos(u + dir * t * 0.02);
        const ey = b * Math.sin(u + dir * t * 0.02);
        const rot = tr.rot;
        xy.push(tr.x * W + ex * Math.cos(rot) - ey * Math.sin(rot), tr.y * H + ex * Math.sin(rot) + ey * Math.cos(rot));
        bright.push(0.3 + 0.5 * (0.5 + 0.5 * Math.cos(u - head)));
      }
      strokeSeries(p, xy, bright, null, null, B, 0.4);
    }
  });

  // the planet: concentric arcs, each one waved; the top arc is the limb
  for (let k = 0; k < K; k++) {
    const r = Rf - k * step;
    const amp = step * 1.5 * Math.min(1, 0.3 + k / 6);
    const xy: number[] = [];
    const bright: number[] = [];
    for (let i = 0; i <= NX; i++) {
      const x = -0.02 * W + (1.04 * W * i) / NX;
      const dx = x - cx;
      const ysq = Math.max(0, r * r - dx * dx);
      const xs = dx / W;
      const w = arcWave(xs, k, t);
      const y = cy - Math.sqrt(ysq) + amp * w;
      xy.push(x, y);
      const depth = 1 - (0.35 * k) / K;
      bright.push(clamp01((0.16 + 0.42 * sun(x) + 0.45 * spot(x, y) + 0.12 * w) * depth + 0.2 * Math.max(0, 1 - k / 10)));
    }
    strokeSeries(p, xy, bright, null, null, B);

    if (k === 0) {
      // the limb: a soft orange glow, then the crisp warm line where the sun falls
      p.line(xy, ORANGE, 0.12, 7);
      const warmAll = xy.map(() => true);
      strokeSeries(p, xy, bright.map((b) => clamp01(0.35 + 0.65 * b)), null, warmAll, B);
    }
  }

  // the rocket: a slim body lifting off the limb, its thin plume trailing down to the limb
  const h = Math.max(16, Math.min(34, H * 0.11));
  const tailY = y0 - H * 0.2; // rocket tail; the plume runs from here down to the limb
  const flicker = 1 + 0.2 * Math.sin(t * 9);
  p.disc(cx, y0, Math.max(30, W * 0.05), [
    [0, ORANGE_HOT, 0.5],
    [0.25, ORANGE, 0.2],
    [1, ORANGE, 0],
  ]);
  const pw = 0.09 * h; // plume half-width at the tail; it tapers to a point on the limb
  p.fill([cx - pw, tailY, cx + pw, tailY, cx + 0.6, y0, cx - 0.6, y0], ORANGE, 0.35 * flicker);
  p.line([cx, tailY, cx, y0], ORANGE_HOT, 0.9, 1.2 * flicker);
  const body: [number, number][] = [
    [0, -1.05],
    [0.1, -0.7],
    [0.1, -0.2],
    [0.2, 0],
    [-0.2, 0],
    [-0.1, -0.2],
    [-0.1, -0.7],
  ];
  const poly: number[] = [];
  for (const [dx, dy] of body) poly.push(cx + dx * h, tailY + dy * h);
  p.fill(poly, ROCKET, 0.8);
  p.disc(cx, tailY - 0.7 * h, h * 0.06, [
    [0, [9, 14, 18], 0.9],
    [1, [9, 14, 18], 0],
  ]);
}

// ============================================================
// painters
// ============================================================

/** Canvas painter. The caller sets the transform so units are CSS pixels. */
export function canvasPainter(ctx: CanvasRenderingContext2D): Painter {
  const rgba = (c: RGB, a: number) => `rgba(${c[0].toFixed(0)},${c[1].toFixed(0)},${c[2].toFixed(0)},${a.toFixed(3)})`;
  const trace = (pts: number[], close: boolean) => {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    if (close) ctx.closePath();
  };
  return {
    line(pts, rgb, alpha, width, dash) {
      if (pts.length < 4) return;
      trace(pts, false);
      ctx.strokeStyle = rgba(rgb, alpha);
      ctx.lineWidth = width;
      ctx.setLineDash(dash ?? []);
      ctx.stroke();
    },
    fill(pts, rgb, alpha) {
      trace(pts, true);
      ctx.fillStyle = rgba(rgb, alpha);
      ctx.fill();
    },
    disc(cx, cy, r, stops, fx = cx, fy = cy) {
      const g = ctx.createRadialGradient(fx, fy, 0, cx, cy, r);
      for (const [o, c, a] of stops) g.addColorStop(o, rgba(c, a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
    },
  };
}

const css = (c: RGB) => `rgb(${c[0].toFixed(0)},${c[1].toFixed(0)},${c[2].toFixed(0)})`;
/** path data in tenths of a pixel, relative after the first point: compact server markup */
const num = (v: number) => (v / 10).toString().replace(/^(-?)0\./, "$1.");
const d = (pts: number[], close: boolean) => {
  let px = Math.round(pts[0] * 10);
  let py = Math.round(pts[1] * 10);
  let s = `M${num(px)} ${num(py)}l`;
  for (let i = 2; i < pts.length; i += 2) {
    const x = Math.round(pts[i] * 10);
    const y = Math.round(pts[i + 1] * 10);
    const dy = num(y - py);
    s += `${i > 2 ? " " : ""}${num(x - px)}${dy[0] === "-" ? "" : " "}${dy}`;
    px = x;
    py = y;
  }
  return close ? `${s}Z` : s;
};

/** SVG painter for the server-rendered still. `prefix` keeps gradient ids unique. */
export function svgPainter(prefix: string) {
  const out: string[] = [];
  let n = 0;
  const painter: Painter = {
    line(pts, rgb, alpha, width, dash) {
      if (pts.length < 4) return;
      const dash_ = dash ? ` stroke-dasharray="${dash.join(" ")}"` : "";
      out.push(
        `<path d="${d(pts, false)}" fill="none" stroke="${css(rgb)}" stroke-opacity="${alpha.toFixed(3)}" stroke-width="${width.toFixed(2)}"${dash_}/>`
      );
    },
    fill(pts, rgb, alpha) {
      out.push(`<path d="${d(pts, true)}" fill="${css(rgb)}" fill-opacity="${alpha.toFixed(3)}"/>`);
    },
    disc(cx, cy, r, stops, fx = cx, fy = cy) {
      const id = `${prefix}${n++}`;
      const sts = stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${css(c)}" stop-opacity="${a.toFixed(3)}"/>`).join("");
      out.push(
        `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fx="${fx.toFixed(1)}" fy="${fy.toFixed(1)}">${sts}</radialGradient><circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${id})"/>`
      );
    },
  };
  return { painter, markup: () => out.join("") };
}
