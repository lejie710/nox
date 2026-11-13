// The main page's story, "chapter 0": one laptop through one night, on the
// chapters' own grammar (one photograph, one camera, the words beside the
// picture), without the chapters' rail of chips: the step line says where
// the reader is. Each stop declares the figure's complete state,
// never a change from the stop before, so fast or backward scrolling always
// lands on a correct picture.

import type { SceneFit } from "./layout";
import { CHAPTERS } from "./chapters";
import { HYPNOGRAM, NIGHT_LENGTH, minuteOf, type Level, type Minute } from "./night";
import { sourceNumber } from "./sources";

/** The plates are one photograph from one camera, 2400 x 1500. */
export const PLATE = { w: 2400, h: 1500 } as const;
/** The laptop on the plate: its box with the lid open, in plate px. */
export const LAPTOP = { x0: 540, y0: 207, x1: 1860, y1: 1262 } as const;
/** The standby light on the closed laptop's front edge. */
export const LED: readonly [number, number] = [617, 1194];
/** The screen with the lid open, where the clock is set. */
export const SCREEN = { cx: 1200, cy: 500 } as const;
/** The night line's box: the room the open lid leaves above the closed laptop. */
export const LINE = { x0: 700, x1: 1840, y0: 330, y1: 800 } as const;
/** Scroll height of one stop, in svh (the chapters' value). */
export const STOP_H = 85;

/** Which photograph a stop shows. `awake` is the closed laptop with its light white and steady. */
export type PlateId = "open" | "half" | "closed" | "awake" | "dawn";

/** What a stop names on the night line: set bare at the moment it happens. */
export interface NightLabel {
  /** The point on the line the label's hairline ends at. */
  at: Minute;
  level: Level;
  /** Where the label's text starts, in plate px. */
  x: number;
  y: number;
  /** Name in white, then the state word in grey; a `warm` state word takes the site's one warm colour (still at work, or able to wake the laptop). */
  parts: { name: string; state: string; warm?: boolean }[];
}

export interface Stop {
  id: string;
  /** The clock above the title (the main page counts no steps), and on the laptop's screen while it is open. */
  time: string;
  /** The system state beside the clock: every stop of this night is S0. */
  state: string;
  title: string;
  /** The white sentence, then the grey ones. */
  lead: string;
  rest?: string;
  citations: string[];
  /** The short cream-ruled line under the text. */
  rule?: string;
  ruleCitations?: string[];
  plate: PlateId;
  /** How far the night line is drawn at this stop; null before the lid closes. */
  drawnTo: Minute | null;
  /** The stop's label on the line; it stays for the rest of the night. */
  label?: NightLabel;
}

/**
 * The opening's motion, as progress 0..1 through its pinned scroll span: the
 * closed laptop opens in side view and wakes (the standby light stops
 * breathing and holds steady), then shrinks so the open lid fits.
 */
export const HERO_MOTION = {
  spanVh: 150,
  openFrom: 0.1,
  openTo: 0.75,
  fitTo: 0.45,
  ledFrom: 0.3,
  ledTo: 0.45,
  textFrom: 0.25,
  textTo: 0.45,
  openMax: 105,
};

export const HEADER = {
  eyebrow: "Nox",
  title: "After dark.",
  lead: "What your laptop does while you sleep.",
};

export const CAVEAT = {
  text: "An illustrative laptop and an illustrative night, not any real product and not a measurement. This laptop uses Modern Standby. How often a laptop wakes depends on its settings and network.",
  citations: ["msModernStandby"],
};

