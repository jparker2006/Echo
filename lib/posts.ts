import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export interface PostMeta {
  slug: string;
  title: string;
  /** ISO 8601 string, normalized from the frontmatter `date`. */
  date: string;
  description?: string;
  tags?: string[];
  /** A short, plain-text excerpt for the home list and RSS. */
  excerpt: string;
}

export interface Post extends PostMeta {
  /** Raw Markdown body (frontmatter stripped). */
  content: string;
}

/** All post slugs (filenames without the `.md` extension). */
export function getPostSlugs(): string[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map((file) => file.replace(/\.md$/, ""));
}

/** Normalize a frontmatter date (which gray-matter may parse to a Date). */
function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value ?? ""));
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

/** Build a plain-text excerpt from Markdown by stripping the obvious syntax. */
function deriveExcerpt(markdown: string, max = 180): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, "") // fenced code
    .replace(/`[^`]*`/g, "") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> text
    .replace(/^[#>\-*+]\s+/gm, "") // headings, quotes, list markers
    .replace(/[*_~]/g, "") // emphasis marks
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export function getPostBySlug(slug: string): Post {
  const fullPath = path.join(POSTS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    date: toIso(data.date),
    description: typeof data.description === "string" ? data.description : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : undefined,
    excerpt:
      typeof data.description === "string" && data.description.length > 0
        ? data.description
        : deriveExcerpt(content),
    content,
  };
}

/** All posts, newest first. (Metadata only — no rendered body.) */
export function getAllPosts(): PostMeta[] {
  return getPostSlugs()
    .map((slug) => {
      const { content: _content, ...meta } = getPostBySlug(slug);
      return meta;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Format an ISO date as an uppercase mono-friendly label, e.g. "MAY 20, 2026". */
export function formatDate(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
    .toUpperCase();
}

/** Read and parse the editable About page Markdown. */
export function getAbout(): { title: string; content: string } {
  const fullPath = path.join(process.cwd(), "content", "about.md");
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);
  return {
    title: typeof data.title === "string" ? data.title : "about",
    content,
  };
}
