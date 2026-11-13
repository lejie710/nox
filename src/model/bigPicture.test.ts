// Chapter 1's model: every power state declares the whole board, the sandbox answers each case from the
// states' own facts, and every claim carries a source.
import { describe, expect, it } from "vitest";
import { BIG_PICTURE_SOURCES } from "../chapters/BigPicture";
import {
  MAP,
  NAMES,
  NAMES_CITATIONS,
  STATE_STEPS,
  outcome,
  powerLevel,
  sandboxLooks,
  type SandboxEvent,
  type SandboxState,
  SANDBOX_LIGHT,
} from "./bigPicture";
import { PART_IDS, type Look, LIT, MARK } from "./board";
import { SOURCES } from "./sources";

const STATES: SandboxState[] = ["s3", "s4", "s5"];
const EVENTS: SandboxEvent[] = ["button", "powerLost"];

describe("chapter 1: the state map", () => {
  it("has eight steps with unique ids, in map order", () => {
    expect(STATE_STEPS).toHaveLength(8);
    expect(new Set(STATE_STEPS.map((s) => s.id)).size).toBe(8);
    expect(STATE_STEPS.map((s) => s.chip)).toEqual(MAP.flatMap((g) => g.chips));
  });

  it("puts every step's chip under its own global state", () => {
    for (const s of STATE_STEPS) {
      const g = MAP.find((m) => m.chips.includes(s.chip));
      expect(g?.global, s.id).toBe(s.global);
    }
  });

  it("defines every board part and a valid magnified focus for every step", () => {
    const looks: Look[] = ["on", "idle", "low", "wake", "holds", "file", "off"];
    for (const step of STATE_STEPS) {
      expect(Object.keys(step.looks).sort(), step.id).toEqual([...PART_IDS].sort());
      for (const part of PART_IDS) expect(looks, `${step.id}.${part}`).toContain(step.looks[part]);
      expect(PART_IDS, step.id).toContain(step.focus);
      expect(step.callout.trim().length, step.id).toBeGreaterThan(0);
    }
  });

  it("shows the session in powered memory for S3 and an unpowered file for S4", () => {
    expect(STATE_STEPS.find((step) => step.id === "s3")!.looks.memory).toBe("holds");
    expect(STATE_STEPS.find((step) => step.id === "s4")!.looks).toMatchObject({ ssd: "file", memory: "off" });
  });

  it("lights the whole board only while working, and never brightens it again on the way down", () => {
    const light = STATE_STEPS.map((step) => step.light);
    expect(light[0]).toBe(1);
    for (let i = 1; i < light.length; i++) expect(light[i]).toBeLessThanOrEqual(light[i - 1]);
    // From the first sleeping state on, the board is dark enough for a lit part to stand out.
    for (const step of STATE_STEPS) if (step.global !== "G0") expect(step.light, step.id).toBeLessThan(0.3);
    expect(SANDBOX_LIGHT).toBeLessThan(0.3);
  });

  it("keeps the clock battery lit in every state: the real-time clock never stops", () => {
    for (const step of STATE_STEPS) expect(step.looks.rtc, step.id).toBe("on");
  });

  it("marks the session with one point of light wherever it is kept, and names amber where it first appears", () => {
    for (const step of STATE_STEPS) {
      const session = PART_IDS.filter((part) => MARK[step.looks[part]] === "session");
      expect(session.length, step.id).toBe(step.session === "nowhere" ? 0 : 1);
    }
    const firstWake = STATE_STEPS.find((step) => PART_IDS.some((part) => MARK[step.looks[part]] === "wake"))!;
    expect(firstWake.id).toBe("s1");
    expect(firstWake.note).toMatch(/amber point marks a part kept powered/);
    expect(STATE_STEPS.filter((step) => step.note).length).toBe(1);
  });

  it("lights a part that has power, leaves an unpowered one dark, and puts a point on a dark part that still matters", () => {
    expect(LIT.on).toBe(1);
    expect(LIT.holds).toBe(1);
    expect(LIT.off).toBe(0);
    expect(LIT.idle).toBeLessThan(LIT.on);
    expect(LIT.low).toBeLessThan(LIT.idle);
    // Dark with a point: kept for wake, or holding the session in a file without power.
    for (const look of ["wake", "file"] as const) {
      expect(LIT[look]).toBe(0);
      expect(MARK[look]).toBeDefined();
    }
    expect(MARK.off).toBeUndefined();
  });

  it("leaves only the clock on in G3", () => {
    const step = STATE_STEPS.find((state) => state.id === "g3")!;
    expect(PART_IDS.filter((part) => step.looks[part] !== "off")).toEqual(["rtc"]);
  });

  it("cites a real source for every step", () => {
    for (const s of STATE_STEPS) {
      expect(s.citations.length, s.id).toBeGreaterThan(0);
      for (const id of s.citations) expect(SOURCES[id], `${s.id} cites ${id}`).toBeDefined();
    }
  });

  it("fills every readout and keeps power in order from S1 down to G3", () => {
    for (const s of STATE_STEPS) {
      for (const k of ["title", "short", "lead", "rest", "rule", "session", "power", "back"] as const)
        expect(s[k].length, `${s.id}.${k}`).toBeGreaterThan(0);
      expect(powerLevel(s)).toBeGreaterThanOrEqual(0);
      expect(powerLevel(s)).toBeLessThanOrEqual(4);
    }
    const sleeping = ["s1", "s2", "s3", "s4", "s5", "g3"].map((id) =>
      powerLevel(STATE_STEPS.find((s) => s.id === id)!),
    );
    for (let i = 1; i < sleeping.length; i++) expect(sleeping[i]).toBeLessThanOrEqual(sleeping[i - 1]);
    expect(powerLevel(STATE_STEPS.find((s) => s.id === "g3")!)).toBe(0);
  });

  it("draws one bar length per power word, and gives S4 and S5 the same word", () => {
    for (const a of STATE_STEPS)
      for (const b of STATE_STEPS) if (a.power === b.power) expect(powerLevel(a)).toBe(powerLevel(b));
    const word = (id: string) => STATE_STEPS.find((s) => s.id === id)!.power;
    expect(word("s4")).toBe(word("s5"));
  });
});

