// Chapter 1, the big picture: the state map stepper and the "what
// survives?" sandbox. Each step declares the figure's whole state.

import type { Look, PartId } from "./board";

export type Global = "G0" | "G1" | "G2" | "G3";

/**
 * The power readout's words, in order, and the bar length each one draws.
 * One word, one length: the bar is derived from the word, so they cannot
 * disagree. Ordinal only, not a measurement.
 */
export const POWER_LEVELS = {
  full: 4,
  low: 2.5,
  "very low": 1.5,
  minimal: 0.5,
  "none, except the clock": 0,
} as const;
export type PowerWord = keyof typeof POWER_LEVELS;

export interface StateStep {
  id: string;
  /** The chip highlighted on the map. */
  chip: string;
  global: Global;
  title: string;
  /** Under the chip on the map: two or three words. */
  short: string;
  /** Plain-language lead, set in ink. */
  lead: string;
  /** The rest of the paragraph, set in grey. */
  rest: string;
  /** One rule worth remembering, cited. */
  rule: string;
  citations: string[];
  /** How bright the whole board is, 0 to 1: lit while working, dark once it sleeps. */
  light: number;
  /** A short note under the rule (the step where a colour first appears names it). */
  note?: string;
  /**
   * The board's complete appearance and its magnified detail. The clock battery has power in every state,
   * mechanical off included, so it is lit in every state, as bright as any powered part.
   */
  looks: Record<PartId, Look>;
  focus: PartId;
  callout: string;
  /** Readouts under the map. */
  session: string;
  power: PowerWord;
  back: string;
}

