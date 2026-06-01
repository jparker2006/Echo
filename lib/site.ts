// Site-wide configuration. Edit these to make the blog yours.
export const site = {
  title: "echo",
  description:
    "A terminal-flavored personal blog — notes on code, craft, and the command line.",
  // Used for absolute URLs in metadata and the RSS feed.
  // Set SITE_URL in the environment for production; otherwise this default is used.
  url: process.env.SITE_URL ?? "https://echo.example.com",
  author: "Jake Parker",
};
