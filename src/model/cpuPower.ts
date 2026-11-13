// Chapter 4, CPU power: the night bench. A fictional die on a probe station: a
// tile is lit while its core executes, and the core's power is drawn as a trace
// along the bench edge. After the reader's turn the same pinned scene turns to
// day and the bench itself is written on, step by step, in ink. Every sentence
// was checked against its sources: the ACPI 6.6 text and the Linux and Microsoft
// pages named in its citations.

import { centred, type Box, type Transform } from "./layout";

// ---- The plate (pixels of bench-plate.webp, 2400 x 1500) ----
export const PLATE = { w: 2400, h: 1500 } as const;
export type TileId = "t0" | "t1" | "t2" | "t3" | "b0" | "b1" | "b2" | "b3";
/** Each tile's inner area, measured from its bright border ridge (the die is not a perfect grid). */
export const RECTS: Record<TileId, [number, number, number, number]> = {
  t0: [477, 345, 619, 556],
  t1: [631, 350, 771, 560],
  t2: [783, 353, 924, 566],
  t3: [936, 350, 1080, 563],
  b0: [469, 709, 610, 918],
  b1: [622, 704, 762, 922],
  b2: [774, 708, 914, 926],
  b3: [926, 712, 1070, 923],
};
export const TOP: TileId[] = ["t0", "t1", "t2", "t3"];
export const BOTTOM: TileId[] = ["b0", "b1", "b2", "b3"];
export const TOP_Y = 345;
export const BAND = { x0: 470, x1: 1080, y0: 566, y1: 700 } as const;
/** The trace along the bench edge, and its own window on narrow screens. */
export const LANE = { x0: 190, x1: 1440 } as const;
export const STRIP: Box = { x: -30, y: 1150, w: 1490, h: 330 };
/** The performance scale, on the chuck beside the die. */
export const SCALE = { x: 1236, y0: 330, y1: 920 } as const;
export const CLUSTER_LINE: Box = { x: 474, y: 328, w: 650, h: 270 };

export type FrameId = "full" | "die" | "phone" | "print" | "draw" | "card" | "all";
export const FRAMES: Record<FrameId, Box> = {
  full: { x: 150, y: 270, w: 1330, h: 1220 },
  die: { x: 400, y: 280, w: 920, h: 700 },
  phone: { x: 430, y: 300, w: 960, h: 650 },
  // By day: ink on the bench itself. The idle period on the mat under the scales, the levels on the die with
  // their combinations beside it, the two performance scales on the mat, then all of it.
  print: { x: 1340, y: 990, w: 1020, h: 300 },
  draw: { x: 130, y: 60, w: 2010, h: 1200 },
  card: { x: 1310, y: 200, w: 1080, h: 830 },
  all: { x: 40, y: 170, w: 2360, h: 1130 },
};
export const DAY_FRAMES: FrameId[] = ["print", "draw", "card", "all"];

/**
 * Frames a box of the plate in the figure area: the left 56 percent on wide
 * screens; on narrow ones the top part (night, with the trace strip under it)
 * or the whole view (day). On narrow screens a day step may pass the box of
 * the ink it adds, so that ink stays legible.
 */
export function fit(frame: FrameId, vw: number, vh: number, narrow: boolean, box?: Box | null): Transform {
  const day = DAY_FRAMES.includes(frame);
  const F = narrow && day && frame !== "all" && box ? box : FRAMES[narrow && !day ? "phone" : frame];
  const R = narrow
    ? { x: 0.03 * vw, y: 0.02 * vh, w: 0.94 * vw, h: (day ? 0.94 : 0.58) * vh }
    : { x: 0.03 * vw, y: 0.12 * vh, w: 0.56 * vw, h: 0.85 * vh };
  let s = Math.min(R.w / F.w, R.h / F.h, 1.1);
  if (!narrow) s = Math.max(s, (vw / PLATE.w) * 0.62);
  return { s, ...centred(F, R, s) };
}
/** SVG text never renders under 12 px: the factor that lifts a base size to that floor. */
export const textFloor = (basePx: number, nest: number, s: number) => Math.max(1, 12 / (basePx * nest * s));

