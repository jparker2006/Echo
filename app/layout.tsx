import type { Metadata } from "next";
import { Newsreader, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.title}` },
  description: site.description,
  authors: [{ name: site.author }],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    title: site.title,
    description: site.description,
    type: "website",
    url: site.url,
    siteName: site.title,
  },
};

// Set data-motion on <html> before first paint *only* when motion is allowed,
// so the GSAP layer can pre-hide its entrance targets (opacity:0) without a
// flash. If JS is off or reduced motion is requested, the attribute is never
// set and content renders fully visible — never stuck hidden.
const motionReadyScript = `(function(){try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){document.documentElement.setAttribute("data-motion","")}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionReadyScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
