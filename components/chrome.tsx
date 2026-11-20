import Link from "next/link";
import type { ReactNode } from "react";
import { RevealRoot } from "@/components/motion/reveal-root";
import { NavLinks } from "@/components/nav-links";

/** The shared site header: "echo" top-left (links home), plain nav top-right. */
export function SiteHeader() {
  return (
    <header className="masthead" data-reveal>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Link href="/" className="brand" aria-label="echo, home">
        echo
      </Link>
      <nav className="nav" aria-label="Primary">
        <NavLinks />
      </nav>
    </header>
  );
}

/** A small uppercase kicker label. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="kicker" data-reveal>
      {children}
    </p>
  );
}

/** Section label on a hairline rule, with an optional note on the right. */
export function SectionHead({ id, title, aside }: { id?: string; title: string; aside?: ReactNode }) {
  return (
    <div className="section-head" data-reveal>
      <h2 className="section-title" id={id}>
        {title}
      </h2>
      {aside ? <span className="section-aside">{aside}</span> : null}
    </div>
  );
}

/** One row of quiet links, then the huge cream wordmark. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-inner">
        <p className="foot-tag">A web log by Jake Parker.</p>
        <nav className="foot-links" aria-label="Elsewhere">
          <Link href="/">Writing</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/about">About</Link>
          <a href="https://github.com/jparker2006">GitHub</a>
          <a href="/rss.xml">RSS</a>
        </nav>
      </div>
      <p className="foot-wordmark" aria-hidden="true">
        echo
      </p>
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