// ---- Idle states: illustrative values in invented units, not the spec's figures ----
export type IdleId = "cg" | "ret" | "pd";
export type TileState = "run" | "c1" | "c2" | "c3" | IdleId;
export type Perf = "run" | "poll" | "p1" | "p2";
/** Relative power drawn in each state (the trace's height). */
export const POWER: Record<TileState | Perf, number> = {
  run: 1,
  poll: 0.9,
  c1: 0.62,
  c2: 0.45,
  c3: 0.3,
  cg: 0.55,
  ret: 0.3,
  pd: 0.08,
  p1: 0.78,
  p2: 0.56,
};
/** Worst-case wake latency and minimum residency (break-even). */
export const LAT: Record<IdleId, number> = { cg: 1, ret: 3, pd: 7 };
export const RES: Record<IdleId, number> = { cg: 1, ret: 4, pd: 10 };
export const IDLE_NAME: Record<IdleId | "poll", string> = {
  cg: "clock gate",
  ret: "retention",
  pd: "power down",
  poll: "keep running",
};
/** Deepest first. */
export const DEPTH: IdleId[] = ["pd", "ret", "cg"];
/** The other cores: steady, never followed. */
export const NEIGHBOURS: Partial<Record<TileId, TileState>> = { b0: "run", b1: "pd", b2: "run", b3: "ret" };

// ---- The trace -----------------------------------------------------------------
export type Seg = ["run", number, Perf?] | ["idle", IdleId, number, { est?: number }?];
export interface Idle {
  st: IdleId;
  t0: number;
  irq: number;
  up: number;
  gap: number;
  est?: number;
}
export interface Lane {
  span: number;
  pts: [number, number][];
  idles: Idle[];
  runs: { t0: number; t1: number; p: number; perf: Perf }[];
  X: (t: number) => number;
  Y: (p: number) => number;
  base: number;
}
/**
 * A lane of the trace: running segments at a performance level, idle periods
 * that drop once (never stepping through shallower states) and climb back over
 * the state's wake latency after the interrupt.
 */
export function lane(segs: Seg[], base = 1440, amp = 150, total?: number): Lane {
  const span = total ?? segs.reduce((a, s) => a + (s[0] === "run" ? s[1] : s[2] + LAT[s[1]]), 0);
  const X = (t: number) => LANE.x0 + (t / span) * (LANE.x1 - LANE.x0);
  const Y = (p: number) => base - p * amp;
  let t = 0;
  const pts: [number, number][] = [],
    idles: Idle[] = [],
    runs: Lane["runs"] = [];
  for (const s of segs) {
    if (s[0] === "run") {
      const perf = s[2] ?? "run",
        p = POWER[perf];
      pts.push([X(t), Y(p)], [X(t + s[1]), Y(p)]);
      runs.push({ t0: t, t1: t + s[1], p, perf });
      t += s[1];
    } else {
      const [, st, gap, o] = s,
        entry = Math.min(0.8, gap / 3),
        lat = LAT[st];
      pts.push([X(t + entry), Y(POWER[st])], [X(t + gap), Y(POWER[st])], [X(t + gap + lat), Y(1)]);
      idles.push({ st, t0: t, irq: t + gap, up: t + gap + lat, gap, est: o?.est });
      t += gap + lat;
    }
  }
  return { span, pts, idles, runs, X, Y, base };
}
export const pathOf = (pts: [number, number][]) =>
  "M " + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L ");

