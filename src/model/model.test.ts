// What the whole site shares: the moon's geometry, the legend of states, and the list of sources.
import { describe, expect, it } from "vitest";
import { LEGEND, legendItem, litFraction, litPath, terminatorRadius } from "./moon";
import { SOURCE_LIST, sourceNumber } from "./sources";

describe("moon geometry", () => {
  it("lights exactly the requested fraction of the disc", () => {
    for (const k of [0.05, 0.3, 0.5, 0.72, 0.95]) {
      expect(litFraction(k, 20)).toBeCloseTo(k, 10);
    }
  });

  it("has a straight terminator at half moon", () => {
    expect(terminatorRadius(0.5, 20)).toBe(0);
  });

  it("draws nothing for a new moon and a closed circle for a full moon", () => {
    expect(litPath(0, 10, 12)).toBeNull();
    expect(litPath(1, 10, 12)).toMatch(/Z$/);
  });
});

describe("legend", () => {
  it("uses phase only inside the working state, so it never reads as one ladder", () => {
    for (const g of LEGEND) {
      for (const it of g.items) {
        if (g.short === "Working") expect(it.k).toBeGreaterThan(0);
        else expect(it.k).toBe(0);
      }
    }
  });

  it("tells S3 and S4 apart by a marker, not by darkness", () => {
    expect(legendItem("s3").k).toBe(legendItem("s4").k);
    expect(legendItem("s3").dot).toBe(true);
    expect(legendItem("s4").ring).toBe(true);
  });
});

describe("sources", () => {
  it("never prints an unconfirmed section number", () => {
    // A section is named by its title until its 6.6 number is confirmed; a
    // bare section number such as "9.5" must not appear. Table numbers seen
    // in the 6.6 List of Tables ("Table 9.3") are allowed.
    for (const s of SOURCE_LIST) expect(s.where.replace(/Table \d+\.\d+/g, "")).not.toMatch(/\b\d+\.\d+/);
  });

  it("numbers citations in list order", () => {
    expect(sourceNumber(SOURCE_LIST[0].id)).toBe(1);
    expect(sourceNumber(SOURCE_LIST[SOURCE_LIST.length - 1].id)).toBe(SOURCE_LIST.length);
  });
});
