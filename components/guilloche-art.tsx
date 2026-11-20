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
