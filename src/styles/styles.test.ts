// The stylesheets, read as text: the rules that must hold whatever else changes (scroll-linked motion and
// its fallbacks, page-to-page motion, the narrow breakpoint in step with the models).
import { describe, expect, it } from "vitest";
import noxRaw from "./nox.css?raw";
import storyRaw from "./story.css?raw";
import { NARROW } from "../model/layout";
import { PLATE as ST_PLATE } from "../model/story";

/**
 * A stylesheet with every run of white space as one space and no leading zero on a decimal, so a test reads
 * rules and values, not how the file happens to be laid out.
 */
const flat = (sheet: string) => sheet.replace(/\s+/g, " ").replace(/(^|[^\d.])0\.(\d)/g, "$1.$2");
const css = flat(noxRaw);
const stCss = flat(storyRaw);

describe("the main page", () => {
  /** Every rule body (text between braces) that declares the property. */
  const rulesWith = (prop: string): string[] =>
    [...css.matchAll(/\{([^{}]*)\}/g)]
      .map((m) => m[1])
      .filter((body) => new RegExp(`(^|;|\\s)${prop}\\s*:`).test(body));

  it("gives the opening's view timeline a zero inset in the same rule", () => {
    // By default a view timeline is shortened by the page's scroll-padding (inset auto), and the
    // `view-timeline` shorthand resets the inset, so a rule that names a timeline must also set its inset.
    const rules = rulesWith("view-timeline");
    expect(rules.length).toBe(1);
    for (const body of rules) expect(body).toMatch(/view-timeline-inset\s*:\s*0(px)?\s*;?/);
  });

  it("gives every scroll-linked animation a non-auto duration, as Firefox requires", () => {
    const rules = rulesWith("animation-timeline");
    expect(rules.length).toBeGreaterThan(0);
    for (const body of rules) expect(body).toMatch(/animation-duration\s*:\s*1ms/);
  });

  it("keeps scroll-linked motion to the opening: the story changes at its stops, as the chapters do", () => {
    expect(stCss).not.toMatch(/animation-timeline|view-timeline/);
  });

  it("sizes the story's world as its plate, blends the plates into the page, and uses the shared step-text values", () => {
    expect(stCss).toMatch(new RegExp(`\.st-world \{[^}]*width: ${ST_PLATE.w}px; height: ${ST_PLATE.h}px`));
    expect(stCss).toMatch(/\.st-plate \{[^}]*mix-blend-mode: screen/);
    expect(stCss).toMatch(/\.st-title \{[^}]*font: var\(--step-title\)/);
    expect(stCss).toMatch(/\.st-text\.twotone \{[^}]*font: var\(--step-text\)/);
    expect(stCss).toContain(`@media (max-width: ${NARROW - 1}px)`);
  });

  it("moves between pages only when motion is welcome, and names exactly the nav and the chapter's name", () => {
    // The block that only applies when motion is welcome, cut out by matching its braces.
    const open = "@media (prefers-reduced-motion: no-preference) {";
    const start = css.indexOf(open);
    expect(start).toBeGreaterThan(-1);
    let end = start + open.length;
    for (let depth = 1; depth > 0; end++) depth += css[end] === "{" ? 1 : css[end] === "}" ? -1 : 0;
    const block = css.slice(start, end);
    const outside = css.slice(0, start) + css.slice(end);
    expect([...css.matchAll(/view-transition-name: ([\w-]+)/g)].map((m) => m[1]).sort()).toEqual([
      "nox-nav",
      "nox-title",
    ]);
    // Every rule that names or animates a view transition is inside that block.
    expect(outside).not.toContain("view-transition");
    expect(block).toMatch(/\.lnav \{ view-transition-name: nox-nav; \}/);
    expect(block).toMatch(/\.map-tab\[aria-selected="true"\], \.chapter-title \{ view-transition-name: nox-title; \}/);
  });

  it("puts no rail of chips on the main page", () => {
    expect(stCss).not.toMatch(/st-rail|st-chip/);
  });

  it("draws no box round a label on the night line or the chapter list", () => {
    expect(stCss).not.toMatch(/\.st-label[^{]*\{[^}]*(border|background)\s*:/);
    expect(css).toMatch(/\.map-pic \{[^}]*mix-blend-mode: screen/);
  });
});

// The narrow layout is decided twice, in the models (the camera, the label spots) and in each stylesheet
// (the words column or the cards). The two numbers must stay one.
import sleepWakeRaw from "./sleepWake.css?raw";
import devicePowerRaw from "./devicePower.css?raw";
import cpuPowerRaw from "./cpuPower.css?raw";
import underHoodRaw from "./underHood.css?raw";

const swCss = flat(sleepWakeRaw);
const dpCss = flat(devicePowerRaw);
const cpCss = flat(cpuPowerRaw);
const uhCss = flat(underHoodRaw);

describe("chapter 4 on narrow screens", () => {
  it("hides the day steps without a stop, and puts the track in the flow, only below 1060 px", () => {
    const wide = cpCss.split("@media")[0];
    expect(wide).not.toContain("cp-nostop");
    expect(wide).not.toContain("cp-stop-step");
    expect(wide).toMatch(/\.cp-track \{ position: absolute;/);
    const narrow = cpCss.split("@media").find((b) => b.includes(".cp-marker.cp-nostop { display: none; }"));
    expect(narrow).toBeDefined();
    expect(narrow!.trimStart().startsWith("(max-width: 1059px) {")).toBe(true);
  });
});
import { PLATE as SW_PLATE } from "../model/sleepWake";
import { PLATE as UH_PLATE } from "../model/underHood";

describe("narrow breakpoint", () => {
  it.each([
    ["sleepWake", swCss],
    ["devicePower", dpCss],
    ["cpuPower", cpCss],
    ["underHood", uhCss],
  ] as const)("%s.css switches at the models' breakpoint", (_name, css) => {
    expect(css).toContain(`@media (max-width: ${NARROW - 1}px)`);
  });

  it("sizes chapter 6's world as its plate, hides what is drawn while the camera moves, and uses the shared step-text values", () => {
    expect(uhCss).toMatch(new RegExp(`\.uh-world \{[^}]*width: ${UH_PLATE.w}px; height: ${UH_PLATE.h}px`));
    expect(uhCss).toMatch(/\.uh-ov\.moving text[^{]*\{ opacity: 0 !important/);
    expect(uhCss).toMatch(/\.uh-title \{[^}]*font: var\(--step-title\)/);
    expect(uhCss).toMatch(/\.uh-text\.twotone \{[^}]*font: var\(--step-text\)/);
    // The drawing's paper takes the page's colour: one white, not two.
    expect(uhCss).toMatch(/\.uh-drawing-plate \{[^}]*mix-blend-mode: multiply/);
  });

  it("sizes chapter 5's world as its plate, and cuts every light at the hand-off", () => {
    expect(swCss).toMatch(new RegExp(`\\.sw-world \\{[^}]*width: ${SW_PLATE.w}px; height: ${SW_PLATE.h}px`));
    expect(swCss).toMatch(
      /\.sw-world\.cut \.sw-lyr, \.sw-world\.cut \.sw-mark, \.sw-world\.cut \.sw-under \{ transition-duration: \.06s/,
    );
  });
});
