// Chapter 2, Modern Standby: one night.
// The moon is the SoC-wide state; four halo rings are Microsoft's hardware
// layers in the order Windows powers them down ("Prepare hardware for modern
// standby"); the cloud veil is background tasks (condition 4 of
// "Transitioning between idle and active states"). Seven scroll steps, then
// the reader's turn. Every sentence is checked against the saved Microsoft
// Learn pages named in its citations. Each step declares the whole night.

/** Microsoft's five conditions for the SoC to enter DRIPS. */
export type ConditionId = "tasks" | "devices" | "network" | "hosts" | "cpu";

export interface Condition {
  id: ConditionId;
  /** Ring number (1 outermost), or null for the software veil. */
  n: number | null;
  /** Ring radius in the 1000-unit figure, or null for the veil. */
  r: number | null;
  name: string;
  /** Short name for the phone key. */
  short: string;
  /** Used inside a sentence. */
  say: string;
  /** The condition when met, in Microsoft's terms, briefly. */
  met: string;
  /** Why it keeps the SoC out of DRIPS when it is not met. */
  blocks: string;
}

export const CONDITIONS: Condition[] = [
  {
    id: "tasks",
    n: null,
    r: null,
    name: "Background tasks",
    short: "Tasks",
    say: "background tasks",
    met: "completed",
    blocks: "An app background task has not completed.",
  },
  {
    id: "devices",
    n: 1,
    r: 392,
    name: "Devices outside the SoC",
    short: "Devices",
    say: "devices outside the SoC",
    met: "powered down",
    blocks: "A device outside the SoC is still powered, so the SoC cannot power down.",
  },
  {
    id: "network",
    n: 2,
    r: 322,
    name: "Network and radio",
    short: "Network",
    say: "network and radio",
    met: "low power, listening",
    blocks:
      "A network or radio device has not yet entered its low-power state, where it waits for wake packets or wake interrupts.",
  },
  {
    id: "hosts",
    n: 3,
    r: 236,
    name: "Host controllers",
    short: "Host ctrl",
    say: "host controllers",
    met: "powered down",
    blocks:
      "A host controller on the SoC, such as USB, is still on. It can power down only after every device attached to it has.",
  },
  {
    id: "cpu",
    n: 4,
    r: 176,
    name: "CPU and GPU",
    short: "CPU/GPU",
    say: "the CPU and GPU",
    met: "idle",
    blocks: "The CPU or GPU is still active.",
  },
];
export const CONDITION_IDS = CONDITIONS.map((c) => c.id);
export const RINGS = CONDITIONS.filter((c) => c.r !== null);
export const CONDITION_CITATIONS = ["msIdleActive", "msPrepareHardware"];

/** What has to wait for a busy condition ("Prepare hardware"). */
export const WAITS_FOR: Partial<Record<ConditionId, ConditionId[]>> = { hosts: ["devices", "network"], cpu: ["tasks"] };

/** The figure's geometry, in 1000 units. */
export const FIGURE = { c: 500, moonR: 112, socR: 278 } as const;
/** The site legend's moon (src/model/moon.ts): screen off, and low-power idle. */
export const K_SCREEN_OFF = 0.72;
export const K_DRIPS = 0.3;

export type CondState = "awake" | "quieting" | "met" | "quiet" | "running" | "busy" | "waiting";

export interface StandbyStep {
  id: string;
  rail: string;
  title: string;
  lead: string;
  rest: string;
  rule: string;
  citations: string[];
  /** Every condition's state at this step. */
  states: Record<ConditionId, CondState>;
  /** How much the night deepens, 0 to about .5. */
  depth: number;
  /** A wake warms the horizon. */
  warm?: boolean;
  /** Words that replace a condition's default state word. */
  words?: Partial<Record<ConditionId, string>>;
  /** A note under the figure for this step, and the pages behind it. */
  note?: string;
  noteCitations?: string[];
  /** What the step points at: conditions, or the moon. */
  focus: (ConditionId | "moon")[];
}

const A: CondState = "awake";
const M: CondState = "met";
const ALL_MET: Record<ConditionId, CondState> = { tasks: M, devices: M, network: M, hosts: M, cpu: M };

