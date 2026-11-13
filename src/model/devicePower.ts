// Chapter 3, Device power: the flats at night. Each of four flats is a device
// on an example laptop; each floor's corridor light is a power resource; a lit
// door plate means the device is found on its bus; the bell wire is its wake
// path (_PRW). The moon stays at the site legend's Modern Standby phase for the
// whole chapter. Every sentence was checked against its sources: Microsoft
// Learn, the Linux kernel documentation and the ACPI 6.6 text.

import { centred, type Box, type Transform } from "./layout";

// ---- The plate and what sits on it (pixels of flats-plate.webp, 2880 x 1800,
// measured on the plate) -------------------------------------------
export const PLATE = { w: 2880, h: 1800 } as const;
export const DOORS: [number, number][] = [
  [220, 277],
  [441, 498],
  [665, 720],
  [884, 937],
  [1101, 1152],
  [1315, 1367],
];
export type LevelId = "L1" | "L2" | "L3";
export interface Level {
  n: number;
  top: number;
  door: number;
  par: number;
  tube: number;
}
export const LEVELS: Record<LevelId | "L4", Level> = {
  L4: { n: 4, top: 385, door: 468, par: 583, tube: 412 },
  L3: { n: 3, top: 665, door: 735, par: 849, tube: 690 },
  L2: { n: 2, top: 931, door: 987, par: 1094, tube: 948 },
  L1: { n: 1, top: 1176, door: 1219, par: 1331, tube: 1192 },
};
export const LIT_LEVELS: LevelId[] = ["L3", "L2", "L1"];
export const CORRIDOR = { x0: 184, x1: 1521 } as const;
export const TUBE_X = 1370;
export const SWITCH_X = 1494;
export const BELL = { x: 1532, y: 1530 } as const;
export const WIRE_X = 1536;

export function windowOf(level: LevelId | "L4", bay: number): Box {
  const L = LEVELS[level],
    d = DOORS[bay];
  return { x: d[1] + 17, y: L.door - 4, w: 105, h: L.par - (L.door - 4) };
}
export function doorOf(level: LevelId | "L4", bay: number): Box & { cx: number } {
  const L = LEVELS[level],
    d = DOORS[bay];
  return { x: d[0], y: L.door, w: d[1] - d[0], h: L.par - L.door, cx: (d[0] + d[1]) / 2 };
}
/** The bell wire from the gate's intercom up the stairwell to a door plate. */
export function wirePath(level: LevelId, bay: number): string {
  const L = LEVELS[level],
    d = doorOf(level, bay);
  // The run along the corridor stays above the tube, so a light's label dot sits on the tube alone.
  return `M ${BELL.x} ${BELL.y} H ${WIRE_X} V ${L.top + 8} H ${d.cx} V ${d.y + 13}`;
}

// ---- The cast and the example laptop's values ------------------------------
export type FlatId = "wifi" | "webcam" | "touchpad" | "ssd";
export interface Flat {
  id: FlatId;
  name: string;
  level: LevelId;
  bay: number;
  wake: boolean;
  s0w?: 3 | 4;
}
export const FLATS: Flat[] = [
  { id: "wifi", name: "Wi-Fi", level: "L3", bay: 1, wake: true, s0w: 4 },
  { id: "webcam", name: "Webcam", level: "L2", bay: 2, wake: false },
  { id: "touchpad", name: "Touchpad", level: "L2", bay: 3, wake: true, s0w: 3 },
  { id: "ssd", name: "NVMe SSD", level: "L1", bay: 4, wake: false },
];
export const FLAT_IDS = FLATS.map((f) => f.id);
export const flat = (id: FlatId) => FLATS.find((f) => f.id === id)!;
/** Other devices: windows with a steady glow, never followed. */
export const NEIGHBOURS: [LevelId | "L4", number][] = [
  ["L4", 0],
  ["L4", 4],
  ["L3", 4],
  ["L3", 5],
  ["L2", 0],
  ["L2", 5],
  ["L1", 0],
  ["L1", 2],
];
export const S0W_WORD = { 3: "D3hot", 4: "D3cold" } as const;
/** The site legend's Modern Standby phase (src/model/moon.ts), held all chapter. */
export const K_MOON = 0.3;

