import type { Line } from "@/lib/snake-eyes/format";
import type { Header } from "@/lib/snake-eyes/types";
import { SEAT_COLORS, seatName } from "@/lib/snake-eyes/seat";

export function TranscriptLine({ line, header }: { line: Line; header: Header }) {
  const color = line.seat != null ? SEAT_COLORS[line.seat as 0 | 1 | 2 | 3] : "var(--muted)";
  const name = line.seat != null ? seatName(header, line.seat) : "";

  if (line.kind === "think") {
    return (
      <div className="se-line se-think" style={{ borderColor: color }}>
        <span className="se-think-tag" style={{ color }}>
          {name} privately
        </span>
        <span className="se-think-text">{line.text}</span>
      </div>
    );
  }

  if (line.kind === "system") {
    return (
      <div className="se-line se-system">
        <b style={{ color }}>{name}</b> {line.text}
      </div>
    );
  }

  const isSpeech = line.kind === "say" || line.kind === "dm";
  return (
    <div className={`se-line se-${line.kind}`}>
      <span className="se-line-who" style={{ color }}>
        {name}
      </span>
      {line.kind === "dm" ? <span className="se-dm-tag">🔒 to P{line.to}</span> : null}
      <span className="se-line-text">{isSpeech ? `“${line.text}”` : line.text}</span>
    </div>
  );
}
