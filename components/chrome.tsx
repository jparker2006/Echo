import Link from "next/link";
import type { ReactNode } from "react";
import { RevealRoot } from "@/components/motion/reveal-root";
import { NavLinks } from "@/components/nav-links";
import { FooterHorizon } from "@/components/guilloche-art";

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

/** Serif section title (`posts`, `projects`) on a hairline rule, with an optional
    mono note on the right. The `ls /…` command stays in the accessible name. */
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
        <span className="sr-only">
          <span className="cmd-sigil">$</span> {command}
        </span>
        <span className="section-title" aria-hidden="true">
          {command.replace(/^ls \//, "")}
        </span>
      </span>
      <span className="section-rule" aria-hidden="true" />
      {aside ? <span className="section-aside">{aside}</span> : null}
    </h2>
  );
}

/** The page ends on a horizon: an engraved teal planet limb with a burnt-orange
    glow and a rocket lifting off it. Two rows of quiet links sit above it. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-inner">
        <nav className="foot-links" aria-label="Elsewhere">
          <Link href="/">posts</Link>
          <Link href="/projects">projects</Link>
          <Link href="/about">about</Link>
          <a href="https://github.com/jparker2006">github</a>
          <a href="/rss.xml">rss</a>
        </nav>
      </div>
      <div className="foot-horizon">
        <FooterHorizon />
      </div>
    </footer>
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
