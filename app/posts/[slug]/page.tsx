import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getPostSlugs, formatDate } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { Shell } from "@/components/chrome";

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
    <Shell compact>
      <article className="prose fade-up">
        <div className="post-meta">
          <span className="post-date">{formatDate(post.date)}</span>
          {post.tags && post.tags.length > 0 ? (
            <span className="tags">{post.tags.map((t) => `#${t}`).join("  ")}</span>
          ) : null}
        </div>
        <h1 className="post-h1">{post.title}</h1>
        <div className="post-body" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <p className="back">
        <Link href="/">← cd ..</Link>
      </p>
    </Shell>
  );
}