// ---- The night's steps ----------------------------------------------------------
export interface NightStep {
  id: string;
  rail: string;
  title: string;
  frame: FrameId;
  tiles: Partial<Record<TileId, TileState>>;
  /** The trace, if the step draws one, and which marks it shows. */
  lane?: { segs: Seg[]; marks: ("irq" | "hatch" | "est" | "res" | "shade" | "plevels" | "stria")[] };
  lanes?: boolean;
  cluster?: boolean;
  busMaster?: boolean;
  scale?: "pss" | "cppc";
  lead: string;
  rest: string;
  citations: string[];
  rule: string;
  ruleCitations: string[];
  note?: string;
}
export const NIGHT: NightStep[] = [
  {
    id: "c0",
    rail: "C0",
    title: "C0: a core at work",
    frame: "full",
    tiles: { t0: "run", t1: "run", t2: "cg", t3: "run" },
    lane: {
      segs: [
        ["run", 26],
        ["idle", "pd", 24],
        ["run", 50],
      ],
      marks: ["irq", "hatch"],
    },
    lead: "A core that is executing instructions is in C0. Its tile is lit and its trace runs high.",
    rest: "When it runs out of work it rests, then a wake comes and it climbs back. All of this happens while the system is working: every core idle in this chapter is still S0.",
    citations: ["acpiProcessorDefs", "acpiProcessor"],
    rule: "Processor idle states exist only inside the working state, G0. The system never sleeps here.",
    ruleCitations: ["acpiProcessorDefs", "acpiProcessor"],
    note: "Eight cores on a fictional die. The top four are followed, and core 0 is top left.",
  },
  {
    id: "states",
    rail: "Idle states",
    title: "C1, C2, C3: rest at different depths",
    frame: "die",
    busMaster: true,
    tiles: { t0: "c1", t1: "c2", t2: "c3", t3: "run" },
    lead: "C1 must be supported and its latency is low enough that the OS can ignore it. C2 and C3 are optional. In general a deeper state saves more power and takes longer to leave.",
    rest: "In C2 the core still snoops other agents' memory traffic. In C3 its caches keep their contents but stop snooping, so the OS keeps them coherent. With bus-master traffic the OS uses C2 instead.",
    citations: ["acpiProcessorDefs", "acpiProcessor", "acpiLpi"],
    rule: "A platform can also describe idle states with _LPI. An OS that supports it should prefer it, and the two are never mixed at run time. From here on, the spec's own example states for a core: clock gate, retention, power down.",
    ruleCitations: ["acpiLpi"],
    note: "Spec example _CST, four entries: C1 20 us and 1000 mW, C2 40 us and 750 mW, C3 60 us and 500 mW, and a second C3-type state at 100 us and 250 mW.",
  },
  {
    id: "pick",
    rail: "The pick",
    title: "One pick per idle period",
    frame: "full",
    tiles: { t0: "pd", t1: "run", t2: "cg", t3: "run" },
    lane: {
      segs: [
        ["run", 22],
        ["idle", "pd", 36, { est: 30 }],
        ["run", 42],
      ],
      marks: ["est"],
    },
    lead: "When a core runs out of work, the OS estimates how long it will stay idle and picks one state for that period.",
    rest: "The trace drops once, straight to the chosen depth. It does not step down through the shallower states on the way.",
    citations: ["acpiProcessorConcepts", "acpiLpi", "linuxCpuidle"],
    rule: "The OS picks the deepest state whose constraints all hold: its minimum residency fits the estimate, its wake latency fits the limit.",
    ruleCitations: ["acpiLpi", "linuxCpuidle"],
  },
  {
    id: "wake",
    rail: "Wake cost",
    title: "Leaving costs time",
    frame: "full",
    tiles: { t0: "run", t1: "run", t2: "cg", t3: "run" },
    lane: {
      segs: [
        ["run", 22],
        ["idle", "pd", 36, { est: 30 }],
        ["run", 42],
      ],
      marks: ["est", "irq", "hatch"],
    },
    lead: "An interrupt arrives and the core has to climb back before it can run again. The worst case of that climb is the state's wake latency.",
    rest: "The deeper the state, generally the longer the climb. The interrupt is never lost: the hardware must leave the idle state to present it, so the work waits.",
    citations: ["acpiProcessor", "acpiLpi", "linuxCpuidle"],
    rule: "Wake latency should be set conservatively: the OS relies on it to answer interrupts in time.",
    ruleCitations: ["acpiLpi"],
  },
  {
    id: "breakeven",
    rail: "Break-even",
    title: "Deeper only pays if it lasts",
    frame: "full",
    tiles: { t0: "run", t1: "run", t2: "cg", t3: "run" },
    lane: {
      segs: [
        ["run", 8],
        ["idle", "pd", 30, { est: 24 }],
        ["run", 12],
        ["idle", "pd", 5, { est: 24 }],
        ["run", 45],
      ],
      marks: ["est", "irq", "hatch", "res", "shade"],
    },
    lead: "Going down and coming back costs energy. A state saves only if the core stays in it longer than its minimum residency.",
    rest: "In the first gap the core stayed well past the mark: saved. In the second the interrupt came early, before the mark, so the deeper state lost.",
    citations: ["acpiLpi", "linuxCpuidle"],
    rule: "A wrong minimum residency only wastes energy. A wrong wake latency breaks the OS's promise to answer in time.",
    ruleCitations: ["acpiLpi"],
    note: "Grey: the part of the gap that only repays going down and coming back. Blue: the net saving.",
  },
  {
    id: "containers",
    rail: "Containers",
    title: "The last core out",
    frame: "full",
    lanes: true,
    cluster: true,
    tiles: { t0: "run", t1: "pd", t2: "pd", t3: "pd" },
    lead: "Cores can be grouped in a processor container, a cluster here, with idle states of its own. The cluster can rest only when every core in it is idle.",
    rest: "Its own state starts when the last core goes down, and ends before the first core can climb back: the wake latencies add, for example 50 + 20 = 70 us.",
    citations: ["acpiLpi", "acpiContainers"],
    rule: "Firmware describes the grouping as processor containers: processors grouped because they share something, such as a cache or a low power mode. The OS either asks for the cluster's state with the last core's request or lets each core vote and the platform decide.",
    ruleCitations: ["acpiLpi", "acpiContainers"],
    note: "Spec example: core 50 us plus cluster 20 us.",
  },
  {
    id: "pstates",
    rail: "P-states",
    title: "Running: how fast",
    frame: "full",
    scale: "pss",
    tiles: { t0: "run", t1: "run", t2: "cg", t3: "pd" },
    lane: {
      segs: [
        ["run", 30, "p1"],
        ["run", 34, "p2"],
        ["run", 36, "p1"],
      ],
      marks: ["plevels"],
    },
    lead: "Performance states exist only while a core runs, in C0. _PSS lists them from the highest performance, P0, down. Each has a frequency, a power and a transition latency.",
    rest: "_PPC tells the OS the best state it may use right now: here P1, because in the spec's example 650 MHz is available only when docked, and this system is on AC but not docked.",
    citations: ["acpiProcessorDefs", "acpiPerf"],
    rule: "A higher P number means less power and less performance. The OS may use the _PPC state or any lower-power one.",
    ruleCitations: ["acpiPerf"],
    note: "Spec example: P0 650 MHz, P1 600 MHz (on AC), P2 500 MHz.",
  },
  {
    id: "cppc",
    rail: "CPPC",
    title: "A scale with no units",
    frame: "full",
    scale: "cppc",
    tiles: { t0: "run", t1: "pd", t2: "pd", t3: "pd" },
    lane: { segs: [["run", 100]], marks: ["stria"] },
    lead: "With CPPC there is one abstract performance scale and no MHz. The OS asks for a level, and the platform turns it into hardware settings.",
    rest: "Highest may need the other cores idle and may not last. All cores together are expected to sustain Nominal. Guaranteed moves with known limits such as power and heat. Two counters show what was delivered, which can differ from what was asked.",
    citations: ["acpiCppc", "linuxCppc"],
    rule: "When _CPC is present it supersedes _PSS and _PPC. Optionally the platform picks levels itself, within the OS's minimum and maximum, steered by an energy performance preference from 0 (performance) to 0xFF (energy).",
    ruleCitations: ["acpiCppc"],
    note: "Frequencies, if shown at all, are for display only.",
  },
];

