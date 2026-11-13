// What chapter 4's bench works out from the step alone: the stop a day step belongs to on a narrow screen,
// the camera, and the state of the tiles.
import { describe, expect, it } from "vitest";
import { CPPC_CASES, DAY, DAY0, DAY_STOPS, LAST_NIGHT, NIGHT, STEP_COUNT } from "../model/cpuPower";
import { benchCamera, benchTiles, reach, stepFrame, stopAt, stripTransform } from "./useCpuBench";

const WIDE = { vw: 1366, vh: 708 };
const PHONE = { vw: 390, vh: 500 };
const steps = Array.from({ length: STEP_COUNT }, (_, i) => i);
const daySteps = steps.filter((i) => i >= DAY0);

describe("chapter 4: the stop a step belongs to", () => {
  it("has no stops by night, and none on a wide screen", () => {
    for (const i of steps) expect(stopAt(i, false)).toBeNull();
    for (const i of steps.filter((k) => k < DAY0)) expect(stopAt(i, true)).toBeNull();
  });

  it("gives every day step, on a narrow screen, the one stop that holds it", () => {
    for (const i of daySteps) {
      const stop = stopAt(i, true)!;
      expect(DAY_STOPS).toContain(stop);
      expect(stop.from).toBeLessThanOrEqual(i - DAY0);
      expect(stop.to).toBeGreaterThanOrEqual(i - DAY0);
    }
  });

  it("leads a chip to its own step on a wide screen, and to the last step of its stop on a narrow one", () => {
    for (const i of steps) expect(reach(i, false)).toBe(i);
    for (const i of steps.filter((k) => k < DAY0)) expect(reach(i, true)).toBe(i);
    for (const i of daySteps) {
      expect(reach(i, true)).toBe(DAY0 + stopAt(i, true)!.to);
      // Where a chip leads is itself a step a narrow screen can stand on.
      expect(reach(reach(i, true), true)).toBe(reach(i, true));
    }
    expect(new Set(daySteps.map((i) => reach(i, true))).size).toBe(DAY_STOPS.length);
  });
});

describe("chapter 4: the camera", () => {
  it("is on each step's own frame on a wide screen, with the day's ink drawn up to that step", () => {
    for (const i of steps) {
      const cam = benchCamera(i, false, WIDE);
      expect(cam.frame).toBe(stepFrame(i));
      expect(cam.stop).toBeNull();
      expect(cam.inkFrom).toBe(1);
      expect(cam.inkTo).toBe(i >= DAY0 ? i - DAY0 + 1 : 0);
      // On a wide screen the trace is drawn on the plate itself.
      expect(cam.traceT).toBe(cam.t);
    }
  });

  it("names the frame by the step alone: the night's, the reader's turn in full, then the day's", () => {
    for (const i of steps.filter((k) => k < LAST_NIGHT)) expect(stepFrame(i)).toBe(NIGHT[i].frame);
    expect(stepFrame(LAST_NIGHT)).toBe("full");
    for (const i of daySteps) expect(stepFrame(i)).toBe(DAY[i - DAY0].frame);
  });

  it("shows a narrow day stop at its last step, with only its own ink", () => {
    for (const i of daySteps) {
      const cam = benchCamera(i, true, PHONE);
      const stop = stopAt(i, true)!;
      expect(cam.stop).toBe(stop);
      expect(cam.frame).toBe(DAY[stop.to].frame);
      expect(cam.inkTo).toBe(stop.to + 1);
      expect(cam.inkFrom).toBe(stop.box ? stop.from + 1 : 1);
    }
  });

  it("draws the trace in its own strip on a narrow screen", () => {
    const cam = benchCamera(0, true, PHONE);
    expect(cam.traceT).toEqual(stripTransform(PHONE.vw, PHONE.vh));
    expect(cam.traceT).not.toEqual(cam.t);
    expect(cam.traceT.s).toBeGreaterThan(0);
  });
});

describe("chapter 4: the tiles", () => {
  const none = [null, null, null];

  it("shows a night step's own tiles, and what is in motion over them", () => {
    const i = steps.find((k) => k < LAST_NIGHT && NIGHT[k].tiles && NIGHT[k].scale !== "cppc")!;
    expect(benchTiles(i, {}, 0, none).tiles).toEqual(NIGHT[i].tiles);
    expect(benchTiles(i, { t0: "pd" }, 0, none).tiles.t0).toBe("pd");
  });

  it("shows the CPPC step by the case on show", () => {
    const i = NIGHT.findIndex((s) => s.scale === "cppc");
    CPPC_CASES.forEach((c, phase) => expect(benchTiles(i, {}, phase, none).tiles).toEqual(c.tiles));
  });

  it("rests core 0 at the depth the reader picked last, and keeps it running after a pick to keep running", () => {
    expect(benchTiles(LAST_NIGHT, {}, 0, none).tiles.t0).toBe("run");
    expect(benchTiles(LAST_NIGHT, {}, 0, ["pd", null, null]).tiles.t0).toBe("pd");
    expect(benchTiles(LAST_NIGHT, {}, 0, ["pd", "ret", null]).tiles.t0).toBe("ret");
    expect(benchTiles(LAST_NIGHT, {}, 0, ["pd", "poll", null]).tiles.t0).toBe("run");
  });

  it("puts more light on the bench the more cores run", () => {
    const dark = benchTiles(LAST_NIGHT, { t0: "pd", t1: "pd", t2: "pd", t3: "pd" }, 0, none).lit;
    const lit = benchTiles(LAST_NIGHT, { t0: "run", t1: "run", t2: "run", t3: "run" }, 0, none).lit;
    expect(lit).toBeGreaterThan(dark);
    expect(dark).toBeGreaterThanOrEqual(0);
  });
});
