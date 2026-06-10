"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BoardData, GameData, GameEvent } from "./types";
import { buildSnapshots, frameAt } from "./reducer";

export type Reveal = "table" | "omniscient";

// How long (ms, at 1x) each event lingers before the replay advances. The talk and
// trades breathe; the mechanical churn flashes by. Events with 0 dwell in the current
// reveal mode (hidden DMs / reasoning in "at the table") are stepped through instantly.
function dwellMs(ev: GameEvent, reveal: Reveal): number {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = ev.data as any;
  switch (ev.type) {
    case "message":
      if (d.visibility === "public") return 1500;
      return reveal === "omniscient" ? 1500 : 0;
    case "reasoning":
      return reveal === "omniscient" ? 1300 : 0;
    case "trade":
    case "pledge_made":
    case "bankrupt":
    case "game_over":
      return 1700;
    case "trade_counter":
    case "trade_rejected":
      return 800;
    case "buy":
    case "build":
    case "sell_building":
    case "mortgage":
    case "unmortgage":
    case "card_draw":
      return 560;
    case "dice_roll":
      return 460; // linger so the dice tumble is visible
    case "turn_start":
      return 320;
    case "move":
    case "pay_player":
    case "pay_bank":
    case "collect":
    case "pass_go":
    case "go_to_jail":
    case "leave_jail":
      return 240;
    default:
      return 110; // dice_roll, decline, goojf_gained, game_start/meta
  }
}

export function useReplay(data: GameData, board: BoardData, reveal: Reveal) {
  const snapshots = useMemo(() => buildSnapshots(data, board), [data, board]);
  const total = data.events.length;

  const [index, setIndexState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const indexRef = useRef(0);
  const liveRef = useRef({ speed, reveal });
  liveRef.current = { speed, reveal };

  const frame = useMemo(() => frameAt(data, board, snapshots, index), [data, board, snapshots, index]);

  function seek(i: number) {
    const c = Math.max(0, Math.min(total - 1, Math.round(i)));
    indexRef.current = c;
    setIndexState(c);
  }
  function step(delta: number) {
    setPlaying(false);
    seek(indexRef.current + delta);
  }
  function play() {
    if (indexRef.current >= total - 1) seek(0);
    setPlaying(true);
  }
  function pause() {
    setPlaying(false);
  }
  function toggle() {
    if (playing) pause();
    else play();
  }
  function seekAndPause(i: number) {
    setPlaying(false);
    seek(i);
  }

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      let dt = now - last;
      last = now;
      if (dt > 250) dt = 250; // ignore big gaps (tab was backgrounded)
      acc += dt;
      const { speed: sp, reveal: rv } = liveRef.current;
      let cur = indexRef.current;
      let moved = false;
      let guard = 0;
      while (cur < total - 1 && guard++ < 20000) {
        const dwell = dwellMs(data.events[cur], rv) / sp;
        if (acc < dwell) break;
        acc -= dwell;
        cur += 1;
        moved = true;
      }
      if (moved) {
        indexRef.current = cur;
        setIndexState(cur);
      }
      if (cur >= total - 1) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, data, total]);

  return { index, total, playing, speed, setSpeed, frame, seek, seekAndPause, step, play, pause, toggle };
}
