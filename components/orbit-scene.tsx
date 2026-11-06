import { footerScene, heroScene, SVG_SIZE, type Item } from "@/lib/orbit-art";
import { OrbitCanvas } from "@/components/orbit-canvas";

/** The hero planet. The server writes the first frame as SVG (never blank,
    works without JS); OrbitCanvas then draws live frames over it. Decorative. */
export function HeroPlanet() {
  const [w, h] = SVG_SIZE.hero;
  return (
    <OrbitCanvas kind="hero">
      <OrbitSvg items={heroScene(w, h, 0)} w={w} h={h} id="hero" fit="xMidYMid meet" />
    </OrbitCanvas>
  );
}

/** The footer horizon: the same scene, live on a canvas that follows the mouse. */
export function FooterOrbit() {
  const [w, h] = SVG_SIZE.foot;
  return (
    <OrbitCanvas kind="footer">
      <OrbitSvg items={footerScene(w, h, 0)} w={w} h={h} id="foot" fit="xMidYMax slice" />
    </OrbitCanvas>
  );
}

function path(p: number[]) {
  let d = "";
  for (let i = 0; i < p.length; i += 2) d += `${i ? "L" : "M"}${p[i].toFixed(2)} ${p[i + 1].toFixed(2)}`;
  return d;
}

/** The still frame: the same drawing list as the canvas, written as SVG. */
function OrbitSvg({ items, w, h, id, fit }: { items: Item[]; w: number; h: number; id: string; fit: string }) {
  return (
    <svg
      className="orbit-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio={fit}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {items.map((it, i) =>
          it.k === "glow" ? (
            <radialGradient key={i} id={`${id}-g${i}`}>
              <stop offset="0" stopColor={it.c} stopOpacity="1" />
              <stop offset="1" stopColor={it.c} stopOpacity="0" />
            </radialGradient>
          ) : null
        )}
      </defs>
      {items.map((it, i) => {
        if (it.k === "line")
          return (
            <path
              key={i}
              d={path(it.p)}
              fill="none"
              stroke={it.c}
              strokeWidth={it.w}
              strokeOpacity={it.a}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        if (it.k === "disc") return <circle key={i} cx={it.x} cy={it.y} r={it.r} fill={it.c} />;
        return <circle key={i} cx={it.x} cy={it.y} r={it.r} fill={`url(#${id}-g${i})`} opacity={it.a} />;
      })}
    </svg>
  );
}
