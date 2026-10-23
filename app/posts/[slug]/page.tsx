import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug, getPostSlugs, formatDate } from "@/lib/posts";
import { renderMarkdown } from "@/lib/markdown";
import { Shell } from "@/components/chrome";
import { ReadingRocket } from "@/components/motion/reading-rocket";

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

  // posts are newest-first, so the "newer" neighbor sits one index earlier
  const all = getAllPosts();
  const index = all.findIndex((p) => p.slug === slug);
  const newer = index > 0 ? all[index - 1] : undefined;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : undefined;

  return (
    <Shell>
      <ReadingRocket />
      <article className="article">
        <header className="article-head">
          <p className="kicker" data-reveal>
            <Link href="/">posts</Link>
            <span className="kicker-sep" aria-hidden="true">
              /
            </span>
            <span className="kicker-file">{post.slug}.md</span>
          </p>
          <h1 className="post-h1" data-reveal>{post.title}</h1>
          {post.description ? (
            <p className="article-dek" data-reveal>
              {post.description}
            </p>
          ) : null}
          <p className="post-meta" data-reveal>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>{post.minutes} min read</span>
            {post.tags && post.tags.length > 0 ? (
              <span className="tags">{post.tags.map((t) => `#${t}`).join("  ")}</span>
            ) : null}
          </p>
        </header>
        <div className="prose post-body" dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <nav className="article-foot" aria-label="More posts">
        {older ? (
          <Link href={`/posts/${older.slug}`} className="pager pager--prev">
            <span className="pager-label">← older</span>
            <span className="pager-title">{older.title}</span>
          </Link>
        ) : null}
        {newer ? (
          <Link href={`/posts/${newer.slug}`} className="pager pager--next">
            <span className="pager-label">newer →</span>
            <span className="pager-title">{newer.title}</span>
          </Link>
        ) : null}
      </nav>
      <p className="back">
        <Link href="/">← cd ..</Link>
      </p>
    </Shell>
  );
}
