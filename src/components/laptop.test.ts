// The side-view laptop of the opening: how its outline shifts as the lid opens, and where the lid hinges.
import { describe, expect, it } from "vitest";
import { SIDE_HINGE, sideOpenShift } from "./Laptop";

describe("side view lid geometry", () => {
  it("does not move the outline while the lid is closed", () => {
    const s = sideOpenShift(0);
    expect(Math.abs(s.dx)).toBeLessThan(1e-9);
    expect(Math.abs(s.dy)).toBeLessThan(1e-9);
  });

  it("moves the outline up and towards the hinge as the lid opens past vertical", () => {
    const s = sideOpenShift(105);
    expect(s.dy).toBeLessThan(-0.3); // the lid rises far above the base
    expect(s.dx).toBeGreaterThan(0); // the open shape leans back towards the hinge
  });

  it("hinges at the centre of the lid's rounded back end", () => {
    // The lid is 18 units thick (y 16 to 34), so its end radius is 9 and the
    // end's centre is 9 units in from the back (x 988) at mid thickness.
    expect(SIDE_HINGE).toEqual({ x: 988 - 9, y: 16 + 9 });
  });
});
