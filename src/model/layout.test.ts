// The geometry every page shares: a share kept between 0 and 1, centring a box in a region, and turning a
// point of a plate into a point of the view.
import { describe, expect, it } from "vitest";
import { NARROW, NAV_HEIGHT, centred, clamp01, place, toView, type Box, type Transform } from "./layout";

describe("shared layout", () => {
  it("keeps a share between 0 and 1", () => {
    expect(clamp01(-0.4)).toBe(0);
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.37)).toBe(0.37);
    expect(clamp01(1)).toBe(1);
    expect(clamp01(7)).toBe(1);
  });

  it("puts the middle of a box on the middle of a region, at any scale", () => {
    const box: Box = { x: 400, y: 280, w: 920, h: 700 };
    const region: Box = { x: 40, y: 90, w: 760, h: 650 };
    for (const s of [0.25, 0.5, 1, 1.1]) {
      const { tx, ty } = centred(box, region, s);
      expect(tx + (box.x + box.w / 2) * s).toBeCloseTo(region.x + region.w / 2, 9);
      expect(ty + (box.y + box.h / 2) * s).toBeCloseTo(region.y + region.h / 2, 9);
    }
  });

  it("maps a plate point through the transform: scaled, then moved", () => {
    const t: Transform = { s: 0.5, tx: 30, ty: -12 };
    expect(toView(t, [0, 0])).toEqual([30, -12]);
    expect(toView(t, [200, 100])).toEqual([130, 38]);
  });

  it("places an overlaid element at the same point the plate's own pixel lands on", () => {
    const t: Transform = { s: 0.566, tx: -227.4, ty: -52.3 };
    for (const [x, y] of [
      [0, 0],
      [452, 318],
      [2400, 1500],
    ] as const) {
      const [vx, vy] = toView(t, [x, y]);
      expect(place(t, x, y)).toEqual({ left: `${vx}px`, top: `${vy}px` });
    }
  });

  it("names the two numbers the stylesheets also write", () => {
    // The stylesheets cannot import them: src/styles/styles.test.ts checks the breakpoint against each sheet.
    expect(NARROW).toBe(1060);
    expect(NAV_HEIGHT).toBe(60);
  });
});
