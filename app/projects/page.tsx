import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { Shell } from "@/components/chrome";
import { ProjectLog } from "@/components/project-log";

export const metadata: Metadata = {
  title: "projects",
  description: "A reverse-chronological log of things I've built.",
};

export default function ProjectsPage() {
  return (
    <Shell>
      <header className="page-head">
        <p className="kicker" data-reveal>
          <span className="kicker-file">~/projects</span>
          <span className="kicker-sep" aria-hidden="true">
            /
          </span>
          {projects.length} entries
        </p>
        <h1 className="page-title" data-reveal>
          projects
        </h1>
      </header>
      <ProjectLog projects={projects} />
    </Shell>
  );
}
