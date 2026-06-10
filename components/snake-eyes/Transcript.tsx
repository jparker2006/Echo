"use client";

import { useEffect, useMemo, useRef } from "react";
import type { BoardData, GameData, Header } from "@/lib/snake-eyes/types";
import { describe, type Line } from "@/lib/snake-eyes/format";
import type { Reveal } from "@/lib/snake-eyes/useReplay";
import { TranscriptLine } from "./TranscriptLine";

interface Pre {
  idx: number;
  line: Line;
  round: number;
}

function visibleIn(line: Line, reveal: Reveal): boolean {
  if (reveal === "table") {
    if (line.kind === "think") return false; // private reasoning
    if (line.kind === "dm") return false; // private DMs
  }
  return true;
}

export function Transcript({
  data,
  board,
  header,
  index,
  reveal,
}: {
  data: GameData;
  board: BoardData;
  header: Header;
  index: number;
  reveal: Reveal;
}) {
  // describe every event once; cheap, memoized on the data.
  const pre = useMemo<Pre[]>(() => {
    const out: Pre[] = [];
    let round = 0;
    data.events.forEach((ev, i) => {
      if (ev.type === "turn_start") round = Number((ev.data as { round?: number }).round ?? round);
      const line = describe(ev, board);
      if (line) out.push({ idx: i, line, round });
    });
    return out;
  }, [data, board]);

  // window: the last ~160 visible lines up to the current index (auto-scrolls to bottom).
  const visible = useMemo(
    () => pre.filter((p) => p.idx <= index && visibleIn(p.line, reveal)).slice(-160),
    [pre, index, reveal],
  );

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [index, reveal, visible.length]);

  return (
    <div className="se-transcript" ref={ref}>
      <div className="se-transcript-inner">
        {visible.length === 0 ? (
          <div className="se-transcript-empty">Press play to start the game.</div>
        ) : null}
        {visible.map((p, k) => {
          const prev = visible[k - 1];
          const showDivider = !prev || prev.round !== p.round;
          const current = p.idx === index;
          return (
            <div key={p.idx} className={current ? "se-row se-row--current" : "se-row"}>
              {showDivider ? <div className="se-round-divider">Round {Math.max(1, p.round)}</div> : null}
              <TranscriptLine line={p.line} header={header} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
