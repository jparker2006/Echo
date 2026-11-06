import { GuillocheLive } from "@/components/guilloche";
import { paintFooter, paintHero, STATIC_T, svgPainter } from "@/lib/guilloche";

// the still frames are drawn at these sizes; CSS scales them with preserveAspectRatio
const HERO = { W: 480, H: 378 };
const FOOTER = { W: 1440, H: 300 };
const STILL_Q = 0.42; // coarser lines keep the server markup small

/** The hero planet. The server renders its still frame as SVG so it is never
    blank; GuillocheLive then draws live frames over it. Decorative. */
export function HeroPlanet() {
  const { painter, markup } = svgPainter("gh");
  paintHero(painter, HERO.W, HERO.H, STATIC_T, STILL_Q);
  return (
    <GuillocheLive scene="hero">
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

/** The footer horizon, with the same still-then-live pattern. */
export function FooterHorizon() {
  const { painter, markup } = svgPainter("gf");
  paintFooter(painter, FOOTER.W, FOOTER.H, STATIC_T, { sunX: FOOTER.W / 2, spotX: 0, spotY: 0, spot: 0 }, STILL_Q);
  return (
    <GuillocheLive scene="footer">
      <svg
        className="guil-static"
        viewBox={`0 0 ${FOOTER.W} ${FOOTER.H}`}
        preserveAspectRatio="xMidYMax slice"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: markup() }}
      />
    </GuillocheLive>
  );
}
