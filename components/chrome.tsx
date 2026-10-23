import Link from "next/link";
import type { ReactNode } from "react";
import { RevealRoot } from "@/components/motion/reveal-root";
import { NavLinks } from "@/components/nav-links";
import { HORIZON_NARROW, HORIZON_WIDE, horizonRuns, PALETTE } from "@/lib/ascii";

/** The shared site header: "echo" wordmark top-left (links home),
    terminal-style nav top-right, on one line. Identical on every page. */
export function SiteHeader() {
  return (
    <header className="masthead" data-reveal>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Link href="/" className="brand" aria-label="echo, home">
        <span className="brand-word">echo</span>
        <span className="brand-cursor" aria-hidden="true">
          _
        </span>
      </Link>
      <nav className="nav" aria-label="Primary">
        <span className="prompt" aria-hidden="true">
          <span className="cmd-path">~</span> <span className="cmd-sigil">$</span>
        </span>
        <NavLinks />
      </nav>
    </header>
  );
}

/** A terminal command line: `~ $ <command>`.
    Shared across pages so the prompt styling stays identical:
    "~" path is muted, the "$" sigil is lime, the command is off-white. */
export function Prompt({ command }: { command: string }) {
  return (
    <p className="cmd" data-reveal>
      <span className="cmd-path">~</span> <span className="cmd-sigil">$</span>{" "}
      <span className="cmd-text">{command}</span>
    </p>
  );
}

/** Mono section heading with a dotted rule and an optional right-hand note,
    e.g. `ls /posts ··········· 2 posts`. */
export function SectionHead({
  id,
  command,
  aside,
}: {
  id?: string;
  command: string;
  aside?: ReactNode;
}) {
  return (
    <h2 className="section-head" id={id} data-reveal>
      <span className="section-cmd">
        <span className="cmd-sigil">$</span> {command}
      </span>
      <span className="section-rule" aria-hidden="true" />
      {aside ? <span className="section-aside">{aside}</span> : null}
    </h2>
  );
}

/** Site footer: the wordmark signs off with a tiny ASCII ringed planet
    (the hero's planet, in miniature), then the outbound links. */
/** The page ends on a horizon: the limb of a huge purple planet in ASCII,
    full-bleed, with two quiet links in the sky above it. One still frame per
    grid size; CSS shows the one that fits. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-inner">
        <nav className="foot-links" aria-label="Elsewhere">
          <a href="/rss.xml">rss</a>
          <a href="https://github.com/jparker2006">github</a>
        </nav>
      </div>
      <div className="foot-horizon" aria-hidden="true">
        <HorizonFrame grid={HORIZON_WIDE} className="foot-art foot-art--wide" />
        <HorizonFrame grid={HORIZON_NARROW} className="foot-art foot-art--narrow" />
      </div>
    </footer>
  );
}

function HorizonFrame({ grid, className }: { grid: { W: number; H: number }; className: string }) {
  return (
    <pre className={className}>
      {horizonRuns(grid.W, grid.H).map((runs, i) => (
        <span key={i}>
          {runs.map((run, j) => (
            <span key={j} style={run.tone ? { color: PALETTE[run.tone] } : undefined}>
              {run.text}
            </span>
          ))}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}

/** Page frame shared by every page: header + main content + footer. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <RevealRoot>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </RevealRoot>
  );
}