/** Step 6: four core lanes and the cluster lane; the cluster rests only over their overlap. */
export const CORE_LANES: Seg[][] = [
  [
    ["run", 10],
    ["idle", "pd", 60],
  ],
  [
    ["run", 22],
    ["idle", "pd", 78],
  ],
  [
    ["run", 34],
    ["idle", "pd", 66],
  ],
  [
    ["run", 46],
    ["idle", "pd", 54],
  ],
];
export const CLUSTER_LAT = 3;
/** When every core lane is idle at once (entry included): only then may the cluster rest. */
export function overlap(lanes: Seg[][] = CORE_LANES): [number, number] {
  let from = 0,
    to = Infinity;
  for (const segs of lanes) {
    let t = 0;
    for (const s of segs) {
      if (s[0] === "run") {
        t += s[1];
        continue;
      }
      from = Math.max(from, t + 1);
      to = Math.min(to, t + s[2]);
      t += s[2];
    }
  }
  // Core 0 is woken by the interrupt at 70, which ends the overlap for every lane.
  return [from, Math.min(to, 70)];
}
/** The containers step as drawn: every core is idle from ALL_IDLE_FROM to ALL_IDLE_TO on the trace's time axis. */
export const [ALL_IDLE_FROM, ALL_IDLE_TO] = overlap();

