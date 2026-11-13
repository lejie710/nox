// The deep-idle scene: the laptop's night as data. The hypnogram (a stepped
// line of how awake the laptop is over the night). What each stop names on it
// is in story.ts. The shape is illustrative, not measured; the page says so.

/** Minutes since 22:30, the hypnogram's left edge. */
export type Minute = number;

export const NIGHT = { startLabel: "22:30", start: 22 * 60 + 30, end: 31 * 60 + 30 } as const; // 22:30 to 07:30

export function minuteOf(hhmm: string): Minute {
  const [h, m] = hhmm.split(":").map(Number);
  let t = h * 60 + m;
  if (t < NIGHT.start) t += 24 * 60;
  return t - NIGHT.start;
}

export const NIGHT_LENGTH: Minute = NIGHT.end - NIGHT.start;

/** Hypnogram levels: 0 in use, 1 awake with the screen off, 2 low-power idle. */
export type Level = 0 | 1 | 2;
export const LEVELS = ["In use", "Awake, screen off", "Low-power idle"] as const;
/** The legend state each level is drawn with: all three are S0. */
export const LEVEL_STATES = ["s0", "s0off", "s0ix"] as const;

/** Each segment starts at `from` and lasts until the next one. */
export const HYPNOGRAM: { from: Minute; level: Level }[] = [
  { from: minuteOf("22:30"), level: 0 },
  { from: minuteOf("22:47"), level: 1 }, // the lid closes (scene 1)
  { from: minuteOf("23:20"), level: 2 }, // DRIPS reached
  { from: minuteOf("03:36"), level: 1 }, // a brief wake, screen off
  { from: minuteOf("03:41"), level: 2 },
  { from: minuteOf("05:55"), level: 1 },
  { from: minuteOf("05:58"), level: 2 },
  { from: minuteOf("07:30"), level: 2 },
];

export function levelAt(t: Minute): Level {
  let level: Level = HYPNOGRAM[0].level;
  for (const s of HYPNOGRAM) if (s.from <= t) level = s.level;
  return level;
}