// ---- Device states ----------------------------------------------------------
export type DState = "D0" | "D2" | "D3hot" | "D3cold";
export interface FlatState {
  d: DState;
  armed: boolean;
}
export interface NightState {
  flats: Record<FlatId, FlatState>;
  on: Record<LevelId, boolean>;
}
export const isD3 = (d: DState) => d === "D3hot" || d === "D3cold";
export const found = (d: DState) => d !== "D3cold";
export const stateName = (d: DState) => (d === "D2" ? "D1 or D2" : d);
export function busWord(d: DState): string {
  if (d === "D3cold") return "not found on its bus";
  if (d === "D0") return "working";
  if (d === "D2") return "low power, keeps more context";
  return "found on its bus";
}

// ---- Frames: the part of the plate each step shows ------------------------
export type FrameId = "full" | "ssd" | "ssdWide" | "shared" | "wake";
export const FRAMES: Record<FrameId, Box> = {
  full: { x: 150, y: 330, w: 1560, h: 1400 },
  ssd: { x: 960, y: 1120, w: 560, h: 330 },
  ssdWide: { x: 860, y: 1120, w: 720, h: 330 },
  shared: { x: 430, y: 880, w: 1130, h: 320 },
  wake: { x: 400, y: 560, w: 1300, h: 1140 },
};
/**
 * Scale and offset that put a frame in the figure's region of the view:
 * the left 55% on wide screens (the words take the right), almost all of it
 * on narrow ones. Never enlarges the plate past about its own pixels, never
 * shows past its edges.
 */
export function fit(frame: FrameId, vw: number, vh: number, narrow: boolean): Transform {
  const F = FRAMES[frame];
  const R = narrow
    ? { x: 0.04 * vw, y: 0.06 * vh, w: 0.92 * vw, h: 0.9 * vh }
    : { x: 0.03 * vw, y: 0.13 * vh, w: 0.55 * vw, h: 0.83 * vh };
  let s = Math.min(R.w / F.w, R.h / F.h, 1.15);
  s = Math.max(s, vw / PLATE.w, vh / PLATE.h);
  let { tx, ty } = centred(F, R, s);
  tx = Math.min(0, Math.max(vw - PLATE.w * s, tx));
  ty = Math.min(0, Math.max(vh - PLATE.h * s, ty));
  return { s, tx, ty };
}

// ---- The steps -------------------------------------------------------------
export interface DeviceStep {
  id: string;
  rail: string;
  title: string;
  frame: FrameId;
  focus: FlatId[];
  flats: Record<FlatId, DState | [DState, boolean]>;
  on: Record<LevelId, boolean>;
  lead: string;
  rest: string;
  citations: string[];
  rule: string;
  ruleCitations: string[];
  note?: string;
  /** Step 4 and 5: a bus scan runs along this level. */
  scan?: LevelId;
  /** Step 6: the stairwell switch on this level keeps trying and springs back. */
  held?: LevelId;
  /** Step 7: this device's wake plays out. */
  wake?: FlatId;
}

