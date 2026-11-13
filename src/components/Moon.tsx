// The moon glyph: a disc lit by a given fraction, or one of the legend's state glyphs. Used in the nav and
// on the chapter list.
import { legendItem, litPath, type StateId } from "../model/moon";

interface Props {
  /** Lit fraction 0..1, or a legend state whose glyph to draw. */
  k?: number;
  state?: StateId;
  r: number;
  tone: "dark" | "light";
}

// On dark ground the moon is moonlight on a faint disc with a quiet outline;
// on light ground the lit part stays pale with an ink outline, so a full moon
// never reads as a new moon.
const INK = {
  dark: { lit: "#EDE6D3", disc: "rgba(237,230,211,.12)", outline: "#5B6070" },
  light: { lit: "#FFF8E6", disc: "#3A4166", outline: "#161B33" },
};

export function Moon({ k, state, r, tone }: Props) {
  const it = state ? legendItem(state) : null;
  const lit = it ? it.k : (k ?? 1);
  const ink = INK[tone];
  const size = r * 2 + 4;
  const c = size / 2;
  if (it?.dashed) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={c} cy={c} r={r - 0.75} fill="none" stroke={ink.outline} strokeWidth={1.5} strokeDasharray="3 3" />
      </svg>
    );
  }
  const path = litPath(lit, r, c);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill={ink.disc} />
      {it?.ring && (
        <circle
          cx={c}
          cy={c}
          r={Math.max(r - 3.5, r * 0.78)}
          fill="none"
          stroke={ink.lit}
          strokeWidth={r > 14 ? 2.5 : 1.6}
        />
      )}
      {it?.dot && <circle cx={c} cy={c} r={Math.max(1.6, r * 0.2)} fill="#F2A93B" />}
      {path && <path d={path} fill={ink.lit} />}
      <circle cx={c} cy={c} r={r - 0.5} fill="none" stroke={ink.outline} strokeWidth={1} />
    </svg>
  );
}
