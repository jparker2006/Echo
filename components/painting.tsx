import type { ReactNode } from "react";
import { HeroPlanet } from "@/components/guilloche-art";

/**
 * The painting behind the UI: a warm dusk sky with an engraved, dithered
 * texture, all CSS + inline SVG (no raster files). The home page gets the full
 * hero with the live engraved planet; inner pages get a slim band with a
 * quiet engraved limb. Children (the UI card) sit on top of the painting.
 */
export function Painting({
  variant,
  children,
}: {
  variant: "hero" | "band";
  children?: ReactNode;
}) {
  const id = `pt-${variant}`;
  return (
    <div className={`paint paint--${variant}`}>
      <div className="paint-art" aria-hidden="true">
        <div className="paint-sky" />
        <div className="paint-sun" />
        {variant === "hero" ? (
          <div className="paint-planet">
            <div className="paint-halo" />
            <HeroPlanet />
          </div>
        ) : (
          <div className="paint-limb" />
        )}
        <svg className="paint-grain" focusable="false" preserveAspectRatio="none">
          <defs>
            {/* engraver's hatching: fine horizontal rules, and a crossing set in the shadows */}
            <pattern id={`${id}-h`} width="6" height="3" patternUnits="userSpaceOnUse">
              <rect width="6" height="0.7" fill="#120f0c" />
            </pattern>
            <pattern
              id={`${id}-x`}
              width="5"
              height="5"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-28)"
            >
              <rect width="5" height="0.6" fill="#120f0c" />
            </pattern>
            <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="0.45" stopColor="#fff" stopOpacity="0.15" />
              <stop offset="0.75" stopColor="#fff" stopOpacity="0.35" />
              <stop offset="1" stopColor="#fff" stopOpacity="1" />
            </linearGradient>
            <mask id={`${id}-m`}>
              <rect width="100%" height="100%" fill={`url(#${id}-shade)`} />
            </mask>
            {/* a coarse ordered-looking dither: thresholded noise */}
            <filter id={`${id}-d`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="4" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.95  0 0 0 0 0.86  0 0 0 0 0.74  1.4 0 0 0 -0.62"
              />
              <feComponentTransfer>
                <feFuncA type="discrete" tableValues="0 0 0.55 1" />
              </feComponentTransfer>
            </filter>
          </defs>
          <rect className="paint-hatch" width="100%" height="100%" fill={`url(#${id}-h)`} />
          <rect
            className="paint-cross"
            width="100%"
            height="100%"
            fill={`url(#${id}-x)`}
            mask={`url(#${id}-m)`}
          />
          <rect className="paint-dither" width="100%" height="100%" filter={`url(#${id}-d)`} />
        </svg>
        <div className="paint-fade" />
      </div>
      {children}
    </div>
  );
}