export const STATE_STEPS: StateStep[] = [
  {
    id: "s0",
    light: 1,
    looks: { cpu: "on", memory: "holds", ssd: "on", wifi: "on", ec: "on", rtc: "on" },
    focus: "cpu",
    callout: "Running software.",
    short: "working",
    chip: "S0",
    global: "G0",
    title: "Working: S0",
    lead: "The machine is on and software runs.",
    rest: "Devices can still be in their own low-power states and the processor idles between tasks. To ACPI the system is working.",
    rule: "There is one working state, S0, and low-power idle is still S0. Every state outside G0 is a way of not working.",
    citations: ["acpiTerms", "msSystemPowerStates"],
    session: "the running system: processor, chipset and memory",
    power: "full",
    back: "already working",
  },
  {
    id: "s0ix",
    light: 0.5,
    looks: { cpu: "idle", memory: "holds", ssd: "low", wifi: "low", ec: "on", rtc: "on" },
    focus: "cpu",
    callout: "Idle as deep as it can go, still in S0.",
    short: "low-power idle",
    chip: "S0 idle",
    global: "G0",
    title: "Still S0: low-power idle",
    lead: "Modern Standby never leaves the working state.",
    rest: "With the screen off the platform idles as deeply as it can, but it is still S0, and it wakes significantly faster than S1 to S3. Chapter 2 opens it up.",
    rule: "S0 low-power idle is a mode of the working state, not a sleeping state.",
    citations: ["msSystemPowerStates", "msModernStandby"],
    session: "the running system: processor, chipset and memory",
    power: "very low",
    back: "faster than S1 to S3",
  },
  {
    id: "s1",
    light: 0.24,
    looks: { cpu: "low", memory: "holds", ssd: "off", wifi: "off", ec: "wake", rtc: "on" },
    focus: "cpu",
    callout: "Its context is kept by the hardware.",
    short: "lightest sleep",
    chip: "S1",
    global: "G1",
    title: "The lightest sleep: S1",
    lead: "No system context is lost: the hardware keeps everything the processor and chipset were holding.",
    rest: "Because nothing has to be rebuilt, ACPI calls S1 a low wake latency sleeping state.",
    rule: "Each deeper sleeping state keeps less context. S4, the deepest, takes longest to leave.",
    note: "The amber point marks a part kept powered so that it can wake the machine. Which parts those are varies by platform. The embedded controller is this picture's example.",
    citations: ["acpiTerms"],
    session: "processor, chipset and memory",
    power: "low",
    back: "short",
  },
  {
    id: "s2",
    light: 0.24,
    looks: { cpu: "off", memory: "holds", ssd: "off", wifi: "off", ec: "wake", rtc: "on" },
    focus: "cpu",
    callout: "Context lost: it restarts from reset.",
    short: "processor forgets",
    chip: "S2",
    global: "G1",
    title: "S2: the processor forgets",
    lead: "Like S1, except the processor and cache context is lost.",
    rest: "The operating system must save that context itself, and after the wake event the processor starts again from its reset vector, as if just powered on.",
    rule: "From S2 down, waking means the processor starts again from reset.",
    citations: ["acpiTerms"],
    session: "memory, and the OS saves processor state",
    power: "low",
    back: "short",
  },
  {
    id: "s3",
    light: 0.24,
    looks: { cpu: "off", memory: "holds", ssd: "off", wifi: "off", ec: "wake", rtc: "on" },
    focus: "memory",
    callout: "Kept refreshed: it holds the session.",
    short: "suspend to RAM",
    chip: "S3",
    global: "G1",
    title: "Suspend to RAM: S3",
    lead: "All system context is lost except system memory.",
    rest: 'Memory stays powered, keeping itself alive on a trickle of power, and it holds the whole session. Windows calls this sleep, and Linux calls it suspend-to-RAM, the "deep" variant.',
    rule: "Plain S3 keeps the session only in powered memory. Take the power away and the session goes with it.",
    citations: ["acpiTerms", "msSystemPowerStates", "linuxSleepStates"],
    session: "memory, powered",
    power: "very low",
    back: "short",
  },
  {
    id: "s4",
    light: 0.2,
    looks: { cpu: "off", memory: "off", ssd: "file", wifi: "off", ec: "wake", rtc: "on" },
    focus: "ssd",
    callout: "The session, in a file. It needs no power.",
    short: "hibernate",
    chip: "S4",
    global: "G1",
    title: "Hibernate: S4",
    lead: "The operating system writes the session to a file on non-volatile storage: a disk or SSD, which keeps data without power.",
    rest: "Then the platform powers off its devices. S4 is the lowest-power, longest-latency sleeping state. To resume, the saved memory is read back from the file.",
    rule: "Because S4 relies only on non-volatile storage, the session survives even if power is lost completely.",
    citations: ["acpiTerms", "msSystemPowerStates"],
    session: "a file on disk",
    power: "minimal",
    back: "a POST, then memory read back from disk",
  },
  {
    id: "s5",
    light: 0.18,
    looks: { cpu: "off", memory: "off", ssd: "off", wifi: "off", ec: "off", rtc: "on" },
    focus: "ssd",
    callout: "No hibernation file: nothing was saved.",
    short: "soft off",
    chip: "S5",
    global: "G2",
    title: "Soft off: S5",
    lead: "Like S4, except the operating system saves nothing.",
    rest: "The machine still draws a minimal amount of power, and coming back takes a complete boot. It is not safe to take it apart in this state.",
    rule: "Soft off still draws power. Only mechanical off draws none, apart from the real-time clock.",
    citations: ["acpiTerms", "msSystemPowerStates"],
    session: "nowhere",
    power: "minimal",
    back: "a complete boot",
  },
  {
    id: "g3",
    light: 0.14,
    looks: { cpu: "off", memory: "off", ssd: "off", wifi: "off", ec: "off", rtc: "on" },
    focus: "rtc",
    callout: "Only the clock runs, on its own battery.",
    short: "mechanical off",
    chip: "G3",
    global: "G3",
    title: "Mechanical off: G3",
    lead: "Entered and left by mechanical means, such as a switch that cuts the power, so that no current runs through the circuitry.",
    rest: "No hardware context is kept. Except for the real-time clock, which runs on its own battery, the machine draws no power, so this is the state in which it can be worked on safely.",
    rule: "G3 is the only state in which it is safe to open the machine.",
    citations: ["acpiTerms", "acpiHardware"],
    session: "nowhere",
    power: "none, except the clock",
    back: "a complete boot",
  },
];

