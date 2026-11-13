// The main page's story: each stop's full state, the night line and its labels, the camera, and the
// closing's list of sources.
import { describe, expect, it } from "vitest";
import { CHAPTERS } from "./chapters";
import { NIGHT_LENGTH, levelAt, minuteOf } from "./night";
import { SOURCES, sourceNumber } from "./sources";
import {
  CAVEAT,
  FRAME,
  HEADER,
  LAPTOP,
  LED,
  LEVEL_Y,
  LINE,
  PLATE,
  STEP_COUNT,
  STOPS,
  TIGHT_BELOW,
  drawnShare,
  fit,
  labelsAt,
  lineShown,
  lineX,
  storySources,
} from "./story";
import { NARROW } from "./layout";

const minutes = (hhmm: string) => minuteOf(hhmm);

describe("the story's stops", () => {
  it("tells one night in order: the evening, the lid, the night, the morning", () => {
    expect(STOPS.map((s) => s.plate)).toEqual([
      "open",
      "half",
      "closed",
      "closed",
      "closed",
      "closed",
      "awake",
      "closed",
      "half",
      "dawn",
    ]);
    expect(new Set(STOPS.map((s) => s.id)).size).toBe(STEP_COUNT);
    // The clock never runs backwards (it passes midnight once).
    const t = STOPS.map((s) => minutes(s.time));
    for (let i = 1; i < t.length; i++) expect(t[i]).toBeGreaterThanOrEqual(t[i - 1]);
  });

  it("never leaves S0: every stop's state says S0", () => {
    for (const s of STOPS) expect(s.state.startsWith("S0, ")).toBe(true);
  });

  it("cites a real source for every stop and the caveat", () => {
    for (const s of STOPS) {
      expect(s.citations.length, s.id).toBeGreaterThan(0);
      for (const c of [...s.citations, ...(s.ruleCitations ?? [])])
        expect(SOURCES[c], `${s.id} cites ${c}`).toBeDefined();
    }
    for (const c of CAVEAT.citations) expect(SOURCES[c]).toBeDefined();
  });

  it("keeps the words short: a title, a white sentence, and at most 50 words in all", () => {
    for (const s of STOPS) {
      const words = `${s.lead} ${s.rest ?? ""}`.trim().split(/\s+/).length;
      expect(words, s.id).toBeLessThanOrEqual(50);
      expect(s.title.length, s.id).toBeLessThanOrEqual(34);
    }
  });

  it("names no vendor, and says nothing about how its pictures were made", () => {
    const text = [
      HEADER.lead,
      CAVEAT.text,
      ...STOPS.flatMap((s) => [s.title, s.lead, s.rest ?? "", s.rule ?? "", s.state]),
    ].join(" ");
    expect(text).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm|generated)\b/);
  });

  it("makes the operating system the actor where it is: it picks the cores' idle state, and only DRIPS is called the deepest idle", () => {
    const cores = STOPS.find((s) => s.id === "cores")!;
    expect(cores.lead).toMatch(/the operating system lets each rest in an idle state, as deep as it can/);
    expect(`${cores.lead} ${cores.rest} ${cores.label!.parts.map((p) => p.state).join(" ")}`).not.toMatch(/deepest/);
  });

  it("tells the lid opening as it tells the closing: the method reports a change, then the lid reads open", () => {
    expect(STOPS.find((s) => s.id === "open")!.rest).toMatch(
      /reports that the lid device has changed. The lid then reads open/,
    );
  });

  it("says the firmware wrote the lid method and the operating system runs it", () => {
    const lid = STOPS.find((s) => s.id === "lid")!;
    expect(lid.rest).toMatch(/operating system answers by running a method the firmware wrote/);
    expect(`${lid.lead} ${lid.rest}`).not.toMatch(/[Ff]irmware (then )?tells/);
  });
});

