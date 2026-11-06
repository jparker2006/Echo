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

/** Body-fixed wave field: a shape on the planet's surface, drifting slowly. */
function bodyWave(th: number, ph: number, t: number) {
  return (
    0.45 * Math.sin(3 * th + 2.1 * ph + 0.25 * t) +
    0.3 * Math.sin(5 * th - 1.3 * ph - 0.18 * t) +
    0.5 * (2 * noise(1.6 * Math.cos(th) + 10, 1.6 * Math.sin(th) + 2 * ph + 0.05 * t) - 1)
  );
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
  const B = 32; // fine steps: coarse brightness buckets show as hard vertical edges
  const NL = Math.round(136 * q);
  const NS = Math.round(260 * q);
  const NU = Math.round(180 * q);
  const NR = Math.round(28 * q);
  const psi = -0.32;

  starfield(p, 0, 0, W, H, Math.round(90 * q), 7);

  // rings, back half (drawn under the body). Teal everywhere; burnt orange
  // only where the ring catches the sun.
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

  // engraving: latitude lines, displaced by the wave field and bunched by light
  for (let k = 0; k < NL; k++) {
    const ph = -Math.PI / 2 + (Math.PI * (k + 0.5)) / NL; // pole to pole, no cap hole
    const cp = Math.cos(ph);
    const sp = Math.sin(ph);
    const xy: number[] = [];
    const bright: number[] = [];
    const ok: boolean[] = [];
    // each latitude is a closed loop: sample all the way round (j = NS meets
    // j = 0) and start on the far side, so no break ever faces the viewer
    for (let j = 0; j <= NS; j++) {
      const th = Math.PI - spin + (TAU * j) / NS;
      const al = th + spin;
      const w = bodyWave(th, ph, t);
      const r = R * (1 + 0.03 * w * cp); // relief fades out at the poles, no pinch
      const X = cp * Math.sin(al);
      const Y = sp;
      const Z = cp * Math.cos(al);
      const y2 = Y * cT - Z * sT;
      const z2 = Y * sT + Z * cT;
      xy.push(cx + r * X, cy - r * y2);
      ok.push(z2 > 0);
      const d = X * L[0] + y2 * L[1] + z2 * L[2];
      bright.push(clamp01(0.26 + 0.7 * Math.max(0, d) ** 1.0 + 0.1 * w + 0.12 * (1 - z2) ** 4));
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

/** Craters on the footer planet: [x across the width (-0.5..0.5), depth (0 limb..1 front), radius]. */
const CRATERS: readonly [number, number, number][] = [
  [-0.3, 0.62, 0.075],
  [0.24, 0.72, 0.1],
  [0.4, 0.34, 0.05],
  [-0.06, 0.9, 0.06],
  [-0.43, 0.3, 0.045],
  [0.08, 0.42, 0.04],
];

/** Terrain height for the footer engraving: layered noise ridges plus crater rims.
    Fed (x across the planet, depth from the limb); neighbouring arcs sample nearby
    depths, so they bunch and part together and the lines read as relief. */
function terrain(xs: number, v: number, t: number) {
  const u = xs + t * 0.004; // the planet turns slowly under the rocket
  let h =
    0.55 * (2 * noise(u * 6 + 3, v * 3.2) - 1) +
    0.3 * (2 * noise(u * 14 + 9, v * 7 + 4) - 1) +
    0.15 * (2 * noise(u * 31 + 1, v * 15 + 8) - 1);
  h = Math.sign(h) * Math.abs(h) ** 0.8; // sharpen ridges a little
  for (const [xc, vc, r] of CRATERS) {
    const cxw = ((xc - u + 0.8) % 1.6 + 1.6) % 1.6 - 0.8; // wrap round as it turns
    const d = Math.hypot(cxw / r, (v - vc) / (r * 2.6));
    if (d < 2.2) h += 1.2 * Math.exp(-(((d - 1) / 0.28) ** 2)) - 0.7 * Math.exp(-((d / 0.65) ** 2));
  }
  return h;
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
  const NX = Math.round(420 * q);
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

  // the planet: concentric arcs displaced by the terrain; the top arc is the limb.
  // Relief grows toward the viewer (the limb is foreshortened) and never rises
  // above the limb, so the horizon stays one crisp line.
  const limbY = (x: number) => cy - Math.sqrt(Math.max(0, Rf * Rf - (x - cx) * (x - cx)));
  for (let k = K - 1; k >= 0; k--) {
    const r = Rf - k * step;
    const v = k / K;
    const amp = k === 0 ? 0 : step * (1.2 + 5 * v) * Math.min(1, k / 4);
    const xy: number[] = [];
    const bright: number[] = [];
    for (let i = 0; i <= NX; i++) {
      const x = -0.02 * W + (1.04 * W * i) / NX;
      const dx = x - cx;
      const h = k === 0 ? 0 : terrain(dx / W, v, t);
      const y = Math.max(limbY(x) + 0.8, cy - Math.sqrt(Math.max(0, r * r - dx * dx)) - amp * h);
      xy.push(x, y);
      const depth = 1 - 0.3 * v;
      bright.push(
        clamp01((0.26 + 0.42 * sun(x) + 0.45 * spot(x, y) + 0.16 * h) * depth + 0.22 * Math.max(0, 1 - k / 8))
      );
    }
    strokeSeries(p, xy, bright, null, null, B, k === 0 ? 1 : 1.15, heroTealFor);

    if (k === 0) {
      // the horizon: a thin burnt-orange glow and a crisp hot line, strongest where the sun falls
      const C = 4;
      for (let i = 0; i + C <= NX; i += C) {
        const g = Math.exp(-(((xy[2 * i + C] - sunX) / (0.42 * W)) ** 2));
        if (g < 0.04) continue;
        const seg = xy.slice(2 * i, 2 * (i + C) + 2);
        p.line(seg, ORANGE, 0.26 * g, 3.5);
        p.line(seg, mix(ORANGE, ORANGE_HOT, 0.35 * g * g), Math.min(1, 1.25 * g), 1.5);
      }
    }
  }

  // the rocket, the focal point: a slim body lifting off the limb, its thin plume
  // trailing straight down to a hot spot on the horizon
  const h = Math.max(22, Math.min(50, H * 0.17));
  const tailY = y0 - H * 0.21; // rocket tail; the plume runs from here down to the limb
  const flicker = 1 + 0.2 * Math.sin(t * 9);
  p.disc(cx, y0, Math.max(34, W * 0.045), [
    [0, ORANGE_HOT, 0.55],
    [0.2, ORANGE, 0.22],
    [1, ORANGE, 0],
  ]);
  const pw = 0.075 * h; // plume half-width at the tail; it tapers to a point on the limb
  p.fill([cx - pw, tailY, cx + pw, tailY, cx + 0.5, y0, cx - 0.5, y0], ORANGE, 0.4 * flicker);
  p.line([cx, tailY + 1, cx, y0], ORANGE_HOT, 0.95, 1.1 * flicker);
  p.disc(cx, tailY + 1, h * 0.22, [
    [0, ORANGE_HOT, 0.75],
    [0.4, ORANGE, 0.25],
    [1, ORANGE, 0],
  ]);
  // fins first, then the body over them
  for (const side of [-1, 1]) {
    p.fill(
      [cx + side * 0.09 * h, tailY - 0.34 * h, cx + side * 0.24 * h, tailY - 0.06 * h, cx + side * 0.24 * h, tailY + 0.04 * h, cx + side * 0.09 * h, tailY - 0.06 * h],
      [150, 170, 172],
      0.95
    );
  }
  const body: [number, number][] = [
    [0, -1.05],
    [0.05, -0.95],
    [0.1, -0.72],
    [0.11, -0.3],
    [0.09, 0],
    [-0.09, 0],
    [-0.11, -0.3],
    [-0.1, -0.72],
    [-0.05, -0.95],
  ];
  const poly: number[] = [];
  for (const [dx, dy] of body) poly.push(cx + dx * h, tailY + dy * h);
  p.fill(poly, ROCKET, 0.95);
  // a sunlit edge on the right and a dark porthole
  p.line([cx + 0.05 * h, tailY - 0.95 * h, cx + 0.1 * h, tailY - 0.72 * h, cx + 0.11 * h, tailY - 0.3 * h], ORANGE_HOT, 0.6, 0.8);
  p.disc(cx, tailY - 0.62 * h, h * 0.045, [
    [0, [9, 14, 18], 0.95],
    [0.7, [9, 14, 18], 0.9],
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
const d = (pts: number[], close: boolean) => {
  let s = `M${pts[0].toFixed(1)} ${pts[1].toFixed(1)}`;
  for (let i = 2; i < pts.length; i += 2) s += `L${pts[i].toFixed(1)} ${pts[i + 1].toFixed(1)}`;
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
