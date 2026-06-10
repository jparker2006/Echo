// One-time build: turn the preserved Snake Eyes game into web-ready JSON for the
// /snake-eyes replay demo. Reads from the sibling repo ../../SnakeEyes and writes
// committed files into Echo's public/snake-eyes/ so the blog stays self-contained.
//
//   node scripts/build-snake-eyes-data.mjs
//
// Produces:
//   public/snake-eyes/board.json  — verbatim board definition (40 squares + decks)
//   public/snake-eyes/game.json   — { header, events } with the heavy reasoning.raw
//                                    chain-of-thought stripped (5.9MB -> ~0.3MB)
//   public/snake-eyes/judge.json  — flattened neutral-judge deception flags

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const ECHO = path.resolve(here, "..");
const SNAKE = path.resolve(ECHO, "..", "SnakeEyes");
const SRC = path.join(SNAKE, "showcase", "frontier-game-1");
const OUT = path.join(ECHO, "public", "snake-eyes");

// slug -> human display name + lab, for the HUD (derived from header.slugs).
const SLUG_DISPLAY = {
  "openai/gpt-5.2": { name: "GPT-5.2", lab: "OpenAI" },
  "anthropic/claude-sonnet-4.6": { name: "Claude Sonnet 4.6", lab: "Anthropic" },
  "moonshotai/kimi-k2.6": { name: "Kimi K2.6", lab: "Moonshot" },
  "xiaomi/mimo-v2.5-pro": { name: "MiMo", lab: "Xiaomi" },
};

function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`;
}

fs.mkdirSync(OUT, { recursive: true });

// --- board.json (validate + re-emit minified) ------------------------------
const boardRaw = fs.readFileSync(path.join(SNAKE, "snake_eyes_board.json"), "utf8");
const board = JSON.parse(boardRaw);
if (!Array.isArray(board.board) || board.board.length !== 40) {
  throw new Error(`board.json: expected 40 squares, got ${board.board?.length}`);
}
const boardOut = JSON.stringify(board);
fs.writeFileSync(path.join(OUT, "board.json"), boardOut);

// --- game.json (header + slim events) --------------------------------------
const lines = fs
  .readFileSync(path.join(SRC, "game.jsonl"), "utf8")
  .split("\n")
  .filter((l) => l.trim().length > 0);

let header = null;
const events = [];
let rawStripped = 0;
for (const line of lines) {
  const e = JSON.parse(line);
  if (e.type === "header") {
    header = e;
    continue;
  }
  if (e.type === "reasoning" && e.data && "raw" in e.data) {
    rawStripped += 1;
    const { raw, ...rest } = e.data;
    e.data = rest;
  }
  events.push(e);
}
if (!header) throw new Error("game.jsonl: no header line found");

// derive per-seat display info from slugs (fall back to seat label)
const display = {};
for (const [seat, slug] of Object.entries(header.slugs ?? {})) {
  display[seat] = SLUG_DISPLAY[slug] ?? { name: header.seats?.[seat] ?? `P${seat}`, lab: "" };
}
header.display = display;

// sanity: contiguous seqs 0..N-1
events.forEach((e, i) => {
  if (e.seq !== i) throw new Error(`seq gap at index ${i}: event.seq=${e.seq}`);
});

const gameOut = JSON.stringify({ header, events });
fs.writeFileSync(path.join(OUT, "game.json"), gameOut);

// --- judge.json (flattened deception flags) --------------------------------
let judgeFlags = [];
try {
  const judge = JSON.parse(fs.readFileSync(path.join(SRC, "game.judge.json"), "utf8"));
  const seen = new Set();
  for (const [seat, blk] of Object.entries(judge.players ?? {})) {
    for (const vote of blk.raw_votes ?? []) {
      for (const [dim, dd] of Object.entries(vote.dimensions ?? {})) {
        for (const inst of dd.instances ?? []) {
          const rationale = (inst.rationale ?? "").trim();
          const seqs = inst.evidence_seqs ?? [];
          if (!rationale || seqs.length === 0) continue;
          const key = `${seat}|${dim}|${rationale.slice(0, 48)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          judgeFlags.push({ seat: Number(seat), dim, seqs, rationale });
        }
      }
    }
  }
  judgeFlags.sort((a, b) => (a.seqs[0] ?? 0) - (b.seqs[0] ?? 0));
} catch (err) {
  console.warn("judge.json: skipped (", err.message, ")");
}
fs.writeFileSync(path.join(OUT, "judge.json"), JSON.stringify({ flags: judgeFlags }));

// --- report ----------------------------------------------------------------
console.log("snake-eyes data written to public/snake-eyes/");
console.log(`  board.json  ${kb(Buffer.byteLength(boardOut))}  (${board.board.length} squares)`);
console.log(
  `  game.json   ${kb(Buffer.byteLength(gameOut))}  (${events.length} events, raw stripped from ${rawStripped})`,
);
console.log(`  judge.json  ${kb(Buffer.byteLength(JSON.stringify({ flags: judgeFlags })))}  (${judgeFlags.length} flags)`);
console.log(
  `  header: winner_seat=${header.winner_seat} rounds=${header.rounds} ` +
    `net_worths=${JSON.stringify(header.net_worths)} pot=${header.house_rules?.free_parking_pot}`,
);
console.log(`  display: ${Object.entries(display).map(([s, d]) => `${s}:${d.name}`).join("  ")}`);
