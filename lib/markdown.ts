import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode, { type Options as PrettyCodeOptions } from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

// Warm, muted Shiki themes that sit well on the cream + rust palette and ship
// token colors for BOTH light and dark via CSS variables (see globals.css).
// `keepBackground: false` lets globals.css supply our own --code-bg surface.
const prettyCodeOptions: PrettyCodeOptions = {
  theme: { light: "rose-pine-dawn", dark: "rose-pine" },
  keepBackground: false,
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypePrettyCode, prettyCodeOptions)
  .use(rehypeStringify);

/** Render a Markdown string to an HTML string (syntax-highlighted). */
export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}
