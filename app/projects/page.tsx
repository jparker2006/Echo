import type { Metadata } from "next";
import { projects } from "@/data/projects";
import { Shell, Kicker } from "@/components/chrome";
import { ProjectLog } from "@/components/project-log";

export const metadata: Metadata = {
  title: "projects",
  description: "A reverse-chronological log of things I've built.",
};

export default function ProjectsPage() {
  return (
    <Shell>
      <header className="page-head">
        <Kicker>{projects.length} things I&rsquo;ve built</Kicker>
        <h1 className="page-title" data-reveal>
          Projects
        </h1>
      </header>
      <ProjectLog projects={projects} />
    </Shell>
  );
}