describe("chapter 1: what survives?", () => {
  it.each([
    ["s3", "button", "holds", "off"],
    ["s3", "powerLost", "off", "off"],
    ["s4", "button", "off", "file"],
    ["s4", "powerLost", "off", "file"],
    ["s5", "button", "off", "off"],
    ["s5", "powerLost", "off", "off"],
  ] as const)("shows the original session storage for %s / %s", (state, event, memory, ssd) => {
    expect(sandboxLooks(state, event)).toEqual({ cpu: "off", memory, wifi: "off", ssd, ec: "off", rtc: "off" });
  });

  it("cites a real source for all six combinations", () => {
    for (const s of STATES)
      for (const e of EVENTS) {
        const o = outcome(s, e);
        expect(o.citations.length).toBeGreaterThan(0);
        for (const id of o.citations) expect(SOURCES[id], `${s}/${e} cites ${id}`).toBeDefined();
      }
  });

  it("S3 keeps the session in memory, so it survives the button but not losing all power", () => {
    expect(outcome("s3", "button")).toMatchObject({ survives: true, keptIn: "memory" });
    expect(outcome("s3", "powerLost")).toMatchObject({ survives: false, keptIn: "memory" });
  });

  it("S4 keeps the session on disk, so it survives either way", () => {
    for (const e of EVENTS) expect(outcome("s4", e)).toMatchObject({ survives: true, keptIn: "disk" });
  });

  it("S5 never keeps the session", () => {
    for (const e of EVENTS) expect(outcome("s5", e)).toMatchObject({ survives: false, keptIn: "nowhere" });
  });
});

describe("chapter 1: names and sources", () => {
  it("names each state in all three vocabularies", () => {
    for (const n of NAMES) for (const v of [n.acpi, n.windows, n.linux]) expect(v.length).toBeGreaterThan(0);
    for (const id of NAMES_CITATIONS) expect(SOURCES[id]).toBeDefined();
  });

  it("lists every cited source once, and only real ones", () => {
    expect(new Set(BIG_PICTURE_SOURCES).size).toBe(BIG_PICTURE_SOURCES.length);
    for (const id of BIG_PICTURE_SOURCES) expect(SOURCES[id], id).toBeDefined();
    for (const s of STATE_STEPS) for (const id of s.citations) expect(BIG_PICTURE_SOURCES).toContain(id);
  });

  it("names no chip vendor", () => {
    const text = JSON.stringify([STATE_STEPS, NAMES, STATES.flatMap((s) => EVENTS.map((e) => outcome(s, e)))]);
    expect(text).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
  });
});
