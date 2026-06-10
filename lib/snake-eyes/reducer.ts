// Pure replay reducer: fold the event stream into game state at any index.
//
// Every cash/ownership/building delta is present in the events, so the browser can
// reconstruct the full board without any precomputed frames. We snapshot a Frame at
// each turn_start so the scrubber can jump in O(few events) instead of re-folding
// from zero.
//
// Runtime-dependency-free (types are `import type`, erased at runtime) so the Node
// cross-check can import this file directly.

import type { BoardData, Bundle, Frame, GameData, GameEvent, Header, PlayerState, Seat, SquareState } from "./types";

const SEATS: Seat[] = [0, 1, 2, 3];
const JAIL_INDEX = 10;

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" ? v : fallback;
}

function asBundle(v: unknown): Bundle {
  const b = (v ?? {}) as Partial<Bundle>;
  return {
    cash: num(b.cash),
    properties: Array.isArray(b.properties) ? (b.properties as number[]) : [],
    goojf_chance: num(b.goojf_chance),
    goojf_cc: num(b.goojf_cc),
  };
}

export function initialFrame(header: Header): Frame {
  const cash = header.house_rules?.starting_cash ?? 1500;
  const players: PlayerState[] = SEATS.map((seat) => ({
    seat,
    cash,
    position: 0,
    inJail: false,
    jailTurns: 0,
    bankrupt: false,
    goojfChance: 0,
    goojfCc: 0,
  }));
  const squares: SquareState[] = Array.from({ length: 40 }, (_, index) => ({
    index,
    owner: null,
    houses: 0,
    hasHotel: false,
    mortgaged: false,
  }));
  return { index: -1, round: 0, activeSeat: null, players, squares, winnerSeat: null };
}

export function cloneFrame(f: Frame): Frame {
  // key order matches initialFrame so JSON.stringify of equal frames is identical.
  return {
    index: f.index,
    round: f.round,
    activeSeat: f.activeSeat,
    players: f.players.map((p) => ({ ...p })),
    squares: f.squares.map((s) => ({ ...s })),
    winnerSeat: f.winnerSeat,
  };
}

/** Apply one event to `f` in place. `board` is needed for bankruptcy building refunds. */
export function applyEvent(f: Frame, ev: GameEvent, board: BoardData): void {
  const d = ev.data as Record<string, unknown>;
  const p = typeof ev.player === "number" ? f.players[ev.player] : null;

  switch (ev.type) {
    case "turn_start": {
      f.round = num(d.round, f.round);
      f.activeSeat = (ev.player as Seat) ?? f.activeSeat;
      // position is set from move/jail events; turn_start.position is a cross-check.
      if (p && !p.inJail) p.position = num(d.position, p.position);
      break;
    }
    case "move": {
      if (p) p.position = num(d.to, p.position);
      break;
    }
    case "pass_go": {
      if (p) p.cash += num(d.amount);
      break;
    }
    case "buy": {
      if (p) {
        p.cash -= num(d.price);
        f.squares[num(d.index)].owner = p.seat;
      }
      break;
    }
    case "collect": {
      if (p) p.cash += num(d.amount);
      break;
    }
    case "pay_bank": {
      if (p) p.cash -= num(d.amount);
      break;
    }
    case "pay_player": {
      if (p) p.cash -= num(d.amount);
      const payee = f.players[num(d.payee)];
      if (payee) payee.cash += num(d.amount);
      break;
    }
    case "go_to_jail": {
      if (p) {
        p.inJail = true;
        p.jailTurns = 0;
        p.position = JAIL_INDEX;
      }
      break;
    }
    case "leave_jail": {
      // The $50 fine is emitted separately as pay_bank(reason="jail_fine") — don't double-charge.
      if (p) {
        p.inJail = false;
        p.jailTurns = 0;
      }
      break;
    }
    case "build": {
      if (p) p.cash -= num(d.cost);
      const sq = f.squares[num(d.index)];
      sq.houses = num(d.houses, sq.houses);
      sq.hasHotel = Boolean(d.has_hotel);
      break;
    }
    case "sell_building": {
      if (p) p.cash += num(d.proceeds);
      const sq = f.squares[num(d.index)];
      sq.houses = num(d.houses, sq.houses);
      sq.hasHotel = Boolean(d.has_hotel);
      break;
    }
    case "mortgage": {
      if (p) p.cash += num(d.proceeds);
      f.squares[num(d.index)].mortgaged = true;
      break;
    }
    case "unmortgage": {
      if (p) p.cash -= num(d.cost);
      f.squares[num(d.index)].mortgaged = false;
      break;
    }
    case "trade": {
      // proposer = ev.player gives `give`, receives `receive`; target = d.target.
      const target = f.players[num(d.target)];
      const give = asBundle(d.give);
      const receive = asBundle(d.receive);
      if (p) p.cash += receive.cash - give.cash;
      if (target) target.cash += give.cash - receive.cash;
      for (const idx of give.properties) f.squares[idx].owner = (target?.seat ?? null) as Seat | null;
      for (const idx of receive.properties) f.squares[idx].owner = (p?.seat ?? null) as Seat | null;
      if (p) {
        p.goojfChance += receive.goojf_chance - give.goojf_chance;
        p.goojfCc += receive.goojf_cc - give.goojf_cc;
      }
      if (target) {
        target.goojfChance += give.goojf_chance - receive.goojf_chance;
        target.goojfCc += give.goojf_cc - receive.goojf_cc;
      }
      break;
    }
    case "goojf_gained": {
      if (p) {
        if (d.deck === "chance") p.goojfChance += 1;
        else p.goojfCc += 1;
      }
      break;
    }
    case "bankrupt": {
      if (p) {
        // 1. Liquidate ALL the debtor's buildings to the bank at half cost (engine rule).
        let refund = 0;
        for (const sq of f.squares) {
          if (sq.owner !== p.seat) continue;
          const hc = board.board[sq.index]?.house_cost ?? 0;
          if (sq.hasHotel) {
            refund += 5 * Math.floor(hc / 2);
            sq.hasHotel = false;
          } else if (sq.houses > 0) {
            refund += sq.houses * Math.floor(hc / 2);
            sq.houses = 0;
          }
        }
        const creditor = d.creditor == null ? null : f.players[num(d.creditor)];
        if (creditor) {
          // cash + building refund to creditor; props transfer (mortgaged stay mortgaged);
          // creditor pays 10% interest on each inherited mortgaged property.
          creditor.cash += p.cash + refund;
          creditor.cash -= num(d.mortgage_interest_paid);
          for (const sq of f.squares) if (sq.owner === p.seat) sq.owner = creditor.seat;
        } else {
          // to the bank: buildings already gone; properties return unowned + unmortgaged.
          for (const sq of f.squares) {
            if (sq.owner !== p.seat) continue;
            sq.owner = null;
            sq.mortgaged = false;
          }
        }
        // GOOJF cards return to their decks (not transferred to the creditor).
        p.cash = 0;
        p.goojfChance = 0;
        p.goojfCc = 0;
        p.bankrupt = true;
      }
      break;
    }
    case "game_over": {
      f.winnerSeat = (num(d.winner) as Seat) ?? null;
      break;
    }
    default:
      break; // dice_roll, decline, card_draw, message, reasoning, pledge_made, trade_counter/rejected, header, game_start/meta
  }
}

