// Renders the chapter-1 page to HTML (no browser needed) and checks what a
// reader would see: every citation number is in the page's source list, no
// chip vendor is named, and the sandbox opens on S3 with power lost.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChapterPage } from "./ChapterPage";
import { Labels, TurnWords } from "./SleepWake";
import {
  MARK_IDS,
  fire as swFire,
  fit as swFit,
  initialTurn,
  nextBeat,
  pick as swPick,
  sleepNow,
  toggleArm,
  turnView,
  type Turn,
} from "../model/sleepWake";
import { PARTS } from "../model/board";
import { Buttons as UhButtons, TurnWords as UhTurnWords } from "./UnderHood";
import {
  FIND_IDS,
  STOPS as UH_STOPS,
  TABLE_IDS as UH_TABLES,
  THREAD_IDS as UH_THREADS,
  fit as uhFit,
  initialTurn as uhInitial,
  press as uhPress,
  turnView as uhTurnView,
  type Action as UhAction,
} from "../model/underHood";

const html = renderToStaticMarkup(<ChapterPage id="big-picture" />);
const text = html.replace(/<[^>]+>/g, " ");

describe("chapter 1 page", () => {
  it("offers a named hotspot button for each part on both boards", () => {
    const buttons = [...html.matchAll(/<button\b[^>]*class="board-hotspot"[^>]*>/g)].map((m) => m[0]);
    expect(buttons).toHaveLength(12);
    for (const part of Object.values(PARTS)) {
      expect(buttons.filter((button) => button.includes(`aria-label="${part.name}"`))).toHaveLength(2);
    }
  });

  it("puts the sandbox board before dawn and keeps the reference cards in the light part", () => {
    const sandbox = html.indexOf('class="sandbox"');
    const dawn = html.indexOf('class="chapter-dawn"');
    const light = html.indexOf('class="chapter-light"');
    expect(sandbox).toBeGreaterThan(html.indexOf('class="board-scrolly"'));
    expect(sandbox).toBeLessThan(dawn);
    expect(dawn).toBeLessThan(light);
    expect(html.indexOf('class="sandbox-board"')).toBeLessThan(dawn);
    expect(html.indexOf('class="field-cards"')).toBeGreaterThan(light);
    expect(html).not.toContain('class="verdict-mark"');
  });

  it("lists every cited number in its sources", () => {
    const cited = new Set(
      [...html.matchAll(/aria-label="Sources ([\d, ]+):/g)].flatMap((m) => m[1].split(", ").map(Number)),
    );
    const listed = new Set([...html.matchAll(/<li value="(\d+)"/g)].map((m) => Number(m[1])));
    expect(cited.size).toBeGreaterThan(0);
    for (const n of cited) expect(listed.has(n), `source ${n}`).toBe(true);
  });

  it("names no chip vendor anywhere on the page", () => {
    expect(text).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
  });

  it("opens the sandbox on S3 with all power lost: the session is lost", () => {
    expect(text).toContain("The session is lost.");
    expect(html).toContain('<input type="radio" name="sb-state" checked="" value="s3"/>');
    expect(html).toContain('<input type="radio" name="sb-event" checked="" value="powerLost"/>');
  });
});

describe("chapter 2 page", () => {
  const html2 = renderToStaticMarkup(<ChapterPage id="modern-standby" />);
  const text2 = html2.replace(/<[^>]+>/g, " ");

  it("shows eight steps as a radio rail, the last one the reader's turn", () => {
    expect([...html2.matchAll(/role="radio"[^>]*class="ms-chip/g)]).toHaveLength(8);
    expect(text2).toContain("Your turn");
  });

  it("draws one halo with four rings and labels every condition on it", () => {
    expect([...html2.matchAll(/class="ms-ring[ "]/g)]).toHaveLength(4);
    for (const name of [
      "Background tasks",
      "Devices outside the SoC",
      "Network and radio",
      "Host controllers",
      "CPU and GPU",
    ])
      expect(text2).toContain(name);
    expect(html2).not.toContain("board-picture");
  });

  it("opens on step 1, out of DRIPS, with every step's words in the scrolling cards", () => {
    expect(text2).toContain("The SoC: out of DRIPS");
    expect([...html2.matchAll(/class="ms-card"/g)]).toHaveLength(8);
  });

  it("lists every cited number in its sources", () => {
    const cited = new Set(
      [...html2.matchAll(/aria-label="Sources ([\d, ]+):/g)].flatMap((m) => m[1].split(", ").map(Number)),
    );
    const listed = new Set([...html2.matchAll(/<li value="(\d+)"/g)].map((m) => Number(m[1])));
    expect(cited.size).toBeGreaterThan(0);
    for (const n of cited) expect(listed.has(n), `source ${n}`).toBe(true);
  });

  it("describes its own illustrative plates in the footer, not chapter 1's board", () => {
    expect(text2).toContain("illustrative generated plates");
    expect(text2).not.toContain("board picture");
  });

  it("puts the five toggles for the reader's turn in the step 8 card, with the instruction", () => {
    const card = html2.slice(html2.lastIndexOf('class="ms-card"'));
    expect([...card.matchAll(/<button[^>]*class="ms-key-chip"[^>]*aria-pressed="false"/g)]).toHaveLength(5);
    expect(card).toContain("Select a condition to keep it busy");
  });

  it("links back to chapter 1's names table", () => {
    expect(html2).toContain('href="#/chapter/big-picture"');
    expect(text2).toContain("names table");
  });

  it("names no chip vendor and does not use the vendor term S0ix", () => {
    expect(text2).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
    expect(text2).not.toMatch(/S0ix/i);
  });
});

describe("chapter 3 page", () => {
  const html3 = renderToStaticMarkup(<ChapterPage id="device-power" />);
  const text3 = html3.replace(/<[^>]+>/g, " ");

  it("shows eight steps as a radio rail, the last one the reader's turn", () => {
    expect([...html3.matchAll(/role="radio"[^>]*class="dp-chip/g)]).toHaveLength(8);
    expect(text3).toContain("Your turn");
  });

  it("draws the four followed flats on the plate, with a corridor light per level", () => {
    expect([...html3.matchAll(/class="dp-flat/g)]).toHaveLength(4);
    expect([...html3.matchAll(/class="dp-level/g)]).toHaveLength(3);
  });

  it("carries the caveat line before the scene and its own note in the footer", () => {
    const caveat = html3.indexOf("An illustrative building, not a real one");
    expect(caveat).toBeGreaterThan(0);
    expect(caveat).toBeLessThan(html3.indexOf('class="dp-scene"'));
    expect(text3).toContain("illustrative generated images, not photographs of a real building");
  });

  it("puts the reader's controls in the step 8 card for narrow screens", () => {
    const card = html3.slice(html3.lastIndexOf('class="dp-card"'));
    expect([...card.matchAll(/<button[^>]*class="dp-ctl[^"]*inline/g)]).toHaveLength(6);
    expect(card).toContain("Send a packet and a touch");
    expect(card).toContain("Start the night again");
  });

  it("shows the same flat by day after dawn, as one labelled figure", () => {
    const dawn = html3.indexOf('class="chapter-dawn"');
    const bay = html3.indexOf('class="bay-block"');
    expect(bay).toBeGreaterThan(dawn);
    expect(html3).toMatch(/<svg[^>]*role="img"[^>]*aria-labelledby="bay-row-t bay-row-d"/);
    expect([...html3.matchAll(/class="bay-panel"/g)]).toHaveLength(4);
  });

  it("lists every cited number in its sources", () => {
    const cited = new Set(
      [...html3.matchAll(/aria-label="Sources ([\d, ]+):/g)].flatMap((m) => m[1].split(", ").map(Number)),
    );
    const listed = new Set([...html3.matchAll(/<li value="(\d+)"/g)].map((m) => Number(m[1])));
    expect(cited.size).toBeGreaterThan(0);
    for (const n of cited) expect(listed.has(n), `source ${n}`).toBe(true);
  });

  it("names no chip vendor and does not use the vendor term S0ix", () => {
    expect(text3).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
    expect(text3).not.toMatch(/S0ix/i);
  });
});

describe("chapter 4 page", () => {
  const html4 = renderToStaticMarkup(<ChapterPage id="cpu-power" />);
  const text4 = html4.replace(/<[^>]+>/g, " ");

  it("shows the night's nine chips plus the way into the day", () => {
    // Night group: eight steps, Your turn, and the "By day" chip that crosses over.
    expect([...html4.matchAll(/role="radio"[^>]*class="cp-chip/g)]).toHaveLength(10);
    // The crossing chip is an arrow chip: its name starts with its visible text, it carries no number.
    expect(html4).toContain('aria-label="By day: on to the daytime steps"');
    expect([...html4.matchAll(/class="cp-chip-n"/g)]).toHaveLength(9);
    expect(html4).toMatch(
      /class="cp-chip cp-chip-cross"[^>]*><span class="cp-chip-label">By day<span aria-hidden="true"> →<\/span>/,
    );
    expect(text4).toContain("Your turn");
  });

  it("draws eight tiles on the die and the day's ink in the same figure, on the bench itself and not on paper", () => {
    expect(html4).not.toContain("cp-paper");
    expect(html4).not.toContain("cp-tape");
    // The levels are outlined on the die: core 0, cluster 0, system.
    expect([...html4.matchAll(/class="cp-ink-w"/g)]).toHaveLength(3);
    expect([...html4.matchAll(/class="cp-tile( neighbour)?"/g)]).toHaveLength(8);
    expect(html4).toContain('class="cp-pr"');
    expect(html4).toContain('class="cp-dr"');
    expect(html4).toContain('class="cp-cd"');
    expect(
      [...html4.matchAll(/class="cp-part[^"]*" data-p="(\d+)"/g)].map((m) => Number(m[1])).sort((a, b) => a - b),
    ).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("observes one marker per step and the dawn span", () => {
    expect([...html4.matchAll(/class="cp-marker/g)]).toHaveLength(21);
    // Twelve day markers: the six that end a narrow-screen stop, and six that only wide screens use.
    expect([...html4.matchAll(/class="cp-marker day"/g)]).toHaveLength(6);
    expect([...html4.matchAll(/class="cp-marker day cp-nostop"/g)]).toHaveLength(6);
  });

  it("keeps the wide screen's day as it was: twelve steps of words, the idle period as drawn", () => {
    // Rendered wide (the server has no window): every card is one step, none is a stop of several.
    expect(html4).not.toContain("cp-stop-step");
    expect([...text4.matchAll(/By day, (\d+) of 12/g)].map((m) => Number(m[1]))).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(text4).not.toMatch(/By day, \d+ of 6/);
    // The idle period is not stretched: its top line is at 1300 and its name is on one line.
    expect(html4).toContain('<tspan class="b">Minimum residency</tspan>');
    expect(html4).toMatch(/<line class="cp-ink-thin cp-draw" pathLength="1" x1="190" y1="1432" x2="1440" y2="1432"/);
    expect([...html4.matchAll(/class="cp-dawn-span"/g)]).toHaveLength(1);
  });

  it("carries the caveat line before the scene and its own note in the footer", () => {
    const caveat = html4.indexOf("An illustrative, fictional processor on a test bench");
    expect(caveat).toBeGreaterThan(0);
    expect(caveat).toBeLessThan(html4.indexOf('class="cp-scene"'));
    expect(text4).toContain("illustrative generated images of a fictional chip");
  });

  it("gives the day in words for screen readers, with the combinations and the scales' values", () => {
    const desc = html4.slice(html4.indexOf('id="cp-day-desc"'));
    expect(desc).toContain("running, clock gate, power down");
    expect(desc).toContain("P0 650 MHz, 21.5 W, only when docked");
    expect(desc).toContain("Lowest nonlinear");
  });

  it("lists every cited number in its sources", () => {
    const cited = new Set(
      [...html4.matchAll(/aria-label="Sources ([\d, ]+):/g)].flatMap((m) => m[1].split(", ").map(Number)),
    );
    const listed = new Set([...html4.matchAll(/<li value="(\d+)"/g)].map((m) => Number(m[1])));
    expect(cited.size).toBeGreaterThan(0);
    for (const n of cited) expect(listed.has(n), `source ${n}`).toBe(true);
  });

  it("names no chip vendor and does not use the vendor term S0ix", () => {
    expect(text4).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm|MWAIT|HWP)\b/);
    expect(text4).not.toMatch(/S0ix/i);
  });
});

describe("chapter 5 page", () => {
  const html5 = renderToStaticMarkup(<ChapterPage id="sleep-wake" />);
  const text5 = html5.replace(/<[^>]+>/g, " ");

  it("shows nine steps as a radio rail: eight stops, then the reader's turn", () => {
    expect([...html5.matchAll(/role="radio"[^>]*class="sw-chip/g)]).toHaveLength(9);
    expect([...html5.matchAll(/class="sw-chip-label">([^<]+)</g)].map((m) => m[1])).toEqual([
      "Sleep",
      "Arming",
      "Devices",
      "SLP_EN",
      "Asleep",
      "Button",
      "Firmware",
      "OS back",
      "Your turn",
    ]);
    expect([...html5.matchAll(/role="radio" aria-checked="(true|false)"/g)].map((m) => m[1])).toEqual([
      "true",
      ...Array(8).fill("false"),
    ]);
    expect([...html5.matchAll(/class="sw-marker/g)]).toHaveLength(9);
    expect([...html5.matchAll(/class="sw-dawn-span"/g)]).toHaveLength(1);
    expect(text5).toContain("Your turn");
  });

  it("opens on step 1: the display, the white light and the ring lit; no amber, no moon, no point of light", () => {
    const world = html5.slice(html5.indexOf('class="sw-world'), html5.indexOf('class="sw-shade"'));
    // In order: display, early moon, late moon, white, amber, ring.
    expect([...world.matchAll(/<img class="sw-lyr[^"]*"[^>]*opacity:([\d.]+)/g)].map((m) => Number(m[1]))).toEqual([
      1, 0, 0, 1, 0, 1,
    ]);
    expect([...world.matchAll(/class="sw-mark"/g)]).toHaveLength(MARK_IDS.length);
    expect(world).not.toMatch(/class="sw-(mark|under) /);
    expect(text5).toContain("Step 1 of 8");
    expect(text5).toContain("on: the OS is running");
  });

  it("writes one bare label on the figure at step 1 and no button, and the labels can be read", () => {
    const labels = html5.slice(html5.indexOf('class="sw-labels"'), html5.indexOf('class="sw-paper"'));
    expect([...labels.matchAll(/class="sw-lb/g)]).toHaveLength(1);
    expect(labels).not.toContain("<button");
    expect(labels).not.toContain('aria-hidden="true"');
  });

  it("carries the caveat line before the scene and its own note in the footer", () => {
    const caveat = html5.indexOf("An illustrative desktop that supports S3");
    expect(caveat).toBeGreaterThan(0);
    expect(caveat).toBeLessThan(html5.indexOf('class="sw-scene"'));
    expect(text5).toContain(
      "The light in the case, the points of light, the moonlight and the times are teaching devices",
    );
  });

  it("keeps the facts the merge to eight stops moved into the reference part", () => {
    const ref = html5.slice(html5.indexOf('class="chapter-light'));
    for (const fact of [
      "cleared by writing 1",
      "caches flushed",
      "then PM1b if there is one",
      "reads the preserved",
      "64-bit waking vector first",
      "The platform must assume",
      "AML cannot write them",
    ])
      expect(ref, fact).toContain(fact);
    for (const row of ["S1", "S2, S3", "S4 (OS-initiated)", "S4BIOS", "S5", "S0 idle"])
      expect(ref, row).toContain(`<th scope="row">${row}</th>`);
  });

  // Your turn is not in the first render (the page opens on step 1), so its controls are rendered here, phase by phase.
  const acts = { arm: () => {}, sleep: () => {}, fire: () => {}, pick: () => {} };
  const stage = (t: Turn, narrow: boolean) => {
    const v = turnView(t);
    return renderToStaticMarkup(
      <Labels
        labels={v.labels}
        bits={v.bits}
        t={narrow ? swFit(390, 354, true) : swFit(1366, 708, false)}
        narrow={narrow}
        acts={acts}
        done={t.phase === "done"}
      />,
    );
  };
  const VOID = new Set(["img", "br", "input", "hr", "line", "circle"]);
  /** The open ancestors of the first `needle` that hide it from assistive technology. */
  const hidingAncestors = (html: string, needle: string) => {
    const open: string[] = [];
    for (const m of html.slice(0, html.indexOf(needle)).matchAll(/<(\/)?([a-z0-9]+)([^>]*?)(\/)?>/g)) {
      if (m[1]) open.pop();
      else if (!m[4] && !VOID.has(m[2])) open.push(m[3]);
    }
    return open.filter((attrs) => /aria-hidden="true"|\binert\b/.test(attrs));
  };
  const asleep = sleepNow(toggleArm(initialTurn(), "net"));
  const find = [0, 1, 2].reduce((t) => nextBeat(t), swFire(asleep, "net"));

  it("puts every Your turn control in the named group, outside any hidden container, wide and narrow", () => {
    expect(find.phase).toBe("find");
    for (const narrow of [false, true]) {
      const arm = stage(initialTurn(), narrow),
        sleeping = stage(asleep, narrow),
        bits = stage(find, narrow);
      expect(arm).toContain('class="sw-labels" role="group" aria-label="On the machine"');
      // Three toggles and Sleep; the power button is a label, never a control.
      expect([...arm.matchAll(/<button/g)], `arm ${narrow}`).toHaveLength(4);
      expect([...arm.matchAll(/aria-pressed="(true|false)"/g)].map((m) => m[1])).toEqual(["true", "false", "false"]);
      expect(arm).toMatch(/Power button[\s\S]*always wakes: nothing to arm/);
      expect([...sleeping.matchAll(/<button/g)], `asleep ${narrow}`).toHaveLength(4);
      expect([...bits.matchAll(/<button/g)], `find ${narrow}`).toHaveLength(4);
      for (const [html, first] of [
        [arm, "<button"],
        [sleeping, "<button"],
        [bits, "<button"],
      ] as const)
        expect(hidingAncestors(html, first)).toEqual([]);
      // Narrow: every button shares one group at the foot of the figure; none is placed by a plate position.
      if (narrow) expect(arm).not.toMatch(/<button[^>]*style=/);
    }
  });

  it("keeps the answered bits readable and focusable, and shows the bit the network card latched", () => {
    const html = stage(find, false);
    expect(html).toMatch(/GPE: network<\/b>[\s\S]*?<i class="hot">set<\/i>/);
    expect([...html.matchAll(/>(set|clear)</g)].map((m) => m[1])).toEqual(["clear", "clear", "set", "clear"]);
    const done = swPick(find, "net");
    expect(done.phase).toBe("done");
    const after = stage(done, false);
    expect([...after.matchAll(/aria-disabled="true"/g)]).toHaveLength(4);
    expect(after).not.toMatch(/<button[^>]* disabled/);
  });

  it("shows the verdict, Start again and the closing rule in the words once the reader has answered", () => {
    const done = swPick(find, "net");
    const words = renderToStaticMarkup(<TurnWords turn={done} view={turnView(done)} onReset={() => {}} />).replace(
      /<[^>]+>/g,
      " ",
    );
    expect(words).toMatch(/Yes: GPE: network\./);
    expect(words).toContain("the screen stayed dark: on Windows an automatic wake leaves the display off");
    expect(words).toContain("Start again");
    expect(words).toMatch(/The rule\.[\s\S]*WAK_STS\s+has no enable/);
    // While it sleeps there is nothing to start again from the arming phase.
    const arming = renderToStaticMarkup(
      <TurnWords turn={initialTurn()} view={turnView(initialTurn())} onReset={() => {}} />,
    );
    expect(arming).not.toContain("sw-again");
  });

  it("lists every cited number in its sources", () => {
    const cited = new Set(
      [...html5.matchAll(/aria-label="Sources ([\d, ]+):/g)].flatMap((m) => m[1].split(", ").map(Number)),
    );
    const listed = new Set([...html5.matchAll(/<li value="(\d+)"/g)].map((m) => Number(m[1])));
    expect(cited.size).toBeGreaterThan(0);
    for (const n of cited) expect(listed.has(n), `source ${n}`).toBe(true);
  });

  it("names no chip vendor and does not use the vendor term S0ix", () => {
    expect(text5).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
    expect(text5).not.toMatch(/S0ix/i);
  });
});

describe("chapter 6 page", () => {
  const html6 = renderToStaticMarkup(<ChapterPage id="under-the-hood" />);
  const text6 = html6.replace(/<[^>]+>/g, " ");

  it("shows eight steps as a radio rail: seven stops, then the reader's turn", () => {
    expect([...html6.matchAll(/role="radio"[^>]*class="uh-chip/g)]).toHaveLength(8);
    expect([...html6.matchAll(/class="uh-chip-label">([^<]+)</g)].map((m) => m[1])).toEqual([
      "Found",
      "Followed",
      "Branched",
      "Bytes",
      "Loaded",
      "Added",
      "Evaluated",
      "Your turn",
    ]);
    expect([...html6.matchAll(/role="radio" aria-checked="(true|false)"/g)].map((m) => m[1])).toEqual([
      "true",
      ...Array(7).fill("false"),
    ]);
    expect([...html6.matchAll(/class="uh-marker/g)]).toHaveLength(8);
    expect([...html6.matchAll(/class="uh-dawn-span"/g)]).toHaveLength(1);
  });

  it("opens with every table on the memory as a dim amber span, and only the RSDP reached", () => {
    const world = html6.slice(html6.indexOf('class="uh-world"'), html6.indexOf('class="uh-shade"'));
    // The firmware left all of them; the OS has reached one.
    expect([...world.matchAll(/class="uh-span[^"]*"/g)]).toHaveLength(UH_TABLES.length);
    expect([...world.matchAll(/class="uh-span on"/g)]).toHaveLength(1);
    expect([...world.matchAll(/class="uh-thr[^"]* on"/g)]).toHaveLength(1);
    expect([...world.matchAll(/<path class="uh-thr/g)]).toHaveLength(UH_THREADS.length);
    // No name of the tree, no bytes and no power before their stops.
    expect(world).not.toMatch(/class="uh-name[^"]* on/);
    expect(world).toContain('class="uh-strip"');
    expect(world).not.toMatch(/class="uh-(glow|led) on"/);
    // The picture and everything drawn on it is hidden from screen readers; the words carry it.
    expect(world).toMatch(/^class="uh-world" aria-hidden="true"/);
    // The night and dawn photographs of the same frame.
    expect([...world.matchAll(/<img class="uh-plate/g)]).toHaveLength(2);
  });

  it("gives each stop its words in a card, with the caveat before the scene and no buttons outside the reader's turn", () => {
    for (const s of UH_STOPS) expect(text6, s.id).toContain(s.title);
    expect([...html6.matchAll(/class="uh-card"/g)]).toHaveLength(8);
    const caveat = html6.indexOf("An illustrative laptop taken apart");
    expect(caveat).toBeGreaterThan(-1);
    expect(caveat).toBeLessThan(html6.indexOf('class="uh-scene"'));
    expect(html6).not.toContain('class="uh-labels');
    // The three pairs of stop 4 are said in words for a reader who cannot see the figure.
    expect(text6).toMatch(/Scope \(\\_SB\)\s+became\s+10 ·· 5C _SB_/);
    expect(text6).toMatch(/Method \(_ON\)\s+became\s+14 ·· _ON_/);
    expect(text6).toMatch(/CT01 = Ones\s+became\s+70 FF CT01/);
  });

  it("keeps the reference part in the chapter's own world: the same machine by day, then the tables, the field and the comparison", () => {
    const light = html6.slice(html6.indexOf('class="chapter-light uh-light"'));
    expect(light.indexOf('class="uh-drawing"')).toBeGreaterThan(-1);
    expect(light.indexOf('class="uh-drawing"')).toBeLessThan(light.indexOf('class="names uh-table"'));
    expect(light.indexOf('class="names uh-table"')).toBeLessThan(light.indexOf('class="field-cards"'));
    expect(light).toMatch(/<svg class="uh-draw-ov"[^>]*role="img" aria-label="The taken-apart laptop by day/);
    // The drawing shows the seven tables the OS knows, not the one it ignores.
    expect([...light.matchAll(/class="d-span"/g)]).toHaveLength(UH_TABLES.length - 1);
    expect(light).toContain("<code>FACP</code>");
    expect(text6).toContain("iasl -e ssdt?.* -d dsdt.dat");
    expect(text6).toContain("asl /tab=DSDT");
  });

  it("uses no placeholder wording, and says the images are generated", () => {
    expect(text6).not.toMatch(/stand-in|mockup/i);
    // The page's own prose keeps the model's wording rules: the firmware writes, it never runs a method.
    expect(text6).not.toMatch(/firmware (runs|evaluates|executes)|byte ?code/i);
    expect(text6).toContain("illustrative generated images");
  });

  const stage6 = (acts: UhAction[], narrow: boolean) => {
    const t = acts.reduce(uhPress, uhInitial()),
      view = uhTurnView(t);
    return renderToStaticMarkup(
      <UhButtons
        view={view}
        t={uhFit(view.frame, narrow ? 390 : 1366, narrow ? 388 : 708, narrow)}
        narrow={narrow}
        held={false}
        onPress={() => {}}
      />,
    );
  };

  it("renders the reader's turn as buttons on the machine: six tables, then three methods and the part", () => {
    for (const narrow of [false, true]) {
      const find = stage6([], narrow),
        run = stage6(["rsdp", "xsdt", "facp", "dsdt"], narrow);
      expect(find).toContain('class="uh-labels" role="group" aria-label="On the machine"');
      expect(
        [...find.matchAll(/<button type="button" class="uh-lb[^"]*" data-act="([a-z0-9]+)"/g)].map((m) => m[1]),
      ).toEqual(FIND_IDS);
      expect(find).not.toContain('data-act="part"');
      // The methods in the figure's order, then the part itself, last in the tab order.
      expect([...run.matchAll(/data-act="([a-z]+)"/g)].map((m) => m[1])).toEqual(["sta", "off", "on", "part"]);
      expect(run).toContain('aria-label="The part itself (the SSD)"');
      // Narrow: one group at the figure's foot; wide: each button at its place on the machine.
      expect(find.includes('class="uh-btns"')).toBe(narrow);
      expect(/class="uh-lb" data-act="rsdp" style="left:/.test(find)).toBe(!narrow);
      expect(find).not.toMatch(/aria-hidden="true"/);
    }
    // A table already read is marked.
    expect(stage6(["rsdp"], false)).toMatch(/class="uh-lb done" data-act="rsdp"/);
  });

  it("shows the reply and Start again in the words once the reader has pressed something", () => {
    const fresh = renderToStaticMarkup(
      <UhTurnWords turn={uhInitial()} view={uhTurnView(uhInitial())} onReset={() => {}} />,
    );
    expect(fresh).toContain("Find your way to the DSDT.");
    expect(fresh).not.toContain("uh-again");
    const wrong = uhPress(uhInitial(), "dsdt");
    const words = renderToStaticMarkup(
      <UhTurnWords turn={wrong} view={uhTurnView(wrong)} onReset={() => {}} />,
    ).replace(/<[^>]+>/g, " ");
    expect(words).toContain("Still dark.");
    const one = uhPress(uhInitial(), "rsdp");
    const after = renderToStaticMarkup(<UhTurnWords turn={one} view={uhTurnView(one)} onReset={() => {}} />);
    expect(after).toContain("uh-again");
    expect(after).toContain("<code>RSD PTR </code>");
  });

  it("lists every cited number in its sources", () => {
    const cited = new Set(
      [...html6.matchAll(/aria-label="Sources ([\d, ]+):/g)].flatMap((m) => m[1].split(", ").map(Number)),
    );
    const listed = new Set([...html6.matchAll(/<li value="(\d+)"/g)].map((m) => Number(m[1])));
    expect(cited.size).toBeGreaterThan(0);
    for (const n of cited) expect(listed.has(n), `source ${n}`).toBe(true);
  });

  it("names no chip vendor and does not use the vendor term S0ix", () => {
    expect(text6).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
    expect(text6).not.toMatch(/S0ix/i);
  });

  it("is the last chapter: it offers the way back to all chapters and no next one", () => {
    expect(html6).toContain('<a href="#chapters">All chapters</a>');
    expect(text6).not.toContain("Next:");
  });
});