const ON3 = { L3: true, L2: true, L1: true };
export const DEVICE_STEPS: DeviceStep[] = [
  {
    id: "own",
    rail: "Its own state",
    title: "Every device has its own power state",
    frame: "full",
    focus: ["wifi", "webcam", "touchpad", "ssd"],
    flats: { wifi: "D0", webcam: "D3hot", touchpad: "D0", ssd: "D0" },
    on: ON3,
    lead: "Each device has its own power state, from D0, fully on, to D3. The system can stay in S0 while devices go to D3.",
    rest: "A webcam nobody is using can sit in D3 with the screen on. Tonight this laptop is in Modern Standby, so the moon stays as it is for the whole chapter.",
    citations: ["acpiDevicePower", "msDeviceLowPower", "msDevicePowerStates"],
    rule: "Device states and the system state are separate but coordinated: a device can never be in a shallower state than its parent.",
    ruleCitations: ["acpiPowerResources"],
    note: "Four flats are four devices on this example laptop. The other lit windows are other devices, not followed here.",
  },
  {
    id: "d0",
    rail: "D0",
    title: "D0: fully on",
    frame: "ssd",
    focus: ["ssd"],
    flats: { wifi: "D0", webcam: "D3hot", touchpad: "D0", ssd: "D0" },
    on: ON3,
    lead: "D0 is the fully on state: the device works, and the power resources its _PR0 lists are on.",
    rest: "The lamp is on and the desk is set: the device's context, its settings and state, is in the device itself.",
    citations: ["acpiDevicePower", "acpiPowerResources"],
    rule: "The higher the state number, the less power it uses.",
    ruleCitations: ["msDevicePowerStates"],
  },
  {
    id: "d12",
    rail: "D1, D2",
    title: "D1 and D2: optional, in between",
    frame: "ssd",
    focus: ["ssd"],
    flats: { wifi: "D0", webcam: "D3hot", touchpad: "D0", ssd: "D2" },
    on: ON3,
    lead: "D1 and D2 are intermediate states. Many classes of device do not define them.",
    rest: "Where a class does, they use less power than D0 and keep more context than D3. Every device must define D3hot. D1, D2 and D3cold are optional.",
    citations: ["msDeviceLowPower", "msDevicePowerStates"],
    rule: "What D1 and D2 mean comes from each device class's own specification.",
    ruleCitations: ["acpiDevicePower", "msDeviceLowPower"],
    note: "Illustrative: the half-lit lamp stands for any intermediate state.",
  },
  {
    id: "d3hot",
    rail: "D3hot",
    title: "D3hot: off, but still found",
    frame: "ssdWide",
    focus: ["ssd"],
    scan: "L1",
    flats: { wifi: "D0", webcam: "D3hot", touchpad: "D0", ssd: "D3hot" },
    on: ON3,
    lead: "In D3hot the device is mostly off, on a trickle of current, but it keeps enough power to be found on its bus, and the bus stays in D0.",
    rest: "Its driver moves it there from D0, and the driver owns its context: it saves what it needs and restores it, or reinitialises the device, on the way back.",
    citations: ["acpiDevicePower", "msDeviceLowPower"],
    rule: "On Windows, D3hot is the only part of D3 a device enters directly from D0, and every device supports it.",
    ruleCitations: ["msDeviceLowPower", "msDevicePowerStates"],
  },
  {
    id: "d3cold",
    rail: "D3cold",
    title: "D3cold: power off, not found",
    frame: "ssdWide",
    focus: ["ssd"],
    scan: "L1",
    flats: { wifi: "D0", webcam: "D3hot", touchpad: "D0", ssd: "D3cold" },
    on: { L3: true, L2: true, L1: false },
    lead: "When the OS turns off the power resources the device still needed in D3hot, the ones its _PR3 lists, the device is in D3cold: main power gone, no longer found on its bus.",
    rest: "It is still physically connected. On Windows no driver action is needed for this step. The driver only opted in beforehand. All of its context is lost.",
    citations: ["acpiDevicePower", "acpiPowerResources", "msDeviceLowPower", "msD3cold"],
    rule: "On Windows, D3cold is entered only from D3hot, and a device leaves it only by going to D0.",
    ruleCitations: ["msDeviceLowPower"],
  },
  {
    id: "shared",
    rail: "Shared",
    title: "One light for the whole corridor",
    frame: "shared",
    focus: ["webcam", "touchpad"],
    held: "L2",
    flats: { wifi: "D0", webcam: "D3hot", touchpad: ["D3hot", true], ssd: "D3cold" },
    on: { L3: true, L2: true, L1: false },
    lead: "A power resource can feed several devices. The OS turns it off only when no device still needs it: the last one out turns off the light.",
    rest: "On this example laptop the webcam and the touchpad share one. The webcam is ready for D3cold, but the touchpad is armed to wake the system and can wake only from D3hot, so the light stays on and both stay in D3hot.",
    citations: ["acpiSetDevicePower", "acpiPowerResources", "msDeviceLowPower"],
    rule: "One device that still needs the power resource keeps every device on it out of D3cold.",
    ruleCitations: ["acpiPowerResources", "msDeviceLowPower"],
  },
  {
    id: "wake",
    rail: "Wake",
    title: "Wake: the bell rings",
    frame: "wake",
    focus: ["wifi"],
    wake: "wifi",
    flats: { wifi: ["D3cold", true], webcam: "D3hot", touchpad: ["D3hot", true], ssd: "D3cold" },
    on: { L3: false, L2: true, L1: false },
    lead: "To wake, a device is armed first: _PRW names its wake event and the power resources wake needs, and _DSW enables it. This Wi-Fi card can wake from D3cold (_S0W = 4), so its corridor is dark but its bell wire stays powered.",
    rest: "A packet arrives and the device signals. The OS is told the device woke, powers it back and its driver brings it to D0, then restores its context. From D3cold that takes the longest.",
    citations: ["acpiPowerResources", "msDeviceLowPower", "acpiNotify"],
    rule: "The system is already in S0, so no S-state change is needed: the device signals wake, and its driver brings it from D3cold back to D0.",
    ruleCitations: ["msDeviceLowPower"],
  },
];
export const YOUR_TURN = {
  rail: "Your turn",
  title: "Your turn: caretaker for the night",
  lead: "Every device is idle in D3hot and every light is on.",
  rest: "Turn lights off at the stairwell, arm or disarm wake by the doors, then send a packet and a touch to see which devices signal wake.",
  hint: "On this example laptop the touchpad can wake only from D3hot (_S0W = 3) and the Wi-Fi card from D3cold (_S0W = 4). The webcam and the SSD do not wake the system.",
};
export const PLAY_CITATIONS = ["acpiPowerResources", "msDeviceLowPower", "msD3coldDriver"];
export const STEP_COUNT = DEVICE_STEPS.length + 1;

