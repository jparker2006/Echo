import type { BoardData, Frame, Header, Seat } from "@/lib/snake-eyes/types";
import { netWorth } from "@/lib/snake-eyes/reducer";
import { SEAT_COLORS, seatLab, seatName } from "@/lib/snake-eyes/seat";
import type { Reveal } from "@/lib/snake-eyes/useReplay";
import { Holdings } from "./Holdings";

export function PlayerHud({
  frame,
  board,
  header,
  reveal,
}: {
  frame: Frame;
  board: BoardData;
  header: Header;
  reveal: Reveal;
}) {
  return (
    <div className="se-hud">
      {frame.players.map((p) => {
        const color = SEAT_COLORS[p.seat];
        const active = frame.activeSeat === p.seat && !p.bankrupt && frame.winnerSeat == null;
        const won = frame.winnerSeat === p.seat;
        return (
          <div
            key={p.seat}
            className={`se-card${p.bankrupt ? " se-card--out" : ""}${active ? " se-card--active" : ""}${won ? " se-card--won" : ""}`}
            style={active || won ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : undefined}
          >
            <div className="se-card-top">
              <span className="se-dot" style={{ background: color }} />
              <span className="se-card-name">{seatName(header, p.seat)}</span>
              {p.bankrupt ? (
                <span className="se-card-flag">OUT</span>
              ) : p.inJail ? (
                <span className="se-card-flag se-card-flag--jail">JAIL</span>
              ) : won ? (
                <span className="se-card-flag se-card-flag--won">WINNER</span>
              ) : null}
            </div>
            <div className="se-card-lab">{seatLab(header, p.seat)}</div>
            <div className="se-card-cash">{p.bankrupt ? "—" : `$${p.cash.toLocaleString()}`}</div>
            <div className="se-card-meta">
              <span>{p.bankrupt ? "bankrupt" : `on ${board.board[p.position]?.name ?? "?"}`}</span>
              {reveal === "omniscient" && !p.bankrupt ? (
                <span className="se-card-nw">net ${netWorth(frame, board, p.seat as Seat).toLocaleString()}</span>
              ) : null}
            </div>
            {!p.bankrupt ? <Holdings frame={frame} board={board} seat={p.seat as Seat} /> : null}
          </div>
        );
      })}
    </div>
  );
}
