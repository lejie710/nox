// Chapter 3's model: each step's full state of the building, the rules of the reader's turn, and the same
// flat by day.
import { describe, expect, it } from "vitest";
import {
  BAY_PANELS,
  DEVICE_STEPS,
  FLATS,
  FRAMES,
  LEVELS,
  LIT_LEVELS,
  PLATE,
  PLAY_CITATIONS,
  STEP_COUNT,
  TAG_TEXT,
  TUBE_X,
  bellSwitch,
  blocker,
  defaultStory,
  fit,
  initialPlay,
  lightSwitch,
  settle,
  stepState,
  tagLead,
  tagsFor,
  wakeAll,
  windowOf,
  wokenState,
  type FrameId,
  type LevelId,
  type NightState,
} from "./devicePower";
import { SOURCES } from "./sources";

/** What must hold in every night the chapter can draw. */
function invariants(s: NightState) {
  for (const lv of LIT_LEVELS) {
    const here = FLATS.filter((f) => f.level === lv);
    // A dark light means every device on it is in D3cold, and a device is in
    // D3cold only when its light is off (the OS turned the resource off).
    for (const f of here) expect(s.flats[f.id].d === "D3cold", `${f.id} on ${lv}`).toBe(!s.on[lv]);
    // An armed device that wakes only from D3hot never sits in D3cold.
    for (const f of here) if (s.flats[f.id].armed && f.s0w === 3) expect(s.flats[f.id].d).not.toBe("D3cold");
  }
  // Only devices that can wake are ever armed.
  for (const f of FLATS) if (!f.wake) expect(s.flats[f.id].armed).toBe(false);
}

