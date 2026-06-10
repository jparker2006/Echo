// Curated jump points. `index` is the event index (== seq) to seek to; the verified
// beats from the real transcript. Most land on a public line so the moment is legible
// in either reveal mode — and far more damning with the private channel turned on.
export interface Chapter {
  id: string;
  label: string;
  index: number;
  blurb: string;
}

export const CHAPTERS: Chapter[] = [
  { id: "open", label: "The opening trades", index: 146, blurb: "MiMo pitches “you come out ahead” — privately, “roughly even.”" },
  { id: "gaslight", label: "The gaslight", index: 264, blurb: "“You haven't responded yet” — after eight straight rejections." },
  { id: "railroad", label: "Invented math", index: 314, blurb: "A fabricated $420 “bank cost” to dress a loss as a discount." },
  { id: "atlantic", label: "Hidden tempo", index: 525, blurb: "“Ends both our standoffs” — knowing it left Claude too broke to build." },
  { id: "collapse", label: "Both flagships bust", index: 825, blurb: "GPT and Claude bankrupt by round 18." },
  { id: "duel", label: "The duel", index: 863, blurb: "Kimi vs MiMo — fifteen rounds to the death." },
  { id: "concede", label: "The concession", index: 1204, blurb: "“GG P2. You outplayed me. The math always catches up.”" },
];
