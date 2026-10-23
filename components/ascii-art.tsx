import { frameRuns, GRID_NARROW, GRID_WIDE, PALETTE, STATIC_T } from "@/lib/ascii";
import { AsciiLive } from "@/components/ascii-live";

/** The home hero's 3D ASCII scene. The server renders one still frame per
    grid size as a <pre> (so the hero is never blank and works without JS);
    CSS shows the one matching the width, and AsciiLive then draws live frames
    on a canvas over it with the same grid, so there's no jump. Decorative. */
export function AsciiScene() {
  return (
    <AsciiLive>
      <StillFrame grid={GRID_WIDE} className="ascii-static ascii-static--wide" />
      <StillFrame grid={GRID_NARROW} className="ascii-static ascii-static--narrow" />
    </AsciiLive>
  );
}

function StillFrame({ grid, className }: { grid: { W: number; H: number }; className: string }) {
  const rows = frameRuns(grid.W, grid.H, STATIC_T);
  return (
    <pre className={className}>
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
  );
}
