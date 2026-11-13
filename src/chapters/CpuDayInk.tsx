// Chapter 4 by day: ink on the bench itself.
// The same die on the same bench, by day, and nothing on paper: the night's own drawings come back in ink,
// in the plate's own coordinates, with the detail the night left out. Two inks only: dark on the pale mat,
// cream on the dark chuck and die. Each inked part appears on its day step (1 to 11; step 12 is the
// overview); a path draws itself, text fades in. The same content is given in words for screen readers.
//
// Measured on the day photograph (2400 x 1500): core 0 on its tile's ridge (x 474 to 622, y 335 to 560),
// cluster 0 along the top row's ridge (to x 1084), the die's edge at x 426 to 1118, y 300 to 966.
import type { ReactNode } from "react";
import { COMBINATIONS, CPPC_LEVELS, PSS_EXAMPLE } from "../model/cpuPower";

// A part is inked from its own day step on; `lo` hides the parts before it (narrow screens show one group at a time).
const Part = ({
  p,
  k,
  lo,
  children,
  className = "",
}: {
  p: number;
  k: number;
  lo: number;
  children: ReactNode;
  className?: string;
}) => (
  <g className={`cp-part${p >= lo && p <= k ? " on" : ""}${className ? ` ${className}` : ""}`} data-p={p}>
    {children}
  </g>
);

// ---- One idle period (steps 1 to 3): on the clean mat under the scales, at 0.72 of its drawn size ----------
const P = { x0: 190, x1: 1440, top: 1300, base: 1432 };
const X = (t: number) => P.x0 + (t * (P.x1 - P.x0)) / 100;
const T0 = 18,
  ENTRY = 2,
  IRQ = 62,
  UP = 74,
  RESID = 54,
  EST = 54;
const FLOOR = 1412;
/** Where the idle period sits on the plate, and its scale (model: FRAMES.print frames it). */
export const TRACE_AT = { x: 1400, y: 1050, s: 0.72 };

/**
 * `v` stretches the drawing downwards from its top label: 1 on wide screens (the values as drawn), more on
 * narrow ones, where the period is as wide as the screen and would otherwise be a flat strip with its labels
 * on top of each other. Only positions stretch; the letters keep their shape. Under the time axis nothing stretches.
 */
function Trace({ k, lo, v }: { k: number; lo: number; v: number }) {
  const Y = (y: number) => (y <= P.base ? 1250 + (y - 1250) * v : 1250 + (P.base - 1250) * v + (y - P.base));
  const top = Y(P.top),
    base = Y(P.base),
    floor = Y(FLOOR);
  return (
    <g
      className="cp-pr"
      transform={`translate(${(TRACE_AT.x - P.x0 * TRACE_AT.s).toFixed(1)} ${(TRACE_AT.y - 1246 * TRACE_AT.s).toFixed(1)}) scale(${TRACE_AT.s})`}
    >
      <Part p={1} k={k} lo={lo}>
        <polygon
          className="cp-ink-area"
          points={`${X(0)},${top} ${X(T0)},${top} ${X(T0 + ENTRY)},${floor} ${X(IRQ)},${floor} ${X(IRQ)},${base} ${X(0)},${base}`}
        />
        <line className="cp-ink-thin cp-draw" pathLength={1} x1={P.x0} y1={base} x2={P.x1} y2={base} />
        <path
          className="cp-ink cp-draw"
          pathLength={1}
          d={`M ${X(0)} ${top} H ${X(T0)} L ${X(T0 + ENTRY)} ${floor} H ${X(IRQ)}`}
        />
        <path className="cp-ink-dash" d={`M ${X(T0)} ${Y(1284)} V ${Y(1270)} H ${X(T0 + EST)} V ${Y(1284)}`} />
        <text className="cp-ink-t" x={(X(T0) + X(T0 + EST)) / 2} y={Y(1250)} textAnchor="middle">
          <tspan className="b">OS estimate</tspan> of the idle time
        </text>
        <text className="cp-ink-t grey" x={P.x0} y={Y(1282)}>
          running
        </text>
        <text className="cp-ink-t" x={X(T0 + ENTRY) + 12} y={floor - 16}>
          <tspan className="b">One state</tspan>
          <tspan className="sub">, picked once</tspan>
        </text>
        <text className="cp-ink-t grey sub" x={P.x1} y={base + 40} textAnchor="end">
          time, not to scale
        </text>
      </Part>
      <Part p={2} k={k} lo={lo}>
        <line className="cp-ink-dash" x1={X(RESID)} y1={Y(1296)} x2={X(RESID)} y2={base} />
        <text className="cp-ink-t" x={X(RESID) - 14} y={Y(1336)} textAnchor="end">
          {/* Stretched (narrow screens), the name takes two lines: on one it would cross the drop into the state. */}
          {v > 1 ? (
            <>
              <tspan className="b">Minimum</tspan>
              <tspan className="b" x={X(RESID) - 14} dy="1.15em">
                residency
              </tspan>
            </>
          ) : (
            <tspan className="b">Minimum residency</tspan>
          )}
        </text>
        <text className="cp-ink-t grey sub" x={X(RESID) - 14} y={Y(1370)} textAnchor="end">
          break-even, may be tuned
        </text>
        <line className="cp-ink cp-draw" pathLength={1} x1={X(IRQ)} y1={base} x2={X(IRQ)} y2={Y(1296)} />
        <line className="cp-ink-thin" x1={X(IRQ)} y1={base} x2={X(IRQ)} y2={base + 14} />
        <text className="cp-ink-t" x={X(IRQ)} y={base + 46} textAnchor="middle">
          <tspan className="b">Interrupt</tspan>: the work waits
        </text>
      </Part>
      <Part p={3} k={k} lo={lo}>
        <polygon
          className="cp-ink-area"
          points={`${X(IRQ)},${floor} ${X(UP)},${top} ${X(100)},${top} ${X(100)},${base} ${X(IRQ)},${base}`}
        />
        <polygon
          className="cp-ink-hatch"
          points={`${X(IRQ)},${floor} ${X(UP)},${top} ${X(UP)},${base} ${X(IRQ)},${base}`}
        />
        <path className="cp-ink cp-draw" pathLength={1} d={`M ${X(IRQ)} ${floor} L ${X(UP)} ${top} H ${X(100)}`} />
        <text className="cp-ink-t" x={X(UP) + 16} y={Y(1356)}>
          <tspan className="b">Wake latency</tspan>
        </text>
        <text className="cp-ink-t grey sub" x={X(UP) + 16} y={Y(1392)}>
          worst case, the OS relies on it
        </text>
        <text className="cp-ink-t mono sub" x={P.x0} y={base + 96}>
          _LPI: residency and usage counters are optional
        </text>
      </Part>
    </g>
  );
}

