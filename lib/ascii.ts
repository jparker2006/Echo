// A tiny real-time ASCII renderer for the home hero: a textured, spinning
// purple planet, a tilted ring that passes in front of and behind it, a
// point-cloud rocket on an inclined orbit, and twinkling stars.
//
// Everything that never changes (sphere normals, ring geometry, shadows,
// textures) is baked once per grid size; a frame is then just lookups plus
// ~300 rocket points, so it costs well under a millisecond. The same code
// renders the static server frame and the live canvas frames.

export const ASPECT = 1.75; // cell height / width (line-height 1.05em ÷ 0.6em advance)
export const GLYPH_W = 0.6; // JetBrains Mono advance width, in em

/** tone index → color. 0 means "empty cell". */
export const PALETTE = [
  "transparent",
  "#4f4a61", // 1 star, dim
  "#b9b4c9", // 2 star, bright
  "#3e2380", // 3 planet, night side
  "#6b3bd6", // 4 planet, dusk
  "#a56bff", // 5 planet, day
  "#d6b8ff", // 6 planet, highlight
  "#5f5288", // 7 ring, shadowed / far
  "#d8cef4", // 8 ring, lit
  "#eceaf2", // 9 rocket, lit
  "#8d88a0", // 10 rocket, shade
  "#c6f35a", // 11 flame (the only lime)
];

const PLANET_RAMP = " .:-=+*#%@";
const RING_RAMP = " .-~=+*";
const BODY_RAMP = ".:-=+#%@";

type V3 = [number, number, number];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: V3): V3 => {
  const n = Math.hypot(a[0], a[1], a[2]);
  return [a[0] / n, a[1] / n, a[2] / n];
};
const cross = (a: V3, b: V3): V3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

// small deterministic PRNG + value noise, so the server and client agree
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(xf), v = s(yf), w = s(zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w
  );
}

function fbm(x: number, y: number, z: number) {
  return 0.55 * noise3(x, y, z) + 0.3 * noise3(x * 2.1, y * 2.1, z * 2.1) + 0.15 * noise3(x * 4.3, y * 4.3, z * 4.3);
}

// ---- scene constants (view space: x right, y up, z toward the viewer) ----

const LIGHT = norm([-0.62, 0.48, 0.62]);
const TILT = 0.3; // ring opening
const ROLL = -0.22; // ring rotation on screen
const RING_N: V3 = [-Math.sin(ROLL) * Math.cos(TILT), Math.cos(ROLL) * Math.cos(TILT), Math.sin(TILT)];
const AX_X: V3 = [Math.cos(ROLL), Math.sin(ROLL), 0];
const AX_Z: V3 = cross(AX_X, RING_N);

const TW = 128; // planet texture, equirectangular
const TH = 64;
const RTW = 192; // ring texture: angle × radius
const RTH = 24;

function bakePlanetTexture() {
  const tex = new Float32Array(TW * TH);
  for (let j = 0; j < TH; j++) {
    const lat = (j / (TH - 1) - 0.5) * Math.PI;
    for (let i = 0; i < TW; i++) {
      const lon = (i / TW) * Math.PI * 2;
      // sample noise on a cylinder so the texture wraps seamlessly in longitude
      const nx = Math.cos(lon) * 1.6, nz = Math.sin(lon) * 1.6, ny = lat * 1.4;
      const warp = fbm(nx + 7, ny, nz);
      let v = 0.5 + 0.34 * Math.sin(lat * 9 + warp * 3.2) + 0.18 * (fbm(nx * 2, ny * 2, nz * 2) - 0.5);
      // one big storm so the spin reads at a glance
      const dl = lon - 2.2, dla = lat + 0.38;
      const d = Math.min(Math.abs(dl), Math.PI * 2 - Math.abs(dl));
      v += 0.55 * Math.exp(-(d * d * 9 + dla * dla * 70));
      tex[j * TW + i] = Math.max(0, Math.min(1, v));
    }
  }
  return tex;
}

