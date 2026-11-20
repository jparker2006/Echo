import Link from "next/link";
import type { ReactNode } from "react";
import { RevealRoot } from "@/components/motion/reveal-root";
import { NavLinks } from "@/components/nav-links";
import { Painting } from "@/components/painting";

/** The shared site header: the cream "echo" wordmark top-left (links home),
    three quiet links top-right. It sits on the painting at the top of every page. */
export function SiteHeader() {
  return (
    <header className="masthead" data-reveal>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Link href="/" className="brand" aria-label="echo, home">
        <span className="brand-dot" aria-hidden="true" />
        <span className="brand-word">echo</span>
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

/** A section label on a hairline rule, with an optional note on the right. */
export function SectionHead({
  id,
  title,
  aside,
}: {
  id?: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="section-head" data-reveal>
      <h2 className="section-title" id={id}>
        {title}
      </h2>
      {aside ? <span className="section-aside">{aside}</span> : null}
    </div>
  );
}

/** The slim painted band that opens every inner page, with the page head on it. */
export function PageBand({ children }: { children: ReactNode }) {
  return (
    <Painting variant="band">
      <div className="band-head">{children}</div>
    </Painting>
  );
}

/** Link groups, then a huge cream wordmark, as on openwiz.dev. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-inner">
        <div className="foot-about">
          <p className="foot-tag">A web log by Jake Parker.</p>
          <p className="foot-line">Notes on things I build.</p>
        </div>
        <nav className="foot-groups" aria-label="Footer">
          <div>
            <h2>Read</h2>
            <ul>
              <li>
                <Link href="/">Posts</Link>
              </li>
              <li>
                <a href="/rss.xml">RSS</a>
              </li>
            </ul>
          </div>
          <div>
            <h2>More</h2>
            <ul>
              <li>
                <Link href="/projects">Projects</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <a href="https://github.com/jparker2006">GitHub</a>
              </li>
            </ul>
          </div>
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
