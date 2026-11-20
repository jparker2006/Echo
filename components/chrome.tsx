import Link from "next/link";
import type { ReactNode } from "react";
import { RevealRoot } from "@/components/motion/reveal-root";
import { NavLinks } from "@/components/nav-links";
import { site } from "@/lib/site";

/** The shared site header: the cream "echo" wordmark on the left (links home),
    plain nav on the right, over one hairline. Identical on every page. */
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

/** A section title on the left with an optional quiet note on the right. */
export function SectionHead({ id, title, aside }: { id?: string; title: string; aside?: ReactNode }) {
  return (
    <div className="section-head" data-reveal>
      <h2 id={id}>{title}</h2>
      {aside ? <p className="section-aside">{aside}</p> : null}
    </div>
  );
}

/** Small link columns, then a huge cream wordmark across the page. */
export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-top">
        <div className="foot-about">
          <p className="foot-tag">{site.author}</p>
          <p className="foot-line">{site.description}</p>
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
