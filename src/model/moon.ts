// Moon-phase geometry and the state legend.
//
// A waning moon lit on the left: the lit part is a half disc plus or minus a
// half ellipse (the terminator), so the lit area fraction k is exact.
// Half-ellipse area / disc area = a / (2r), so a = r * |2k - 1|.

export type StateId = "s0" | "s0off" | "s0ix" | "s3" | "s4" | "s5" | "g3";

export interface LegendItem {
  id: StateId;
  /** Lit fraction of the disc, 0..1. Only working states use phase. */
  k: number;
  name: string;
  desc: string;
  /** S3: a warm dot, memory still powered. */
  dot?: boolean;
  /** S4: a ring, the session saved to disk. */
  ring?: boolean;
  /** G3: a dashed outline, no disc. */
  dashed?: boolean;
}

export interface LegendGroup {
  group: string;
  short: string;
  items: LegendItem[];
}

// The legend is a metaphor, not a scale: phase changes only
// inside the working state; every sleeping and off state is a dark moon told
// apart by where the session is kept.
export const LEGEND: LegendGroup[] = [
  {
    group: "Working (G0)",
    short: "Working",
    items: [
      { id: "s0", k: 1, name: "S0", desc: "working, in use" },
      { id: "s0off", k: 0.72, name: "S0", desc: "screen off" },
      { id: "s0ix", k: 0.3, name: "S0", desc: "low-power idle (Modern Standby)" },
    ],
  },
  {
    group: "Sleeping (G1)",
    short: "Sleeping",
    items: [
      { id: "s3", k: 0, dot: true, name: "S3", desc: "suspend to RAM: memory stays powered" },
      { id: "s4", k: 0, ring: true, name: "S4", desc: "hibernate: memory saved to disk" },
    ],
  },
  {
    group: "Off",
    short: "Off",
    items: [
      { id: "s5", k: 0, name: "S5 (G2)", desc: "soft off: standby power only" },
      { id: "g3", k: 0, dashed: true, name: "G3", desc: "mechanical off: only the clock battery" },
    ],
  },
];

export function legendItem(id: StateId): LegendItem {
  for (const g of LEGEND) for (const it of g.items) if (it.id === id) return it;
  throw new Error(`Unknown state ${id}`);
}

/** Terminator half-width for lit fraction k on a disc of radius r. */
export function terminatorRadius(k: number, r: number): number {
  return r * Math.abs(2 * k - 1);
}

/** Fraction of the disc that the lit path covers (for tests). */
export function litFraction(k: number, r: number): number {
  if (k >= 1) return 1;
  if (k <= 0) return 0;
  const half = 0.5;
  const ellipse = terminatorRadius(k, r) / (2 * r);
  return k > 0.5 ? half + ellipse : half - ellipse;
}

/**
 * SVG path for the lit part, centred on (c, c). Returns null for a new moon
 * and a full circle path for a full moon.
 */
export function litPath(k: number, r: number, c: number): string | null {
  if (k <= 0.001) return null;
  if (k >= 0.999) return `M ${c - r} ${c} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  const a = terminatorRadius(k, r);
  // Left semicircle from top to bottom, then back up along the terminator,
  // bulging right for a gibbous moon (sweep 0) and left for a crescent (1).
  const sweep = k > 0.5 ? 0 : 1;
  return `M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} A ${a} ${r} 0 0 ${sweep} ${c} ${c - r} Z`;
}
