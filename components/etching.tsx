/**
 * A blue engraved seascape: hatched sky, a low sun drawn in rings, a hairline
 * horizon, distant headland and a sea of wave lines that tighten toward the
 * horizon, with a stippled glint path. Pure SVG, generated at build time.
 */

const W = 480;
const H = 600;
const HORIZON = 330;
const SUN = { x: 300, y: 250, r: 54 };

const f = (n: number) => Math.round(n * 10) / 10;

// deterministic pseudo-random, so the plate is the same on every render
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function skyLines() {
  const out: { d: string; w: number }[] = [];
  // spacing widens toward the horizon: dark at the top, light near the sea
  let y = 8;
  while (y < HORIZON - 6) {
    const t = y / HORIZON;
    const w = 1.5 - t * 1.05;
    out.push({ d: `M0 ${f(y)}H${W}`, w: f(w * 10) / 10 });
    y += 3.2 + t * 4.2;
  }
  return out;
}

function sunRings() {
  const out: string[] = [];
  for (let r = 2.5; r <= SUN.r; r += 2.6) {
    out.push(`M${SUN.x - r} ${SUN.y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`);
  }
  return out;
}

function headland() {
  // a low ridge on the left, hatched with short verticals
  const ridge = (x: number) =>
    HORIZON - Math.max(0, 34 * Math.sin((x / 170) * Math.PI) + 8 * Math.sin(x / 13)) * (x < 170 ? 1 : 0);
  let outline = `M0 ${HORIZON}`;
  const hatch: string[] = [];
  for (let x = 0; x <= 170; x += 2) {
    const y = ridge(x);
    outline += `L${x} ${f(y)}`;
    if (x % 3 === 0 || x % 4 === 0) hatch.push(`M${x} ${f(y + 1.5)}V${HORIZON}`);
  }
  return { outline, hatch: hatch.join("") };
}

function seaLines() {
  const rand = rng(7);
  const out: { d: string; w: number; o: number }[] = [];
  const n = 46;
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n;
    const y0 = HORIZON + Math.pow(t, 1.9) * (H - HORIZON + 10);
    const amp = 0.4 + t * 5.5;
    const len = 24 + t * 70;
    const phase = rand() * Math.PI * 2;
    let d = "";
    let pen = false;
    for (let x = -4; x <= W + 4; x += 4) {
      const y = y0 + Math.sin((x / len) * Math.PI * 2 + phase) * amp + Math.sin(x / 7 + i) * amp * 0.18;
      // engraved lines break up: short gaps scattered along each stroke
      const gap = Math.sin(x * 0.031 + i * 1.7) + Math.sin(x * 0.11 + i) > 1.55;
      if (gap) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${x} ${f(y)}`;
      pen = true;
    }
    out.push({ d, w: f((0.55 + t * 1.15) * 10) / 10, o: f((0.55 + t * 0.4) * 100) / 100 });
  }
  return out;
}

function glint() {
  // stippled dither: dots fall inside a cone under the sun, sparser with depth
  const rand = rng(31);
  const dots: string[] = [];
  for (let k = 0; k < 900; k++) {
    const t = rand();
    const y = HORIZON + 2 + Math.pow(t, 1.6) * (H - HORIZON);
    const spread = 10 + t * 120;
    const x = SUN.x + (rand() - 0.5) * 2 * spread * Math.sqrt(rand());
    if (rand() < 0.35 + t * 0.4) continue;
    dots.push(`M${f(x)} ${f(y)}h${f(1 + t * 2.2)}`);
  }
  return dots.join("");
}

export function Etching() {
  const sky = skyLines();
  const sea = seaLines();
  const land = headland();
  return (
    <svg
      className="etching"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="An engraved seascape: a low sun over a calm sea and a distant headland."
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <mask id="etch-sky">
          <rect width={W} height={H} fill="#fff" />
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r + 7} fill="#000" />
        </mask>
        <clipPath id="etch-sun">
          <circle cx={SUN.x} cy={SUN.y} r={SUN.r} />
        </clipPath>
        <pattern id="etch-stipple" width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r=".7" fill="currentColor" />
          <circle cx="4.5" cy="4.5" r=".5" fill="currentColor" />
        </pattern>
        <linearGradient id="etch-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".7" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="etch-top">
          <rect width={W} height={HORIZON} fill="url(#etch-fade)" />
        </mask>
      </defs>

      <g fill="none" stroke="currentColor" strokeLinecap="round">
        <g mask="url(#etch-sky)">
          {sky.map((l, i) => (
            <path key={i} d={l.d} strokeWidth={l.w} opacity={0.85} />
          ))}
        </g>
        <rect width={W} height={HORIZON} fill="url(#etch-stipple)" stroke="none" mask="url(#etch-top)" opacity=".5" />
        <g clipPath="url(#etch-sun)" className="etching-glint" strokeWidth=".9">
          {sunRings().map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={`${land.outline}V${HORIZON}Z`} fill="var(--etch-bg)" stroke="none" />
        <path d={land.hatch} strokeWidth="1.1" />
        <path d={land.outline} strokeWidth="1.2" />
        <path d={`M0 ${HORIZON}H${W}`} strokeWidth="1.4" />
        {sea.map((l, i) => (
          <path key={i} d={l.d} strokeWidth={l.w} opacity={l.o} />
        ))}
        <path className="etching-glint" d={glint()} strokeWidth="1.2" />
      </g>
    </svg>
  );
}
