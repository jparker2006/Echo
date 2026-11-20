import Link from "next/link";
import { getAllPosts, formatShortDate } from "@/lib/posts";
import { Shell } from "@/components/chrome";
import { HeroPlanet } from "@/components/guilloche-art";

export default function Home() {
  const posts = getAllPosts();

  return (
    <Shell>
      <section className="intro" aria-labelledby="intro-title">
        <div className="intro-art" data-reveal>
          <HeroPlanet />
        </div>
        <div className="intro-copy">
          <p className="kicker" data-reveal>
            A web log by Jake Parker
          </p>
          <h1 className="display" id="intro-title" data-reveal>
            echo
          </h1>
        </div>
      </section>

      <section className="home-posts" aria-labelledby="posts-head">
        <h2 className="rail-label" id="posts-head" data-reveal>
          Posts <span className="rail-count">{posts.length}</span>
        </h2>
        <ol className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-row" data-reveal-row>
              <time className="post-date" dateTime={post.date}>
                {formatShortDate(post.date)}
              </time>
              <h3 className="post-title">
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </h3>
              <span className="post-read">{post.minutes} min</span>
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
