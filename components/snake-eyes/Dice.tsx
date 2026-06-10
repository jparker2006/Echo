"use client";

import { useEffect, useRef, useState } from "react";

// pip positions on a 3x3 grid (row-major indices 0..8) for each die value.
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function Die({ value, tumbling }: { value: number; tumbling: boolean }) {
  const on = new Set(PIPS[value] ?? []);
  return (
    <span className={`se-die${tumbling ? " se-die--tumble" : ""}`} aria-hidden="true">
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} className={`se-pip${on.has(i) ? " se-pip--on" : ""}`} />
      ))}
    </span>
  );
}

export function Dice({
  d1,
  d2,
  doubles,
  rollKey,
  animate,
}: {
  d1: number;
  d2: number;
  doubles: boolean;
  rollKey: number;
  animate: boolean;
}) {
  const [faces, setFaces] = useState<[number, number]>([d1, d2]);
  const [tumbling, setTumbling] = useState(false);
  const prevKey = useRef<number | null>(null);

  useEffect(() => {
    // only re-roll (tumble + flicker) when the roll actually changes, during playback
    if (prevKey.current === rollKey) {
      setFaces([d1, d2]);
      return;
    }
    prevKey.current = rollKey;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate || reduced) {
      setFaces([d1, d2]);
      setTumbling(false);
      return;
    }

    setTumbling(true);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      if (n >= 6) {
        window.clearInterval(id);
        setFaces([d1, d2]);
        setTumbling(false);
      } else {
        setFaces([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
      }
    }, 70);
    return () => window.clearInterval(id);
  }, [rollKey, d1, d2, animate]);

  return (
    <div className={`se-dice${doubles ? " se-dice--doubles" : ""}`} title={`rolled ${d1} + ${d2} = ${d1 + d2}${doubles ? " (doubles)" : ""}`}>
      <Die value={faces[0]} tumbling={tumbling} />
      <Die value={faces[1]} tumbling={tumbling} />
      {doubles && !tumbling ? <span className="se-dice-doubles">doubles</span> : null}
    </div>
  );
}
