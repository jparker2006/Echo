import type { BoardData, Frame, Header } from "@/lib/snake-eyes/types";
import { Square } from "./Square";
import { Dice } from "./Dice";
import { tokenPercent } from "@/lib/snake-eyes/geo";
import { SEAT_COLORS, SEAT_INITIALS, seatName } from "@/lib/snake-eyes/seat";

export interface Roll {
  index: number;
  d1: number;
  d2: number;
  doubles: boolean;
}

export function Board({
  frame,
  board,
  header,
  roll,
  animate,
}: {
  frame: Frame;
  board: BoardData;
  header: Header;
  roll: Roll | null;
  animate: boolean;
}) {
  return (
    <div className="se-board">
      <div className="se-grid">
        {board.board.map((def) => (
          <Square key={def.index} def={def} state={frame.squares[def.index]} />
        ))}

        <div className="se-center" style={{ gridColumn: "2 / 11", gridRow: "2 / 11" }}>
          <div className="se-center-title">SNAKE&nbsp;EYES</div>
          {roll && frame.winnerSeat == null ? (
            <Dice d1={roll.d1} d2={roll.d2} doubles={roll.doubles} rollKey={roll.index} animate={animate} />
          ) : null}
          {frame.winnerSeat != null ? (
            <div className="se-center-sub" style={{ color: SEAT_COLORS[frame.winnerSeat] }}>
              {seatName(header, frame.winnerSeat)} wins
            </div>
          ) : (
            <>
              <div className="se-center-sub">Round {Math.max(1, frame.round)}</div>
              {frame.activeSeat != null ? (
                <div className="se-center-turn" style={{ color: SEAT_COLORS[frame.activeSeat] }}>
                  {seatName(header, frame.activeSeat)} to act
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div className="se-tokens">
        {frame.players.map((p) => {
          if (p.bankrupt) return null;
          const { left, top } = tokenPercent(p.position, p.seat);
          return (
            <span
              key={p.seat}
              className={`se-token${frame.activeSeat === p.seat ? " se-token--active" : ""}`}
              style={{ left: `${left}%`, top: `${top}%`, background: SEAT_COLORS[p.seat] }}
              title={seatName(header, p.seat)}
            >
              {SEAT_INITIALS[p.seat]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