/** Fold events[0..uptoIndex] (inclusive) onto a fresh frame. */
export function reconstruct(data: GameData, board: BoardData, uptoIndex: number): Frame {
  const f = initialFrame(data.header);
  const end = Math.min(uptoIndex, data.events.length - 1);
  for (let i = 0; i <= end; i++) {
    applyEvent(f, data.events[i], board);
    f.index = i;
  }
  return f;
}

/** Snapshot a (cloned) frame at the start of every turn for O(few) scrubbing. */
export function buildSnapshots(data: GameData, board: BoardData): { index: number; frame: Frame }[] {
  const snaps: { index: number; frame: Frame }[] = [];
  const f = initialFrame(data.header);
  snaps.push({ index: -1, frame: cloneFrame(f) });
  for (let i = 0; i < data.events.length; i++) {
    const ev = data.events[i];
    if (ev.type === "turn_start") snaps.push({ index: i - 1, frame: cloneFrame({ ...f, index: i - 1 }) });
    applyEvent(f, ev, board);
    f.index = i;
  }
  return snaps;
}

/** Get the frame at event index `i`, using the nearest snapshot <= i. */
export function frameAt(
  data: GameData,
  board: BoardData,
  snaps: { index: number; frame: Frame }[],
  i: number,
): Frame {
  let lo = 0;
  let hi = snaps.length - 1;
  let best = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (snaps[mid].index <= i) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  const f = cloneFrame(snaps[best].frame);
  for (let j = snaps[best].index + 1; j <= i; j++) {
    applyEvent(f, data.events[j], board);
    f.index = j;
  }
  return f;
}

/** Net worth (engine convention): cash + property book value + buildings at cost. */
export function netWorth(frame: Frame, board: { board: { index: number; price?: number; mortgage?: number; house_cost?: number }[] }, seat: Seat): number {
  const byIndex = board.board;
  let nw = frame.players[seat].cash;
  for (const sq of frame.squares) {
    if (sq.owner !== seat) continue;
    const def = byIndex[sq.index];
    nw += sq.mortgaged ? def.mortgage ?? 0 : def.price ?? 0;
    const units = sq.houses + (sq.hasHotel ? 5 : 0);
    nw += units * (def.house_cost ?? 0);
  }
  return nw;
}
