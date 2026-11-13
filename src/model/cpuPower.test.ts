// Chapter 4's model: the camera's geometry, the idle states and the trace, the reader's turn, the
// performance scales, the day's steps (and their stops on a narrow screen), and the wording.
import { describe, expect, it } from "vitest";
import {
  CAVEAT,
  COMBINATIONS,
  CPPC_CASES,
  CPPC_MARKS,
  DAY,
  DAY_FRAMES,
  DAY_STOPS,
  FRAMES,
  GAPS,
  LAT,
  NIGHT,
  PLATE,
  PLAY_CITATIONS,
  POWER,
  RECTS,
  RES,
  dayStopOf,
  fit,
  gapStart,
  lane,
  osPick,
  outcome,
  overlap,
  storyFor,
  textFloor,
  validCombination,
  type Seg,
} from "./cpuPower";
import { SOURCES } from "./sources";

describe("chapter 4 geometry", () => {
  it("keeps every tile and day frame on the plate", () => {
    for (const [x0, y0, x1, y1] of Object.values(RECTS)) {
      expect(x0).toBeLessThan(x1);
      expect(y0).toBeLessThan(y1);
      expect(x1).toBeLessThanOrEqual(PLATE.w);
      expect(y1).toBeLessThanOrEqual(PLATE.h);
    }
    // The day's ink lies on the photograph itself: every day frame is inside the plate.
    for (const f of DAY_FRAMES) {
      const F = FRAMES[f];
      expect(F.x).toBeGreaterThanOrEqual(0);
      expect(F.y).toBeGreaterThanOrEqual(0);
      expect(F.x + F.w).toBeLessThanOrEqual(PLATE.w);
      expect(F.y + F.h).toBeLessThanOrEqual(PLATE.h);
    }
    // The levels are marked on the die itself, so their frame holds the whole die.
    expect(FRAMES.draw.x).toBeLessThan(426);
    expect(FRAMES.draw.x + FRAMES.draw.w).toBeGreaterThan(1118);
    expect(FRAMES.draw.y).toBeLessThan(300);
    expect(FRAMES.draw.y + FRAMES.draw.h).toBeGreaterThan(966);
  });
  it("frames a step in the figure area, left of the words", () => {
    const vw = 1440,
      vh = 900;
    for (const frame of ["full", "die", "print", "draw", "card", "all"] as const) {
      const t = fit(frame, vw, vh, false),
        F = FRAMES[frame];
      // The frame's middle is the middle of the figure area: 3 to 59 percent across, 12 to 97 percent down.
      expect(t.tx + (F.x + F.w / 2) * t.s, frame).toBeCloseTo((0.03 + 0.56 / 2) * vw, 6);
      expect(t.ty + (F.y + F.h / 2) * t.s, frame).toBeCloseTo((0.12 + 0.85 / 2) * vh, 6);
      // It fits the area, unless the plate is held at its smallest wide scale (62 percent of the view's width).
      const fitted = Math.min((0.56 * vw) / F.w, (0.85 * vh) / F.h, 1.1);
      expect(t.s, frame).toBeCloseTo(Math.max(fitted, (vw / 2400) * 0.62), 9);
    }
  });
  it("lifts text to 12 px where the scale would take it under, and leaves larger text alone", () => {
    expect(textFloor(24, 1, 0.25)).toBe(2);
    expect(textFloor(24, 1, 0.5)).toBe(1);
    expect(textFloor(24, 1, 1)).toBe(1);
    expect(24 * 0.72 * 0.3 * textFloor(24, 0.72, 0.3)).toBeCloseTo(12, 9);
    // The overview keeps true sizes by design; every other frame is lifted.
    expect(textFloor(15, 1, 2)).toBe(1);
  });
});

describe("chapter 4 idle states", () => {
  it("orders the example states: deeper saves more, and takes longer to leave and to repay", () => {
    expect(POWER.cg).toBeGreaterThan(POWER.ret);
    expect(POWER.ret).toBeGreaterThan(POWER.pd);
    expect(LAT.cg).toBeLessThan(LAT.ret);
    expect(LAT.ret).toBeLessThan(LAT.pd);
    expect(RES.cg).toBeLessThan(RES.ret);
    expect(RES.ret).toBeLessThan(RES.pd);
  });
  it("drops once to the chosen depth, never stepping through shallower states", () => {
    const l = lane([
      ["run", 20],
      ["idle", "pd", 30],
      ["run", 20],
    ]);
    const ys = l.pts.map((p) => p[1]);
    const levels = new Set(ys.map((y) => y.toFixed(1)));
    // Running, then the chosen depth only: no C1 or retention level on the way down.
    expect(levels.size).toBe(2);
    expect(l.idles[0].up - l.idles[0].irq).toBe(LAT.pd);
  });
  it("lets the cluster rest only while every core is idle", () => {
    const [from, to] = overlap();
    expect(from).toBe(47);
    expect(to).toBe(70);
    // No core runs inside the overlap.
    const lanes: Seg[][] = [
      [
        ["run", 10],
        ["idle", "pd", 60],
      ],
      [
        ["run", 22],
        ["idle", "pd", 78],
      ],
    ];
    expect(overlap(lanes)[0]).toBe(23);
  });
});

