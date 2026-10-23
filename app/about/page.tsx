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
  const { title, content } = getAbout();
  const html = await renderMarkdown(content);

  return (
    <Shell>
      <article className="article">
        <header className="page-head">
          <Prompt command="cat about.md" />
          <h1 className="page-title" data-reveal>
            {title}
          </h1>
        </header>
        <div className="prose post-body" data-reveal dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </Shell>
  );
}
