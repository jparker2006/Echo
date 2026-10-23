"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The verb ("cd " / "cat ") is its own span so narrow screens can drop it
// and keep the header on one line.
const links = [
  { href: "/", verb: "cd", path: "/posts", match: (p: string) => p === "/" || p.startsWith("/posts") },
  { href: "/projects", verb: "cd", path: "/projects", match: (p: string) => p.startsWith("/projects") },
  { href: "/about", verb: "cat", path: "about.md", match: (p: string) => p.startsWith("/about") },
];

/** Terminal-style primary nav; marks the current section with aria-current. */
export function NavLinks() {
  const pathname = usePathname() ?? "/";
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          aria-current={link.match(pathname) ? "page" : undefined}
        >
          <span className="nav-verb">{link.verb} </span>
          {link.path}
        </Link>
      ))}
    </>
  );
}
