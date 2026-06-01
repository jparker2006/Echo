import type { Metadata } from "next";
import { getAbout } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { Shell, Prompt } from "@/components/chrome";

export async function generateMetadata(): Promise<Metadata> {
  const { title } = getAbout();
  return {
    title,
    description: "About echo and the person writing it.",
  };
}

export default async function AboutPage() {
  const { content } = getAbout();
  const html = await renderMarkdown(content);

  return (
    <Shell compact>
      <article className="prose fade-up">
        <Prompt command="cat about.md" />
        <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </Shell>
  );
}
