import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPostSlugs, formatDate } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { Shell } from "@/components/chrome";
import { ReadingProgress } from "@/components/motion/reading-progress";

// Only render posts that exist on disk; unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!getPostSlugs().includes(slug)) return {};
  const post = getPostBySlug(slug);
  return {
    title: post.title,
    description: post.description ?? post.excerpt,
    openGraph: {
      title: post.title,
      description: post.description ?? post.excerpt,
      type: "article",
      publishedTime: post.date,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getPostSlugs().includes(slug)) notFound();

  const post = getPostBySlug(slug);
  const html = await renderMarkdown(post.content);

  return (
    <Shell>
      <ReadingProgress />
      <article className="prose">
        <div className="post-meta" data-reveal>
          <span className="post-date">{formatDate(post.date)}</span>
          {post.tags && post.tags.length > 0 ? (
            <span className="tags">{post.tags.map((t) => `#${t}`).join("  ")}</span>
          ) : null}
        </div>
        <h1 className="post-h1" data-reveal>{post.title}</h1>
        <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <p className="back">
        <Link href="/">← cd ..</Link>
      </p>
    </Shell>
  );
}