describe("chapter 3 steps", () => {
  it("has seven steps and the reader's turn", () => {
    expect(DEVICE_STEPS).toHaveLength(7);
    expect(STEP_COUNT).toBe(8);
  });

  it("cites only sources that exist, for every claim and rule", () => {
    for (const s of DEVICE_STEPS) {
      expect(s.citations.length).toBeGreaterThan(0);
      expect(s.ruleCitations.length).toBeGreaterThan(0);
      for (const c of [...s.citations, ...s.ruleCitations]) expect(SOURCES[c], `${s.id}: ${c}`).toBeDefined();
    }
    for (const c of PLAY_CITATIONS) expect(SOURCES[c]).toBeDefined();
  });

  it("draws a consistent night at every step, before and after the wake", () => {
    for (const s of DEVICE_STEPS) {
      invariants(stepState(s));
      invariants(wokenState(s));
    }
  });

  it("keeps the touchpad's light on in the shared step, and wakes the Wi-Fi card from D3cold in the wake step", () => {
    const shared = stepState(DEVICE_STEPS.find((s) => s.id === "shared")!);
    expect(blocker(shared, "L2")?.id).toBe("touchpad");
    expect(shared.on.L2).toBe(true);
    const wake = DEVICE_STEPS.find((s) => s.id === "wake")!;
    expect(stepState(wake).flats.wifi).toEqual({ d: "D3cold", armed: true });
    expect(wokenState(wake).flats.wifi.d).toBe("D0");
    expect(wokenState(wake).on.L3).toBe(true);
  });

  it("frames every step inside the plate and never enlarges it past its own pixels", () => {
    for (const [vw, vh, narrow] of [
      [1280, 660, false],
      [1440, 840, false],
      [1920, 1020, false],
      [1000, 416, true],
      [375, 341, true],
    ] as const) {
      for (const id of Object.keys(FRAMES) as FrameId[]) {
        const t = fit(id, vw, vh, narrow);
        expect(t.s).toBeLessThanOrEqual(1.15 + 1e-9);
        expect(t.tx).toBeLessThanOrEqual(0);
        expect(t.ty).toBeLessThanOrEqual(0);
        expect(t.tx + PLATE.w * t.s).toBeGreaterThanOrEqual(vw - 1e-6);
        expect(t.ty + PLATE.h * t.s).toBeGreaterThanOrEqual(vh - 1e-6);
      }
    }
  });

  it("tags only the devices a step is about, and tells a level's light only where it matters", () => {
    for (const [k, s] of DEVICE_STEPS.entries()) {
      const tags = tagsFor(stepState(s), k, false);
      const flats = tags
        .filter((t) => !t.key.startsWith("light-"))
        .map((t) => t.key)
        .sort();
      expect(flats).toEqual([...s.focus].sort());
      const lights = tags.filter((t) => t.key.startsWith("light-")).map((t) => t.key.slice(6));
      if (k === 0) expect(lights).toEqual([]);
      else expect(new Set(lights)).toEqual(new Set(s.focus.map((id) => FLATS.find((f) => f.id === id)!.level)));
    }
  });

  it("puts each label's dot on its part and its text on a parapet no other label of the step uses", () => {
    const up: Record<string, string> = { L1: "L2", L2: "L3", L3: "L4" };
    for (const narrow of [false, true]) {
      for (let k = 0; k <= DEVICE_STEPS.length; k++) {
        const s = DEVICE_STEPS[k];
        const tags = tagsFor(s ? stepState(s) : initialPlay(), k, narrow);
        const devices = tags.filter((t) => FLATS.some((f) => f.id === t.key));
        for (const t of devices) {
          const f = FLATS.find((x) => x.id === t.key)!,
            w = windowOf(f.level, f.bay);
          // The dot is inside the device's own window; the text hangs below it, on that level's parapet.
          expect(t.x).toBeGreaterThan(w.x);
          expect(t.x).toBeLessThan(w.x + w.w);
          expect(t.y).toBeGreaterThan(w.y);
          expect(t.y).toBeLessThan(w.y + w.h);
          expect(t.align.startsWith("below"), t.key).toBe(true);
        }
        // Two devices on one level: the left one's text ends at its dot, the right one's starts at its dot.
        for (const a of devices)
          for (const b of devices) {
            const fa = FLATS.find((x) => x.id === a.key)!,
              fb = FLATS.find((x) => x.id === b.key)!;
            if (fa.level === fb.level && a.x < b.x) {
              expect(a.align).toBe("belowRight");
              expect(b.align).toBe("below");
            }
          }
        for (const t of tags.filter((x) => x.key.startsWith("light-"))) {
          const lv = t.key.slice(6) as LevelId;
          // The dot is on the level's tube; the text stands above it, on the parapet of the level above,
          // which carries no device label in this step.
          expect(t.x).toBeGreaterThanOrEqual(TUBE_X);
          expect(t.x).toBeLessThanOrEqual(TUBE_X + 67);
          expect(t.y).toBe(LEVELS[lv].tube);
          expect(t.align).toBe("aboveRight");
          expect(
            devices.some((d) => FLATS.find((f) => f.id === d.key)!.level === up[lv]),
            `${k}: ${t.key}`,
          ).toBe(false);
        }
        for (const t of tags) expect(t.lead).toBeGreaterThan(0);
      }
    }
  });

  it("keeps each label's text on its parapet at every framing (3 px of grace on the smallest ones)", () => {
    const next: Record<string, number> = { L1: LEVELS.L1.par + 82, L2: LEVELS.L1.top, L3: LEVELS.L2.top };
    const above: Record<string, [number, number]> = {
      L1: [LEVELS.L2.par, LEVELS.L1.top],
      L2: [LEVELS.L3.par, LEVELS.L2.top],
      L3: [LEVELS.L4.par, LEVELS.L3.top],
    };
    // The view's size: the window less the nav on wide screens, the pinned figure on narrow ones.
    for (const [vw, vh, narrow] of [
      [1366, 708, false],
      [1280, 660, false],
      [1880, 840, false],
      [1100, 700, false],
      [390, 354, true],
      [375, 280, true],
      [800, 530, true],
    ] as const) {
      const text = narrow ? TAG_TEXT.narrow : TAG_TEXT.wide;
      for (let k = 0; k <= DEVICE_STEPS.length; k++) {
        const s = DEVICE_STEPS[k],
          sc = fit(s ? s.frame : "full", vw, vh, narrow).s;
        for (const t of tagsFor(s ? stepState(s) : initialPlay(), k, narrow)) {
          const far = (tagLead(t.lead, sc) + TAG_TEXT.gap + text) / sc,
            where = `${vw}x${vh} step ${k + 1} ${t.key}`;
          const f = FLATS.find((x) => x.id === t.key);
          if (f) expect((t.y + far - next[f.level]) * sc, where).toBeLessThanOrEqual(3);
          else if (t.key.startsWith("light-")) {
            const [top, bottom] = above[t.key.slice(6)];
            expect((top - (t.y - far)) * sc, where).toBeLessThanOrEqual(3);
            expect(t.y - tagLead(t.lead, sc) / sc, where).toBeLessThanOrEqual(bottom + 1);
          }
        }
      }
    }
  });
});

