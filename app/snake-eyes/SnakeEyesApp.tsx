"use client";

import "./snake-eyes.css";
import { useEffect, useMemo, useState } from "react";
import type { BoardData, GameData } from "@/lib/snake-eyes/types";
import { useReplay, type Reveal } from "@/lib/snake-eyes/useReplay";
import { Board, type Roll } from "@/components/snake-eyes/Board";
import { PlayerHud } from "@/components/snake-eyes/PlayerHud";
import { Transcript } from "@/components/snake-eyes/Transcript";
import { Controls, type JudgeFlag } from "@/components/snake-eyes/Controls";
import { RevealToggle } from "@/components/snake-eyes/RevealToggle";
import { ChapterRail } from "@/components/snake-eyes/ChapterRail";

export function SnakeEyesApp() {
  const [data, setData] = useState<GameData | null>(null);
  const [board, setBoard] = useState<BoardData | null>(null);
  const [judge, setJudge] = useState<JudgeFlag[]>([]);
  const [reveal, setReveal] = useState<Reveal>("table");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/snake-eyes/game.json").then((r) => r.json()),
      fetch("/snake-eyes/board.json").then((r) => r.json()),
      fetch("/snake-eyes/judge.json")
        .then((r) => r.json())
        .catch(() => ({ flags: [] })),
    ])
      .then(([g, b, j]) => {
        if (!alive) return;
        setData(g);
        setBoard(b);
        setJudge(j.flags ?? []);
      })
      .catch((e) => setErr(String(e)));
    return () => {
      alive = false;
    };
  }, []);

  if (err) return <div className="se-loading">Couldn’t load the game ({err}).</div>;
  if (!data || !board) return <div className="se-loading">Loading the game…</div>;

  return <Replay data={data} board={board} judge={judge} reveal={reveal} setReveal={setReveal} />;
}

function Replay({
  data,
  board,
  judge,
  reveal,
  setReveal,
}: {
  data: GameData;
  board: BoardData;
  judge: JudgeFlag[];
  reveal: Reveal;
  setReveal: (r: Reveal) => void;
}) {
  const r = useReplay(data, board, reveal);
  const header = data.header;
  const round = Math.max(1, r.frame.round);

  // all dice rolls, then the most recent one at/before the current event.
  const rolls = useMemo<Roll[]>(() => {
    const out: Roll[] = [];
    for (const ev of data.events) {
      if (ev.type === "dice_roll") {
        const d = ev.data as { d1: number; d2: number; doubles?: boolean };
        out.push({ index: ev.seq, d1: d.d1, d2: d.d2, doubles: !!d.doubles });
      }
    }
    return out;
  }, [data]);
  const currentRoll = useMemo<Roll | null>(() => {
    let lo = 0;
    let hi = rolls.length - 1;
    let best = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (rolls[m].index <= r.index) {
        best = m;
        lo = m + 1;
      } else {
        hi = m - 1;
      }
    }
    return best >= 0 ? rolls[best] : null;
  }, [rolls, r.index]);

  return (
    <div className="se-root">
      <div className="se-topbar">
        <div className="se-titleblock">
          <h1 className="se-h1">Snake Eyes</h1>
          <p className="se-sub">
            One full game of Monopoly between four AI models. Press play — then flip the switch to read what each
            one was privately thinking.
          </p>
        </div>
        <RevealToggle reveal={reveal} onChange={setReveal} />
      </div>

      <div className="se-stage">
        <div className="se-left">
          <Board frame={r.frame} board={board} header={header} roll={currentRoll} animate={r.playing} />
          <PlayerHud frame={r.frame} board={board} header={header} reveal={reveal} />
        </div>
        <div className="se-right">
          <Transcript data={data} board={board} header={header} index={r.index} reveal={reveal} />
        </div>
      </div>

      <Controls
        index={r.index}
        total={r.total}
        playing={r.playing}
        speed={r.speed}
        round={round}
        data={data}
        judge={judge}
        setSpeed={r.setSpeed}
        onToggle={r.toggle}
        onStep={r.step}
        onSeek={r.seekAndPause}
      />

      <ChapterRail onJump={r.seekAndPause} />
    </div>
  );
}
