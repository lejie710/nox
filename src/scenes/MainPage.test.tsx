// Renders the main page's parts to HTML (no browser needed) and checks what a reader gets: the nav's three
// targets exist, every stop of the story is in the page in order, nothing hidden can be tabbed to, the chapter
// list is a proper set of tabs, and every citation number shown is in the closing's source list.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Nav } from "../components/Chrome";
import { CHAPTERS } from "../model/chapters";
import { sourceNumber } from "../model/sources";
import { STOPS, fit, storySources } from "../model/story";
import { Closing } from "./Closing";
import { Hero } from "./Hero";
import { StepWords, Story, World } from "./Story";
import { TopicMap } from "./TopicMap";

const hero = renderToStaticMarkup(<Hero />);
const story = renderToStaticMarkup(<Story />);
const map = renderToStaticMarkup(<TopicMap />);
const closing = renderToStaticMarkup(<Closing />);
const page = hero + story + map + closing;
const text = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

describe("the main page's navigation", () => {
  it("has a target for each of the nav's three links, and no About link", () => {
    const nav = renderToStaticMarkup(<Nav current="sources" />);
    const hrefs = [...nav.matchAll(/href="(#[a-z]+)"/g)].map((m) => m[1]);
    expect(new Set(hrefs)).toEqual(new Set(["#top", "#chapters", "#sources"]));
    for (const h of new Set(hrefs)) expect(page, h).toContain(`id="${h.slice(1)}"`);
    expect(nav).not.toMatch(/About/);
    // The dot marks exactly one of the three.
    expect(nav.match(/aria-current="location"/g)).toHaveLength(1);
    expect(nav).toMatch(/href="#sources" aria-current="location"/);
  });

  it("marks each part of the page for the nav's dot: the night from the very top, then the chapters, then the sources", () => {
    expect(hero).toContain('data-step="night"');
    expect(story).toContain('data-step="night"');
    expect(map).toContain('data-step="story-end"');
    expect(closing).toContain('data-step="sources"');
  });
});

describe("the story", () => {
  it("has every stop in the page, in order, for a reader who goes through it without scrolling by sight", () => {
    let at = -1;
    for (const s of STOPS) {
      const k = story.indexOf(`${s.time}. ${s.title}`, at + 1);
      expect(k, s.id).toBeGreaterThan(at);
      at = k;
      expect(text(story)).toContain(s.lead);
    }
  });

  it("puts nothing a reader can tab to inside the out-of-sight copies, and makes none of them inert", () => {
    const cards = [...story.matchAll(/<div class="st-card"[^>]*>([\s\S]*?)<\/div>/g)];
    expect(cards).toHaveLength(STOPS.length);
    for (const [whole, inner] of cards) {
      expect(whole).not.toMatch(/inert/);
      expect(inner).not.toMatch(/<button|<a /);
    }
  });

  it("shows no rail of chips and no step count", () => {
    expect(story).not.toMatch(/role="radio"|st-chip|st-rail/);
    expect(text(story)).not.toMatch(/Step \d+ of \d+/);
  });

  it("leads each stop with the night's clock and the state", () => {
    for (let i = 0; i < STOPS.length; i++) {
      const w = text(renderToStaticMarkup(<StepWords i={i} />));
      expect(w.trim().startsWith(`${STOPS[i].time} · ${STOPS[i].state}`), STOPS[i].id).toBe(true);
    }
  });

  it("shows exactly the stop's photograph, and the line only while the lid is shut", () => {
    const t = fit(1366, 708, false);
    STOPS.forEach((s, i) => {
      const w = renderToStaticMarkup(<World i={i} t={t} />);
      expect(w.match(/class="st-plate on"/g), s.id).toHaveLength(1);
      expect(w.match(/class="st-plate[ "]/g), s.id).toHaveLength(5);
      const shut = s.plate === "closed" || s.plate === "awake";
      expect(/class="st-ov on/.test(w), s.id).toBe(shut);
      expect(/class="st-clock on/.test(w), s.id).toBe(s.plate === "open" || s.plate === "dawn");
    });
  });

  it("keeps only the dots on the line when the window is too short for the labels", () => {
    expect(renderToStaticMarkup(<World i={5} t={fit(1100, 460, false)} tight />)).toContain('class="st-ov on tight"');
  });
});

describe("the chapter list", () => {
  it("is one set of six tabs, opening on chapter 1, with a picture and a link for each chapter", () => {
    expect(map.match(/role="tab"/g)).toHaveLength(6);
    expect(map.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(map).toMatch(/id="tab-big-picture"[^>]*aria-selected="true"/);
    expect(map.match(/<img /g)).toHaveLength(6);
    expect(map).toContain('href="#/chapter/big-picture"');
    expect(map).not.toMatch(/Figure:/);
    // The picture is described once, for screen readers, in the panel.
    expect(text(map)).toContain(CHAPTERS[0].figureText);
  });
});

describe("the closing", () => {
  it("lists every source number a citation on the main page shows", () => {
    const listed = new Set([...closing.matchAll(/<li value="(\d+)"/g)].map((m) => Number(m[1])));
    expect(listed).toEqual(new Set(storySources().map(sourceNumber)));
    // The page as rendered shows one stop's words; the other stops' citations are checked from their own words.
    const all = page + STOPS.map((_, i) => renderToStaticMarkup(<StepWords i={i} />)).join("");
    const shown = [...all.matchAll(/class="cite"[^>]*>([\d, ]+)</g)].flatMap((m) =>
      m[1].split(",").map((n) => Number(n.trim())),
    );
    expect(shown.length).toBeGreaterThan(10);
    for (const n of shown) expect(listed.has(n), `source ${n}`).toBe(true);
  });

  it("has no About block, and ends with the one line every page ends with", () => {
    expect(closing).not.toMatch(/About/);
    expect(text(closing)).toContain("Not affiliated with or endorsed by any employer or vendor.");
  });
});
