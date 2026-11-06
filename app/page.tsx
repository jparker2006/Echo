import Link from "next/link";
import { getAllPosts, formatDate, firstSentence } from "@/lib/posts";
import { projects } from "@/data/projects";
import { Shell } from "@/components/chrome";
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
            <p className="kicker hero-kicker" data-reveal>
              <time dateTime={latest.date}>{formatDate(latest.date)}</time>
              <span className="kicker-sep" aria-hidden="true">
                |
              </span>
              {latest.minutes} min
            </p>
            <h2 className="hero-title" id="hero-title" data-reveal>
              <Link href={`/posts/${latest.slug}`}>{latest.title}</Link>
            </h2>
            <p className="hero-copy-dek" data-reveal>
              {firstSentence(latest.excerpt)}
            </p>
            <p className="hero-actions" data-reveal>
              <Link href={`/posts/${latest.slug}`} className="cmd-link">
                <span className="cta-cmd">
                  <span className="cmd-sigil" aria-hidden="true">
                    $
                  </span>{" "}
                  cat {latest.slug}.md
                </span>
                <span className="cta-hint">
                  read <span className="cta-key" aria-hidden="true">↵</span>
                </span>
              </Link>
            </p>
          </div>
          <div className="hero-art" data-reveal>
            <AsciiScene />
          </div>
        </section>
      ) : null}

      <section className="home-section" aria-labelledby="posts-head">
        <HomeHead id="posts-head" title="posts" />
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
        <HomeHead id="projects-head" title="projects" aside={<Link href="/projects">all {projects.length} →</Link>} />
        <ul className="project-grid">
          {picks.map((project) => {
            // external URLs and static files open in a new tab; app routes stay in-tab
            const isFile = (href: string) => /^https?:\/\//.test(href) || /\.\w+$/.test(href);
            // the name links to the primary URL; the row below holds the rest,
            // in the /projects order (paper · demo · blog post), minus duplicates
            const links = [
              { label: "paper", href: project.paper },
              { label: "demo", href: project.demo },
              { label: "blog post", href: project.post && `/posts/${project.post}` },
            ].filter(
              (link): link is { label: string; href: string } =>
                Boolean(link.href) && link.href !== project.url
            );
            const where = project.url
              ? project.url.includes("github.com")
                ? "github"
                : project.url.startsWith("/")
                  ? "demo"
                  : new URL(project.url).hostname
              : null;
            return (
              <li key={project.name} className="project-card" data-reveal-row>
                <div className="project-card-head">
                <p className="post-date project-card-meta">
                  {project.year}
                  {where ? (
                    <>
                      <span className="kicker-sep" aria-hidden="true">
                        |
                      </span>
                      {where}
                    </>
                  ) : null}
                </p>
                <h3 className="project-card-name">
                  {project.url ? (
                    isFile(project.url) ? (
                      <a href={project.url} target="_blank" rel="noreferrer">
                        {project.name}
                        <span className="project-card-ext" aria-hidden="true">
                          ↗
                        </span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link href={project.url}>{project.name}</Link>
                    )
                  ) : (
                    project.name
                  )}
                </h3>
                </div>
                <div className="project-card-body">
                <p className="project-card-desc">{project.description}</p>
                {links.length ? (
                  <p className="project-card-links">
                    {links.map((link) =>
                      isFile(link.href) ? (
                        <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                          {link.label}
                        </a>
                      ) : (
                        <Link key={link.label} href={link.href}>
                          {link.label}
                        </Link>
                      )
                    )}
                  </p>
                ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </Shell>
  );
}

/** A display heading for a home section: big serif title, optional right-hand link. */
function HomeHead({ id, title, aside }: { id: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="home-head" data-reveal>
      <h2 id={id}>{title}</h2>
      {aside ? <p className="home-head-aside">{aside}</p> : null}
    </div>
  );
}