/** The whole night a step declares. */
export function stepState(s: DeviceStep): NightState {
  const flats = {} as Record<FlatId, FlatState>;
  for (const id of FLAT_IDS) {
    const v = s.flats[id];
    flats[id] = Array.isArray(v) ? { d: v[0], armed: v[1] } : { d: v, armed: false };
  }
  return { flats, on: { ...s.on } };
}
/** The step 7 end: the Wi-Fi card back in D0 and its light on. */
export function wokenState(s: DeviceStep): NightState {
  const st = stepState(s);
  if (s.wake) {
    st.flats[s.wake] = { d: "D0", armed: true };
    st.on[flat(s.wake).level] = true;
  }
  return st;
}

// ---- Your turn: the caretaker's night ----------------------------------------
export interface Story {
  lead: string;
  rest: string;
}
export interface PlayResult {
  state: NightState;
  story: Story;
  refused?: LevelId;
}
const clone = (s: NightState): NightState => ({
  flats: Object.fromEntries(FLAT_IDS.map((id) => [id, { ...s.flats[id] }])) as Record<FlatId, FlatState>,
  on: { ...s.on },
});
const names = (list: Flat[]) => list.map((f) => f.name).join(" and ");
const onLevel = (lv: LevelId) => FLATS.filter((f) => f.level === lv);

