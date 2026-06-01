import Link from "next/link";
import type { ReactNode } from "react";

/** The "echo" masthead wordmark, plus terminal-style nav. */
function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`masthead${compact ? " masthead--compact" : ""}`}>
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
    <p className="cmd">
      <span className="cmd-path">~</span> <span className="cmd-sigil">$</span>{" "}
      <span className="cmd-text">{command}</span>
    </p>
  );
}

/** A centered "·   ·   ·" rule, used between posts. */
export function Divider() {
  return (
    <div className="divider" aria-hidden="true">
      ·&ensp;&ensp;·&ensp;&ensp;·
    </div>
  );
}

/** Centered reading column shared by every page: header + content. */
export function Shell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="wrap">
      <SiteHeader compact={compact} />
      {children}
    </div>
  );
}
