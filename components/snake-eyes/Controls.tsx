"use client";

import { useMemo } from "react";
import type { GameData } from "@/lib/snake-eyes/types";
import { SEAT_COLORS } from "@/lib/snake-eyes/seat";

export interface JudgeFlag {
  seat: number;
  dim: string;
  seqs: number[];
  rationale: string;
}

interface Props {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  round: number;
  data: GameData;
  judge: JudgeFlag[];
  setSpeed: (s: number) => void;
  onToggle: () => void;
  onStep: (delta: number) => void;
  onSeek: (i: number) => void;
}

export function Controls({ index, total, playing, speed, round, data, judge, setSpeed, onToggle, onStep, onSeek }: Props) {
  const max = total - 1;

  const roundStarts = useMemo(() => {
    const m = new Map<number, number>();
    data.events.forEach((ev, i) => {
      if (ev.type === "turn_start") {
        const r = Number((ev.data as { round?: number }).round ?? 0);
        if (!m.has(r)) m.set(r, i);
      }
    });
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [data]);

  return (
    <div className="se-controls">
      <button className="se-btn se-btn--play" onClick={onToggle} aria-label={playing ? "Pause" : "Play"}>
        {playing ? "❚❚" : "▶"}
      </button>
      <button className="se-btn" onClick={() => onStep(-1)} aria-label="Step back">
        ‹
      </button>
      <button className="se-btn" onClick={() => onStep(1)} aria-label="Step forward">
        ›
      </button>

      <div className="se-scrub">
        <div className="se-ticks">
          {judge.map((f, i) => (
            <button
              key={i}
              className="se-tick"
              style={{ left: `${(f.seqs[0] / max) * 100}%`, background: SEAT_COLORS[f.seat as 0 | 1 | 2 | 3] }}
              title={`judge — ${f.dim}: ${f.rationale}`}
              onClick={() => onSeek(f.seqs[0])}
              aria-label="judge flag"
            />
          ))}
        </div>
        <input
          className="se-range"
          type="range"
          min={0}
          max={max}
          value={index}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Timeline"
        />
      </div>

      <div className="se-readout">
        <span className="se-readout-round">Round {round}</span>
        <span className="se-readout-evt">
          {index}/{max}
        </span>
      </div>

      <div className="se-speed">
        {[0.5, 1, 2, 4].map((s) => (
          <button key={s} className={`se-spd${speed === s ? " se-spd--on" : ""}`} onClick={() => setSpeed(s)}>
            {s}×
          </button>
        ))}
      </div>

      <select
        className="se-roundjump"
        value=""
        onChange={(e) => {
          const v = e.target.value;
          if (v) onSeek(Number(v));
        }}
      >
        <option value="">Jump to round…</option>
        {roundStarts.map(([r, i]) => (
          <option key={r} value={i}>
            Round {r}
          </option>
        ))}
      </select>
    </div>
  );
}