// ---- Core, cluster, system (steps 4 to 7): on the die itself, then the combinations on the mat ---------------
const CORE = { x: 474, y: 335, w: 148, h: 225 };
const ROW_X1 = 1084;
const SYS = { x: 414, y: 288, w: 716, h: 690 };
const TX = 1400,
  TCOL = [0, 240, 480],
  TW = 670,
  TY = 636,
  RH = 46;

function DieMarks({ k, lo }: { k: number; lo: number }) {
  return (
    <g className="cp-dr">
      <Part p={4} k={k} lo={lo}>
        <rect className="cp-ink-c cp-draw" pathLength={1} x={CORE.x} y={CORE.y} width={CORE.w} height={CORE.h} />
        <text className="cp-ink-w" x={CORE.x} y="270">
          core 0
        </text>
      </Part>
      <Part p={5} k={k} lo={lo}>
        <path
          className="cp-ink-c dash"
          d={`M ${CORE.x + CORE.w} ${CORE.y} H ${ROW_X1} V ${CORE.y + CORE.h} H ${CORE.x + CORE.w}`}
        />
        <text className="cp-ink-w" x={ROW_X1} y="270" textAnchor="end">
          cluster 0
        </text>
        <rect className="cp-ink-c dot" x={SYS.x} y={SYS.y} width={SYS.w} height={SYS.h} rx="14" />
        <text className="cp-ink-w" x={SYS.x + 2} y={SYS.y + SYS.h + 42}>
          system
        </text>
      </Part>
      <Part p={6} k={k} lo={lo}>
        {["System", "Cluster", "Core"].map((h, j) => (
          <text key={h} className="cp-ink-t b" x={TX + TCOL[j]} y={TY}>
            {h}
          </text>
        ))}
        <line className="cp-ink-thin cp-draw" pathLength={1} x1={TX} y1={TY + 16} x2={TX + TW} y2={TY + 16} />
        {COMBINATIONS.map((r, i) => (
          <g key={i} className="cp-row" style={{ transitionDelay: `${i * 0.25}s` }}>
            {r.map((c, j) => (
              <text
                key={j}
                className={`cp-ink-t${c === "running" ? " grey" : ""}`}
                x={TX + TCOL[j]}
                y={TY + 16 + (i + 1) * RH - 12}
              >
                {c}
              </text>
            ))}
            <line
              className="cp-ink-thin"
              x1={TX}
              y1={TY + 16 + (i + 1) * RH}
              x2={TX + TW}
              y2={TY + 16 + (i + 1) * RH}
            />
          </g>
        ))}
      </Part>
      <Part p={7} k={k} lo={lo}>
        <text className="cp-ink-t grey sub" x={TX} y={TY + 16 + 4 * RH + 44}>
          containers: described by firmware
        </text>
        <text className="cp-ink-t mono sub" x={TX} y={TY + 16 + 4 * RH + 80}>
          _RDI: top container only
        </text>
      </Part>
    </g>
  );
}

// ---- Steps, then a scale (steps 8 to 11): two rules on the mat beside the die -------------------------------
const PSS = { x: 1420, y0: 330, pitch: 76 };
const CPC = { x: 2110, y0: 330, y1: 920 };