export const STANDBY_STEPS: StandbyStep[] = [
  {
    id: "screen-off",
    rail: "Screen off",
    title: "Screen off, still S0",
    lead: "Closing the lid, pressing the power button or idling out starts Modern Standby, but the system stays in S0 while in standby.",
    rest: "Microsoft splits the session into two states: Screen Off, while the system is quieted, and Sleep, the long low-power stretch.",
    rule: "Screen off is not sleep. A Modern Standby session can pass between Screen Off and Sleep several times.",
    citations: ["msModernStandby", "msStandbyStates", "msStandbyVsS3"],
    states: { tasks: A, devices: A, network: A, hosts: A, cpu: A },
    depth: 0,
    focus: [],
  },
  {
    id: "software",
    rail: "Software",
    title: "Software goes quiet first",
    lead: "Apps and system software are prepared for low-power operation before any hardware is.",
    rest: "Desktop apps are paused, but background tasks from Microsoft Store apps may still do work.",
    rule: "Software first, then hardware: both must be ready for low-power operation.",
    citations: ["msModernStandby", "msStandbyVsS3", "msPrepareHardware"],
    states: { tasks: "quieting", devices: A, network: A, hosts: A, cpu: A },
    depth: 0.12,
    focus: ["tasks"],
  },
  {
    id: "devices",
    rail: "Devices",
    title: "Devices power down, outside in",
    lead: "Then the hardware and its drivers, in order: first the devices outside the SoC, then network and radio devices, then the host controllers on the SoC.",
    rest: "Devices outside the SoC should draw under a milliwatt, or nothing in D3cold. Network and radio devices are the exception: they keep power to listen for wake events.",
    rule: "A host controller can power down only after every device attached to it has.",
    citations: ["msPrepareHardware"],
    states: { tasks: "quieting", devices: M, network: M, hosts: M, cpu: A },
    depth: 0.28,
    focus: ["devices", "network", "hosts"],
  },
  {
    id: "gate",
    rail: "The gate",
    title: "Five conditions, then DRIPS",
    lead: "The SoC enters its deepest runtime idle platform state, DRIPS, only when all five conditions are met: every ring out, the sky clear.",
    rest: "In DRIPS no CPU code runs, the processors are powered off and memory is kept in self-refresh. The platform draws the least power it can during sleep.",
    rule: "If any one condition is not met, the SoC stays out of DRIPS. Almost all Modern Standby power problems come down to this.",
    citations: ["msIdleActive", "msPrepareHardware", "msStandbyVsS3"],
    states: ALL_MET,
    depth: 0.52,
    focus: ["moon"],
  },
  {
    id: "connected",
    rail: "Connected",
    title: "Staying connected",
    lead: "Since Windows 10 version 2004, on battery, Windows decides at the start of each sleep session whether the network stays connected, and keeps that choice for the session.",
    rest: "Remote Desktop, or an app whose background tasks need the network and may always run, keeps it connected: the network device waits in low power with wake patterns set.",
    rule: "Low power still comes from spending most of the time in DRIPS and very little in short bursts of activity.",
    citations: ["msNetworkConnectivity", "msModernStandby", "msIdleActive"],
    states: ALL_MET,
    depth: 0.52,
    focus: ["network"],
  },
  {
    id: "disconnected",
    rail: "Disconnected",
    title: "Disconnected standby",
    lead: "When no app needs the network, Windows prevents network activity during sleep.",
    rest: "The network is ready again on resume. Meanwhile a call over Wi-Fi cannot come in, but real-time events such as a reminder still can.",
    rule: "Disconnected does not mean deaf: the power button, the lid and input still wake the system.",
    citations: ["msNetworkConnectivity", "msStandbyVsS3", "msWakeSources"],
    states: { ...ALL_MET, network: "quiet" },
    depth: 0.52,
    focus: ["network"],
    words: { network: "no app traffic during sleep" },
    note: "Network activity is prevented during sleep. A network device that is not needed for wake goes to D3.",
    noteCitations: ["msNetworkConnectivity", "msPrepareHardware"],
  },
  {
    id: "wake",
    rail: "Wake",
    title: "Waking up, with or without the screen",
    lead: "Every wake source must wake the SoC from DRIPS, but only some turn the screen on.",
    rest: "The power button, the lid, input and plugging in power usually do. A timer or most network events wake it with the screen off, and Windows returns it to DRIPS as soon as it can. Power button to display: under a second.",
    rule: "Waking the SoC and turning on the screen are different events.",
    citations: ["msWakeSources", "msIdleActive", "msModernStandby"],
    states: { tasks: "running", devices: M, network: M, hosts: M, cpu: "running" },
    depth: 0.2,
    warm: true,
    focus: ["cpu", "moon"],
    note: "Shown: a brief wake with the screen off. A full resume lights every ring and the full moon.",
    noteCitations: ["msIdleActive", "msModernStandby"],
  },
];

/** The reader's turn: the eighth step. */
export const YOUR_TURN = {
  rail: "Your turn",
  title: "Your turn: find the blocker",
  lead: "It starts in DRIPS, every condition met.",
  kept: "Your choices are kept from before.",
  rest: "Make one condition busy and watch the night: what has to wait, and whether the SoC can stay in its deepest idle.",
};
export const STEP_COUNT = STANDBY_STEPS.length + 1;
export const BLOCKER_CITATIONS = ["msIdleActive", "msPrepareHardware"];

/** The SoC is in DRIPS only when every condition is met (a quiet network is met too). */
export function inDrips(states: Record<ConditionId, CondState>): boolean {
  return CONDITION_IDS.every((id) => states[id] === "met" || states[id] === "quiet");
}

const cap = (t: string) => t[0].toUpperCase() + t.slice(1);
const join = (xs: string[]) =>
  xs.length < 3 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

/** The reader's turn: every condition's state, the night, and the sentence. */
export function playState(busy: ReadonlySet<ConditionId>) {
  const states = {} as Record<ConditionId, CondState>;
  for (const c of CONDITIONS) {
    states[c.id] = busy.has(c.id) ? "busy" : (WAITS_FOR[c.id] ?? []).some((d) => busy.has(d)) ? "waiting" : "met";
  }
  const blockers = CONDITIONS.filter((c) => busy.has(c.id));
  const waiting = CONDITIONS.filter((c) => states[c.id] === "waiting");
  const open = blockers.length === 0;
  let rest: string;
  if (open) rest = "All five conditions are met: no CPU code runs, and memory waits in self-refresh.";
  else {
    rest =
      blockers.length === 1
        ? blockers[0].blocks
        : `${blockers.length} conditions are not met. Any one of them is enough.`;
    if (waiting.length)
      rest += ` Waiting on ${blockers.length > 1 ? "them" : "it"}: ${join(waiting.map((c) => c.say))}.`;
  }
  return {
    states,
    open,
    blockers,
    waiting,
    lead: open ? "The SoC can enter DRIPS." : "The SoC stays out of DRIPS.",
    rest: cap(rest),
    depth: open ? 0.52 : 0.3,
  };
}
