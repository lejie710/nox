// The offline half of the citation check (the online half is scripts/check-links.mjs). It renders every page
// to HTML and checks the source list and the citation markers against each other, so it runs with the tests
// and needs no network.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChapterPage } from "./chapters/ChapterPage";
import { CHAPTERS } from "./model/chapters";
import { SOURCE_LIST } from "./model/sources";
import { Closing } from "./scenes/Closing";
import { Hero } from "./scenes/Hero";
import { Story } from "./scenes/Story";
import { TopicMap } from "./scenes/TopicMap";

/** The three public sites the project takes its sources from. */
const PUBLIC_SITES = ["uefi.org", "learn.microsoft.com", "docs.kernel.org"];

const pages: Record<string, string> = {
  main: renderToStaticMarkup(
    <>
      <Hero />
      <Story />
      <TopicMap />
      <Closing />
    </>,
  ),
  ...Object.fromEntries(CHAPTERS.map((c) => [c.id, renderToStaticMarkup(<ChapterPage id={c.id} />)])),
};
/** The source numbers of every citation marker on a page, one entry per marker. */
const markers = (html: string) =>
  [...html.matchAll(/class="cite" aria-label="Sources ([\d, ]+):/g)].map((m) => m[1].split(", ").map(Number));

/** The source numbers in a page's closing list of sources. */
const listed = (html: string) => [...html.matchAll(/<li value="(\d+)">/g)].map((m) => Number(m[1]));

describe("the source list", () => {
  it("names each source once, with a secure address on one of the three public sites", () => {
    expect(new Set(SOURCE_LIST.map((s) => s.id)).size).toBe(SOURCE_LIST.length);
    for (const s of SOURCE_LIST) {
      const u = new URL(s.url);
      expect(u.protocol, s.id).toBe("https:");
      expect(PUBLIC_SITES, s.id).toContain(u.host);
      expect(s.title.trim(), s.id).not.toBe("");
      expect(s.where.trim(), s.id).not.toBe("");
    }
  });
});

describe("citations on the pages", () => {
  it("renders the main page and all six chapters with citation markers", () => {
    expect(Object.keys(pages)).toHaveLength(7);
    for (const [name, html] of Object.entries(pages)) expect(markers(html).length, name).toBeGreaterThan(0);
  });

  it("gives every marker at least one source: no marker is empty", () => {
    // An unknown id already fails the render. A marker with no ids renders too, with nothing in it:
    // find every marker by its class, whatever its label says, and require a numbered label on each.
    for (const [name, html] of Object.entries(pages)) {
      const labels = [...html.matchAll(/class="cite" aria-label="([^"]*)"/g)].map((m) => m[1]);
      expect(labels.length, name).toBe(markers(html).length);
      for (const label of labels) expect(label, name).toMatch(/^Sources \d+(, \d+)*: \S/);
    }
  });

  it("lists, at the end of each page, every source a marker on that page names", () => {
    for (const [name, html] of Object.entries(pages)) {
      const end = new Set(listed(html));
      for (const n of markers(html).flat())
        expect(end.has(n), `${name}: source ${n} is cited but not listed`).toBe(true);
    }
  });

  it("uses every source in the list on some page: the list holds no source nothing cites", () => {
    // A page's closing list also names the sources of the steps and states that are not on screen at first.
    const used = new Set(Object.values(pages).flatMap((html) => [...markers(html).flat(), ...listed(html)]));
    const unused = SOURCE_LIST.filter((_, i) => !used.has(i + 1)).map((s) => s.id);
    expect(unused).toEqual([]);
  });
});
