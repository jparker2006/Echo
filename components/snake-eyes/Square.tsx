import type { CSSProperties } from "react";
import type { BoardSquare, SquareState } from "@/lib/snake-eyes/types";
import { cellFor, edgeFor } from "@/lib/snake-eyes/geo";
import { SEAT_COLORS } from "@/lib/snake-eyes/seat";

// --- thin monochrome line icons (no emoji) ---------------------------------
function TrainIcon() {
  return (
    <svg className="se-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="6" width="11" height="9" rx="1.5" />
      <path d="M15 8h3.2l2.3 3.2V15H15z" />
      <circle cx="8" cy="18" r="1.5" />
      <circle cx="17" cy="18" r="1.5" />
      <path d="M6 18h7" />
    </svg>
  );
}
function BulbIcon() {
  return (
    <svg className="se-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 18h5" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.8 10.6c.6.6 1.1 1.1 1.3 2.4h5c.2-1.3.7-1.8 1.3-2.4A6 6 0 0 0 12 3z" />
    </svg>
  );
}
function DropIcon() {
  return (
    <svg className="se-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5c2.8 3.8 5.5 6.6 5.5 9.5a5.5 5.5 0 0 1-11 0c0-2.9 2.7-5.7 5.5-9.5z" />
    </svg>
  );
}
function ChestIcon() {
  return (
    <svg className="se-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="9" width="16" height="10" rx="1" />
      <path d="M4 13h16" />
      <path d="M4.5 9a7.5 4 0 0 1 15 0" />
      <rect x="11" y="11.5" width="2" height="3" rx="0.4" />
    </svg>
  );
}

function SquareIcon({ def }: { def: BoardSquare }) {
  switch (def.type) {
    case "railroad":
      return <TrainIcon />;
    case "utility":
      return /water/i.test(def.name) ? <DropIcon /> : <BulbIcon />;
    case "community_chest":
      return <ChestIcon />;
    case "tax":
      return <span className="se-sq-glyph">$</span>;
    case "chance":
      return <span className="se-sq-glyph">?</span>;
    default:
      return null;
  }
}

function CornerContent({ def }: { def: BoardSquare }) {
  if (def.type === "go")
    return (
      <>
        <span className="se-corner-big">GO</span>
        <span className="se-corner-sub">collect $200</span>
      </>
    );
  if (def.type === "jail")
    return (
      <>
        <span className="se-corner-big">JAIL</span>
        <span className="se-corner-sub">just visiting</span>
      </>
    );
  if (def.type === "free_parking") return <span className="se-corner-big">FREE PARKING</span>;
  if (def.type === "go_to_jail") return <span className="se-corner-big">GO TO JAIL</span>;
  return <span className="se-corner-big">{def.name}</span>;
}

export function Square({ def, state }: { def: BoardSquare; state: SquareState }) {
  const edge = edgeFor(def.index);
  const { row, col } = cellFor(def.index);
  const owner = state.owner;
  const ownerColor = owner != null ? SEAT_COLORS[owner] : null;

  const style: CSSProperties = { gridColumn: col, gridRow: row };
  if (ownerColor) {
    style.boxShadow = `inset 0 0 0 2px ${ownerColor}`;
    style.background = `color-mix(in srgb, ${ownerColor} 16%, var(--se-tile))`;
  }

  if (edge === "corner") {
    return (
      <div className="se-sq se-sq--corner" style={style} title={def.name}>
        <CornerContent def={def} />
      </div>
    );
  }

  const isProperty = def.type === "property";
  const houseUnits = state.hasHotel ? 0 : state.houses;

  return (
    <div
      className={`se-sq se-sq--${edge}${state.mortgaged ? " se-sq--mortgaged" : ""}`}
      style={style}
      title={`${def.name}${def.price != null ? ` · $${def.price}` : ""}${owner != null ? ` · P${owner}` : ""}`}
    >
      {isProperty && def.color ? (
        <span className="se-band" style={{ background: `var(--c-${def.color})` }} />
      ) : null}

      <span className="se-sq-body">
        {!isProperty ? (
          <span className="se-sq-icon">
            <SquareIcon def={def} />
          </span>
        ) : null}
        <span className="se-sq-name">{def.name}</span>
        {def.price != null ? <span className="se-sq-price">${def.price}</span> : null}
      </span>

      {state.hasHotel ? (
        <span className="se-hotel" title="hotel" />
      ) : houseUnits > 0 ? (
        <span className="se-houses">
          {Array.from({ length: houseUnits }, (_, i) => (
            <span key={i} className="se-house" />
          ))}
        </span>
      ) : null}
    </div>
  );
}
