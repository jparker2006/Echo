"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "cd /posts", match: (p: string) => p === "/" || p.startsWith("/posts") },
  { href: "/projects", label: "cd /projects", match: (p: string) => p.startsWith("/projects") },
  { href: "/about", label: "cat about.md", match: (p: string) => p.startsWith("/about") },
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
          {link.label}
        </Link>
      ))}
    </>
  );
}
