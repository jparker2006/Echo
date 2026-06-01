# echo

A small, terminal-flavored personal blog built with Next.js (App Router). Posts
are plain Markdown files, rendered statically, with syntax-highlighted code and a
warm cream-and-rust palette that adapts to light and dark mode.

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

To create an optimized production build:

```bash
npm run build
npm start
```

## Add a post

Drop a single Markdown file into `content/posts/`. The filename becomes the URL
(`my-post.md` → `/posts/my-post`). Start it with frontmatter:

```markdown
---
title: My new post
date: 2026-06-01
description: An optional one-line summary, shown as the excerpt.
tags: [optional, tags]
---

Write your post here in **Markdown**.
```

- `title` and `date` are required; `description` and `tags` are optional.
- Posts sort newest-first automatically and appear on the home page and in the RSS feed.
- Fenced code blocks are syntax-highlighted. Add a title and highlight lines with:
  <code>```ts title="example.ts" {2-3}</code>

That's it — no rebuild step in dev; the page appears on its own.

## Add a project

Edit `data/projects.ts` and add an entry to the `projects` array:

```ts
{
  name: "my-project",
  description: "One-line description.",
  year: "2026",
  status: "active", // "active" | "wip" | "archived"
  repo: "https://github.com/you/my-project", // optional
  live: "https://my-project.example.com",     // optional
}
```

## Edit the About page

Edit `content/about.md`. It's plain Markdown (with an optional `title` in
frontmatter) and renders at `/about`.

## Make it yours

- **Site name, description, author, URL:** `lib/site.ts`
- **Colors & type:** the CSS variables at the top of `app/globals.css`
- **Code theme:** the Shiki `theme` option in `lib/markdown.ts`

## Deploy

### Vercel (free, recommended)

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new) — Vercel detects Next.js
   automatically; no configuration needed.
3. Set the `SITE_URL` environment variable to your final URL (used for RSS and
   metadata), e.g. `https://echo.yourdomain.com`.

### Static export (Netlify / GitHub Pages)

This site has no server-only features, so it can be exported as static files.

1. Uncomment `output: "export"` in `next.config.mjs`.
2. Run `npm run build`. The static site is written to `out/`.
3. Deploy `out/` to any static host (Netlify, GitHub Pages, Cloudflare Pages…).

> For GitHub Pages served from a subpath, also set `basePath` in `next.config.mjs`.

## Project layout

```
content/posts/   →  blog posts (one .md file each)
content/about.md →  the About page
data/projects.ts →  the projects list
lib/site.ts      →  site name, description, author, URL
app/             →  pages, layout, global CSS, RSS route
components/      →  shared chrome (masthead, nav, footer)
```
