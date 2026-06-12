import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/chrome";
import { RevealRoot } from "@/components/motion/reveal-root";
import { SnakeEyesApp } from "./SnakeEyesApp";

export const metadata: Metadata = {
  title: "Snake Eyes — watch the game",
  description:
    "An interactive replay of one full Monopoly game between four AI models. Flip the toggle to read each model's private reasoning next to what it said out loud.",
};

export default function SnakeEyesPage() {
  return (
    <div className="se-page">
      <RevealRoot className="se-page-head">
        <SiteHeader />
      </RevealRoot>
      <SnakeEyesApp />
      <p className="se-back">
        <Link href="/posts/the-trade-is-the-game">← back to the post</Link>
      </p>
    </div>
  );
}
