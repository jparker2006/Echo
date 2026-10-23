import { frameRuns, GRID_WIDE, PALETTE, STATIC_T } from "@/lib/ascii";
import { AsciiLive } from "@/components/ascii-live";

/** The home hero's 3D ASCII scene. The server renders one still frame as a
    <pre> (so the hero is never blank and works without JS); AsciiLive then
    draws live frames on a canvas over it. Purely decorative. */
export function AsciiScene() {
  const rows = frameRuns(GRID_WIDE.W, GRID_WIDE.H, STATIC_T);
  return (
    <AsciiLive>
      <pre className="ascii-static">
        {rows.map((runs, i) => (
          <span key={i}>
            {runs.map((run, j) => (
              <span key={j} style={run.tone ? { color: PALETTE[run.tone] } : undefined}>
                {run.text}
              </span>
            ))}
            {"\n"}
          </span>
        ))}
      </pre>
    </AsciiLive>
  );
}
