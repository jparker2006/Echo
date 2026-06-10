// Board geometry: map a square index (0..39) onto an 11x11 grid cell, Monopoly-style
// (GO bottom-right, play runs counter-clockwise), and report which edge it sits on.

export interface Cell {
  row: number; // 1..11
  col: number; // 1..11
}

export type Edge = "bottom" | "left" | "top" | "right" | "corner";

export function cellFor(index: number): Cell {
  if (index <= 10) return { row: 11, col: 11 - index }; // bottom: GO(0) right -> Jail(10) left
  if (index <= 20) return { row: 11 - (index - 10), col: 1 }; // left col going up -> Free Parking(20)
  if (index <= 30) return { row: 1, col: index - 19 }; // top L->R -> Go To Jail(30)
  return { row: index - 29, col: 11 }; // right col going down -> back to GO
}

export function edgeFor(index: number): Edge {
  if (index === 0 || index === 10 || index === 20 || index === 30) return "corner";
  if (index < 10) return "bottom";
  if (index < 20) return "left";
  if (index < 30) return "top";
  return "right";
}

/** Token center as a percentage of the board, with a small per-seat offset so
 *  co-located tokens fan out instead of stacking. */
export function tokenPercent(index: number, seat: number): { left: number; top: number } {
  const { row, col } = cellFor(index);
  const cx = ((col - 0.5) / 11) * 100;
  const cy = ((row - 0.5) / 11) * 100;
  const dx = [-1.7, 1.7, -1.7, 1.7][seat] ?? 0;
  const dy = [-1.7, -1.7, 1.7, 1.7][seat] ?? 0;
  return { left: cx + dx, top: cy + dy };
}