export function initialPlay(): NightState {
  return {
    flats: Object.fromEntries(FLATS.map((f) => [f.id, { d: "D3hot", armed: f.wake }])) as Record<FlatId, FlatState>,
    on: { L3: true, L2: true, L1: true },
  };
}
/** A wake cut short settles the woken devices back in D3hot. */
export function settle(s: NightState): NightState {
  const t = clone(s);
  for (const id of FLAT_IDS) if (t.flats[id].d === "D0") t.flats[id].d = "D3hot";
  return t;
}
/** The device on a level that holds its light on: armed, and wakes only from D3hot. */
export function blocker(s: NightState, lv: LevelId): Flat | undefined {
  return onLevel(lv).find((f) => s.flats[f.id].armed && f.s0w === 3);
}
/** The default story is read from the states, so it never claims what is not drawn. */
export function defaultStory(s: NightState): Story {
  const off = LIT_LEVELS.filter((lv) => !s.on[lv]).length;
  const list = (d: DState) => FLATS.filter((f) => s.flats[f.id].d === d).map((f) => f.name);
  const parts: string[] = [];
  if (list("D0").length) parts.push(`In D0: ${list("D0").join(", ")}.`);
  if (list("D3cold").length) parts.push(`In D3cold, not found on their bus: ${list("D3cold").join(", ")}.`);
  if (list("D3hot").length) parts.push(`In D3hot, still found: ${list("D3hot").join(", ")}.`);
  return { lead: off ? `${off} of 3 lights off.` : "All three lights are on.", rest: parts.join(" ") };
}
/** A stairwell switch: off only when nothing on the light still needs it. */
export function lightSwitch(prev: NightState, lv: LevelId): PlayResult {
  const s = settle(prev),
    n = LEVELS[lv].n;
  if (s.on[lv]) {
    const b = blocker(s, lv);
    if (b)
      return {
        state: s,
        refused: lv,
        story: {
          lead: `The Level ${n} light stays on.`,
          rest: `${b.name}: armed for wake, can wake only from D3hot (_S0W = 3). Nothing on this light can go to D3cold.`,
        },
      };
    s.on[lv] = false;
    for (const f of onLevel(lv)) s.flats[f.id].d = "D3cold";
    const armed = onLevel(lv).filter((f) => s.flats[f.id].armed);
    return {
      state: s,
      story: {
        lead: `Level ${n} light off: _OFF ran.`,
        rest: `${names(onLevel(lv))} now in D3cold, not found on the bus.${armed.length ? ` ${armed[0].name} can still wake: its bell wire, a _PRW resource, stays on.` : ""}`,
      },
    };
  }
  s.on[lv] = true;
  for (const f of onLevel(lv)) s.flats[f.id].d = "D3hot";
  return {
    state: s,
    story: {
      lead: `Level ${n} light on again.`,
      rest: "Power returns. Each device comes back through D0 and its driver puts it back in D3hot, still idle.",
    },
  };
}
/** A bell switch by the door: arm or disarm wake (_DSW). */
export function bellSwitch(prev: NightState, id: FlatId): PlayResult {
  const s = settle(prev),
    f = flat(id),
    st = s.flats[id],
    n = LEVELS[f.level].n;
  st.armed = !st.armed;
  if (st.armed && !s.on[f.level] && f.s0w === 3) {
    // It can wake only from D3hot, so its light comes back on; the neighbour
    // on the same light gets a surprise wake-up as a side effect.
    s.on[f.level] = true;
    for (const x of onLevel(f.level)) s.flats[x.id].d = "D3hot";
    const other = onLevel(f.level).find((x) => x.id !== id);
    return {
      state: s,
      story: {
        lead: `${f.name} armed: the Level ${n} light comes back on.`,
        rest: `It can wake only from D3hot. Power returns, so the devices on this light come back through D0. The ${f.name.toLowerCase()}'s wake is set up with _DSW, and both drivers put their devices in D3hot.${other ? ` For the ${other.name.toLowerCase()} this was a surprise wake-up.` : ""}`,
      },
    };
  }
  if (st.d === "D3cold") {
    return {
      state: s,
      story: {
        lead: `${f.name} wake ${st.armed ? "armed" : "disarmed"}.`,
        rest: `_DSW runs before a device goes down, so the OS brought it up to D0, ${st.armed ? "enabled" : "disabled"} wake, and let it drop back to D3cold.${st.armed ? " Its bell wire (_PRW) stays powered." : ""}`,
      },
    };
  }
  return {
    state: s,
    story: {
      lead: `${f.name} wake ${st.armed ? "armed" : "disarmed"}.`,
      rest: st.armed
        ? "_DSW enabled it, and its bell wire (_PRW) is powered."
        : `It will not signal wake${f.s0w === 3 ? `, and no longer holds the Level ${n} light on` : ""}.`,
    },
  };
}
/** A packet and a touch arrive: every armed device signals wake and comes back to D0. */
export function wakeAll(prev: NightState, done: boolean): PlayResult & { armed: FlatId[]; fromCold: FlatId[] } {
  const s = settle(prev);
  const armed = FLATS.filter((f) => s.flats[f.id].armed);
  if (!armed.length)
    return {
      state: s,
      armed: [],
      fromCold: [],
      story: { lead: "No device signals wake.", rest: "No device is armed for wake." },
    };
  const fromCold = armed.filter((f) => s.flats[f.id].d === "D3cold");
  for (const f of armed) {
    s.on[f.level] = true;
    s.flats[f.id].d = done ? "D3hot" : "D0";
  }
  const many = armed.length > 1;
  const rest = `${many ? "They are" : "It is"} back in D0 and ${many ? "their" : "its"} context ${done ? "was" : "is being"} restored${fromCold.length ? `; ${names(fromCold)} came from D3cold, so that ${done ? "took" : "takes"} longest` : ""}. Devices not armed did not signal.`;
  return {
    state: s,
    armed: armed.map((f) => f.id),
    fromCold: fromCold.map((f) => f.id),
    story: {
      lead: `${names(armed)} signalled wake, and the OS brought ${many ? "them" : "it"} back.`,
      rest: done
        ? `${rest} Now idle, ${many ? "they are" : "it is"} back in D3hot.`
        : `${rest} In a moment the idle devices drop back to D3hot.`,
    },
  };
}

