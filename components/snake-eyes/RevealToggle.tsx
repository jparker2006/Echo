"use client";

import type { Reveal } from "@/lib/snake-eyes/useReplay";

export function RevealToggle({ reveal, onChange }: { reveal: Reveal; onChange: (r: Reveal) => void }) {
  const omni = reveal === "omniscient";
  return (
    <button
      type="button"
      className={`se-reveal${omni ? " se-reveal--on" : ""}`}
      onClick={() => onChange(omni ? "table" : "omniscient")}
      aria-pressed={omni}
    >
      <span className="se-reveal-track" aria-hidden="true">
        <span className="se-reveal-thumb" />
      </span>
      <span className="se-reveal-label">
        <b>{omni ? "Omniscient" : "At the table"}</b>
        <small>{omni ? "private reasoning + DMs shown" : "click to read what they were really thinking"}</small>
      </span>
    </button>
  );
}