export const STOPS: Stop[] = [
  {
    id: "evening",
    time: "22:47",
    state: "S0, in use",
    title: "Still in use.",
    lead: "The laptop is in S0, the working state.",
    rest: "This one uses Modern Standby. Watch what the working state turns into once the lid is shut.",
    citations: ["msModernStandby", "msSystemPowerStates"],
    plate: "open",
    drawnTo: null,
  },
  {
    id: "lid",
    time: "22:47",
    state: "S0, in use",
    title: "The lid closes.",
    lead: "On many laptops a lid sensor reports to the embedded controller, which raises an ACPI interrupt.",
    rest: "The operating system answers by running a method the firmware wrote, which reports that the lid device has changed. The lid then reads closed.",
    citations: ["acpiEc", "acpiLid"],
    rule: "One common path: lid sensor, embedded controller, ACPI interrupt (SCI), operating system.",
    ruleCitations: ["acpiEc"],
    plate: "half",
    drawnTo: null,
  },
  {
    id: "screen-off",
    time: "22:47",
    state: "S0, screen off",
    title: "The screen goes off. Still S0.",
    lead: "The screen goes off, but the system stays in S0, the working state. That is Modern Standby.",
    rest: "Many laptops used to sleep in S3: the processor stops and loses its context, while memory keeps its contents.",
    citations: ["msModernStandby", "msSystemPowerStates", "acpiSleep"],
    plate: "closed",
    drawnTo: minuteOf("22:47"),
  },
  {
    id: "cores",
    time: "22:52",
    state: "S0, screen off",
    title: "The cores rest.",
    lead: "The processor cores have nothing to do, so the operating system lets each rest in an idle state, as deep as it can.",
    rest: "The deeper a core rests, the less power it draws and the longer it takes to wake.",
    citations: ["linuxCpuidle"],
    plate: "closed",
    drawnTo: minuteOf("22:52"),
    label: { at: minuteOf("22:52"), level: 1, x: 900, y: 392, parts: [{ name: "Processor cores", state: "idle" }] },
  },
  {
    id: "devices",
    time: "23:05",
    state: "S0, screen off",
    title: "The devices drop to D3.",
    lead: "One by one the devices drop to D3, their lowest-power state. Some lose power entirely (D3cold).",
    rest: "Wi-Fi goes to D3 too, but keeps listening for a packet that should wake the laptop.",
    citations: ["msPrepareHardware", "msWifiPm", "msDeviceLowPower"],
    plate: "closed",
    drawnTo: minuteOf("23:05"),
    label: {
      at: minuteOf("23:05"),
      level: 1,
      x: 900,
      y: 470,
      parts: [
        { name: "Devices", state: "D3" },
        { name: "Wi-Fi", state: "listening", warm: true },
      ],
    },
  },
  {
    id: "drips",
    time: "23:20",
    state: "S0, low-power idle",
    title: "The deepest idle, still S0.",
    lead: "With the processor and devices idle, the chip reaches its lowest-power state. Windows calls this DRIPS.",
    rest: "Memory keeps its data in self-refresh, and a few parts stay ready to wake it.",
    citations: ["msPrepareHardware", "msSystemPowerStates"],
    plate: "closed",
    drawnTo: minuteOf("23:20"),
    label: { at: minuteOf("23:20"), level: 2, x: 900, y: 690, parts: [{ name: "DRIPS", state: "lowest-power idle" }] },
  },
  {
    id: "wake",
    time: "03:38",
    state: "S0, awake for a moment",
    title: "A packet arrives.",
    lead: "The laptop leaves its deepest idle for a moment, screen still off, does a short burst of work, and sinks back.",
    rest: "Something needed that packet. Still S0.",
    citations: ["msModernStandby", "msWifiPm"],
    plate: "awake",
    drawnTo: minuteOf("03:41"),
    label: {
      at: minuteOf("03:38"),
      level: 1,
      x: 1400,
      y: 470,
      parts: [{ name: "03:38", state: "a short burst of work", warm: true }],
    },
  },
  {
    id: "night",
    time: "06:50",
    state: "S0, low-power idle",
    title: "All of this night is S0.",
    lead: "Hours of deepest idle, broken by a few brief wakes.",
    rest: "And not once did it leave S0, the working state.",
    citations: ["msModernStandby", "msSystemPowerStates"],
    plate: "closed",
    drawnTo: NIGHT_LENGTH,
  },
  {
    id: "open",
    time: "07:30",
    state: "S0, leaving idle",
    title: "The lid opens.",
    lead: "Opening the lid wakes the chip from its deepest idle.",
    rest: "On many laptops the lid sensor tells the embedded controller, which raises an ACPI interrupt. The method the operating system then runs reports that the lid device has changed. The lid then reads open. The devices return to D0.",
    citations: ["acpiEc", "acpiLid", "msWakeSources", "msDeviceLowPower"],
    plate: "half",
    drawnTo: NIGHT_LENGTH,
  },
  {
    id: "ready",
    time: "07:30",
    state: "S0, in use",
    title: "Ready, without a restart.",
    lead: "This laptop never left S0, so nothing starts from the beginning.",
    rest: "From S3, the processor would first restart in firmware.",
    citations: ["msModernStandby", "acpiSleep"],
    plate: "dawn",
    drawnTo: NIGHT_LENGTH,
  },
];

