import type { BoardData, GameEvent } from "./types";

// A renderable transcript row. `kind` drives styling in TranscriptLine.
export interface Line {
  seat: number | null;
  kind: "say" | "dm" | "think" | "trade" | "pledge" | "move" | "system";
  text: string;
  to?: number | null;
}

const money = (n: number) => `$${Number(n).toLocaleString()}`;

function sqName(board: BoardData, idx: number): string {
  return board.board[idx]?.name ?? `#${idx}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function bundleText(board: BoardData, b: any): string {
  const parts: string[] = [];
  if (b?.cash) parts.push(money(b.cash));
  for (const idx of b?.properties ?? []) parts.push(sqName(board, idx));
  if (b?.goojf_chance) parts.push("a Get-Out-of-Jail card");
  if (b?.goojf_cc) parts.push("a Get-Out-of-Jail card");
  return parts.length ? parts.join(" + ") : "nothing";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pledgeText(d: any): string {
  const to = d.to != null ? `P${d.to}` : "the table";
  switch (d.pledge_type) {
    case "non_aggression":
      return `pledged non-aggression toward ${to}`;
    case "no_rent":
      return `pledged to waive rent for ${to}`;
    case "no_build":
      return `pledged not to build on ${d.terms?.group_or_index ?? "a set"}`;
    case "future_trade_payment":
      return `promised ${to} a future payment`;
    case "trade_embargo":
      return `pledged a trade embargo`;
    case "custom":
      return d.text ? `pledged: “${d.text}”` : `made a pledge to ${to}`;
    default:
      return `made a pledge to ${to}`;
  }
}

/** Turn an event into a transcript line, or null for events we don't surface. */
export function describe(ev: GameEvent, board: BoardData): Line | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = ev.data as any;
  const seat = ev.player;
  switch (ev.type) {
    case "message":
      return { seat, kind: d.visibility === "public" ? "say" : "dm", text: String(d.text ?? ""), to: d.to };
    case "reasoning":
      return d.text ? { seat, kind: "think", text: String(d.text) } : null;
    case "pledge_made":
      return { seat, kind: "pledge", text: pledgeText(d), to: d.to };
    case "trade":
      return {
        seat,
        kind: "trade",
        text: `traded with P${d.target} — gave ${bundleText(board, d.give)}, received ${bundleText(board, d.receive)}`,
        to: d.target,
      };
    case "trade_rejected":
      return { seat, kind: "move", text: `rejected P${d.proposer}'s trade` };
    case "buy":
      return { seat, kind: "move", text: `bought ${sqName(board, d.index)} for ${money(d.price)}` };
    case "build":
      return { seat, kind: "move", text: `built ${d.has_hotel ? "a hotel" : "a house"} on ${sqName(board, d.index)}` };
    case "sell_building":
      return { seat, kind: "move", text: `sold a building on ${sqName(board, d.index)}` };
    case "mortgage":
      return { seat, kind: "move", text: `mortgaged ${sqName(board, d.index)}` };
    case "unmortgage":
      return { seat, kind: "move", text: `lifted the mortgage on ${sqName(board, d.index)}` };
    case "pay_player":
      return { seat, kind: "move", text: `paid P${d.payee} ${money(d.amount)}${d.reason === "rent" ? " in rent" : ""}` };
    case "pay_bank":
      return { seat, kind: "move", text: `paid ${money(d.amount)} (${d.reason})` };
    case "collect":
      return { seat, kind: "move", text: `collected ${money(d.amount)}` };
    case "card_draw":
      return { seat, kind: "move", text: `drew: “${d.text}”` };
    case "go_to_jail":
      return { seat, kind: "move", text: `was sent to jail` };
    case "bankrupt":
      return { seat, kind: "system", text: `went bankrupt${d.creditor != null ? ` to P${d.creditor}` : ""}` };
    case "game_over":
      return { seat: d.winner, kind: "system", text: `wins` };
    default:
      // dice_roll, move, turn_start, decline, leave_jail, pass_go, trade_counter, goojf_gained, game_start/meta
      return null;
  }
}