// ---- Tags on the figure (plate coordinates) ---------------------------------
/** A label: (x, y) is the dot on the part; a hairline of `lead` plate px runs from it to the bare text. */
export interface Tag {
  key: string;
  x: number;
  y: number;
  lead: number;
  align: "below" | "belowRight" | "aboveRight" | "left";
  name: string;
  state?: { word: string; rest?: string };
  note?: string;
  tone?: "awake" | "cold" | "";
  warn?: boolean;
}
/**
 * Where each label sits (the shared standard: a dot on the part, a hairline,
 * bare text in a quiet place). The quiet places are the parapets: a device's
 * text hangs on its own level's parapet, under its window (the webcam's ends
 * at its dot, so it never meets the touchpad's); a level light's text stands
 * on the parapet above its tube, where no device of that step is labelled.
 */
/** Plate px from a device's dot up from its parapet, and so the hairline's length: the text starts at the parapet's top edge. */
export const TAG_LEAD = 10;
/**
 * A label's text in screen px, as the stylesheet sets it (tied together by a test):
 * two lines on wide screens (name; state and note), one on narrow ones (name and state word).
 * The hairline is `lead` plate px but never shorter than `minLead`; `gap` separates it from the text.
 */
export const TAG_TEXT = { wide: 16.8 + 15.6, narrow: 14.4, minLead: 3, gap: 2 } as const;
export const tagLead = (lead: number, s: number) => Math.max(lead * s, TAG_TEXT.minLead);
export function tagsFor(
  state: NightState,
  step: number,
  narrow: boolean,
  extra?: { name: string; state: string },
): Tag[] {
  const compact = step === 0 || step === DEVICE_STEPS.length || narrow;
  const s = DEVICE_STEPS[step];
  const focus: FlatId[] = s ? s.focus : FLAT_IDS;
  const tags: Tag[] = [];
  for (const f of FLATS) {
    if (!focus.includes(f.id)) continue;
    const st = state.flats[f.id],
      L = LEVELS[f.level],
      w = windowOf(f.level, f.bay);
    const at =
      f.id === "webcam"
        ? { x: w.x + w.w - 16, y: L.par - TAG_LEAD, lead: TAG_LEAD, align: "belowRight" as const }
        : { x: w.x + 16, y: L.par - TAG_LEAD, lead: TAG_LEAD, align: "below" as const };
    const wake =
      f.wake && step >= 5 && step < DEVICE_STEPS.length
        ? st.armed
          ? `wake armed, _S0W = ${f.s0w} (${S0W_WORD[f.s0w!]})`
          : "wake not armed"
        : "";
    tags.push({
      key: f.id,
      ...at,
      name: f.name,
      state: { word: stateName(st.d), rest: compact ? "" : busWord(st.d) },
      note: compact ? "" : wake,
      tone: st.d === "D0" ? "awake" : st.d === "D3cold" ? "cold" : "",
    });
  }
  if (s && step !== 0) {
    for (const lv of [...new Set(s.focus.map((id) => flat(id).level))]) {
      const L = LEVELS[lv],
        on = state.on[lv];
      const users = onLevel(lv)
        .map((f) => f.name)
        .join(" and ");
      const held = s.held === lv;
      tags.push({
        key: `light-${lv}`,
        x: TUBE_X + 50,
        y: L.tube,
        lead: L.tube - L.top + 5,
        align: "aboveRight",
        name: narrow ? `Level ${L.n} light` : `Level ${L.n} light: a power resource`,
        state: { word: on ? "on" : "off", rest: narrow ? "" : on ? "_STA = 1" : "_OFF ran, _STA = 0" },
        note: narrow ? "" : held ? "held on: the touchpad wakes only from D3hot (_S0W = 3)" : `used by ${users}`,
        warn: held,
        tone: on ? "" : "cold",
      });
    }
  }
  if (extra)
    tags.push({
      key: "wake",
      x: BELL.x,
      y: BELL.y,
      lead: 40,
      align: "left",
      name: extra.name,
      state: { word: extra.state },
    });
  return tags;
}

