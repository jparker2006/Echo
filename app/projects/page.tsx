import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { Shell, Kicker, PageBand } from "@/components/chrome";
import { ProjectLog } from "@/components/project-log";

export const metadata: Metadata = {
  title: "projects",
  description: "A reverse-chronological log of things I've built.",
};

export default function ProjectsPage() {
  return (
    <Shell>
      <PageBand>
        <header className="page-head">
          <Kicker>
            Work
            <span className="kicker-sep" aria-hidden="true">
              ·
            </span>
            {projects.length} entries
          </Kicker>
          <h1 className="page-title" data-reveal>
            Projects
          </h1>
        </header>
      </PageBand>
      <ProjectLog projects={projects} />
    </Shell>
  );
}