/** Step 8: the three cases, played once in order. */
export interface CppcCase {
  name: string;
  state: string;
  tiles: Partial<Record<TileId, TileState>>;
  want: number;
  got: number;
  guaranteed: number;
  level: Perf;
}
export const CPPC_MARKS: [string, number][] = [
  ["Highest", 0],
  ["Nominal", 0.3],
  ["Guaranteed", 0.42],
  ["Lowest nonlinear", 0.76],
  ["Lowest", 1],
];
export const CPPC_CASES: CppcCase[] = [
  {
    name: "Core 0 alone asks for Highest",
    state: "it may get there while the others are idle",
    tiles: { t0: "run", t1: "pd", t2: "pd", t3: "pd" },
    want: 0,
    got: 0.04,
    guaranteed: 0.42,
    level: "run",
  },
  {
    name: "All four run",
    state: "Nominal: what all are expected to sustain together",
    tiles: { t0: "run", t1: "run", t2: "run", t3: "run" },
    want: 0.3,
    got: 0.3,
    guaranteed: 0.42,
    level: "p1",
  },
  {
    name: "A known limit lowers Guaranteed",
    state: "delivered can fall below what was asked",
    tiles: { t0: "run", t1: "run", t2: "run", t3: "run" },
    want: 0.3,
    got: 0.62,
    guaranteed: 0.62,
    level: "p2",
  },
];

// ---- Your turn: "Night shift at the bench" ----------------------------------------
export interface Gap {
  est: number;
  gap: number;
  limit: number;
}
export const GAPS: Gap[] = [
  { est: 12, gap: 14, limit: 9 },
  { est: 12, gap: 3, limit: 9 },
  { est: 20, gap: 20, limit: 2 },
];
export type Pick = IdleId | "poll";
export const RUN_GAP = 8;
/** An unpicked gap is drawn with room for the deepest wake. */
export const PENDING = 7;
export const PLAY_SPAN = RUN_GAP * 4 + GAPS.reduce((a, g) => a + g.gap + PENDING, 0);
/** The OS's choice: the deepest state whose minimum residency fits the estimate and whose wake latency fits the limit. */
export const osPick = (g: Gap): Pick => DEPTH.find((s) => RES[s] <= g.est && LAT[s] <= g.limit) ?? "poll";
/** Where gap k starts, given the picks before it. */
export function gapStart(picks: (Pick | null)[], k: number): number {
  let t = RUN_GAP;
  for (let j = 0; j < k; j++) {
    const s = picks[j];
    t += GAPS[j].gap + (s && s !== "poll" ? LAT[s] : s ? 0 : PENDING) + RUN_GAP;
  }
  return t;
}
export interface Outcome {
  lost: boolean;
  late: boolean;
}
export function outcome(s: Pick, g: Gap): Outcome {
  if (s === "poll") return { lost: false, late: false };
  return { lost: g.gap < RES[s], late: LAT[s] > g.limit };
}
export function storyFor(picks: (Pick | null)[], k: number, short = false): string {
  const s = picks[k],
    g = GAPS[k];
  if (!s) return "";
  if (s === "poll") return `Idle ${k + 1}: kept running. No saving, no delay.`;
  const o = outcome(s, g);
  if (short)
    return `Idle ${k + 1}, ${IDLE_NAME[s]}: ${o.lost ? "lost, shorter than its minimum residency" : "energy saved"}${o.late ? `; late, wake ${LAT[s]} over the limit ${g.limit}, not lost` : ""}.`;
  const parts = [`Idle ${k + 1}: ${IDLE_NAME[s]}; it lasted ${g.gap} units.`];
  parts.push(
    o.lost
      ? "Shorter than its minimum residency: going down and coming back cost more than it saved."
      : "Past its minimum residency: energy saved.",
  );
  if (o.late)
    parts.push(
      `Its wake latency (${LAT[s]}) is over the limit (${g.limit}): the work resumed late, delayed but not lost.`,
    );
  return parts.join(" ");
}
export const question = (k: number) =>
  `Idle ${k + 1} of 3: estimate about ${GAPS[k].est} units, latency limit ${GAPS[k].limit} from the interrupt. Pick a depth for core 0.`;