function bakeRingTexture() {
  const tex = new Float32Array(RTW * RTH);
  for (let j = 0; j < RTH; j++) {
    const band = 0.55 + 0.45 * noise3(j * 0.9, 3.1, 0.5);
    for (let i = 0; i < RTW; i++) {
      const a = (i / RTW) * Math.PI * 2;
      const clump = noise3(Math.cos(a) * 3, Math.sin(a) * 3, j * 0.4);
      tex[j * RTW + i] = band * (0.7 + 0.45 * clump);
    }
  }
  return tex;
}

const PLANET_TEX = bakePlanetTexture();
const RING_TEX = bakeRingTexture();

// ---- rocket model: (side, forward, up) points, kind 0 body · 1 fin · 2 window · 3 nozzle ----
// Points sit ~0.22 units apart (under one cell at the rocket's scale) so the
// silhouette fills solid instead of reading as a cloud of dots.

type RocketPoint = { p: V3; n: V3; kind: number };

const ROCKET_STEP = 0.22;

function buildRocket(): RocketPoint[] {
  const pts: RocketPoint[] = [];
  const ring = (f: number, r: number, kind: number, slope = 0) => {
    const k = Math.max(6, Math.round((Math.PI * 2 * r) / ROCKET_STEP));
    for (let i = 0; i < k; i++) {
      const a = (i / k) * Math.PI * 2;
      const n = norm([Math.cos(a), slope, Math.sin(a)]);
      pts.push({ p: [Math.cos(a) * r, f, Math.sin(a) * r], n, kind });
    }
  };
  // body, then a parabolic nose that comes to a clear point
  for (let f = -2.3; f < 1.2; f += ROCKET_STEP) ring(f, 1, 0);
  for (let f = 1.2; f <= 4.2; f += ROCKET_STEP * 0.8) {
    const u = (f - 1.2) / 3;
    ring(f, Math.max(0.04, 1 - u * u), 0, 0.66 * u);
  }
  // engine bell flaring out behind the body
  for (let f = -2.3; f >= -2.9; f -= ROCKET_STEP * 0.6) ring(f, 0.62 + (-2.3 - f) * 0.45, 3, -0.4);
  // four swept fins: edge-on pairs give the classic profile from any side
  for (let fin = 0; fin < 4; fin++) {
    const a = (fin / 4) * Math.PI * 2;
    const dir: V3 = [Math.cos(a), 0, Math.sin(a)];
    const flat: V3 = [-Math.sin(a), 0, Math.cos(a)];
    for (let r = 1; r <= 2.05; r += ROCKET_STEP) {
      const s = (r - 1) / 1.05;
      // leading edge sweeps back, trailing edge reaches past the nozzle
      for (let f = -2.3 - s * 0.75; f <= -0.6 - s * 1.35; f += ROCKET_STEP)
        pts.push({ p: [dir[0] * r, f, dir[2] * r], n: flat, kind: 1 });
    }
  }
  // a porthole on the side that faces the viewer as the rocket crosses in front
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++)
      if (i * i + j * j < 2) pts.push({ p: [1.08, 0.55 + i * 0.2, j * 0.2], n: [1, 0, 0], kind: 2 });
  return pts;
}

const ROCKET = buildRocket();

// ---- baked scene for one grid size ----

export type Scene = {
  W: number;
  H: number;
  R: number;
  cx: number;
  cy: number;
  kind: Uint8Array; // 0 sky · 1 planet · 2 ring
  diff: Float32Array; // planet: lit amount incl. ring shadow · ring: lit amount
  lat: Float32Array;
  lon: Float32Array;
  ringR: Uint8Array; // ring radial band
  ringA: Float32Array; // ring angle
  zTop: Float32Array; // nearest opaque depth per cell
  stars: { k: number; phase: number; speed: number; big: boolean }[];
  chars: Uint8Array; // frame output: index into GLYPHS
  tones: Uint8Array; // frame output: index into PALETTE
  zb: Float32Array;
};

