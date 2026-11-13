// The main page's night as a line of levels over time: in time order from 22:30 to 07:30, and in the
// working state throughout.
import { describe, expect, it } from "vitest";
import { legendItem } from "./moon";
import { HYPNOGRAM, LEVEL_STATES, NIGHT_LENGTH, levelAt, minuteOf } from "./night";

describe("the night's hypnogram", () => {
  it("runs from 22:30 to 07:30 in time order", () => {
    expect(minuteOf("22:30")).toBe(0);
    expect(minuteOf("07:30")).toBe(NIGHT_LENGTH);
    for (let i = 1; i < HYPNOGRAM.length; i++) expect(HYPNOGRAM[i].from).toBeGreaterThanOrEqual(HYPNOGRAM[i - 1].from);
  });

  it("is in use until the lid closes at 22:47, as the story tells it", () => {
    expect(levelAt(minuteOf("22:46"))).toBe(0);
    expect(levelAt(minuteOf("22:47"))).toBe(1);
  });

  it("never leaves S0: every level it uses is a working-state (S0) glyph of the legend", () => {
    for (const s of HYPNOGRAM) expect(legendItem(LEVEL_STATES[s.level]).name).toBe("S0");
  });
});