describe("chapter 4 your turn", () => {
  it("lets the OS pick the deepest state that fits the estimate and the limit", () => {
    expect(GAPS.map(osPick)).toEqual(["pd", "pd", "cg"]);
  });
  it("shows a deeper pick losing when the idle ends before its minimum residency", () => {
    expect(outcome("pd", GAPS[1])).toEqual({ lost: true, late: false });
    expect(outcome("ret", GAPS[2])).toEqual({ lost: false, late: true });
    expect(outcome("poll", GAPS[0])).toEqual({ lost: false, late: false });
  });
  it("tells a late wake as delayed, never lost", () => {
    const s = storyFor(["pd", "pd", "ret"], 2);
    expect(s).toMatch(/delayed but not lost/);
    expect(s).not.toMatch(/\blost\b(?!\.)(?! )/);
  });
  it("places each gap after the picks before it", () => {
    expect(gapStart([null, null, null], 0)).toBe(8);
    expect(gapStart(["pd", null, null], 1)).toBe(8 + 14 + LAT.pd + 8);
    expect(gapStart(["poll", null, null], 1)).toBe(8 + 14 + 8);
  });
});

describe("chapter 4 performance", () => {
  it("keeps the CPPC scale in order and moves only Guaranteed", () => {
    const at = Object.fromEntries(CPPC_MARKS);
    expect(at.Highest).toBeLessThan(at.Nominal);
    expect(at.Nominal).toBeLessThan(at.Guaranteed);
    expect(at.Guaranteed).toBeLessThan(at["Lowest nonlinear"]);
    expect(CPPC_CASES[2].guaranteed).toBeGreaterThan(CPPC_CASES[1].guaranteed);
    // All four together get Nominal, not Highest.
    expect(CPPC_CASES[1].got).toBe(at.Nominal);
  });
  it("prints no MHz on the CPPC step", () => {
    const s = NIGHT.find((x) => x.scale === "cppc")!;
    expect(`${s.lead} ${s.rest}`).not.toMatch(/\d\s*MHz/);
  });
});

describe("chapter 4 by day", () => {
  it("shows only valid combinations from the spec's example", () => {
    for (const c of COMBINATIONS) expect(validCombination(c)).toBe(true);
    expect(validCombination(["power down", "running", "clock gate"])).toBe(false);
  });
  it("has twelve day steps ending on the overview", () => {
    expect(DAY).toHaveLength(12);
    expect(DAY[11].frame).toBe("all");
  });
});

describe("chapter 4 by day on a narrow screen", () => {
  it("covers the twelve steps with six stops, in order, each step in exactly one", () => {
    expect(DAY_STOPS).toHaveLength(6);
    expect(DAY_STOPS.flatMap((s) => Array.from({ length: s.to - s.from + 1 }, (_, n) => s.from + n))).toEqual(
      DAY.map((_, n) => n),
    );
    DAY.forEach((_, n) => expect(dayStopOf(n)).toBe(DAY_STOPS.findIndex((s) => n >= s.from && n <= s.to)));
  });
  it("frames each stop round its own ink, and ends on the overview", () => {
    for (const s of DAY_STOPS.slice(0, -1)) {
      expect(s.box, s.rail).not.toBeNull();
      // One stop, one picture: its steps share a frame, and its box lies inside the day's overview.
      expect(new Set(DAY.slice(s.from, s.to + 1).map((d) => d.frame)).size, s.rail).toBe(1);
      expect(s.box!.x).toBeGreaterThanOrEqual(FRAMES.all.x);
      expect(s.box!.y).toBeGreaterThanOrEqual(FRAMES.all.y);
    }
    const last = DAY_STOPS[DAY_STOPS.length - 1];
    expect(last.box).toBeNull();
    expect(DAY[last.to].frame).toBe("all");
  });
  it("lets a 390 px phone read every stop: the ink is 12 px or lifted to it", () => {
    // The figure on a phone: 94 percent of 390 by 94 percent of half an 844 px screen.
    for (const s of DAY_STOPS.slice(0, -1)) {
      const t = fit(DAY[s.to].frame, 390, 422, true, s.box);
      const nest = DAY[s.to].frame === "print" ? 0.72 : 1;
      expect(24 * nest * t.s * textFloor(24, nest, t.s), s.rail).toBeGreaterThanOrEqual(11.99);
      // The whole box is on screen.
      expect(s.box!.w * t.s).toBeLessThanOrEqual(390);
      expect(s.box!.h * t.s).toBeLessThanOrEqual(422);
    }
  });
  it("leaves wide screens alone: without a box a day frame is the one in FRAMES", () => {
    for (const f of DAY_FRAMES) expect(fit(f, 765, 653, false, null)).toEqual(fit(f, 765, 653, false));
  });
});

describe("chapter 4 wording", () => {
  const all = [
    CAVEAT,
    ...NIGHT.flatMap((s) => [s.lead, s.rest, s.rule, s.note ?? ""]),
    ...DAY.flatMap((s) => [s.lead, s.rest]),
  ].join(" ");
  it("cites only sources that exist, on every step", () => {
    for (const s of NIGHT) {
      expect(s.citations.length).toBeGreaterThan(0);
      for (const c of [...s.citations, ...s.ruleCitations]) expect(SOURCES[c], c).toBeDefined();
    }
    for (const s of DAY) for (const c of s.citations) expect(SOURCES[c], c).toBeDefined();
    for (const c of PLAY_CITATIONS) expect(SOURCES[c]).toBeDefined();
  });
  it("stays vendor-neutral and within what the spec says", () => {
    expect(all).not.toMatch(/\b(C6|C10|MWAIT|HLT|WFI|PSCI|HWP|Intel|AMD|Arm)\b/);
    // The spec recommends a conservative wake latency; it does not require it.
    expect(all).not.toMatch(/must be (set )?conservative/);
    // _CST and _LPI may both be described; they are never mixed at run time.
    expect(all).not.toMatch(/never both/);
  });
});
