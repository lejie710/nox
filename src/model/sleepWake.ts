// Chapter 5, the sleep and wake sequence: one photograph of a desktop at night, one camera.
// Eight stops follow an S3 round trip, then the reader's turn. Every fact here was read from
// ACPI 6.6 and the Linux and Microsoft pages; wording that states one carries its sources.
//
// What the picture means (the chapter's devices, said in the caveat):
// - the light inside the case: white as photographed, the OS runs; amber, platform firmware
//   runs; none, no code runs. The power button's ring alone: power, no code yet.
// - points of light on parts: bits that are set (armed, enabled, latched, the waking vector).
// - moonlight and the time in the step line: the night passing. They follow the clock only.
// Text between backticks is an ACPI identifier and is set in the mono face.

import { toView, type SceneFit } from "./layout";

export const PLATE = { w: 2400, h: 1500 } as const;

/** Each light layer's crop box in plate px: where the lit plate differs from the unlit one. */
export const LAYER_BOX = {
  ring: [1079, 161, 109, 123],
  glowWhite: [0, 93, 2351, 1407],
  glowAmber: [0, 93, 2352, 1407],
  mon: [0, 92, 2232, 1408],
  moonEarly: [0, 90, 2283, 1410],
  moonLate: [0, 91, 2257, 1409],
} as const;

export type PartId = "light" | "pwr" | "mem" | "core" | "usb" | "net" | "rtc" | "mon";
export type MarkId = "usb" | "net" | "core" | "rtc" | "mem";
export const MARK_IDS: MarkId[] = ["usb", "net", "core", "rtc", "mem"];

/** A text position; "r" means the text is right-aligned and ends there. */
export type Spot = readonly [number, number] | readonly [number, number, "r"];
/**
 * Parts measured on the base plate. at: the dot on the part. wide and narrow: where the bare
 * label text starts, on dark pixels of the plate (the PSU shroud, the dark window, the floor).
 */
export const PARTS: Record<PartId, { at: readonly [number, number]; wide: Spot; narrow: Spot }> = {
  light: { at: [924, 192], wide: [1272, 262], narrow: [880, 26, "r"] },
  pwr: { at: [1134, 222], wide: [1272, 160], narrow: [968, 26] },
  mem: { at: [880, 705], wide: [1272, 455], narrow: [1010, 600] },
  core: { at: [816, 840], wide: [1262, 880], narrow: [640, 1095] },
  usb: { at: [382, 690], wide: [255, 1100], narrow: [215, 1095] },
  net: { at: [560, 812], wide: [420, 1222], narrow: [640, 1215] },
  rtc: { at: [644, 922], wide: [610, 1100], narrow: [215, 1215] },
  mon: { at: [1380, 722], wide: [1262, 880], narrow: [1530, 790, "r"] },
};
/** Where the status-bit buttons start on wide screens, and the shroud's right edge. */
export const SHROUD = { x: 228, y: 1108, right: 1185 } as const;
/** The plate x where the words start, and the floor line of the dawn plate. */
export const WORDS_X = 1700;
export const FLOOR_Y = 1068;

export type Glow = "white" | "amber" | null;
/** dim: armed. on: enabled or being written. ember: still set while no code runs. latch: a status bit hardware has set. */
export type MarkState = "dim" | "on" | "ember" | "latch";
/** scrub: early to late as the Asleep stop scrolls. */
export type Moon = "scrub" | "early" | "late" | null;

export interface Scene {
  /** The display. */
  mon: boolean;
  glow: Glow;
  /** The power button's ring; always lit while the glow is. */
  ring: boolean;
  moon: Moon;
  marks: Partial<Record<MarkId, MarkState>>;
  /** The hand-off: every light cuts instead of fading. */
  cut?: boolean;
}

export interface Label {
  part: PartId;
  name: string;
  state: string;
  /** The label that changed in this stop: its state word is set bright. */
  hot?: boolean;
}

export type Sys = "S0, working" | "entering S3" | "S3, sleeping" | "waking";

