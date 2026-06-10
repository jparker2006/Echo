"use client";

import { Fragment, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Project } from "@/data/projects";

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

  return (
    <section className="fade-up">
      <button
        type="button"
        className="cmd cmd-toggle"
        aria-expanded={expanded}
        aria-controls="project-log"
        onClick={() => setExpanded((open) => !open)}
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
            >
              <div className="log-clip" inert={collapsed || undefined}>
                <div className="log-row">
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
