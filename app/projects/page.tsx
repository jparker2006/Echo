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
      <ProjectLog projects={projects} />
    </Shell>
  );
}
