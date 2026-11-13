// The chapter list: six chapters in order, each with its question, its sources and vendor-neutral text.
import { describe, expect, it } from "vitest";
import { CHAPTERS, chapter } from "./chapters";
import { SOURCES } from "./sources";

describe("chapters", () => {
  it("lists the six version-1 topics in order", () => {
    expect(CHAPTERS.map((c) => c.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(6);
  });

  it("cites a real source for every preview", () => {
    for (const c of CHAPTERS) {
      expect(c.citations.length).toBeGreaterThan(0);
      for (const id of c.citations) expect(SOURCES[id], `${c.id} cites ${id}`).toBeDefined();
    }
  });

  it("describes every figure for screen readers and asks one question", () => {
    for (const c of CHAPTERS) {
      expect(c.figureText.length).toBeGreaterThan(40);
      expect(c.question.endsWith("?")).toBe(true);
      expect(c.caption.startsWith(`Chapter ${c.n}:`)).toBe(true);
    }
  });

  it("names no vendor in any preview", () => {
    for (const c of CHAPTERS) {
      const text = [c.question, c.answer, c.caption, c.figureText].join(" ");
      expect(text).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
    }
  });

  it("finds chapters by id and refuses unknown ones", () => {
    expect(chapter("cpu-power").n).toBe(4);
    expect(() => chapter("thermal")).toThrow();
  });
});
