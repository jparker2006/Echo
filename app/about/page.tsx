import type { Metadata } from "next";
import { getAbout } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { Shell, Kicker, PageBand } from "@/components/chrome";

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
      <article className="article about">
        <PageBand>
          <header className="page-head about-head">
            <Kicker>About</Kicker>
            <h1 className="page-title" data-reveal>
              {title}
            </h1>
          </header>
        </PageBand>
        <div className="prose post-body about-body" data-reveal dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </Shell>
  );
}
