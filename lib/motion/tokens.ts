/* ============================================================
   motion tokens — the single source of truth for the GSAP layer.
   Every animation imports from here so the feel stays consistent
   and tunable from one place. Subtle, fast, quiet.
   Values are plain numbers (seconds / pixels) for GSAP.
   ============================================================ */

export const motion = {
  /** vertical travel of an entrance, in px (transform only) */
  travel: 10,
  /** lighter travel on small screens */
  travelMobile: 6,

  /** entrance duration, seconds */
  duration: 0.45,
  /** the terminal print-in of a single projects row */
  durationRow: 0.34,

  /** time between staggered siblings, seconds */
  stagger: 0.05,
  /** quicker cadence for the projects "stdout" print-in */
  staggerRow: 0.045,

  /** easing — kept in the power2/power3 out family, no bounce/elastic */
  ease: "power2.out",
  easeRow: "power3.out",
} as const;

/** matchMedia condition strings — one branch each for desktop, mobile, reduce. */
export const queries = {
  desktop: "(prefers-reduced-motion: no-preference) and (min-width: 641px)",
  mobile: "(prefers-reduced-motion: no-preference) and (max-width: 640px)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;