export const STEP_COUNT = STOPS.length;

/** The labels on the line at stop `i`: every label of this stop and of the stops before it. */
export function labelsAt(i: number): NightLabel[] {
  return STOPS.slice(0, i + 1).flatMap((s) => (s.label ? [s.label] : []));
}

/** The line's three levels and its time axis, in plate px. */
export const LEVEL_Y = [370, 565, 760] as const;
export const lineX = (m: Minute): number => LINE.x0 + (m / NIGHT_LENGTH) * (LINE.x1 - LINE.x0);

/** The night line as a path, and the share of its length drawn by minute `m` (for a dash that draws it). */
export function linePath(): string {
  let d = "";
  HYPNOGRAM.forEach((s, k) => {
    d += k === 0 ? `M ${lineX(s.from)} ${LEVEL_Y[s.level]}` : ` H ${lineX(s.from)} V ${LEVEL_Y[s.level]}`;
  });
  return d + ` H ${lineX(NIGHT_LENGTH)}`;
}
export function drawnShare(m: Minute | null): number {
  if (m === null) return 0;
  let len = 0,
    total = 0;
  for (let k = 0; k < HYPNOGRAM.length; k++) {
    const s = HYPNOGRAM[k],
      end = k + 1 < HYPNOGRAM.length ? HYPNOGRAM[k + 1].from : NIGHT_LENGTH;
    if (k > 0) {
      const jump = Math.abs(LEVEL_Y[s.level] - LEVEL_Y[HYPNOGRAM[k - 1].level]);
      total += jump;
      if (m >= s.from) len += jump;
    }
    total += lineX(end) - lineX(s.from);
    len += Math.max(0, lineX(Math.min(m, end)) - lineX(s.from));
  }
  return len / total;
}

/**
 * Below this scale the line's labels would run into each other at their
 * on-screen size (a short wide window): the picture then keeps only the dots,
 * and the labels are the list in the words, as on narrow screens.
 */
export const TIGHT_BELOW = 0.5;

/** The night line shows only while the lid is shut. */
export function lineShown(i: number): boolean {
  const p = STOPS[i].plate;
  return STOPS[i].drawnTo !== null && (p === "closed" || p === "awake");
}

// ---- The camera: the plate fitted to the stage -----------------------------------------------------------

/** The part of the plate the camera keeps in view: the laptop with a margin, and the room above it for the line. */
export const FRAME = { x: 430, y: 150, w: 1500, h: 1150 } as const;

/**
 * The plate's scale and offset in a view of vw by vh. Wide: the frame fills
 * the room left of the words, and the picture and the words are centred as
 * one group. Narrow: the frame fills the view.
 */
export function fit(vw: number, vh: number, narrow: boolean): SceneFit {
  if (narrow) {
    const z = Math.min(vw / FRAME.w, vh / FRAME.h);
    return {
      s: z,
      tx: (vw - FRAME.w * z) / 2 - FRAME.x * z,
      ty: (vh - FRAME.h * z) / 2 - FRAME.y * z,
      wordsLeft: 0,
      wordsWidth: vw,
    };
  }
  const wordsWidth = Math.min(430, vw * 0.33),
    gap = 40,
    top = 24,
    pad = 16;
  const z = Math.min((vw - wordsWidth - gap - 2 * pad) / FRAME.w, (vh - top - pad) / FRAME.h, 1);
  const group = FRAME.w * z + gap + wordsWidth;
  const left = Math.max(pad, (vw - group) / 2);
  return {
    s: z,
    tx: left - FRAME.x * z,
    ty: top + (vh - top - pad - FRAME.h * z) / 2 - FRAME.y * z,
    wordsLeft: left + FRAME.w * z + gap,
    wordsWidth,
  };
}

// ---- Sources ---------------------------------------------------------------------------------------------

/** Every source the story and the topic map cite, in citation-number order: the closing's list. */
export function storySources(): string[] {
  const ids = new Set([
    ...CAVEAT.citations,
    ...STOPS.flatMap((s) => [...s.citations, ...(s.ruleCitations ?? [])]),
    ...CHAPTERS.flatMap((c) => c.citations),
  ]);
  return [...ids].sort((a, b) => sourceNumber(a) - sourceNumber(b));
}