export const GLYPHS = Array.from(new Set((" " + PLANET_RAMP + RING_RAMP + BODY_RAMP + "o^*'+.").split(""))).join("");
const G = (ch: string) => GLYPHS.indexOf(ch);
const PLANET_G = PLANET_RAMP.split("").map(G);
const RING_G = RING_RAMP.split("").map(G);
const BODY_G = BODY_RAMP.split("").map(G);

export function createScene(W: number, H: number): Scene {
  const n = W * H;
  const R = W * 0.235;
  const RIN = R * 1.24;
  const ROUT = R * 1.95;
  const GAP0 = R * 1.6, GAP1 = R * 1.66;
  const cx = W / 2, cy = H / 2;

  const s: Scene = {
    W, H, R, cx, cy,
    kind: new Uint8Array(n),
    diff: new Float32Array(n),
    lat: new Float32Array(n),
    lon: new Float32Array(n),
    ringR: new Uint8Array(n),
    ringA: new Float32Array(n),
    zTop: new Float32Array(n).fill(-Infinity),
    stars: [],
    chars: new Uint8Array(n),
    tones: new Uint8Array(n),
    zb: new Float32Array(n),
  };

  const onRing = (p: V3) => {
    const r = Math.hypot(p[0], p[1], p[2]);
    return r > RIN && r < ROUT && !(r > GAP0 && r < GAP1);
  };

  for (let row = 0; row < H; row++) {
    for (let col = 0; col < W; col++) {
      const k = row * W + col;
      const x = col + 0.5 - cx;
      const y = (cy - (row + 0.5)) * ASPECT;

      const d2 = x * x + y * y;
      const sz = d2 < R * R ? Math.sqrt(R * R - d2) : -Infinity;

      // where this pixel's ray crosses the ring plane
      const rz = -(RING_N[0] * x + RING_N[1] * y) / RING_N[2];
      const rp: V3 = [x, y, rz];
      const ringHere = onRing(rp) && rz > sz;

      if (ringHere) {
        const r = Math.hypot(x, y, rz);
        s.kind[k] = 2;
        s.zTop[k] = rz;
        s.ringR[k] = Math.min(RTH - 1, Math.floor(((r - RIN) / (ROUT - RIN)) * RTH));
        s.ringA[k] = Math.atan2(dot(rp, AX_X), dot(rp, AX_Z));
        // the planet's shadow falls across the ring behind it
        const along = dot(rp, LIGHT);
        const perp2 = r * r - along * along;
        const shadowed = along < 0 && perp2 < R * R;
        const front = rz > 0;
        s.diff[k] = shadowed ? 0.18 : front ? 1 : 0.72;
      } else if (sz > -Infinity) {
        const nrm: V3 = [x / R, y / R, sz / R];
        s.kind[k] = 1;
        s.zTop[k] = sz;
        s.lat[k] = Math.asin(Math.max(-1, Math.min(1, dot(nrm, RING_N))));
        s.lon[k] = Math.atan2(dot(nrm, AX_X), dot(nrm, AX_Z));
        let lit = Math.max(0, dot(nrm, LIGHT));
        // the ring's shadow on the planet: march toward the light
        const surf: V3 = [x, y, sz];
        const denom = dot(RING_N, LIGHT);
        if (Math.abs(denom) > 1e-4) {
          const t = -dot(RING_N, surf) / denom;
          if (t > 0 && onRing([surf[0] + LIGHT[0] * t, surf[1] + LIGHT[1] * t, surf[2] + LIGHT[2] * t]))
            lit *= 0.35;
        }
        // a thin atmospheric rim so the night-side edge still reads as round
        s.diff[k] = lit + 0.3 * Math.pow(1 - nrm[2], 4);
      }
    }
  }

  const rand = mulberry32(2006 + W);
  for (let k = 0; k < n; k++) {
    if (s.kind[k] !== 0) continue;
    const r = rand();
    if (r < 0.045) s.stars.push({ k, phase: rand() * 6.28, speed: 0.6 + rand() * 1.8, big: r < 0.008 });
  }
  return s;
}