export interface SleepStep {
  id: string;
  rail: string;
  title: string;
  /** The lead is set in white, the rest in grey. */
  lead: string;
  rest: string;
  citations: string[];
  rule: string;
  ruleCitations: string[];
  note?: string;
  noteCitations?: string[];
  /** Height of the stop's scroll, in svh. */
  h: number;
  /** A fixed time, or "night": the clock runs from 23:14 to 03:12 as the stop scrolls. */
  time: string;
  sys: Sys;
  scene: Scene;
  labels: Label[];
  /** The second half of a stop that changes by scroll. */
  after?: { sys: Sys; scene: Scene; labels: Label[]; note: string };
}

const AML_NOTE = "armed · `_DSW` is AML";

export const SLEEP_STEPS: SleepStep[] = [
  {
    id: "sleep",
    rail: "Sleep",
    title: "Sleep, chosen in the OS",
    h: 85,
    time: "23:14",
    sys: "S0, working",
    lead: "Someone picks Sleep, and the operating system decides to take the machine to S3.",
    rest: "First it tells the firmware where it is going: it runs the firmware's `_TTS(3)` method, before any driver hears about it.",
    citations: ["acpiSleepMethods", "acpiSleeping"],
    rule: "A request is not an order: a power button or a closed lid only asks, and the OS chooses what happens.",
    ruleCitations: ["acpiFixedHardware", "acpiButtons"],
    note: "This desktop takes the S3 path. The laptop in the opening story used Modern Standby and stays in S0.",
    noteCitations: ["msSystemPowerStates"],
    scene: { mon: true, glow: "white", ring: true, moon: null, marks: {} },
    labels: [{ part: "light", name: "The machine's light", state: "on: the OS is running" }],
  },
  {
    id: "arm",
    rail: "Arming", // not "Arm": the page names no chip vendor, and the word alone reads as one
    title: "Choose the depth, arm the wakers",
    h: 85,
    time: "23:14",
    sys: "S0, working",
    lead: "The OS reads `_PRW` for every device allowed to wake the machine and picks the deepest sleep state they all allow.",
    rest: "It turns on the power they need and runs each one's `_DSW`, so the device arms itself.",
    citations: ["acpiSleeping", "acpiPowerResources"],
    rule: "The power button needs none of this: a fixed power button wakes the system from S1 to S5 whatever its enable bit says.",
    ruleCitations: ["acpiFixedHardware"],
    scene: { mon: true, glow: "white", ring: true, moon: null, marks: { usb: "dim", net: "dim" } },
    labels: [
      { part: "usb", name: "Keyboard, via USB", state: "armed" },
      { part: "net", name: "Network card", state: AML_NOTE },
      { part: "pwr", name: "Power button", state: "fixed: no arming needed" },
    ],
  },
  {
    id: "devices",
    rail: "Devices",
    title: "Devices go down, the OS still runs",
    h: 85,
    time: "23:14",
    sys: "S0, working",
    lead: "Drivers put their devices into low-power states and the screen goes dark, but the OS is still running.",
    rest: "Then it runs the firmware's `_PTS(3)`, which may come seconds before the final write.",
    citations: ["acpiSleepMethods", "acpiSleeping"],
    rule: "`_PTS` is not the moment of sleep, and it cannot change device configuration.",
    ruleCitations: ["acpiSleepMethods"],
    scene: { mon: false, glow: "white", ring: true, moon: null, marks: { usb: "dim", net: "dim" } },
    labels: [
      { part: "mon", name: "Display", state: "off, the OS is still running" },
      { part: "usb", name: "Keyboard, via USB", state: "armed" },
      { part: "net", name: "Network card", state: "armed" },
    ],
  },
  {
    id: "slpEn",
    rail: "SLP_EN",
    title: "One write hands over",
    h: 110,
    time: "23:14",
    sys: "S0, working",
    lead: "The OS leaves itself a way back, the waking vector in the FACS, then enables the wake events and makes one write: `SLP_TYPa` with `SLP_EN`.",
    rest: "That write gives the machine to the hardware.",
    citations: ["acpiSleepMethods", "acpiSleeping", "acpiFacs", "acpiFixedHardware"],
    rule: "The value written comes from the firmware's `\\_S3` object: a code the board maker chose, not the number 3.",
    ruleCitations: ["acpiSleepMethods", "acpiSleeping"],
    scene: {
      mon: false,
      glow: "white",
      ring: true,
      moon: null,
      marks: { usb: "on", net: "on", core: "on", mem: "on" },
    },
    labels: [
      { part: "mem", name: "Memory", state: "the waking vector, in the FACS" },
      { part: "core", name: "Core logic", state: "`SLP_TYPa` + `SLP_EN`: one write", hot: true },
      { part: "usb", name: "Keyboard, via USB", state: "event enabled" },
      { part: "net", name: "Network card", state: "event enabled" },
    ],
    after: {
      sys: "entering S3",
      note: "The write has landed: the machine's light is out.",
      scene: {
        mon: false,
        glow: null,
        ring: false,
        moon: null,
        cut: true,
        marks: { usb: "ember", net: "ember", mem: "ember" },
      },
      labels: [
        { part: "light", name: "The machine's light", state: "out: no code runs", hot: true },
        { part: "mem", name: "Memory", state: "holds the way back" },
        { part: "usb", name: "Keyboard, via USB", state: "can still wake it" },
        { part: "net", name: "Network card", state: "can still wake it" },
      ],
    },
  },
  {
    id: "asleep",
    rail: "Asleep",
    title: "S3: nothing runs",
    h: 130,
    time: "night",
    sys: "S3, sleeping",
    lead: "No instruction runs anywhere.",
    rest: "In the spec's example only memory, in self-refresh, and the real-time clock keep going. On Linux, devices set to wake the system are expected to keep power too.",
    citations: ["acpiSleeping", "linuxSuspendFlows"],
    rule: "While the system sleeps, the contents of the OS's memory may not be changed.",
    ruleCitations: ["acpiSleeping"],
    note: "Only the moonlight changes: hours pass.",
    scene: { mon: false, glow: null, ring: false, moon: "scrub", marks: { usb: "ember", net: "ember", mem: "ember" } },
    labels: [
      { part: "mem", name: "Memory", state: "in self-refresh, holds the way back" },
      { part: "usb", name: "Keyboard, via USB", state: "can still wake it" },
      { part: "net", name: "Network card", state: "can still wake it" },
    ],
  },
  {
    id: "button",
    rail: "Button",
    title: "A press, and no code yet",
    h: 85,
    time: "03:12",
    sys: "waking",
    lead: "Someone presses the power button. Hardware latches `PWRBTN_STS` and `WAK_STS` and brings the power back, before any instruction runs.",
    rest: "",
    citations: ["acpiFixedHardware", "acpiWaking"],
    rule: "A fixed power button raises no Notify. The OS finds the latched bit later and clears it by writing 1.",
    ruleCitations: ["acpiFixedHardware", "acpiButtons"],
    scene: {
      mon: false,
      glow: null,
      ring: true,
      moon: "late",
      marks: { usb: "ember", net: "ember", mem: "ember", core: "latch" },
    },
    labels: [
      { part: "pwr", name: "Power button", state: "pressed", hot: true },
      { part: "core", name: "Core logic", state: "`PWRBTN_STS`, `WAK_STS` latched", hot: true },
      { part: "mem", name: "Memory", state: "holds the way back" },
    ],
  },
  {
    id: "firmware",
    rail: "Firmware",
    title: "Firmware runs first",
    h: 85,
    time: "03:12",
    sys: "waking",
    lead: "The processor starts at its reset vector, in platform firmware.",
    rest: "Firmware restores the minimum, sets `SCI_EN`, leaves the status and enable bits alone, and jumps to the waking vector the OS left.",
    citations: ["acpiSleeping", "acpiFacs"],
    rule: "On the way back, firmware runs before the operating system does.",
    ruleCitations: ["acpiSleeping"],
    note: "Amber light: platform firmware is running.",
    scene: {
      mon: false,
      glow: "amber",
      ring: true,
      moon: "late",
      marks: { usb: "ember", net: "ember", mem: "on", core: "latch" },
    },
    labels: [
      { part: "light", name: "The machine's light", state: "amber: platform firmware", hot: true },
      { part: "mem", name: "Memory", state: "firmware jumps to the vector", hot: true },
      { part: "core", name: "Core logic", state: "status, enable bits: untouched" },
    ],
  },
  {
    id: "osBack",
    rail: "OS back",
    title: "The OS returns",
    h: 85,
    time: "03:12",
    sys: "S0, working",
    lead: "The OS restores its context and wakes the devices. The firmware's `_WAK(3)` runs alongside the drivers, not first.",
    rest: "The OS reads and clears `PWRBTN_STS`, and `_TTS(0)` comes last.",
    citations: ["acpiSleepMethods", "acpiSleeping", "acpiFixedHardware"],
    rule: "A person woke it, so the screen comes back. On Windows an automatic wake leaves the display off.",
    ruleCitations: ["msWakeEvents"],
    scene: { mon: true, glow: "white", ring: true, moon: "late", marks: { usb: "ember", net: "ember" } },
    labels: [
      { part: "light", name: "The machine's light", state: "white again: the OS is running" },
      { part: "mon", name: "Display", state: "back: a person woke it" },
    ],
  },
];

