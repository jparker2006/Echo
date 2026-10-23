import type { Metadata, Viewport } from "next";
import { Geist, Newsreader, JetBrains_Mono } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-serif",
});

const sans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
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

export const viewport: Viewport = {
  themeColor: "#09090d",
  colorScheme: "dark",
};

// Set data-motion on <html> before first paint *only* when motion is allowed,
// so the GSAP layer can pre-hide its entrance targets (opacity:0) without a
// flash. If JS is off or reduced motion is requested, the attribute is never
// set and content renders fully visible — never stuck hidden. If the JS bundle
// never arrives (blocked, failed, very slow), the attribute is dropped after
// 3s so the pre-hidden content shows anyway.
const motionReadyScript = `(function(){try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches){var h=document.documentElement;h.setAttribute("data-motion","");setTimeout(function(){if(!h.hasAttribute("data-motion-live"))h.removeAttribute("data-motion")},3000)}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionReadyScript }} />
      </head>
      <body id="top">{children}</body>
    </html>
  );
}