const TAU = Math.PI * 2;

/** Render one frame at time `t` (seconds) into scene.chars / scene.tones. */
export function renderFrame(s: Scene, t: number) {
  const { W, H, R, cx, cy, kind, chars, tones, zb } = s;
  const spin = t * 0.16;
  const ringSpin = t * 0.05;

  for (let k = 0; k < W * H; k++) {
    zb[k] = s.zTop[k];
    const kd = kind[k];
    if (kd === 1) {
      let u = (s.lon[k] + spin) / TAU;
      u -= Math.floor(u);
      const v = s.lat[k] / Math.PI + 0.5;
      const tex = PLANET_TEX[Math.min(TH - 1, (v * (TH - 1)) | 0) * TW + ((u * TW) | 0)];
      // a little ambient keeps the night side readable as a disc
      const b = Math.min(1, s.diff[k] * (0.45 + 0.75 * tex) + 0.08 + 0.1 * tex);
      chars[k] = PLANET_G[Math.max(1, Math.round(b * (PLANET_G.length - 1)))];
      tones[k] = b > 0.72 ? 6 : b > 0.42 ? 5 : b > 0.16 ? 4 : 3;
    } else if (kd === 2) {
      let u = (s.ringA[k] + ringSpin) / TAU;
      u -= Math.floor(u);
      const tex = RING_TEX[s.ringR[k] * RTW + ((u * RTW) | 0)];
      const b = Math.min(1, tex * s.diff[k]);
      chars[k] = RING_G[Math.max(1, Math.round(b * (RING_G.length - 1)))];
      tones[k] = s.diff[k] > 0.5 && b > 0.35 ? 8 : 7;
    } else {
      chars[k] = 0;
      tones[k] = 0;
    }
  }

  for (const st of s.stars) {
    const tw = Math.sin(t * st.speed + st.phase);
    if (tw < -0.55) continue;
    chars[st.k] = G(st.big && tw > 0.6 ? "+" : tw > 0.85 ? "*" : ".");
    tones[st.k] = st.big || tw > 0.7 ? 2 : 1;
  }

  // rocket on an inclined orbit: it crosses in front of the planet low, over
  // the dark side where the white hull pops, and behind it high, so the disc
  // and the ring take turns hiding it. Its "up" is the orbit normal, with a
  // gentle roll so the fins catch the light.
  const a = t * 0.34 + 0.06; // STATIC_T catches it in profile, about to cross in front
  const rad = R * 1.72;
  const A = norm([1, 0.12, 0]);
  const B = norm([0, -0.42, 0.9]);
  const pos: V3 = [
    rad * (Math.cos(a) * A[0] + Math.sin(a) * B[0]),
    rad * (Math.cos(a) * A[1] + Math.sin(a) * B[1]),
    rad * (Math.cos(a) * A[2] + Math.sin(a) * B[2]),
  ];
  const fwd = norm([
    -Math.sin(a) * A[0] + Math.cos(a) * B[0],
    -Math.sin(a) * A[1] + Math.cos(a) * B[1],
    -Math.sin(a) * A[2] + Math.cos(a) * B[2],
  ]);
  const n0 = norm(cross(A, B));
  const s0 = cross(fwd, n0);
  const roll = 0.45 * Math.sin(a * 2);
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const up: V3 = [n0[0] * cr + s0[0] * sr, n0[1] * cr + s0[1] * sr, n0[2] * cr + s0[2] * sr];
  const side = cross(fwd, up);
  const scale = R * 0.145;

  const plot = (lx: number, lf: number, lu: number, glyph: number, tone: number) => {
    const wx = pos[0] + (side[0] * lx + fwd[0] * lf + up[0] * lu) * scale;
    const wy = pos[1] + (side[1] * lx + fwd[1] * lf + up[1] * lu) * scale;
    const wz = pos[2] + (side[2] * lx + fwd[2] * lf + up[2] * lu) * scale;
    const col = Math.floor(cx + wx);
    const row = Math.floor(cy - wy / ASPECT);
    if (col < 0 || col >= W || row < 0 || row >= H) return;
    const k = row * W + col;
    if (wz <= zb[k]) return; // hidden behind the planet, the ring, or nearer rocket points
    zb[k] = wz;
    chars[k] = glyph;
    tones[k] = tone;
  };

  // glyph and tone carry the parts apart: a bright heavy hull, solid grey fins
  // and nozzle (never the ring's dashes), a violet porthole, a lime plume
  for (const pt of ROCKET) {
    const nl = dot([
      side[0] * pt.n[0] + fwd[0] * pt.n[1] + up[0] * pt.n[2],
      side[1] * pt.n[0] + fwd[1] * pt.n[1] + up[1] * pt.n[2],
      side[2] * pt.n[0] + fwd[2] * pt.n[1] + up[2] * pt.n[2],
    ], LIGHT);
    const [x, f, u] = pt.p;
    if (pt.kind === 2) plot(x, f, u, G("o"), 6);
    else if (pt.kind === 1) plot(x, f, u, G(Math.abs(nl) > 0.35 ? "#" : "+"), 10);
    else if (pt.kind === 3) plot(x, f, u, G(nl > 0 ? "%" : "#"), 10);
    else plot(x, f, u, G(nl > 0.6 ? "@" : nl > 0.3 ? "%" : nl > 0.05 ? "#" : "*"), nl > 0.05 ? 9 : 10);
  }

  // exhaust: a lime plume that tapers from a dense core and flickers in length
  const flick = mulberry32(Math.floor(t * 20) + 1);
  const len = 2.2 + flick() * 2;
  for (let i = 0; i < 60; i++) {
    const d = Math.pow(flick(), 1.4); // 0 at the nozzle, 1 at the tip
    const r = 0.75 * Math.pow(1 - d, 0.9) * flick();
    const ang = flick() * TAU;
    const glyph = d < 0.18 ? "@" : d < 0.4 ? "*" : d < 0.7 ? "+" : "'";
    plot(Math.cos(ang) * r, -2.9 - d * len, Math.sin(ang) * r, G(glyph), 11);
  }
}

