// The still version (?static, or the system's reduced-motion setting): the gate that chooses it, what the
// pages render in it, and the stylesheet rules that unpin every scene. Rendered to HTML, no browser needed.
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import gate from "../index.html?raw";
import { ChapterPage } from "./chapters/ChapterPage";
import { CHAPTERS } from "./model/chapters";
import { STEP_COUNT as CPU_STEPS, DAY0 } from "./model/cpuPower";
import { STEP_COUNT as DEVICE_STEPS } from "./model/devicePower";
import { STEP_COUNT as STANDBY_STEPS } from "./model/modernStandby";
import { STEP_COUNT as SLEEP_STEPS } from "./model/sleepWake";
import { STOPS } from "./model/story";
import { STEP_COUNT as HOOD_STEPS } from "./model/underHood";
import { STATE_STEPS } from "./model/bigPicture";
import { Story } from "./scenes/Story";
import chapterCss from "./styles/chapter.css?raw";
import cpuCss from "./styles/cpuPower.css?raw";
import deviceCss from "./styles/devicePower.css?raw";
import sleepCss from "./styles/sleepWake.css?raw";
import storyCss from "./styles/story.css?raw";
import hoodCss from "./styles/underHood.css?raw";

/** Renders with the page's class as the gate in index.html would have set it. */
function render(node: ReactNode, still: boolean): string {
  vi.stubGlobal("document", { documentElement: { classList: { contains: (c: string) => still && c === "still" } } });
  return renderToStaticMarkup(node);
}
afterEach(() => vi.unstubAllGlobals());

const flat = (sheet: string) => sheet.replace(/\s+/g, " ");
const count = (html: string, re: RegExp) => [...html.matchAll(re)].length;

describe("the gate in index.html", () => {
  const script = flat(gate);

  it("makes the page still for ?static and for reduced motion, and for nothing else", () => {
    expect(script).toContain('window.matchMedia("(prefers-reduced-motion: reduce)")');
    expect(script).toMatch(
      /if \(p\.has\("static"\) \|\| reduce\) document\.documentElement\.classList\.add\("still"\)/,
    );
    // The one place the class is added: a browser without scroll-driven animations is not still.
    expect(count(script, /classList\.add\("still"\)/g)).toBe(1);
  });

  it("decides before the app loads", () => {
    expect(script.indexOf('classList.add("still")')).toBeLessThan(script.indexOf('src="/src/main.tsx"'));
  });
});

describe("the story, still", () => {
  it("steps through its stops with two controls, and starts with Back at its end", () => {
    const html = render(<Story />, true);
    expect(html).toContain('<p class="st-nav">');
    expect(html).toMatch(/<button type="button" aria-disabled="true">Back<\/button>/);
    expect(html).toMatch(/<button type="button" aria-disabled="false">Next<\/button>/);
    // Nothing to scroll through: the track of stops is not in the page.
    expect(html).not.toContain("st-track");
    expect(html).toContain(STOPS[0].title);
  });

  it("has no such controls with motion, where every stop is in the page in order", () => {
    const html = render(<Story />, false);
    expect(html).not.toContain("st-nav");
    expect(count(html, /class="st-marker/g)).toBe(STOPS.length);
    let from = 0;
    for (const s of STOPS) {
      const at = html.indexOf(s.title, from);
      expect(at, s.id).toBeGreaterThan(-1);
      from = at;
    }
  });
});

describe("the chapters, still", () => {
  // The rail is how a still chapter is stepped through: one radio per step (chapter 4 shows its night group first).
  const chips: Record<string, number> = {
    "big-picture": STATE_STEPS.length,
    "modern-standby": STANDBY_STEPS,
    "device-power": DEVICE_STEPS,
    "cpu-power": DAY0 + 1,
    "sleep-wake": SLEEP_STEPS,
    "under-the-hood": HOOD_STEPS,
  };

  it.each(CHAPTERS.map((c) => c.id))("%s renders with its rail, its first step checked", (id) => {
    const html = render(<ChapterPage id={id} />, true);
    expect(count(html, /role="radio"/g), id).toBe(chips[id]);
    expect(count(html, /role="radio" aria-checked="true"/g), id).toBe(1);
    expect(html).toContain('role="status"');
  });

  it("counts chapter 4's rail from its model", () => {
    expect(DAY0 + 1).toBeLessThan(CPU_STEPS);
  });
});

describe("the stylesheets, still", () => {
  const scenes: [string, string, string | null][] = [
    ["board", chapterCss, "board-track"],
    ["ms", chapterCss, "ms-track"],
    ["dp", deviceCss, "dp-track"],
    ["cp", cpuCss, "cp-track"],
    ["sw", sleepCss, "sw-track"],
    ["uh", hoodCss, "uh-track"],
    // The story's track is not rendered at all when still.
    ["st", storyCss, null],
  ];

  it.each(scenes)("unpin the %s scene and put its track of markers away", (prefix, sheet, track) => {
    const css = flat(sheet);
    // The stage leaves its sticky position: nothing pins.
    expect(css).toMatch(new RegExp(`\\.still \\.${prefix}-stage \\{[^}]*position: relative;`));
    if (track) expect(css).toMatch(new RegExp(`\\.still \\.${track}[^{]*\\{[^}]*display: none;`));
  });
});
