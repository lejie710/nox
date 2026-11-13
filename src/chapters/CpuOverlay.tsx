// Chapter 4's picture: the bench photograph and everything drawn on it in the plate's own coordinates. By
// night the tiles (one per core), the cluster outline, the bus-master pulse and the performance scale; by
// day the ink (CpuDayInk). The trace is drawn by CpuTrace and handed in, because on narrow screens it sits
// in a strip of its own.
import type { ReactNode } from "react";
import plateImage from "../assets/bench-plate.webp";
// The day photograph, run on beyond its own edges so it never shows as a block.
import dayImage from "../assets/day-bench-ext.webp";
import moonImage from "../assets/halo-moon.webp";
import {
  BAND,
  BOTTOM,
  CLUSTER_LINE,
  CPPC_CASES,
  CPPC_MARKS,
  MOON_WORD,
  NEIGHBOURS,
  PLATE,
  RECTS,
  SCALE,
  TOP,
  textFloor,
  type FrameId,
  type NightStep,
  type TileId,
  type TileState,
} from "../model/cpuPower";
import type { Transform } from "../model/layout";
import { DayInk } from "./CpuDayInk";
import { begin } from "../stage/motion";

function Tiles({
  tiles,
  picked = false,
  snoop,
}: {
  tiles: Partial<Record<TileId, TileState>>;
  picked?: boolean;
  snoop: Set<TileId>;
}) {
  return (
    <>
      {[...TOP, ...BOTTOM].map((id) => {
        const [x0, y0, x1, y1] = RECTS[id],
          r = { x: x0, y: y0, width: x1 - x0, height: y1 - y0, rx: 2 };
        return (
          <g
            key={id}
            className={`cp-tile${BOTTOM.includes(id) ? " neighbour" : ""}${picked && id === "t0" ? " picked" : ""}${snoop.has(id) ? " snoop" : ""}`}
            data-s={tiles[id] ?? NEIGHBOURS[id] ?? "pd"}
          >
            <rect className="cp-tile-fill" {...r} />
            <rect className="cp-tile-kept" {...r} />
            <rect className="cp-tile-glow" {...r} />
            <rect className="cp-tile-edge" {...r} />
            {id === "t0" && (
              <rect className="cp-pick" x={x0 - 10} y={y0 - 10} width={x1 - x0 + 20} height={y1 - y0 + 20} rx="10" />
            )}
          </g>
        );
      })}
    </>
  );
}

function Scale({ kind, phase }: { kind?: "pss" | "cppc"; phase: number }) {
  if (!kind) return null;
  const { x, y0, y1 } = SCALE,
    Y = (f: number) => y0 + f * (y1 - y0);
  if (kind === "pss")
    return (
      <g className="cp-scale">
        <line className="cp-scale-axis" x1={x} y1={y0} x2={x} y2={y1} />
        {[
          ["P0", "650 MHz", 0],
          ["P1", "600 MHz", 0.5],
          ["P2", "500 MHz", 1],
        ].map(([n, f, k], i) => (
          <g key={n as string}>
            <rect
              className={`cp-detent${i === 0 ? " blocked" : ""}`}
              x={x - 16}
              y={Y(k as number) - 9}
              width="32"
              height="18"
              rx="4"
            />
            <text className="cp-mark mono" x={x + 28} y={Y(k as number) + 8}>
              {n} {f}
            </text>
          </g>
        ))}
        <rect className="cp-ppc" x={x - 26} y={Y(0.25) - 4} width="52" height="8" rx="3" />
        <text className="cp-mark mono" x={x - 34} y={Y(0.25) + 8} textAnchor="end">
          _PPC = 1
        </text>
        <path className="cp-ptr" d={`M ${x - 34} ${Y(0.5)} l -22 -12 v 24 z`} />
      </g>
    );
  const c = CPPC_CASES[phase];
  // The marks and pointers keep their elements, so a new case glides.
  return (
    <g className="cp-scale">
      <line className="cp-scale-axis" x1={x} y1={y0} x2={x} y2={y1} />
      {CPPC_MARKS.map(([w, f]) => (
        <g
          key={w}
          className="cp-gmark"
          style={{ transform: w === "Guaranteed" ? `translateY(${Y(c.guaranteed) - Y(f)}px)` : undefined }}
        >
          <line className="cp-tick" x1={x - 12} y1={Y(f)} x2={x + 12} y2={Y(f)} />
          <text className="cp-mark" x={x + 26} y={Y(f) + 9}>
            {w}
          </text>
        </g>
      ))}
      <path
        className="cp-ptr"
        style={{ transform: `translateY(${Y(c.want)}px)` }}
        d={`M ${x - 30} 0 l -22 -12 v 24 z`}
      />
      <path
        className="cp-ptr del"
        style={{ transform: `translateY(${Y(c.got)}px)` }}
        d={`M ${x - 30} 0 l -22 -12 v 24 z`}
      />
    </g>
  );
}