function Scales({ k, lo }: { k: number; lo: number }) {
  return (
    <g className="cp-cd">
      <Part p={8} k={k} lo={lo}>
        <text className="cp-ink-t mono" x={PSS.x - 20} y="296">
          _PSS
        </text>
        <line
          className="cp-ink cp-draw"
          pathLength={1}
          x1={PSS.x}
          y1={PSS.y0}
          x2={PSS.x}
          y2={PSS.y0 + 2 * PSS.pitch + 40}
        />
        {PSS_EXAMPLE.map(([n, f, w, when], i) => {
          const y = PSS.y0 + 20 + i * PSS.pitch;
          return (
            <g key={n} className="cp-row" style={{ transitionDelay: `${(2 - i) * 0.25}s` }}>
              <line className="cp-ink" x1={PSS.x - 16} y1={y} x2={PSS.x + 16} y2={y} />
              <text className="cp-ink-t mono" x={PSS.x + 36} y={y + 10}>
                {n}
              </text>
              <text className="cp-ink-t b" x={PSS.x + 100} y={y + 10}>
                {f}
              </text>
              <text className="cp-ink-t" x={PSS.x + 250} y={y + 10}>
                {w}
              </text>
              <text className="cp-ink-t grey sub" x={PSS.x + 360} y={y + 10}>
                {when}
              </text>
            </g>
          );
        })}
      </Part>
      <Part p={9} k={k} lo={lo}>
        <line className="cp-ink-rust" x1={PSS.x - 28} y1={PSS.y0 + 58} x2={PSS.x + 340} y2={PSS.y0 + 58} />
        <text className="cp-ink-t mono rust" x={PSS.x - 20} y={PSS.y0 + 2 * PSS.pitch + 96}>
          _PPC = 1: on AC, not docked
        </text>
      </Part>
      <Part p={10} k={k} lo={lo}>
        <text className="cp-ink-t mono" x={CPC.x - 20} y="296">
          _CPC
        </text>
        <line className="cp-ink-blue cp-draw" pathLength={1} x1={CPC.x} y1={CPC.y0} x2={CPC.x} y2={CPC.y1} />
        {CPPC_LEVELS.map(([w, , f]) => {
          const y = CPC.y0 + f * (CPC.y1 - CPC.y0);
          return (
            <g key={w}>
              <line className="cp-ink-blue" x1={CPC.x - 16} y1={y} x2={CPC.x + 16} y2={y} />
              <text className="cp-ink-t b" x={CPC.x + 36} y={y + 10}>
                {w}
              </text>
            </g>
          );
        })}
      </Part>
      <Part p={11} k={k} lo={lo}>
        <text className="cp-ink-t grey sub" x={CPC.x - 20} y="252">
          supersedes _PSS and _PPC
        </text>
        <text className="cp-ink-t grey sub" x={CPC.x - 20} y={CPC.y1 + 62}>
          one scale, no units. The OS asks,
        </text>
        <text className="cp-ink-t grey sub" x={CPC.x - 20} y={CPC.y1 + 96}>
          or the platform chooses by EPP
        </text>
      </Part>
    </g>
  );
}

/** Everything written on the bench by day; k is the day step shown (0 hides all ink), lo the first part shown, v the idle period's stretch. */
export function DayInk({ k, lo = 1, v = 1 }: { k: number; lo?: number; v?: number }) {
  return (
    <g className="cp-sheets">
      <defs>
        <pattern id="cp-hatch-ink" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="14" stroke="#1d1f27" strokeWidth="1.8" />
        </pattern>
      </defs>
      <DieMarks k={k} lo={lo} />
      <Scales k={k} lo={lo} />
      <Trace k={k} lo={lo} v={v} />
    </g>
  );
}

/** What is written on the bench, in words, for screen readers (the figure itself is hidden from them). */
export function DayInkInWords() {
  return (
    <section className="sr-only" id="cp-day-desc" tabIndex={-1} aria-labelledby="cp-day-desc-title">
      <h2 id="cp-day-desc-title">What is written on the bench by day, in words</h2>
      <p>
        One idle period, drawn on the mat: the core runs, then drops once to one state picked for the OS estimate of the
        idle time. Minimum residency is a break-even, and may be tuned for the typical case. The interrupt arrives. The
        work waits, never lost. Wake latency is a worst case, and the OS relies on it. _LPI residency and usage counters
        are optional.
      </p>
      <p>
        On the die itself: core 0, cluster 0 and the system level are outlined. Example valid combinations (system,
        cluster, core): {COMBINATIONS.map((r) => r.join(", ")).join("; ")}. Containers are described by firmware. _RDI
        is read only at the top container.
      </p>
      <p>
        Beside the die, two scales: {PSS_EXAMPLE.map(([n, f, w, when]) => `${n} ${f}, ${w}, ${when}`).join("; ")}. _PPC
        is 1: on AC, not docked. The CPPC scale has no units: {CPPC_LEVELS.map(([w, d]) => `${w}, ${d}`).join("; ")}. It
        supersedes _PSS and _PPC when present. The OS asks for a desired level, or sets a minimum and maximum.
        Optionally the platform chooses, steered by EPP from 0 to 0xFF.
      </p>
    </section>
  );
}