/** Eight stops and the reader's turn. */
export const STEP_COUNT = SLEEP_STEPS.length + 1;
export const TURN_H = 85;
/** The dawn's scroll span on wide screens, in svh. */
export const DAWN_H = 72;

/** What a stop shows at a point of its own scroll (0 to 1): its second half once past the middle. */
export function stepView(
  s: SleepStep,
  sub: number,
): { sys: Sys; scene: Scene; labels: Label[]; note?: string; after: boolean } {
  if (s.after && sub >= 0.5) return { ...s.after, after: true };
  return { sys: s.sys, scene: s.scene, labels: s.labels, note: s.note, after: false };
}
/** Where a stop rests when nothing scrolls (?static, reduced motion): the state it ends in. */
export const restSub = (s: SleepStep) => (s.after ? 0.7 : s.scene.moon === "scrub" ? 1 : 0.3);

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/** Moonlight follows the clock, never the machine: under the machine's own light it is only weaker. */
export function moonMix(scene: Scene, sub: number): { early: number; late: number } {
  const lit = scene.glow ? 0.6 : 1;
  if (scene.moon === "scrub") {
    const t = smooth(clamp01((sub - 0.3) / 0.4));
    return { early: (1 - t) * Math.min(1, sub / 0.12), late: t };
  }
  if (scene.moon === "early") return { early: lit, late: 0 };
  if (scene.moon === "late") return { early: 0, late: lit };
  return { early: 0, late: 0 };
}

