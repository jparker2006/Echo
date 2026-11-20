import Link from "next/link";
import type { ReactNode } from "react";
import type { Project } from "@/data/projects";

/** External URLs and static files (e.g. the paper PDF) open in a new tab; app routes stay in-tab. */
function ProjectLink({ href, children }: { href: string; children: ReactNode }) {
  const lastSegment = href.split(/[?#]/)[0].split("/").pop() ?? "";
  if (/^https?:\/\//.test(href) || lastSegment.includes(".")) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return <Link href={href}>{children}</Link>;
}

/** Every project, newest-first, as a compact two-column list of hairline rows. */
export function ProjectLog({ projects }: { projects: Project[] }) {
  return (
    <ol className="project-list">
      {projects.map((project) => {
        // related links, in fixed order: paper · demo · blog post
        const links: { id: string; href: string; label: string }[] = [];
        if (project.paper) links.push({ id: "paper", href: project.paper, label: "Paper" });
        if (project.demo) links.push({ id: "demo", href: project.demo, label: "Demo" });
        if (project.post) links.push({ id: "post", href: `/posts/${project.post}`, label: "Blog post" });
        return (
          <li key={`${project.year}-${project.name}`} className="project-row" data-reveal-row>
            <p className="project-head">
              <span className="project-name">
                {project.url ? (
                  <ProjectLink href={project.url}>
                    {project.name}
                    <span className="project-ext" aria-hidden="true">
                      ↗
                    </span>
                  </ProjectLink>
                ) : (
                  project.name
                )}
              </span>
              <span className="project-year">{project.year}</span>
            </p>
            <p className="project-desc">{project.description}</p>
            {links.length > 0 ? (
              <p className="project-links">
                {links.map((link) => (
                  <ProjectLink key={link.id} href={link.href}>
                    {link.label}
                  </ProjectLink>
                ))}
              </p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