// ---- The reference drawing: one ink drawing of the same bay,
// used four times; pixels of bay-drawing.webp, 1680 x 1340 ------------------
export const BAY = {
  image: { w: 1680, h: 1340 },
  crop: { x: 105, y: 352, w: 990, h: 660 },
  plate: { x: 304, y: 627, w: 53, h: 17 },
  window: { x: 484, y: 574, w: 369, h: 368 },
  deskY: 850,
  tube: { x: 420, y: 441, w: 256, h: 29 },
  corridor: { x: 112, y: 405, w: 831, h: 548 },
  bars: [
    [515, 523],
    [551, 561],
    [584, 594],
    [618, 628],
    [650, 670],
    [684, 692],
    [718, 728],
    [750, 762],
    [782, 794],
    [815, 825],
  ] as [number, number][],
  midRail: { y: 752, h: 11 },
} as const;
export interface BayPanel {
  id: string;
  line1: string;
  line2: string;
  short1: string;
  short2: string;
  lamp: number;
  things: boolean;
  box: boolean;
  plate: "lit" | "dark";
  corridor: "on" | "off";
  wire: "idle" | "lit";
  dashed?: boolean;
}
export const BAY_PANELS: BayPanel[] = [
  {
    id: "d0",
    line1: "D0 · fully on",
    line2: "lamp on, desk set",
    short1: "D0 · fully on",
    short2: "lamp on",
    lamp: 1,
    things: true,
    box: false,
    plate: "lit",
    corridor: "on",
    wire: "idle",
  },
  {
    id: "d12",
    line1: "D1, D2 · optional",
    line2: "defined per device class",
    short1: "D1, D2",
    short2: "optional",
    lamp: 0.5,
    things: true,
    box: false,
    plate: "lit",
    corridor: "on",
    wire: "idle",
    dashed: true,
  },
  {
    id: "hot",
    line1: "D3hot · plate lit: found",
    line2: "context in the driver's box",
    short1: "D3hot · found",
    short2: "things boxed",
    lamp: 0,
    things: false,
    box: true,
    plate: "lit",
    corridor: "on",
    wire: "idle",
  },
  {
    id: "cold",
    line1: "D3cold · plate dark: not found",
    line2: "optional · wire lit if armed",
    short1: "D3cold · not found",
    short2: "optional",
    lamp: 0,
    things: false,
    box: true,
    plate: "dark",
    corridor: "off",
    wire: "lit",
  },
];
export const BAY_DESCRIPTION =
  "Four drawings of one flat. D0: lamp on, desk set, door plate lit, corridor light on. D1 and D2: optional, defined per device class, lamp half on. D3hot: the desk's things packed in the driver's box, door plate still lit, so the device is found on its bus, corridor light on. D3cold: corridor light off and door plate dark, so it is not found. Its bell wire stays lit only if it is armed for wake. A driver moves a device from D0 to D3hot. The OS may then move it from D3hot to D3cold, if the device supports and allows it, by turning off its _PR3 power resources. Every way back goes to D0. From D3cold the device is reinitialised, which takes longest.";
