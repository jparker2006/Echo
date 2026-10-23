import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { projects } from "@/data/projects";
import { Shell, SectionHead } from "@/components/chrome";
import { AsciiScene } from "@/components/ascii-art";

// the four projects that lead the home page, in this order
const HOME_PICKS = ["OpenWiz", "Lexicon", "PLOT", "Snake Eyes"];

export default function Home() {
  const posts = getAllPosts();
  const [latest] = posts;
  const picks = HOME_PICKS.map((name) => projects.find((p) => p.name === name)).filter(
    (p): p is (typeof projects)[number] => Boolean(p)
  );

  return (
    <Shell>
      <h1 className="sr-only">echo</h1>

      {latest ? (
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="kicker" data-reveal>
              latest
              <span className="kicker-sep" aria-hidden="true">
                /
              </span>
              <time dateTime={latest.date}>{formatDate(latest.date)}</time>
            </p>
            <h2 className="hero-title" id="hero-title" data-reveal>
              <Link href={`/posts/${latest.slug}`}>{latest.title}</Link>
            </h2>
            <p className="hero-actions" data-reveal>
              <Link href={`/posts/${latest.slug}`} className="cmd-link">
                <span className="cmd-sigil">$</span> cat {latest.slug}.md
              </Link>
              <span className="hero-meta">{latest.minutes} min read</span>
            </p>
          </div>
          <div className="hero-art" data-reveal>
            <AsciiScene />
          </div>
        </section>
      ) : null}

      <section className="home-section" aria-labelledby="posts-head">
        <SectionHead
          id="posts-head"
          command="ls /posts"
          aside={`${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
        />
        <ol className="post-list">
          {posts.map((post) => (
            <li key={post.slug} className="post-item" data-reveal-row>
              <div className="post-main">
                <p className="post-date">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </p>
                <h3 className="post-title">
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                </h3>
                <p className="post-date post-read">{post.minutes} min</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section" aria-labelledby="projects-head">
        <SectionHead
          id="projects-head"
          command="ls /projects"
          aside={<Link href="/projects">all {projects.length} →</Link>}
        />
        <ul className="project-grid">
          {picks.map((project) => (
            <li key={project.name} className="project-card" data-reveal-row>
              <p className="post-date">{project.year}</p>
              <h3 className="project-card-name">
                {project.url ? (
                  project.url.startsWith("/") ? (
                    <Link href={project.url}>{project.name}</Link>
                  ) : (
                    <a href={project.url} target="_blank" rel="noreferrer">
                      {project.name}
                    </a>
                  )
                ) : (
                  project.name
                )}
              </h3>
              <p className="project-card-desc">{project.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
