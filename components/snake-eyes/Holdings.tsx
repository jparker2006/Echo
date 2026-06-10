import type { CSSProperties } from "react";
import type { BoardData, BoardSquare, Frame, Seat, SquareState } from "@/lib/snake-eyes/types";

// Short label for a tiny tile; the full name lives in the title tooltip.
function shortName(def: BoardSquare): string {
  if (def.type === "railroad") {
    if (/reading/i.test(def.name)) return "Read";
    if (/pennsylvania/i.test(def.name)) return "Penn";
    if (/b&o/i.test(def.name)) return "B&O";
    if (/short/i.test(def.name)) return "Short";
    return "RR";
  }
  if (def.type === "utility") return /water/i.test(def.name) ? "Water" : "Elec";
  const n = def.name
    .replace(/\b(Avenue|Place|Gardens|Railroad|Company|Works)\b/gi, "")
    .replace(/\./g, "")
    .trim();
  return n.length > 8 ? n.slice(0, 8) : n;
}

function groupKey(def: BoardSquare): string | null {
  if (def.type === "property" && def.color) return `c:${def.color}`;
  if (def.type === "railroad") return "railroad";
  if (def.type === "utility") return "utility";
  return null;
}

function bandColor(def: BoardSquare): string {
  if (def.type === "property" && def.color) return `var(--c-${def.color})`;
  if (def.type === "railroad") return "#33312b";
  if (def.type === "utility") return "#a9b4b4";
  return "transparent";
}

export function Holdings({ frame, board, seat }: { frame: Frame; board: BoardData; seat: Seat }) {
  // which color/railroad/utility groups does this seat own outright (a monopoly)?
  const groups = new Map<string, number[]>();
  for (const def of board.board) {
    const k = groupKey(def);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(def.index);
  }
  const complete = new Set<string>();
  for (const [k, idxs] of groups) {
    if (idxs.every((i) => frame.squares[i].owner === seat)) complete.add(k);
  }

  const owned = board.board.filter((def) => frame.squares[def.index].owner === seat);
  if (owned.length === 0) return <div className="se-holdings se-holdings--empty">no properties</div>;

  return (
    <div className="se-holdings">
      {owned.map((def) => {
        const st: SquareState = frame.squares[def.index];
        const k = groupKey(def);
        const mono = k ? complete.has(k) : false;
        const cls = ["se-hold"];
        if (mono) cls.push("se-hold--mono");
        if (st.mortgaged) cls.push("se-hold--mortgaged");
        const houseUnits = st.hasHotel ? 0 : st.houses;
        return (
          <span
            key={def.index}
            className={cls.join(" ")}
            title={`${def.name}${st.mortgaged ? " · mortgaged" : ""}${st.hasHotel ? " · hotel" : st.houses ? ` · ${st.houses} house${st.houses > 1 ? "s" : ""}` : ""}${mono ? " · monopoly" : ""}`}
          >
            <span className="se-hold-band" style={{ background: bandColor(def) } as CSSProperties} />
            <span className="se-hold-name">{shortName(def)}</span>
            {st.hasHotel ? (
              <span className="se-hold-hotel" />
            ) : houseUnits > 0 ? (
              <span className="se-hold-pips">
                {Array.from({ length: houseUnits }, (_, i) => (
                  <span key={i} className="se-hold-pip" />
                ))}
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}
