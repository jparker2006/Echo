// Cross-check the replay reducer against ground truth (run: node scripts/check-reducer.ts).
// Folds the whole game and asserts the reconstructed end-state matches the header:
// final net worths, winner, bankruptcies, ranking, plus a few invariants.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reconstruct, buildSnapshots, frameAt, netWorth } from "../lib/snake-eyes/reducer.ts";
import type { GameData, Seat } from "../lib/snake-eyes/types.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "..", "public", "snake-eyes");
const game: GameData = JSON.parse(fs.readFileSync(path.join(OUT, "game.json"), "utf8"));
const board = JSON.parse(fs.readFileSync(path.join(OUT, "board.json"), "utf8"));

let failures = 0;
function check(name: string, cond: boolean, detail = "") {
  console.log(`  ${cond ? "✓" : "✗"} ${name}${detail ? `  — ${detail}` : ""}`);
  if (!cond) failures++;
}

const last = game.events.length - 1;
const final = reconstruct(game, board, last);

// 1. final net worth per seat == header.net_worths
const nwExpected = game.header.net_worths;
for (const seat of [0, 1, 2, 3] as Seat[]) {
  const got = netWorth(final, board, seat);
  const want = nwExpected[String(seat)] ?? 0;
  check(`net worth P${seat} == ${want}`, got === want, `got ${got}`);
}

// 2. winner + ranking
check(`winner == ${game.header.winner_seat}`, final.winnerSeat === game.header.winner_seat, `got ${final.winnerSeat}`);
const survivors = final.players.filter((p) => !p.bankrupt).map((p) => p.seat);
check("exactly one survivor (Kimi/P2)", survivors.length === 1 && survivors[0] === 2, `survivors=${survivors}`);

// 3. bankruptcies fire at the expected seqs with the expected creditors
const bks = game.events.filter((e) => e.type === "bankrupt").map((e) => ({ seq: e.seq, player: e.player, creditor: (e.data as any).creditor }));
check(
  "bankruptcies 825→P0/c2, 840→P1/c3, 1205→P3/c2",
  JSON.stringify(bks) ===
    JSON.stringify([
      { seq: 825, player: 0, creditor: 2 },
      { seq: 840, player: 1, creditor: 3 },
      { seq: 1205, player: 3, creditor: 2 },
    ]),
  JSON.stringify(bks),
);

// 4. invariants across the whole fold
let doubleOwned = false;
let roundOk = true;
let prevRound = 0;
const snaps = buildSnapshots(game, board);
for (let i = 0; i <= last; i++) {
  const f = frameAt(game, board, snaps, i);
  // every square owner is a valid seat or null (single owner by construction)
  for (const sq of f.squares) if (sq.owner !== null && (sq.owner < 0 || sq.owner > 3)) doubleOwned = true;
  if (f.round < prevRound) roundOk = false;
  prevRound = f.round;
}
check("round number monotonic non-decreasing", roundOk);
check("all square owners valid", !doubleOwned);

// 5. frameAt(snapshots) agrees with a full reconstruct at a few probe indices
let agree = true;
for (const i of [0, 200, 500, 825, 840, 900, 1205, last]) {
  const a = JSON.stringify(reconstruct(game, board, i));
  const b = JSON.stringify(frameAt(game, board, snaps, i));
  if (a !== b) {
    agree = false;
    console.log(`    frame mismatch at index ${i}`);
  }
}
check("snapshot fast-path == full reconstruct", agree);

console.log("");
console.log(`final cash: ${final.players.map((p) => `P${p.seat}=$${p.cash}`).join("  ")}`);
console.log(`final net worth: ${[0, 1, 2, 3].map((s) => `P${s}=$${netWorth(final, board, s as Seat)}`).join("  ")}`);
console.log(failures === 0 ? "\nALL CHECKS PASSED ✓" : `\n${failures} CHECK(S) FAILED ✗`);
process.exit(failures === 0 ? 0 : 1);