describe("the night line", () => {
  it("shows only while the lid is shut, and is drawn forwards only", () => {
    let last = -1;
    STOPS.forEach((s, i) => {
      expect(lineShown(i), s.id).toBe(s.plate === "closed" || s.plate === "awake");
      if (s.drawnTo !== null) {
        expect(s.drawnTo).toBeGreaterThanOrEqual(last);
        last = s.drawnTo;
      }
    });
    expect(STOPS.find((s) => s.id === "night")!.drawnTo).toBe(NIGHT_LENGTH);
  });

  it("draws nothing before the lid closes and all of it by morning", () => {
    expect(drawnShare(null)).toBe(0);
    expect(drawnShare(0)).toBe(0);
    expect(drawnShare(NIGHT_LENGTH)).toBeCloseTo(1, 10);
    const a = drawnShare(minutes("23:20")),
      b = drawnShare(minutes("03:41"));
    expect(a).toBeGreaterThan(0);
    expect(b).toBeGreaterThan(a);
    expect(b).toBeLessThan(1);
  });

  it("points each label at the line where it is already drawn, at the level the line has there", () => {
    for (const s of STOPS) {
      if (!s.label) continue;
      expect(s.drawnTo, s.id).not.toBeNull();
      expect(s.label.at, s.id).toBeLessThanOrEqual(s.drawnTo!);
      expect(levelAt(s.label.at), s.id).toBe(s.label.level);
      for (const p of s.label.parts) {
        expect(p.name.length).toBeGreaterThan(0);
        expect(p.state.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps every label once it is on the line", () => {
    const n = STOPS.findIndex((s) => s.id === "night");
    expect(labelsAt(n).length).toBe(STOPS.filter((s) => s.label).length);
    expect(labelsAt(0)).toEqual([]);
  });

  it("is awake only during the brief wake, and warm only for what is at work or can wake the laptop", () => {
    expect(STOPS.filter((s) => s.plate === "awake").map((s) => s.id)).toEqual(["wake"]);
    const warm = STOPS.flatMap((s) => s.label?.parts ?? [])
      .filter((p) => p.warm)
      .map((p) => p.name);
    expect(warm).toEqual(["Wi-Fi", "03:38"]);
  });

  it("sits in the room the open lid leaves: above the closed laptop, inside the camera's frame, no label over another", () => {
    expect(LINE.y1 + 60).toBeLessThan(894); // the closed lid's top edge on the plate
    expect(LINE.y0).toBeGreaterThan(LAPTOP.y0);
    expect(LINE.x1).toBeLessThanOrEqual(FRAME.x + FRAME.w);
    expect(LEVEL_Y[0]).toBeGreaterThan(LINE.y0);
    expect(LEVEL_Y[2]).toBeLessThan(LINE.y1);
    const labels = STOPS.flatMap((s) => (s.label ? [s.label] : []));
    // The labels keep their size on screen (13 px), so on the plate they grow as the camera pulls back.
    // About 0.56 em a character, 1.6 em between two parts. Checked at every scale the labels are shown at.
    const sizes = [
      [1366, 708],
      [1280, 660],
      [1880, 840],
      [1100, 700],
      [1100, 460],
      [1500, 520],
    ] as const;
    let checked = 0;
    for (const [vw, vh] of sizes) {
      const z = fit(vw, vh, false).s;
      if (z < TIGHT_BELOW) continue; // the labels are a list in the words there, not on the line
      checked++;
      const em = 13 / z;
      const box = (l: (typeof labels)[number]) => ({
        x0: l.x,
        x1:
          l.x +
          l.parts.reduce((w, p) => w + `${p.name} · ${p.state}`.length * 0.56 * em, 0) +
          (l.parts.length - 1) * 1.6 * em,
        y: l.y,
      });
      for (const a of labels)
        for (const b of labels) {
          if (a === b) continue;
          const A = box(a),
            B = box(b);
          const apart = Math.abs(A.y - B.y) >= 1.3 * em || A.x1 < B.x0 || B.x1 < A.x0;
          expect(apart, `${a.parts[0].name} over ${b.parts[0].name} at ${vw} x ${vh}`).toBe(true);
        }
      for (const l of labels) {
        expect(box(l).x1, `${l.parts[0].name} at ${vw} x ${vh}`).toBeLessThanOrEqual(FRAME.x + FRAME.w);
        // A label never sits on the brief wakes' spikes, which run between the two lower levels.
        for (const spike of ["03:36", "05:55"]) {
          const x = lineX(minutes(spike));
          const onSpike = l.x <= x && box(l).x1 >= x && l.y > LEVEL_Y[1] - 20 && l.y < LEVEL_Y[2] + 20;
          expect(onSpike, `${l.parts[0].name} on the ${spike} wake at ${vw} x ${vh}`).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(3);
    // A short wide window is below the threshold, so it never shows labels it has no room for.
    expect(fit(1100, 460, false).s).toBeLessThan(TIGHT_BELOW);
  });
});

describe("the camera", () => {
  const sizes = [
    [1366, 708],
    [1280, 660],
    [1880, 840],
    [1100, 700],
  ] as const;

  it("keeps the whole laptop and the line in view beside the words, at every wide size", () => {
    for (const [vw, vh] of sizes) {
      const t = fit(vw, vh, false);
      const X = (x: number) => t.tx + x * t.s,
        Y = (y: number) => t.ty + y * t.s;
      expect(X(LAPTOP.x0), `${vw}`).toBeGreaterThanOrEqual(0);
      expect(X(LAPTOP.x1), `${vw}`).toBeLessThanOrEqual(t.wordsLeft);
      expect(Y(LAPTOP.y0), `${vw}`).toBeGreaterThanOrEqual(16);
      expect(Y(LAPTOP.y1), `${vw}`).toBeLessThanOrEqual(vh);
      expect(t.wordsLeft + t.wordsWidth, `${vw}`).toBeLessThanOrEqual(vw);
      expect(X(LED[0])).toBeGreaterThan(0);
    }
  });

  it("fills a narrow view with the laptop", () => {
    for (const [vw, vh] of [
      [390, 388],
      [360, 256],
      [768, 470],
    ] as const) {
      const t = fit(vw, vh, true);
      expect(t.tx + LAPTOP.x0 * t.s).toBeGreaterThanOrEqual(0);
      expect(t.tx + LAPTOP.x1 * t.s).toBeLessThanOrEqual(vw);
      expect(t.ty + LAPTOP.y1 * t.s).toBeLessThanOrEqual(vh);
    }
    expect(NARROW).toBe(1060);
    expect(PLATE).toEqual({ w: 2400, h: 1500 });
  });
});

describe("the closing's source list", () => {
  it("holds every source the story and the chapter list cite, in citation order, once each", () => {
    const list = storySources();
    for (const s of STOPS) for (const c of s.citations) expect(list).toContain(c);
    for (const ch of CHAPTERS) for (const c of ch.citations) expect(list).toContain(c);
    expect(new Set(list).size).toBe(list.length);
    for (let i = 1; i < list.length; i++) expect(sourceNumber(list[i])).toBeGreaterThan(sourceNumber(list[i - 1]));
  });
});
