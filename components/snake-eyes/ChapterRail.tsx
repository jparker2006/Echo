"use client";

import { CHAPTERS } from "@/lib/snake-eyes/chapters";

export function ChapterRail({ onJump }: { onJump: (index: number) => void }) {
  return (
    <div className="se-chapters">
      <span className="se-chapters-label">Jump to a moment</span>
      <ul className="se-chapter-list">
        {CHAPTERS.map((c) => (
          <li key={c.id}>
            <button className="se-chapter" onClick={() => onJump(c.index)}>
              <b className="se-chapter-name">{c.label}</b>
              <span className="se-chapter-blurb">{c.blurb}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
