import { GuillocheLive } from "@/components/guilloche";
import { paintHero, STATIC_T, svgPainter } from "@/lib/guilloche";

// the still frame is drawn at this size; CSS scales it with preserveAspectRatio
const HERO = { W: 480, H: 378 };
const STILL_Q = 0.5; // coarser lines keep the server markup small

/** The hero planet. The server renders its still frame as SVG so it is never
    blank; GuillocheLive then draws live frames over it. Decorative. */
export function HeroPlanet() {
  const { painter, markup } = svgPainter("gh");
  paintHero(painter, HERO.W, HERO.H, STATIC_T, STILL_Q);
  return (
    <GuillocheLive>
      <svg
        className="guil-static"
        viewBox={`0 0 ${HERO.W} ${HERO.H}`}
        preserveAspectRatio="xMidYMid meet"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: markup() }}
      />
    </GuillocheLive>
  );
}

// ---- the painted band behind the home hero: a warm dusk, engraved ----

const PW = 1440;
const PH = 720;
const SUN = { x: 1010, y: 452 }; // the glow sits low behind the planet

/** A ridge line across the band: a few slow sines, so it reads hand-drawn. */
function ridge(x: number, base: number, amp: number, seed: number) {
  return (
    base -
    amp *
      (0.55 * Math.sin(x / 260 + seed) +
        0.3 * Math.sin(x / 117 + seed * 2.3) +
        0.15 * Math.sin(x / 53 + seed * 4.1))
  );
}

function path(pts: [number, number][]) {
  return pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
}

function paintingMarkup() {
  const out: string[] = [];
  out.push(
    `<defs>
      <linearGradient id="pd-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#191612"/>
        <stop offset="0.38" stop-color="#2a221c"/>
        <stop offset="0.6" stop-color="#4a3829"/>
        <stop offset="0.68" stop-color="#5a4431"/>
        <stop offset="0.78" stop-color="#3a2d23"/>
        <stop offset="1" stop-color="#1b1916"/>
      </linearGradient>
      <radialGradient id="pd-sun" cx="${SUN.x}" cy="${SUN.y}" r="520" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#a27a52" stop-opacity="0.5"/>
        <stop offset="0.35" stop-color="#7a5a3e" stop-opacity="0.22"/>
        <stop offset="1" stop-color="#7a5a3e" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="pd-left" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#14120f" stop-opacity="0.7"/>
        <stop offset="0.5" stop-color="#14120f" stop-opacity="0.18"/>
        <stop offset="1" stop-color="#14120f" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="pd-foot" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#1b1916" stop-opacity="0"/>
        <stop offset="1" stop-color="#1b1916" stop-opacity="1"/>
      </linearGradient>
    </defs>
    <rect width="${PW}" height="${PH}" fill="url(#pd-sky)"/>
    <rect width="${PW}" height="${PH}" fill="url(#pd-sun)"/>`
  );

  // engraved halo: fine concentric rings round the low sun, fading outward
  for (let i = 1; i <= 46; i++) {
    const r = 40 + i * 13;
    const a = 0.085 * (1 - i / 50);
    out.push(
      `<circle cx="${SUN.x}" cy="${SUN.y}" r="${r}" fill="none" stroke="#e7cfae" stroke-opacity="${a.toFixed(3)}" stroke-width="0.6"/>`
    );
  }

  // three ridges, far to near; each is a dark fill engraved with lines that follow its crest
  const ridges = [
    { base: 500, amp: 26, seed: 1.7, fill: "#33281f", ink: "#d9b88e", lines: 9, gap: 6, alpha: 0.14 },
    { base: 548, amp: 34, seed: 4.2, fill: "#27201a", ink: "#cfae86", lines: 11, gap: 7, alpha: 0.12 },
    { base: 606, amp: 22, seed: 0.4, fill: "#1e1a16", ink: "#c2a17c", lines: 13, gap: 8, alpha: 0.1 },
  ];
  for (const r of ridges) {
    const crest: [number, number][] = [];
    for (let x = -20; x <= PW + 20; x += 12) crest.push([x, ridge(x, r.base, r.amp, r.seed)]);
    out.push(`<path d="${path(crest)}L${PW + 20} ${PH}L-20 ${PH}Z" fill="${r.fill}"/>`);
    for (let k = 0; k < r.lines; k++) {
      // each line hugs the crest less the deeper it sits, and fades with depth
      const flat = 1 - (k / r.lines) * 0.6;
      const pts = crest.map(([x, y]) => [x, r.base + (y - r.base) * flat + 3 + k * r.gap] as [number, number]);
      const a = r.alpha * (1 - k / (r.lines + 2));
      out.push(
        `<path d="${path(pts)}" fill="none" stroke="${r.ink}" stroke-opacity="${a.toFixed(3)}" stroke-width="0.7"/>`
      );
    }
    // the crest itself, a touch brighter
    out.push(
      `<path d="${path(crest)}" fill="none" stroke="${r.ink}" stroke-opacity="${(r.alpha * 1.8).toFixed(3)}" stroke-width="0.9"/>`
    );
  }

  out.push(`<rect width="${PW}" height="${PH}" fill="url(#pd-left)"/>`);
  out.push(`<rect y="${PH * 0.78}" width="${PW}" height="${PH * 0.22}" fill="url(#pd-foot)"/>`);
  return out.join("");
}

/** The full-bleed dusk behind the home hero. Static SVG, decorative. */
export function HeroPainting() {
  return (
    <svg
      className="hero-paint"
      viewBox={`0 0 ${PW} ${PH}`}
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: paintingMarkup() }}
    />
  );
}
