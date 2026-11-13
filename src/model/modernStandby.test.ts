// Chapter 2's model: each step declares the whole night, the halo's rings follow the order Windows powers
// layers down, and the reader's turn finds the blocker.
import { describe, expect, it } from "vitest";
import { MODERN_STANDBY_SOURCES } from "../chapters/ModernStandby";
import {
  CONDITIONS,
  CONDITION_IDS,
  FIGURE,
  RINGS,
  STANDBY_STEPS,
  STEP_COUNT,
  WAITS_FOR,
  inDrips,
  playState,
  type ConditionId,
} from "./modernStandby";
import { legendItem } from "./moon";
import { SOURCES } from "./sources";

describe("chapter 2: the night's seven steps and the reader's turn", () => {
  it("has seven told steps plus the reader's turn, with unique ids and rail labels", () => {
    expect(STANDBY_STEPS).toHaveLength(7);
    expect(STEP_COUNT).toBe(8);
    expect(new Set(STANDBY_STEPS.map((s) => s.id)).size).toBe(7);
    expect(new Set(STANDBY_STEPS.map((s) => s.rail)).size).toBe(7);
  });

  it("gives every step a state for all five conditions, words and real citations", () => {
    for (const s of STANDBY_STEPS) {
      expect(Object.keys(s.states).sort(), s.id).toEqual([...CONDITION_IDS].sort());
      for (const text of [s.title, s.lead, s.rest, s.rule]) expect(text.trim().length, s.id).toBeGreaterThan(0);
      expect(s.citations.length, s.id).toBeGreaterThan(0);
      for (const id of s.citations) expect(SOURCES[id], `${s.id} cites ${id}`).toBeDefined();
    }
  });

  it("reaches DRIPS exactly at the gate, connected and disconnected steps", () => {
    expect(STANDBY_STEPS.map((s) => inDrips(s.states))).toEqual([false, false, false, true, true, true, false]);
  });

  it("deepens the night as the platform powers down, deepest in DRIPS", () => {
    const depths = STANDBY_STEPS.map((s) => s.depth);
    expect(depths.slice(0, 4)).toEqual([...depths.slice(0, 4)].sort((a, b) => a - b));
    for (const s of STANDBY_STEPS) if (inDrips(s.states)) expect(s.depth, s.id).toBe(Math.max(...depths));
    expect(STANDBY_STEPS.find((s) => s.id === "wake")!.warm).toBe(true);
  });

  it("thins the cloud veil (software) before any hardware powers down", () => {
    const software = STANDBY_STEPS.find((s) => s.id === "software")!;
    expect(software.states.tasks).toBe("quieting");
    for (const c of RINGS) expect(software.states[c.id], c.id).toBe("awake");
  });
});

describe("chapter 2: the halo", () => {
  it("draws the four hardware layers outside in, all inside the figure and outside the moon", () => {
    expect(RINGS.map((c) => c.id)).toEqual(["devices", "network", "hosts", "cpu"]);
    const radii = RINGS.map((c) => c.r!);
    expect(radii).toEqual([...radii].sort((a, b) => b - a));
    for (const r of radii) {
      expect(r).toBeGreaterThan(FIGURE.moonR);
      expect(r).toBeLessThan(FIGURE.c);
    }
  });

  it("puts host controllers and CPU and GPU inside the SoC boundary, the rest outside", () => {
    for (const c of RINGS) {
      const inside = c.r! < FIGURE.socR;
      expect(inside, c.id).toBe(c.id === "hosts" || c.id === "cpu");
    }
  });

  it("uses the site legend's moon: screen off and low-power idle, never a new moon", async () => {
    const { K_SCREEN_OFF, K_DRIPS } = await import("./modernStandby");
    expect(K_SCREEN_OFF).toBe(legendItem("s0off").k);
    expect(K_DRIPS).toBe(legendItem("s0ix").k);
  });
});

describe("chapter 2: your turn, find the blocker", () => {
  it("starts in DRIPS with every condition met", () => {
    const p = playState(new Set());
    expect(p.open).toBe(true);
    expect(p.lead).toBe("The SoC can enter DRIPS.");
    for (const id of CONDITION_IDS) expect(p.states[id], id).toBe("met");
  });

  it("keeps the SoC out of DRIPS for any one busy condition, and lightens the night", () => {
    for (const id of CONDITION_IDS) {
      const p = playState(new Set<ConditionId>([id]));
      expect(p.open, id).toBe(false);
      expect(p.states[id], id).toBe("busy");
      expect(p.rest, id).toContain(CONDITIONS.find((c) => c.id === id)!.blocks.slice(0, 20));
      expect(p.depth, id).toBeLessThan(playState(new Set()).depth);
    }
  });

  it("makes dependants wait, as Prepare hardware says", () => {
    for (const [waiter, causes] of Object.entries(WAITS_FOR)) {
      for (const cause of causes!) {
        const p = playState(new Set<ConditionId>([cause]));
        expect(p.states[waiter as ConditionId], `${waiter} waits for ${cause}`).toBe("waiting");
      }
    }
    expect(playState(new Set<ConditionId>(["devices"])).rest).toMatch(/Waiting on it: host controllers\.$/);
    expect(playState(new Set<ConditionId>(["tasks"])).rest).toMatch(/Waiting on it: the CPU and GPU\.$/);
  });

  it("says how many conditions are not met when there are several", () => {
    expect(playState(new Set<ConditionId>(["devices", "tasks"])).rest).toMatch(/^2 conditions are not met/);
  });

  it("cites only sources the site lists", () => {
    for (const id of MODERN_STANDBY_SOURCES) expect(SOURCES[id], id).toBeDefined();
  });
});
