import Link from "next/link";
import { getAllPosts, formatDate } from "@/lib/posts";
import { projects } from "@/data/projects";
import { Shell, SectionHead } from "@/components/chrome";
import { Etching } from "@/components/etching";

// the four projects that lead the home page, in this order
const HOME_PICKS = ["OpenWiz", "Lexicon", "PLOT", "Snake Eyes"];

// external URLs and static files open in a new tab; app routes stay in-tab
const isFile = (href: string) => /^https?:\/\//.test(href) || /\.\w+$/.test(href);

export default function Home() {
  const posts = getAllPosts();
  const [latest] = posts;
  const picks = HOME_PICKS.map((name) => projects.find((p) => p.name === name)).filter(
    (p): p is (typeof projects)[number] => Boolean(p)
  );

  return (
    <Shell>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="kicker" data-reveal>
            echo · a web log
          </p>
          <h1 className="hero-title" id="hero-title" data-reveal>
            Jake Parker
          </h1>
          <p className="hero-dek" data-reveal>
            Notes on code, craft and the things I build.
          </p>
          {latest ? (
            <p className="hero-actions" data-reveal>
              <Link href={`/posts/${latest.slug}`} className="button">
                Read the latest
              </Link>
            </p>
          ) : null}
        </div>
        <figure className="art-card" data-reveal>
          <Etching />
        </figure>
      </section>

      <section className="home-section" aria-labelledby="posts-head">
        <SectionHead id="posts-head" title="Writing" aside={`${posts.length}`} />
        <ol className="rows">
          {posts.map((post) => (
            <li key={post.slug} className="row" data-reveal-row>
              <time className="row-meta" dateTime={post.date}>
                {formatDate(post.date)}
              </time>
              <h3 className="row-title">
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </h3>
              <span className="row-meta row-end">{post.minutes} min</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="home-section" aria-labelledby="projects-head">
        <SectionHead
          id="projects-head"
          title="Projects"
          aside={<Link href="/projects">All {projects.length}</Link>}
        />
        <ul className="rows">
          {picks.map((project) => (
            <li key={project.name} className="row" data-reveal-row>
              <span className="row-meta">{project.year}</span>
              <div className="row-main">
                <h3 className="row-title">
                  {project.url ? (
                    isFile(project.url) ? (
                      <a href={project.url} target="_blank" rel="noreferrer">
                        {project.name}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link href={project.url}>{project.name}</Link>
                    )
                  ) : (
                    project.name
                  )}
                </h3>
                <p className="row-desc">{project.description}</p>
              </div>
              <span className="row-meta row-end" aria-hidden="true">
                {project.url ? (isFile(project.url) ? "↗" : "→") : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
