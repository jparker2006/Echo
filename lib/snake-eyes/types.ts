// Shared types for the Snake Eyes replay. These are compile-time only — the reducer
// imports them with `import type`, so nothing here exists at runtime (lets the Node
// cross-check run the .ts reducer directly via type-stripping).

export type Seat = 0 | 1 | 2 | 3;

export interface Bundle {
  cash: number;
  properties: number[];
  goojf_chance: number;
  goojf_cc: number;
}

export interface GameEvent {
  seq: number;
  player: number | null;
  type: string;
  // event payloads are heterogeneous; the reducer narrows per type.
  data: Record<string, unknown>;
}

export interface Header {
  seed: number;
  rounds: number;
  winner_seat: number | null;
  winner_model?: string | null;
  ranking?: number[];
  net_worths: Record<string, number>;
  seats: Record<string, string>;
  slugs?: Record<string, string>;
  display?: Record<string, { name: string; lab: string }>;
  house_rules: { free_parking_pot: boolean; starting_cash: number; max_rounds: number };
}

export interface GameData {
  header: Header;
  events: GameEvent[];
}

// --- board (subset of snake_eyes_board.json we actually use) ----------------
export type SquareType =
  | "go"
  | "property"
  | "railroad"
  | "utility"
  | "tax"
  | "chance"
  | "community_chest"
  | "jail"
  | "free_parking"
  | "go_to_jail";

export type ColorGroup =
  | "brown"
  | "light_blue"
  | "pink"
  | "orange"
  | "red"
  | "yellow"
  | "green"
  | "dark_blue";

export interface BoardSquare {
  index: number;
  name: string;
  type: SquareType;
  color?: ColorGroup;
  price?: number;
  rent?: number[];
  rent_dice_multiplier?: number[];
  house_cost?: number;
  mortgage?: number;
  amount?: number;
}

export interface BoardData {
  meta: Record<string, unknown>;
  board: BoardSquare[];
  chance: unknown[];
  community_chest: unknown[];
}

// --- reconstructed replay state --------------------------------------------
export interface PlayerState {
  seat: Seat;
  cash: number;
  position: number; // board square 0..39 (jail shown via inJail)
  inJail: boolean;
  jailTurns: number;
  bankrupt: boolean;
  goojfChance: number;
  goojfCc: number;
}

export interface SquareState {
  index: number;
  owner: Seat | null;
  houses: number; // 0..4
  hasHotel: boolean;
  mortgaged: boolean;
}

export interface Frame {
  index: number; // last event index applied (inclusive); -1 = pristine start
  round: number;
  activeSeat: Seat | null;
  players: PlayerState[];
  squares: SquareState[]; // length 40, indexed by board position
  winnerSeat: Seat | null;
}