export const YOUR_TURN = {
  rail: "Your turn",
  title: "Your turn: night shift at the bench",
  lead: "You are the OS for core 0. Three idle periods are coming.",
  rest: "For each one, read the estimate and the latency limit on the trace, then pick a depth beside the core. The real length shows after you pick.",
  hint: "Illustrative units, not the spec's figures and not to scale (minimum residency, wake latency): clock gate 1 and 1, retention 4 and 3, power down 10 and 7.",
  osDone:
    "The OS picked the deepest state whose minimum residency fits the estimate and whose wake latency fits the limit. Its second pick still lost: the estimate was wrong.",
  allDone: "All three idle periods are over. Compare with the OS's own picks.",
};
export const PLAY_CITATIONS = ["acpiLpi", "linuxCpuidle"];
export const PICKS: [Pick, string][] = [
  ["poll", "Keep running"],
  ["cg", "Clock gate"],
  ["ret", "Retention"],
  ["pd", "Power down"],
];

// ---- By day: ink on the bench itself (twelve steps) ------------------------------
export interface DayStep {
  rail: string;
  title: string;
  frame: FrameId;
  lead: string;
  rest: string;
  citations: string[];
}
export const DAY: DayStep[] = [
  {
    rail: "In ink",
    title: "One idle period, in ink.",
    frame: "print",
    lead: "The morning after, the night's first idle period written on the bench: the core ran, then dropped once to the state the OS picked for its estimate.",
    rest: "One state, picked once: no steps through the shallower ones.",
    citations: ["acpiProcessorConcepts", "acpiLpi", "linuxCpuidle"],
  },
  {
    rail: "Break-even",
    title: "Break-even, and the interrupt",
    frame: "print",
    lead: "Minimum residency is a break-even, and a wrong value only wastes energy.",
    rest: "The interrupt is never lost: the work waits.",
    citations: ["acpiProcessor", "acpiLpi"],
  },
  {
    rail: "Wake",
    title: "Wake latency, worst case",
    frame: "print",
    lead: "Wake latency is a worst case and should be set conservatively: the OS relies on it.",
    rest: "Residency and usage counters are optional.",
    citations: ["acpiLpi"],
  },
  {
    rail: "Core",
    title: "Core, cluster, system.",
    frame: "draw",
    lead: "A core, a cluster and the whole system each have local idle states.",
    rest: "In the spec's example a core's local states are clock gate, retention and power down.",
    citations: ["acpiLpi"],
  },
  {
    rail: "Cluster",
    title: "One request for every level",
    frame: "draw",
    lead: "The OS combines one state per level into a single request to the platform.",
    rest: "",
    citations: ["acpiLpi"],
  },
  {
    rail: "Combinations",
    title: "Only some combinations",
    frame: "draw",
    lead: "A level cannot rest deeper than the levels under it allow.",
    rest: "Some of the example's valid combinations: system, cluster and core.",
    citations: ["acpiLpi"],
  },
  {
    rail: "Firmware",
    title: "Described by firmware",
    frame: "draw",
    lead: "Firmware describes the hierarchy with processor container devices, grouping processors that share a resource, such as a cache, or a low power mode. It need not be symmetric.",
    rest: "Device dependencies for idle (_RDI) are read only at the single top container.",
    citations: ["acpiLpi", "acpiContainers"],
  },
  {
    rail: "_PSS",
    title: "Steps, then a scale.",
    frame: "card",
    lead: "_PSS lists performance states from the highest, P0, down.",
    rest: "The spec's example: 650, 600 and 500 MHz.",
    citations: ["acpiPerf"],
  },
  {
    rail: "_PPC",
    title: "_PPC caps the top",
    frame: "card",
    lead: "_PPC = 1: on AC but not docked, so P1 and below may be used.",
    rest: "",
    citations: ["acpiPerf"],
  },
  {
    rail: "_CPC",
    title: "One scale, no units",
    frame: "card",
    lead: "With CPPC the levels are abstract: Highest, Nominal, Guaranteed, Lowest nonlinear, Lowest.",
    rest: "Highest may need other cores idle. Nominal is what all are expected to sustain together. Guaranteed moves with known limits.",
    citations: ["acpiCppc"],
  },
  {
    rail: "Who chooses",
    title: "Who chooses",
    frame: "card",
    lead: "When _CPC is present it supersedes _PSS and _PPC. The OS asks for a desired level, or sets a minimum and maximum.",
    rest: "Optionally the platform chooses, steered by an energy performance preference from 0 to 0xFF.",
    citations: ["acpiCppc"],
  },
  {
    rail: "The bench",
    title: "The bench, by day",
    frame: "all",
    lead: "What the night showed, written on the bench itself: the levels on the die, the two performance scales beside it, and one idle period under them.",
    rest: "",
    citations: [],
  },
];
/**
 * Narrow screens by day: one stop per group of ink that reads in one frame, six stops for
 * the twelve steps. A stop holds the day steps `from` to `to` (0-based), is shown at `to` with only its own
 * ink, framed by `box` (plate coordinates, measured round that ink); its card holds every sentence of its steps.
 * The last stop is the overview: all the ink, in the "all" frame. Wide screens keep the twelve steps.
 */
