import Link from "next/link";
import type { ReactNode } from "react";
import { RevealRoot } from "@/components/motion/reveal-root";

/** The shared site header: small "echo" wordmark top-left (links home),
    terminal-style nav top-right, on one line. Identical on every page. */
export function SiteHeader() {
  return (
    <header className="masthead masthead--compact" data-reveal>
      <Link href="/" className="brand" aria-label="echo — home">
        <span className="brand-word">echo</span>
      </Link>
      <nav className="nav" aria-label="Primary">
        <span className="prompt" aria-hidden="true">
          <span className="cmd-path">~</span> <span className="cmd-sigil">$</span>
        </span>
        <Link href="/">cd /posts</Link>
        <Link href="/projects">cd /projects</Link>
        <Link href="/about">cat about.md</Link>
      </nav>
    </header>
  );
}

/** A terminal command line: `~ $ <command>`.
    Shared across pages so the prompt styling stays identical:
    "~" path is muted, the "$" sigil is amber, the command is cream. */
export function Prompt({ command }: { command: string }) {
  return (
    <p className="cmd" data-reveal>
      <span className="cmd-path">~</span> <span className="cmd-sigil">$</span>{" "}
      <span className="cmd-text">{command}</span>
    </p>
  );
}

/** Centered reading column shared by every page: header + content. */
export function Shell({ children }: { children: ReactNode }) {
  return (
    <RevealRoot>
      <SiteHeader />
      {children}
    </RevealRoot>
  );
}