describe("chapter 3, your turn: the caretaker's night", () => {
  it("starts with every device idle in D3hot, every light on, and the two wake devices armed", () => {
    const s = initialPlay();
    invariants(s);
    expect(Object.values(s.flats).every((f) => f.d === "D3hot")).toBe(true);
    expect(s.flats.wifi.armed && s.flats.touchpad.armed).toBe(true);
  });

  it("refuses to turn off the shared light while the touchpad is armed, then allows it once disarmed", () => {
    const refused = lightSwitch(initialPlay(), "L2");
    expect(refused.refused).toBe("L2");
    expect(refused.state.on.L2).toBe(true);
    expect(refused.story.rest).toContain("_S0W = 3");
    const off = lightSwitch(bellSwitch(initialPlay(), "touchpad").state, "L2");
    expect(off.state.on.L2).toBe(false);
    expect(off.state.flats.webcam.d).toBe("D3cold");
    expect(off.state.flats.touchpad.d).toBe("D3cold");
  });

  it("brings the shared light back when the touchpad is armed again, with a surprise wake-up for the webcam", () => {
    const dark = lightSwitch(bellSwitch(initialPlay(), "touchpad").state, "L2").state;
    const armed = bellSwitch(dark, "touchpad");
    expect(armed.state.on.L2).toBe(true);
    expect(armed.state.flats.touchpad).toEqual({ d: "D3hot", armed: true });
    expect(armed.story.rest).toContain("surprise wake-up");
  });

  it("keeps the Wi-Fi card's bell wire on in D3cold, and wakes it slowest", () => {
    const dark = lightSwitch(initialPlay(), "L3");
    expect(dark.state.flats.wifi).toEqual({ d: "D3cold", armed: true });
    expect(dark.story.rest).toContain("_PRW");
    const woke = wakeAll(dark.state, false);
    expect(woke.armed).toEqual(["wifi", "touchpad"]);
    expect(woke.fromCold).toEqual(["wifi"]);
    expect(woke.state.flats.wifi.d).toBe("D0");
    expect(woke.state.on.L3).toBe(true);
    expect(woke.story.rest).toContain("longest");
    expect(settle(woke.state).flats.wifi.d).toBe("D3hot");
  });

  it("says so when nothing is armed", () => {
    let s = bellSwitch(initialPlay(), "wifi").state;
    s = bellSwitch(s, "touchpad").state;
    expect(wakeAll(s, false).story.lead).toBe("No device signals wake.");
  });

  it("keeps every reachable night consistent, and its story true to what is drawn", () => {
    type Act = (s: NightState) => NightState;
    const acts: Act[] = [
      ...LIT_LEVELS.map((lv) => (s: NightState) => lightSwitch(s, lv).state),
      ...FLATS.filter((f) => f.wake).map((f) => (s: NightState) => bellSwitch(s, f.id).state),
      (s: NightState) => wakeAll(s, false).state,
      (s: NightState) => wakeAll(s, true).state,
    ];
    let frontier: NightState[] = [initialPlay()];
    const seen = new Set<string>();
    for (let depth = 0; depth < 5; depth++) {
      const next: NightState[] = [];
      for (const s of frontier)
        for (const a of acts) {
          const t = a(s);
          const key = JSON.stringify(t);
          if (seen.has(key)) continue;
          seen.add(key);
          // A wake mid-way has devices in D0 under a lit corridor; settled, every rule holds.
          invariants(settle(t));
          const story = defaultStory(t);
          for (const f of FLATS) expect(story.rest).toContain(f.name);
          next.push(t);
        }
      frontier = next;
    }
    expect(seen.size).toBeGreaterThan(10);
  });
});

describe("chapter 3, the same flat by day", () => {
  it("shows four panels: D0, the optional D1/D2, D3hot, and D3cold with its bell wire lit", () => {
    expect(BAY_PANELS.map((p) => p.id)).toEqual(["d0", "d12", "hot", "cold"]);
    expect(BAY_PANELS.filter((p) => p.dashed).map((p) => p.id)).toEqual(["d12"]);
    expect(BAY_PANELS.filter((p) => p.wire === "lit").map((p) => p.id)).toEqual(["cold"]);
    expect(BAY_PANELS.filter((p) => p.plate === "dark").map((p) => p.id)).toEqual(["cold"]);
    expect(BAY_PANELS.filter((p) => p.box).map((p) => p.id)).toEqual(["hot", "cold"]);
  });
});
