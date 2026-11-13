// The opening's laptop, drawn in SVG in side view: generic hardware (two USB-C ports, an
// audio jack, a standby light); nothing traced from any product photograph.
import { useId } from "react";

/**
 * Hinge of the side view, in its viewBox units: the centre of the lid's
 * rounded back end (the lid is 18 units thick, so its end radius is 9), so
 * the end turns in place as the lid opens.
 */
export const SIDE_HINGE = { x: 979, y: 25 };

/** Lid and base boxes of the side view, in viewBox units. */
const SIDE_LID = { x0: 12, y0: 16, x1: 988, y1: 34 };
const SIDE_BASE = { x0: 12, y0: 16, x1: 988, y1: 86 };

/**
 * How far the centre of the side view's outline moves when the lid opens by
 * `deg`, as a fraction of the drawing's width (1000 units). The hero shrinks
 * the laptop about its centre and translates it back by this much times the
 * scale, so the open laptop stays centred.
 */
export function sideOpenShift(deg: number): { dx: number; dy: number } {
  const a = (deg * Math.PI) / 180;
  const rot = (x: number, y: number) => {
    const dx = x - SIDE_HINGE.x;
    const dy = y - SIDE_HINGE.y;
    return {
      x: SIDE_HINGE.x + dx * Math.cos(a) - dy * Math.sin(a),
      y: SIDE_HINGE.y + dx * Math.sin(a) + dy * Math.cos(a),
    };
  };
  const pts = [
    rot(SIDE_LID.x0, SIDE_LID.y0),
    rot(SIDE_LID.x1, SIDE_LID.y0),
    rot(SIDE_LID.x1, SIDE_LID.y1),
    rot(SIDE_LID.x0, SIDE_LID.y1),
  ];
  const xs = [SIDE_BASE.x0, SIDE_BASE.x1, ...pts.map((p) => p.x)];
  const ys = [SIDE_BASE.y0, SIDE_BASE.y1, ...pts.map((p) => p.y)];
  const centre = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  const closed = { x: (SIDE_BASE.x0 + SIDE_BASE.x1) / 2, y: (SIDE_BASE.y0 + SIDE_BASE.y1) / 2 };
  return { dx: (centre.x - closed.x) / 1000, dy: (centre.y - closed.y) / 1000 };
}

/**
 * Laptop seen edge-on: a thin lid over a thicker base, front on the left.
 * The lid is its own group (`side-lid`) so CSS can open it about the hinge;
 * `side-glow` is the screen's light on the lid's inner face; `led-sleep`
 * breathes amber while asleep and `led-on` holds steady once awake.
 * `openDeg` and `awake` set the static picture.
 */
export function LaptopSide({ openDeg = 0, awake = false }: { openDeg?: number; awake?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="laptop-side" viewBox="0 0 1000 100" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A9ACB2" />
          <stop offset=".12" stopColor="#9A9DA3" />
          <stop offset=".55" stopColor="#6A6D72" />
          <stop offset="1" stopColor="#1E2023" />
        </linearGradient>
        <linearGradient id={`${id}lid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0F1F4" />
          <stop offset=".45" stopColor="#B7BAC0" />
          <stop offset=".9" stopColor="#8A8D93" />
          <stop offset="1" stopColor="#26282D" />
        </linearGradient>
        <linearGradient id={`${id}e`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".5" />
          <stop offset=".05" stopColor="#000" stopOpacity="0" />
          <stop offset=".95" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".55" />
        </linearGradient>
        <filter id={`${id}b`}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${id}g`}>
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        {/* User-space region: a thin glow's own box is too flat to filter. */}
        <filter id={`${id}glow`} filterUnits="userSpaceOnUse" x="-40" y="-40" width="1080" height="150">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}spill`} filterUnits="userSpaceOnUse" x="-60" y="-60" width="1120" height="190">
          <feGaussianBlur stdDeviation="16" />
        </filter>
      </defs>
      <ellipse cx="500" cy="86" rx="470" ry="7" fill="#000" opacity=".95" filter={`url(#${id}b)`} />
      {/* base */}
      <rect x="12" y="30" width="976" height="50" rx="16" fill={`url(#${id}base)`} />
      <rect x="12" y="30" width="976" height="50" rx="16" fill={`url(#${id}e)`} />
      <g transform="translate(0 57)">
        <rect x="290" y="-5" width="40" height="10" rx="5" fill="#16171A" stroke="#C9CBD0" strokeOpacity=".5" />
        <rect x="348" y="-5" width="40" height="10" rx="5" fill="#16171A" stroke="#C9CBD0" strokeOpacity=".5" />
        <circle cx="412" cy="0" r="5.5" fill="#16171A" stroke="#C9CBD0" strokeOpacity=".5" />
        <g className="led-sleep" style={{ opacity: awake ? 0 : 1 }}>
          <g className="standby-led">
            <circle cx="70" cy="0" r="8" fill="#F2A93B" opacity=".75" filter={`url(#${id}g)`} />
            <circle cx="70" cy="0" r="3.4" fill="#FFE2B0" />
          </g>
        </g>
        <g className="led-on" style={{ opacity: awake ? 1 : 0 }}>
          <circle cx="70" cy="0" r="8" fill="#DCE6FF" opacity=".7" filter={`url(#${id}g)`} />
          <circle cx="70" cy="0" r="3.4" fill="#FFFFFF" />
        </g>
      </g>
      <rect x="70" y="80" width="44" height="5" rx="2.5" fill="#141518" />
      <rect x="886" y="80" width="44" height="5" rx="2.5" fill="#141518" />
      {/* lid, opening about the hinge at the back */}
      <g className="side-lid" style={{ transform: `rotate(${openDeg}deg)` }}>
        <g className="side-glow" style={{ opacity: awake ? 0.9 : 0 }}>
          <rect
            x="40"
            y="30"
            width="920"
            height="22"
            rx="11"
            fill="#9DB7FF"
            opacity=".55"
            filter={`url(#${id}spill)`}
          />
          <rect x="40" y="31" width="920" height="7" rx="3.5" fill="#E4ECFF" filter={`url(#${id}glow)`} />
        </g>
        <rect x="12" y="16" width="976" height="18" rx="9" fill={`url(#${id}lid)`} />
        <rect x="12" y="16" width="976" height="18" rx="9" fill={`url(#${id}e)`} />
        <line x1="30" y1="17.2" x2="970" y2="17.2" stroke="#FFF" strokeOpacity=".8" />
        <line x1="24" y1="33.4" x2="976" y2="33.4" stroke="#0E0F12" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