interface BenchPictureProps {
  /** The plate in the view, and the frame the camera is on. */
  t: Transform;
  frame: FrameId;
  /** The night step shown, or null on the reader's turn and by day. */
  step: NightStep | null;
  tiles: Partial<Record<TileId, TileState>>;
  /** How much light the tiles put on the bench. */
  lit: number;
  /** The reader's turn, with a pick still to make: core 0 is ringed. */
  picked: boolean;
  /** What is in motion now (useStepMotion). */
  motion: { clusterRest: boolean; bm: number; phase: number; snoop: Set<TileId> };
  /** The trace, when it is drawn on the plate. */
  trace: ReactNode;
  /** The day's ink: steps `from` to `to`, and how far the idle period is stretched downwards. */
  ink: { from: number; to: number; stretch: number };
  still: boolean;
}

export function BenchPicture({ t, frame, step, tiles, lit, picked, motion, trace, ink, still }: BenchPictureProps) {
  // Each group of day ink is lifted to the 12 px floor in its own frame only; elsewhere it is context at true size.
  const floor = (own: FrameId, nest: number) => (frame === own ? textFloor(24, nest, t.s) : 1).toFixed(3);
  return (
    <div
      className="cp-world"
      aria-hidden="true"
      style={{
        transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.s})`,
        ["--amb" as string]: (0.12 + lit * 0.1).toFixed(2),
        ["--k" as string]: textFloor(24, 1, t.s).toFixed(3),
        ["--kp" as string]: floor("print", 0.72),
        ["--kd" as string]: floor("draw", 1),
        ["--kc" as string]: floor("card", 1),
      }}
    >
      <div className="cp-ambient" />
      <img className="cp-plate" src={plateImage} width={PLATE.w} height={PLATE.h} alt="" decoding="async" />
      <img className="cp-plate cp-plate-day" src={dayImage} width={4800} height={3900} alt="" decoding="async" />
      <svg className="cp-overlay" viewBox={`0 0 ${PLATE.w} ${PLATE.h}`} width={PLATE.w} height={PLATE.h}>
        <defs>
          <radialGradient id="cp-run" cx=".5" cy=".5" r=".7">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".9" />
            <stop offset=".6" stopColor="#dbe4ff" stopOpacity=".55" />
            <stop offset="1" stopColor="#b4c4ee" stopOpacity=".25" />
          </radialGradient>
          <pattern id="cp-kept" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="2.4" fill="#cdd9ff" opacity=".7" />
          </pattern>
          <pattern id="cp-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="14" stroke="#ffd59a" strokeWidth="3" opacity=".75" />
          </pattern>
          <filter id="cp-bloom" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cp-soft" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <g className="cp-night">
          <Tiles tiles={tiles} picked={picked} snoop={motion.snoop} />
          <rect
            className={`cp-cluster${step?.cluster ? " on" : ""}`}
            data-rest={motion.clusterRest}
            x={CLUSTER_LINE.x}
            y={CLUSTER_LINE.y}
            width={CLUSTER_LINE.w}
            height={CLUSTER_LINE.h}
            rx="18"
          />
          {step?.busMaster && !still && (
            <circle key={motion.bm} className="cp-bm" r="9" cx={BAND.x1 - 10} cy={BAND.y0 + 6}>
              <animate
                ref={begin}
                begin="indefinite"
                attributeName="cx"
                values={`${BAND.x1 - 10};${BAND.x0 + 10};${BAND.x0 + 10}`}
                keyTimes="0;0.74;1"
                dur="3.5s"
                fill="freeze"
              />
              <animate
                ref={begin}
                begin="indefinite"
                attributeName="opacity"
                values=".95;.95;0;0"
                keyTimes="0;0.72;0.74;1"
                dur="3.5s"
                fill="freeze"
              />
            </circle>
          )}
          <Scale kind={step?.scale} phase={motion.phase} />
          {trace}
        </g>
        <DayInk k={ink.to} lo={ink.from} v={ink.stretch} />
      </svg>
    </div>
  );
}

/** The moon over the bench, with the system's state under it: the same all night. */
export function BenchMoon() {
  return (
    <div className="cp-moon" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <clipPath id="cp-moon-disc">
            <circle cx="50" cy="50" r="46" />
          </clipPath>
        </defs>
        <g clipPath="url(#cp-moon-disc)">
          <image href={moonImage} x="4" y="4" width="92" height="92" />
        </g>
      </svg>
      <p className="cp-moon-word">{MOON_WORD}</p>
    </div>
  );
}