/** The night's clock: 23:14 at the start of the Asleep stop, 03:12 at its end. */
export function clockAt(sub: number): string {
  const m = Math.round(23 * 60 + 14 + smooth(clamp01((sub - 0.1) / 0.75)) * 238) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
export const timeOf = (s: SleepStep, sub: number) => (s.time === "night" ? clockAt(sub) : s.time);
/** The time shown where nothing scrolls (the cards on narrow screens). */
export const timeRange = (s: SleepStep) => (s.time === "night" ? "23:14 to 03:12" : s.time);

// ---- Framing ---------------------------------------------------------------------------------

/**
 * Wide: the whole plate by the view's height, never wider than the room left of the words; the
 * picture and the words are centred as one group. Narrow: one fixed camera on the case and the
 * monitor (plate x 140 to 1540). One camera for the whole chapter: no stop reframes.
 */
export function fit(vw: number, vh: number, narrow: boolean): SceneFit {
  if (narrow) {
    const s = Math.min(vh / PLATE.h, vw / 1400);
    return { s, tx: vw / 2 - 840 * s, ty: (vh - PLATE.h * s) / 2, wordsLeft: 0, wordsWidth: vw };
  }
  const wordsWidth = Math.min(430, vw * 0.33);
  const s = Math.min(vh / PLATE.h, (vw - wordsWidth - 48) / WORDS_X);
  const tx = Math.max(0, (vw - (WORDS_X * s + wordsWidth)) / 2);
  return { s, tx, ty: (vh - PLATE.h * s) / 2, wordsLeft: tx + WORDS_X * s, wordsWidth };
}

/** Where a label's text starts. Narrow: the four places on the shroud keep a minimum pitch in screen px. */
export function labelSpot(
  part: PartId,
  f: SceneFit,
  narrow: boolean,
): { x: number; y: number; right: boolean; maxWidth?: number } {
  const p = PARTS[part],
    spot = narrow ? p.narrow : p.wide,
    right = spot[2] === "r";
  let [x, y] = toView(f, [spot[0], spot[1]]);
  if (!narrow) {
    // The shroud's two rows keep a minimum pitch in screen px: in Your turn these labels are 44 px buttons.
    const [ux, uy] = toView(f, [PARTS.usb.wide[0], PARTS.usb.wide[1]]);
    if (part === "rtc") x = Math.max(x, ux + 150);
    if (part === "net") y = Math.max(y, uy + 54);
    // A label in the room right of the case wraps before it reaches the words.
    return { x, y, right, maxWidth: spot[0] >= 1200 ? Math.floor((WORDS_X - spot[0]) * f.s - 14) : undefined };
  }
  const vw = f.wordsWidth; // on narrow screens the words take the view's whole width
  let maxWidth = right ? Math.floor(x - 8) : Math.floor(vw - x - 8);
  if (spot[1] >= 1000 && !right) {
    // The pitches are in screen px: a label keeps its text size however small the plate is drawn, and one that
    // wraps to three lines must still clear the row under it.
    const [bx, by] = toView(f, [215, 1095]),
      pitch = Math.max(425 * f.s, 120),
      left = spot[0] < 400;
    x = bx + (left ? 0 : pitch);
    // The second row never leaves the figure: on a very short view it stops 32 px above the foot, and the
    // first row moves up to keep the 46 px between them.
    const viewH = PLATE.h * f.s + 2 * f.ty,
      row2 = Math.min(by + Math.max(120 * f.s, 46), viewH - 32);
    y = spot[1] < 1150 ? Math.min(by, row2 - 46) : row2;
    maxWidth = left ? Math.floor(pitch - 10) : Math.floor(vw - x - 8);
  }
  // A narrow label wraps inside the screen and inside its own column.
  return { x, y, right, maxWidth };
}

// ---- Your turn: who woke it? -------------------------------------------------------------------

export type WakerId = "pwr" | "usb" | "net" | "rtc";
export type ArmId = "usb" | "net" | "rtc";
export const BITS: Record<WakerId, string> = {
  pwr: "PWRBTN_STS",
  rtc: "RTC_STS",
  net: "GPE: network",
  usb: "GPE: USB",
};
export const BIT_ORDER: WakerId[] = ["pwr", "rtc", "net", "usb"];
const WAKER_NAME: Record<WakerId, string> = {
  pwr: "the power button",
  usb: "the keyboard",
  net: "the network card",
  rtc: "the RTC alarm",
};

export interface Turn {
  phase: "arm" | "asleep" | "waking" | "find" | "done";
  armed: Record<ArmId, boolean>;
  /** The alarm went off with RTC_EN clear: RTC_STS latched, nothing woke. */
  decoy: boolean;
  waker: WakerId | null;
  /** The waking beat, 0 to 2: hardware, firmware, the OS. */
  beat: number;
  /** The reply to the reader's last action: a bold verdict, then the reason. */
  verdict: { lead: string; rest: string } | null;
}
export const initialTurn = (): Turn => ({
  phase: "arm",
  armed: { usb: true, net: false, rtc: false },
  decoy: false,
  waker: null,
  beat: 0,
  verdict: null,
});

export const TURN = {
  rail: "Your turn",
  title: "Your turn: who woke it?",
  citations: ["acpiFixedHardware", "acpiWaking", "acpiEvents"],
  rule: "Each wake event has a status bit that hardware latches and an enable bit the OS sets. Software clears a status bit by writing 1 to it. `WAK_STS` has no enable.",
  ruleCitations: ["acpiFixedHardware", "acpiEvents"],
  autoCitations: ["msWakeEvents"],
  beats: [
    "Hardware latches the event and brings the power back. No code yet.",
    "Platform firmware runs first, from the reset vector.",
    "The OS is back.",
  ],
  /** When each beat ends, in ms after the wake. */
  beatAt: [1400, 2800, 4400],
} as const;

export const toggleArm = (t: Turn, k: ArmId): Turn =>
  t.phase === "arm" ? { ...t, armed: { ...t.armed, [k]: !t.armed[k] } } : t;
export const sleepNow = (t: Turn): Turn => (t.phase === "arm" ? { ...t, phase: "asleep", verdict: null } : t);

/** An event while asleep. The fixed power button always wakes; the others only if armed. */
export function fire(t: Turn, k: WakerId): Turn {
  if (t.phase !== "asleep") return t;
  if (k === "pwr" || t.armed[k]) return { ...t, phase: "waking", waker: k, beat: 0, verdict: null };
  if (k === "rtc")
    return {
      ...t,
      decoy: true,
      verdict: { lead: "02:00 comes and goes.", rest: "`RTC_STS` latches, but `RTC_EN` is off, so nothing wakes." },
    };
  return {
    ...t,
    verdict: {
      lead: "Nothing happens.",
      rest: `${k === "usb" ? "The keyboard" : "The network card"} was not armed: its wake event is not enabled, so it cannot wake the machine.`,
    },
  };
}
/** The next waking beat, then the question. */
export function nextBeat(t: Turn): Turn {
  if (t.phase !== "waking") return t;
  return t.beat < 2 ? { ...t, beat: t.beat + 1 } : { ...t, phase: "find" };
}
/** Which status bits read as set once the machine is awake. */
export const bitSet = (t: Turn, k: WakerId) => k === t.waker || (k === "rtc" && t.decoy);
export function pick(t: Turn, k: WakerId): Turn {
  if (t.phase !== "find") return t;
  if (k === t.waker) {
    const why = k === "pwr" ? "; the fixed button wakes whatever its enable bit says" : ", and its enable was set";
    return {
      ...t,
      phase: "done",
      verdict: { lead: `Yes: ${BITS[k]}.`, rest: `Hardware latched it when ${WAKER_NAME[k]} raised its event${why}.` },
    };
  }
  if (k === "rtc" && t.decoy)
    return {
      ...t,
      verdict: {
        lead: "Set, but not the waker.",
        rest: "`RTC_STS` latched at 02:00, but `RTC_EN` was off, so the alarm could not wake the machine.",
      },
    };
  return { ...t, verdict: { lead: `${BITS[k]} is clear.`, rest: "Nothing latched there." } };
}
/** A person's wake brings the display back; an automatic one (network, alarm) leaves it dark (Windows). */
export const userWake = (t: Turn) => t.waker === "pwr" || t.waker === "usb";

export interface TurnLabel extends Label {
  /** The label is a button: what pressing it does. */
  act?: { kind: "arm"; id: ArmId } | { kind: "sleep" } | { kind: "fire"; id: WakerId };
  /** For a toggle: whether it is on. */
  pressed?: boolean;
}
export interface TurnView {
  sys: Sys;
  time: string;
  scene: Scene;
  lead: string;
  rest: string;
  leadCitations: string[];
  note: string;
  labels: TurnLabel[];
  /** The four status bits, once the machine is awake. */
  bits: { id: WakerId; name: string; set: boolean }[];
  /** The beats shown so far while waking. */
  beats: string[];
}

export function turnView(t: Turn): TurnView {
  const a = t.armed;
  const base = { rest: "", leadCitations: [] as string[], bits: [], beats: [], labels: [] as TurnLabel[] };
  if (t.phase === "arm") {
    return {
      ...base,
      sys: "S0, working",
      time: "23:40",
      lead: "The next night. You are the OS: choose what may wake the machine, then put it to sleep.",
      leadCitations: [...TURN.citations],
      note: "Tap the labels on the machine.",
      // The RTC has nothing to arm: only RTC_EN, which the OS sets at Sleep. No point of light for it yet.
      scene: {
        mon: true,
        glow: "white",
        ring: true,
        moon: null,
        marks: { ...(a.usb && { usb: "dim" as const }), ...(a.net && { net: "dim" as const }) },
      },
      labels: [
        // "Keyboard", not "Keyboard, via USB": as a button it must end left of the network card's leader.
        {
          part: "usb",
          name: "Keyboard",
          state: a.usb ? "armed" : "not armed",
          hot: a.usb,
          act: { kind: "arm", id: "usb" },
          pressed: a.usb,
        },
        {
          part: "net",
          name: "Network card",
          state: a.net ? "armed" : "not armed",
          hot: a.net,
          act: { kind: "arm", id: "net" },
          pressed: a.net,
        },
        {
          part: "rtc",
          name: "RTC alarm, 02:00",
          state: a.rtc ? "`RTC_EN` will be set" : "`RTC_EN` stays off",
          hot: a.rtc,
          act: { kind: "arm", id: "rtc" },
          pressed: a.rtc,
        },
        { part: "pwr", name: "Power button", state: "always wakes: nothing to arm" },
        { part: "mon", name: "Sleep", state: "put it to sleep", hot: true, act: { kind: "sleep" } },
      ],
    };
  }
  const embers: Scene["marks"] = {
    ...(a.usb && { usb: "ember" as const }),
    ...(a.net && { net: "ember" as const }),
    ...(a.rtc && { rtc: "ember" as const }),
    mem: "ember",
  };
  if (t.phase === "asleep") {
    return {
      ...base,
      sys: "S3, sleeping",
      time: t.decoy ? "02:00" : "23:41",
      lead: "It is asleep, and no code runs. Now try to wake it.",
      note: "Tap a label to send that event.",
      // A status bit latches in core logic, whoever raised the event; RTC_STS can latch there without waking anything.
      scene: {
        mon: false,
        glow: null,
        ring: false,
        moon: "early",
        marks: { ...embers, ...(t.decoy && { core: "dim" as const }) },
      },
      labels: [
        { part: "pwr", name: "Power button", state: "press it", hot: true, act: { kind: "fire", id: "pwr" } },
        { part: "usb", name: "Keyboard", state: "press a key", hot: true, act: { kind: "fire", id: "usb" } },
        {
          part: "net",
          name: "Network card",
          state: "a magic packet arrives",
          hot: true,
          act: { kind: "fire", id: "net" },
        },
        { part: "rtc", name: "RTC alarm", state: "let 02:00 arrive", hot: true, act: { kind: "fire", id: "rtc" } },
      ],
    };
  }
  const user = userWake(t);
  if (t.phase === "waking") {
    // The three beats repeat stops 6, 7 and 8 of the main line.
    const glow: Glow = ([null, "amber", "white"] as const)[t.beat];
    const marks: Scene["marks"] = { ...embers, core: "latch" };
    if (t.beat === 0 && t.waker && t.waker !== "pwr") marks[t.waker] = "on";
    if (t.beat === 1) marks.mem = "on";
    if (t.beat === 2) delete marks.mem;
    return {
      ...base,
      sys: t.beat < 2 ? "waking" : "S0, working",
      time: "",
      lead: TURN.beats[t.beat],
      note: "",
      beats: TURN.beats.slice(0, t.beat + 1),
      scene: { mon: t.beat === 2 && user, glow, ring: true, moon: "early", marks },
    };
  }
  const marks: Scene["marks"] = { ...embers, core: "latch" };
  delete marks.mem;
  return {
    ...base,
    sys: "S0, working",
    time: "",
    lead: user
      ? "It is awake. Which status bit says who woke it?"
      : "It is awake, and the screen stayed dark: on Windows an automatic wake leaves the display off. Which status bit says who woke it?",
    leadCitations: user ? [] : [...TURN.autoCitations],
    note: t.phase === "done" ? "" : "The OS reads these bits in core logic. Tap one.",
    scene: { mon: user, glow: "white", ring: true, moon: "early", marks },
    bits: BIT_ORDER.map((id) => ({ id, name: BITS[id], set: bitSet(t, id) })),
    beats: [...TURN.beats],
  };
}

/** Text between backticks, without the backticks, for speech and tests. */
export const plain = (s: string) => s.replace(/`/g, "");
