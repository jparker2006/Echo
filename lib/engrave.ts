// Contour engraving: a planet drawn as iso-contour lines of a noise field
// wrapped onto a rotating sphere, like a topographic plate. Pure functions
// only; the components own the canvas, the loop and the pointer.

/** Palette from design/targets-r1/palette.md (M1): petrol shadow, engraving teal, glint. */
export const SHADOW = [18, 63, 73] as const; // #123f49
export const MID = [60, 141, 157] as const; // #3c8d9d
export const GLINT = [185, 201, 198] as const; // #b9c9c6
export const EMBER = [216, 117, 50] as const; // #d87532, light only

const BUCKETS = 7;
const LEVEL_LO = 0.3;
const LEVEL_HI = 0.7;

export type Vec3 = [number, number, number];

export function norm3(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

/** Integer hash to [0,1). */
function hash3(ix: number, iy: number, iz: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Smooth 3D value noise in [0,1). */
function valueNoise(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const c000 = hash3(ix, iy, iz);
  const c100 = hash3(ix + 1, iy, iz);
  const c010 = hash3(ix, iy + 1, iz);
  const c110 = hash3(ix + 1, iy + 1, iz);
  const c001 = hash3(ix, iy, iz + 1);
  const c101 = hash3(ix + 1, iy, iz + 1);
  const c011 = hash3(ix, iy + 1, iz + 1);
  const c111 = hash3(ix + 1, iy + 1, iz + 1);
  const x00 = c000 + (c100 - c000) * ux;
  const x10 = c010 + (c110 - c010) * ux;
  const x01 = c001 + (c101 - c001) * ux;
  const x11 = c011 + (c111 - c011) * ux;
  const y0 = x00 + (x10 - x00) * uy;
  const y1 = x01 + (x11 - x01) * uy;
  return y0 + (y1 - y0) * uz;
}

/** Four octaves of value noise, normalised to about [0,1]. */
function fbm(x: number, y: number, z: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < 4; o++) {
    sum += amp * valueNoise(x * f, y * f, z * f);
    norm += amp;
    amp *= 0.5;
    f *= 2.03;
  }
  return sum / norm;
}

/**
 * The land field at a point on the unit sphere, after the planet has spun by
 * `spin` about its axis and tipped by `tilt`. Latitude belts are folded in so
 * the engraving reads as banded like the target, not as pure noise.
 */
export function surfaceField(n: Vec3, spin: number, tilt: number): number {
  const cs = Math.cos(spin);
  const ss = Math.sin(spin);
  const x1 = n[0] * cs + n[2] * ss;
  const z1 = -n[0] * ss + n[2] * cs;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const y2 = n[1] * ct - z1 * st;
  const z2 = n[1] * st + z1 * ct;
  const f = fbm(x1 * 3.4 + 11.3, y2 * 3.4 + 4.7, z2 * 3.4 + 7.9);
  return f + 0.07 * Math.sin(y2 * 9 + f * 5);
}

/** Lit-side brightness for a screen point on the sphere, 0..1. */
export function litAt(nx: number, ny: number, nz: number, light: Vec3): number {
  return Math.max(0, nx * light[0] + ny * light[1] + nz * light[2]);
}

/** Colour ramp for brightness b (0..1): shadow petrol → engraving teal → glint. */
export function rampColor(b: number): string {
  const t = Math.min(1, Math.max(0, b));
  const [a, c, u] = t < 0.5 ? [SHADOW, MID, t / 0.5] : [MID, GLINT, (t - 0.5) / 0.5];
  const m = (i: number) => Math.round(a[i] + (c[i] - a[i]) * u);
  return `rgb(${m(0)},${m(1)},${m(2)})`;
}

export type Sphere = {
  cx: number;
  cy: number;
  r: number;
  spin: number;
  tilt: number;
  light: Vec3;
  /** optional pointer spotlight in CSS px and 0..1 strength */
  spot?: { x: number; y: number; k: number };
};

/**
 * Draws the sphere's contour lines into `ctx` (CSS-px coordinates; the caller
 * sets the transform). Grid nodes are sampled at `step` px; each marching-
 * squares segment is bucketed by its lit brightness so the strokes stay batched.
 * Caller clips to the disc.
 */
export function drawContours(
  ctx: CanvasRenderingContext2D,
  s: Sphere,
  box: { x0: number; y0: number; x1: number; y1: number },
  step: number,
  levels: number,
) {
  const { cx, cy, r, spin, tilt, light } = s;
  const cols = Math.max(1, Math.ceil((box.x1 - box.x0) / step));
  const rows = Math.max(1, Math.ceil((box.y1 - box.y0) / step));
  const W = cols + 1;
  const field = new Float32Array(W * (rows + 1));
  for (let j = 0; j <= rows; j++) {
    const y = box.y0 + j * step;
    for (let i = 0; i <= cols; i++) {
      const x = box.x0 + i * step;
      const dx = (x - cx) / r;
      const dy = (y - cy) / r;
      const d2 = Math.min(1, dx * dx + dy * dy);
      field[j * W + i] = surfaceField(norm3([dx, dy, Math.sqrt(1 - d2)]), spin, tilt);
    }
  }

  const buckets: number[][] = Array.from({ length: BUCKETS }, () => []);
  const bucketOf = (x: number, y: number) => {
    const dx = (x - cx) / r;
    const dy = (y - cy) / r;
    const d2 = Math.min(1, dx * dx + dy * dy);
    const nz = Math.sqrt(1 - d2);
    let b = 0.07 + 0.6 * Math.pow(litAt(dx, dy, nz, light), 1.4);
    if (s.spot) {
      const sx = (x - s.spot.x) / (r * 0.5);
      const sy = (y - s.spot.y) / (r * 0.5);
      b += s.spot.k * 0.55 * Math.exp(-(sx * sx + sy * sy) * 1.4);
    }
    return Math.min(BUCKETS - 1, Math.floor(Math.min(1, b) * BUCKETS));
  };
  const push = (k: number, x1: number, y1: number, x2: number, y2: number) => {
    const b = buckets[k];
    b.push(x1, y1, x2, y2);
  };

  const lo = LEVEL_LO;
  const span = (LEVEL_HI - LEVEL_LO) / levels;
  for (let j = 0; j < rows; j++) {
    const y0 = box.y0 + j * step;
    const y1 = y0 + step;
    for (let i = 0; i < cols; i++) {
      const x0 = box.x0 + i * step;
      const x1 = x0 + step;
      const a = field[j * W + i]; // tl
      const b = field[j * W + i + 1]; // tr
      const c = field[(j + 1) * W + i + 1]; // br
      const d = field[(j + 1) * W + i]; // bl
      const vmin = Math.min(a, b, c, d);
      const vmax = Math.max(a, b, c, d);
      let k0 = Math.max(0, Math.ceil((vmin - lo) / span));
      const k1 = Math.min(levels - 1, Math.floor((vmax - lo) / span));
      for (let k = k0; k <= k1; k++) {
        const L = lo + (k + 0.5) * span;
        const ia = a > L ? 8 : 0;
        const ib = b > L ? 4 : 0;
        const ic = c > L ? 2 : 0;
        const id = d > L ? 1 : 0;
        const cse = ia | ib | ic | id;
        if (cse === 0 || cse === 15) continue;
        // edge crossings
        const T = () => [x0 + (step * (L - a)) / (b - a || 1e-6), y0];
        const R = () => [x1, y0 + (step * (L - b)) / (c - b || 1e-6)];
        const B = () => [x0 + (step * (L - d)) / (c - d || 1e-6), y1];
        const Lf = () => [x0, y0 + (step * (L - a)) / (d - a || 1e-6)];
        const seg = (p: () => number[], q: () => number[]) => {
          const [px, py] = p();
          const [qx, qy] = q();
          push(bucketOf((px + qx) / 2, (py + qy) / 2), px, py, qx, qy);
        };
        switch (cse) {
          case 1:
          case 14:
            seg(Lf, B);
            break;
          case 2:
          case 13:
            seg(B, R);
            break;
          case 3:
          case 12:
            seg(Lf, R);
            break;
          case 4:
          case 11:
            seg(T, R);
            break;
          case 6:
          case 9:
            seg(T, B);
            break;
          case 7:
          case 8:
            seg(T, Lf);
            break;
          case 5:
          case 10: {
            // saddle: the centre decides whether the high corners join up
            const high = (a + b + c + d) / 4 > L;
            if ((cse === 5) === high) {
              seg(T, Lf); // b,d high joined (or a,c high cut off) → cut the b/d side
              seg(B, R);
            } else {
              seg(T, R);
              seg(Lf, B);
            }
            break;
          }
        }
      }
    }
  }

  ctx.lineCap = "round";
  for (let k = 0; k < BUCKETS; k++) {
    const pts = buckets[k];
    if (!pts.length) continue;
    const bright = (k + 0.5) / BUCKETS;
    ctx.strokeStyle = rampColor(bright);
    ctx.lineWidth = 0.25 + 0.4 * bright;
    ctx.beginPath();
    for (let p = 0; p < pts.length; p += 4) {
      ctx.moveTo(pts[p], pts[p + 1]);
      ctx.lineTo(pts[p + 2], pts[p + 3]);
    }
    ctx.stroke();
  }
}

/** Limb glow: a burnt-orange arc on the lit side of the disc. */
export function drawLimbGlow(ctx: CanvasRenderingContext2D, s: Sphere, width: number) {
  const ang = Math.atan2(s.light[1], s.light[0]);
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},0.9)`;
  ctx.shadowBlur = width * 3;
  ctx.strokeStyle = `rgba(${EMBER[0]},${EMBER[1]},${EMBER[2]},0.95)`;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(s.cx, s.cy, s.r + width * 0.4, ang - 1.05, ang + 1.05);
  ctx.stroke();
  ctx.restore();
}

/** Deterministic PRNG so the stars never change between renders. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function drawStars(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, seed: number) {
  const rnd = seeded(seed);
  ctx.fillStyle = "rgba(185,201,198,0.55)";
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = rnd() < 0.12 ? 1.1 : 0.5;
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/**
 * Rings as many thin ellipses. The back half of each ellipse is drawn before
 * the planet (so the planet hides it) and the front half after.
 */
export function drawRings(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  tilt: number,
  part: "back" | "front",
) {
  const count = 16;
  ctx.save();
  ctx.lineWidth = 0.6;
  for (let i = 0; i < count; i++) {
    const f = i / (count - 1);
    const rx = r * (1.42 + f * 0.5);
    const ry = rx * 0.27;
    const a = 0.25 + 0.5 * (1 - Math.abs(f - 0.5) * 1.6);
    ctx.strokeStyle = `rgba(${GLINT[0]},${GLINT[1]},${GLINT[2]},${Math.max(0.12, a).toFixed(2)})`;
    ctx.beginPath();
    if (part === "back") ctx.ellipse(cx, cy, rx, ry, tilt, Math.PI, Math.PI * 2);
    else ctx.ellipse(cx, cy, rx, ry, tilt, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}
