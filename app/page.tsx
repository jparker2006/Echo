import { type CSSProperties } from "react";
import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { Shell, Prompt } from "@/components/chrome";

export default function Home() {
  const posts = getAllPosts();

  return (
    <Shell>
      <Prompt command="ls /posts" />
      <main className="post-list">
        {posts.map((post, i) => (
          <article
            key={post.slug}
            className="post-item fade-up"
            style={{ "--i": i } as CSSProperties}
          >
            <p className="post-date">{formatDate(post.date)}</p>
            <h2 className="post-title">
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            </h2>
            {post.excerpt ? <p className="post-excerpt">{post.excerpt}</p> : null}
          </article>
        ))}
      </main>
    </Shell>
  );
}