export type Run = { tone: number; text: string };

/** Render a frame as rows of same-color runs (for the server-rendered <pre>). */
export function frameRuns(W: number, H: number, t: number): Run[][] {
  const s = createScene(W, H);
  renderFrame(s, t);
  const rows: Run[][] = [];
  for (let r = 0; r < H; r++) {
    const runs: Run[] = [];
    for (let c = 0; c < W; c++) {
      const k = r * W + c;
      const ch = GLYPHS[s.chars[k]];
      const tone = ch === " " ? (runs.at(-1)?.tone ?? 0) : s.tones[k];
      const last = runs.at(-1);
      if (last && last.tone === tone) last.text += ch;
      else runs.push({ tone, text: ch });
    }
    rows.push(runs);
  }
  return rows;
}

/** Plain-text frame, handy for eyeballing the art in a terminal. */
export function frameText(W: number, H: number, t: number) {
  return frameRuns(W, H, t)
    .map((runs) => runs.map((r) => r.text).join("").replace(/\s+$/, ""))
    .join("\n");
}

/** The two grid sizes: a wide one for desktop and a coarser one for phones.
    Both share the same aspect ratio so swapping them never shifts layout. */
export const GRID_WIDE = { W: 80, H: 36 } as const;
export const GRID_NARROW = { W: 60, H: 27 } as const;
export const STATIC_T = 3.4;