export interface DayStop {
  rail: string;
  from: number;
  to: number;
  box: Box | null;
}
export const DAY_STOPS: DayStop[] = [
  { rail: "Idle period", from: 0, to: 2, box: { x: 1375, y: 1005, w: 950, h: 490 } },
  { rail: "Levels", from: 3, to: 4, box: { x: 389, y: 225, w: 766, h: 820 } },
  { rail: "Combinations", from: 5, to: 6, box: { x: 1375, y: 595, w: 720, h: 265 } },
  { rail: "_PSS", from: 7, to: 8, box: { x: 1365, y: 255, w: 450, h: 345 } },
  { rail: "_CPC", from: 9, to: 10, box: { x: 2050, y: 255, w: 400, h: 700 } },
  { rail: "The bench", from: 11, to: 11, box: null },
];
/** On narrow screens the idle period is drawn this many times taller, downwards (its box above allows for it). */
export const IDLE_STRETCH = 3;
/** The stop that holds a day step (0-based). */
export const dayStopOf = (d: number) => DAY_STOPS.findIndex((s) => d >= s.from && d <= s.to);

/** The example's valid combinations (ACPI 6.6 Table 8.5): system, cluster, core. */
export const COMBINATIONS: [string, string, string][] = [
  ["running", "running", "clock gate"],
  ["running", "clock gate", "power down"],
  ["running", "retention", "retention"],
  ["power down", "power down", "power down"],
];
/** Local depth order of the example states, shallow to deep; "running" is shallowest. */
const DEPTH_ORDER = ["running", "clock gate", "retention", "power down"];
/** A level may rest only as deep as the level under it (Table 8.5's rule for its example). */
export const validCombination = ([sys, cl, core]: [string, string, string]) =>
  DEPTH_ORDER.indexOf(sys) <= DEPTH_ORDER.indexOf(cl) && DEPTH_ORDER.indexOf(cl) <= DEPTH_ORDER.indexOf(core);
export const PSS_EXAMPLE: [string, string, string, string][] = [
  ["P0", "650 MHz", "21.5 W", "only when docked"],
  ["P1", "600 MHz", "14.9 W", "only on AC"],
  ["P2", "500 MHz", "8.2 W", "always"],
];
export const CPPC_LEVELS: [string, string, number][] = [
  ["Highest", "ideal conditions, may need other cores idle", 0],
  ["Nominal", "all cores together, sustained", 0.27],
  ["Guaranteed", "sustainable now under known limits, and it moves", 0.5],
  ["Lowest nonlinear", "below it: less power, may be less efficient", 0.76],
  ["Lowest", "the lowest level at all", 1],
];

export const STEP_COUNT = NIGHT.length + 1 + DAY.length;
export const LAST_NIGHT = NIGHT.length; // Your turn
export const DAY0 = LAST_NIGHT + 1;

export const CAVEAT =
  "An illustrative, fictional processor on a test bench, not a real product. Which idle and performance states exist, their latencies, and how cores are grouped vary by platform. Real wake times are microseconds, and the trace is drawn, not measured.";
export const MOON_WORD = "System: S0, working. Only the processor rests";
