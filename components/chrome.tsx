import Link from "next/link";
import type { ReactNode } from "react";
import { RevealRoot } from "@/components/motion/reveal-root";
import { NavLinks } from "@/components/nav-links";

/** The shared site header: the cream "echo" wordmark (links home) and three quiet links. */
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

/** Small uppercase label that sits above a title. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="kicker" data-reveal>
      {children}
    </p>
  );
}

/** One line of links, then the huge cream wordmark. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <nav className="foot-links" aria-label="Elsewhere">
        <Link href="/">Posts</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/about">About</Link>
        <a href="https://github.com/jparker2006">GitHub</a>
        <a href="/rss.xml">RSS</a>
      </nav>
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
