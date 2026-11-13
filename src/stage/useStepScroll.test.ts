// The keys of a rail of chips: which chip a key leads to.
import { describe, expect, it } from "vitest";
import { railTarget } from "./useStepScroll";

describe("the rail's keys", () => {
  const last = 7;

  it("moves one chip in reading order with the arrow keys", () => {
    expect(railTarget({ key: "ArrowRight" }, 3, last)).toBe(4);
    expect(railTarget({ key: "ArrowDown" }, 3, last)).toBe(4);
    expect(railTarget({ key: "ArrowLeft" }, 3, last)).toBe(2);
    expect(railTarget({ key: "ArrowUp" }, 3, last)).toBe(2);
  });

  it("stops at either end instead of wrapping round", () => {
    expect(railTarget({ key: "ArrowRight" }, last, last)).toBe(last);
    expect(railTarget({ key: "ArrowDown" }, last, last)).toBe(last);
    expect(railTarget({ key: "ArrowLeft" }, 0, last)).toBe(0);
    expect(railTarget({ key: "ArrowUp" }, 0, last)).toBe(0);
  });

  it("jumps to the ends with Home and End, from anywhere", () => {
    for (let at = 0; at <= last; at++) {
      expect(railTarget({ key: "Home" }, at, last)).toBe(0);
      expect(railTarget({ key: "End" }, at, last)).toBe(last);
    }
  });

  it("leaves a key pressed with Alt, Ctrl or Meta to the browser: those are its shortcuts", () => {
    expect(railTarget({ key: "ArrowLeft", altKey: true }, 3, last)).toBeNull();
    expect(railTarget({ key: "ArrowRight", metaKey: true }, 3, last)).toBeNull();
    expect(railTarget({ key: "Home", ctrlKey: true }, 3, last)).toBeNull();
    expect(railTarget({ key: "End", ctrlKey: true }, 3, last)).toBeNull();
  });

  it("leaves every other key to the browser", () => {
    for (const key of ["Enter", " ", "Tab", "Escape", "a", "PageDown"]) expect(railTarget({ key }, 3, last)).toBeNull();
  });
});