/** The board's light in the reader's turn: the machine is not working in any of its three states. */
export const SANDBOX_LIGHT = 0.2;

/** The bar length for a step's power word. */
export function powerLevel(s: StateStep): number {
  return POWER_LEVELS[s.power];
}

/** The map's layout: each global state and the chips it holds. */
export const MAP: { global: Global; name: string; chips: string[] }[] = [
  { global: "G0", name: "Working", chips: ["S0", "S0 idle"] },
  { global: "G1", name: "Sleeping", chips: ["S1", "S2", "S3", "S4"] },
  { global: "G2", name: "Soft off", chips: ["S5"] },
  { global: "G3", name: "Mechanical off", chips: ["G3"] },
];

// The sandbox: put the laptop in a state, then something happens.
export type SandboxState = "s3" | "s4" | "s5";
export type SandboxEvent = "button" | "powerLost";

export interface Outcome {
  /** Did the session survive? */
  survives: boolean;
  /** Where the session was kept while the laptop was in the state. */
  keptIn: "memory" | "disk" | "nowhere";
  /** One line: what the reader sees next. */
  result: string;
  /** Why, in one sentence. */
  why: string;
  citations: string[];
}

export function outcome(state: SandboxState, event: SandboxEvent): Outcome {
  if (state === "s3") {
    return event === "button"
      ? {
          survives: true,
          keptIn: "memory",
          result: "Back where you left off, in moments.",
          why: "Memory was powered all along, so the session was waiting in it.",
          citations: ["acpiTerms", "msSystemPowerStates"],
        }
      : {
          survives: false,
          keptIn: "memory",
          result: "A complete boot. The session is gone.",
          why: "Plain S3 kept the session only in powered memory. With the power gone, so is the session. Windows hybrid sleep also writes a hibernation file to cover this case.",
          citations: ["acpiTerms", "msSystemPowerStates"],
        };
  }
  if (state === "s4") {
    return {
      survives: true,
      keptIn: "disk",
      result:
        event === "button"
          ? "The session is read back from the file, and you are back where you left off."
          : "Once power is back, the session is read back from the file.",
      why: "The session was on non-volatile storage, which needs no power to keep it.",
      citations: ["acpiTerms", "msSystemPowerStates"],
    };
  }
  return {
    survives: false,
    keptIn: "nowhere",
    result: "A complete boot, either way.",
    why: "Soft off saves no context, so there is nothing to come back to.",
    citations: ["acpiTerms"],
  };
}

/**
 * Visualise the storage that did or did not preserve the original session.
 * keptIn is historical: this is not a simulation of hardware after resume.
 * Other parts stay "not shown as powered", rather than inventing their state.
 */
export function sandboxLooks(state: SandboxState, event: SandboxEvent): Record<PartId, Look> {
  const o = outcome(state, event);
  return {
    cpu: "off",
    memory: o.survives && o.keptIn === "memory" ? "holds" : "off",
    wifi: "off",
    ssd: o.survives && o.keptIn === "disk" ? "file" : "off",
    ec: "off",
    rtc: "off",
  };
}

/** What the specification, Windows and Linux call each state (the "names" table). */
export const NAMES: { acpi: string; windows: string; linux: string }[] = [
  {
    acpi: "S0, low-power S0 idle",
    windows: "Sleep (Modern Standby)",
    linux: "suspend-to-idle (s2idle), the closest equivalent",
  },
  { acpi: "S1", windows: "Sleep (S1)", linux: "standby (shallow)" },
  { acpi: "S3", windows: "Sleep (S3)", linux: "suspend-to-RAM (deep)" },
  { acpi: "S4", windows: "Hibernate", linux: "hibernation (disk)" },
  { acpi: "S5", windows: "Soft off: a full shutdown", linux: "not a sleep state: a shutdown" },
];

/** Sources behind the names table. */
export const NAMES_CITATIONS = ["acpiTerms", "acpiTables", "msSystemPowerStates", "linuxSleepStates"];
