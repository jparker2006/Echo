"use client";

import { Fragment, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import type { Project } from "@/data/projects";
import { gsap, useGSAP } from "@/components/motion/gsap";
import { motion, queries } from "@/lib/motion/tokens";

/**
 * One related link beneath a project. External URLs and static files (e.g. the
 * paper PDF) open in a new tab via a plain anchor; internal route paths (a demo
 * page, a blog post) use client-side navigation in the same tab.
 */
function ProjectLink({ href, children }: { href: string; children: ReactNode }) {
  const lastSegment = href.split(/[?#]/)[0].split("/").pop() ?? "";
  const isExternalOrFile = /^https?:\/\//.test(href) || lastSegment.includes(".");
  if (isExternalOrFile) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return <Link href={href}>{children}</Link>;
}

/**
 * One projects list with a single self-rewriting `ls` toggle.
 *  - collapsed → `~ $ ls /projects        ▸ N more`   (featured only)
 *  - expanded  → `~ $ ls -a /projects     ▾ show less` (all, newest-first)
 *
 * Every project is rendered exactly once, in newest-first order. Non-featured
 * rows are collapsed to zero height until expanded, then fade + slide into
 * their correct chronological positions. No second list, no duplicated rows.
 */
export function ProjectLog({ projects }: { projects: Project[] }) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = projects.filter((project) => !project.featured).length;
  const scope = useRef<HTMLElement>(null);

  // Terminal print-in: the command line + the featured rows fade/rise in
  // sequentially like stdout, a quick stagger that completes well under 1s.
  // The hidden `ls -a` rows are handled by the existing CSS toggle (staggered
  // via --row), so they're left out here. Gated by matchMedia; under reduce
  // nothing is hidden so there's nothing to do.
  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;
      const items = gsap.utils.toArray<HTMLElement>("[data-print]", el);
      if (!items.length) return;

      const printIn = (travel: number) =>
        gsap.fromTo(
          items,
          { opacity: 0, y: travel },
          {
            opacity: 1,
            y: 0,
            duration: motion.durationRow,
            ease: motion.easeRow,
            stagger: motion.staggerRow,
            clearProps: "transform",
          }
        );

      const mm = gsap.matchMedia();
      mm.add(queries.desktop, () => void printIn(motion.travel));
      mm.add(queries.mobile, () => void printIn(motion.travelMobile));
      mm.add(queries.reduce, () => {});
    },
    { scope }
  );

  // running index over the collapsible (hidden) rows, so the `ls -a` reveal
  // cascades top-to-bottom instead of all rows appearing at once.
  let collapsibleIndex = 0;

  return (
    <section ref={scope}>
      <button
        type="button"
        className="cmd cmd-toggle"
        aria-expanded={expanded}
        aria-controls="project-log"
        onClick={() => setExpanded((open) => !open)}
        data-print
      >
        <span className="cmd-path">~</span> <span className="cmd-sigil">$</span>{" "}
        <span className="cmd-text">{expanded ? "ls -a /projects" : "ls /projects"}</span>
        <span className="cmd-hint">
          <span className="cmd-caret" aria-hidden="true">
            {expanded ? "▾" : "▸"}
          </span>{" "}
          {expanded ? "show less" : `${hiddenCount} more`}
        </span>
      </button>

      <ol className="project-log" id="project-log">
        {projects.map((project) => {
          const collapsible = !project.featured;
          const collapsed = collapsible && !expanded;
          const rowIndex = collapsible ? collapsibleIndex++ : 0;
          // Related links, in fixed order: paper · demo · blog post.
          const links: { id: string; href: string; label: string }[] = [];
          if (project.paper) links.push({ id: "paper", href: project.paper, label: "paper" });
          if (project.demo) links.push({ id: "demo", href: project.demo, label: "demo" });
          if (project.post)
            links.push({ id: "post", href: `/posts/${project.post}`, label: "blog post" });
          return (
            <li
              key={`${project.year}-${project.name}`}
              className={[
                "log-item",
                collapsible ? "log-item--collapsible" : "",
                collapsed ? "is-collapsed" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={collapsible ? ({ "--row": rowIndex } as CSSProperties) : undefined}
            >
              <div className="log-clip" inert={collapsed || undefined}>
                <div className="log-row" data-print={collapsible ? undefined : ""}>
                  <span className="log-year">{project.year}</span>
                  <div className="log-main">
                    <span className="log-name">
                      {project.url ? (
                        <a href={project.url} target="_blank" rel="noreferrer">
                          {project.name}
                        </a>
                      ) : (
                        project.name
                      )}
                    </span>
                    <p className="log-desc">{project.description}</p>
                    {links.length > 0 ? (
                      <p className="log-links">
                        {links.map((link, i) => (
                          <Fragment key={link.id}>
                            {i > 0 ? (
                              <span className="log-sep" aria-hidden="true">
                                ·
                              </span>
                            ) : null}
                            <ProjectLink href={link.href}>{link.label}</ProjectLink>
                          </Fragment>
                        ))}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
