// Hash routes: a chapter address opens that chapter, anything else is the main page and its anchors.
import { describe, expect, it } from "vitest";
import { CHAPTERS } from "./chapters";
import { chapterHref, parseRoute } from "./route";

describe("routes", () => {
  it("opens a chapter, with or without a trailing slash", () => {
    expect(parseRoute("#/chapter/big-picture")).toEqual({ page: "chapter", id: "big-picture" });
    expect(parseRoute("#/chapter/big-picture/")).toEqual({ page: "chapter", id: "big-picture" });
  });

  it("opens every chapter in the list, and sends an unknown one to the topic map", () => {
    for (const c of CHAPTERS) expect(parseRoute(`#/chapter/${c.id}`)).toEqual({ page: "chapter", id: c.id });
    expect(parseRoute("#/chapter/thermal")).toEqual({ page: "story", anchor: "chapters" });
  });

  it("treats anything else as the story, keeping a plain anchor", () => {
    expect(parseRoute("")).toEqual({ page: "story", anchor: null });
    expect(parseRoute("#chapters")).toEqual({ page: "story", anchor: "chapters" });
    expect(parseRoute("#top")).toEqual({ page: "story", anchor: "top" });
    expect(parseRoute("#/elsewhere")).toEqual({ page: "story", anchor: null });
    expect(parseRoute("#<img>")).toEqual({ page: "story", anchor: null });
  });

  it("round-trips every chapter link", () => {
    for (const c of CHAPTERS) expect(parseRoute(chapterHref(c.id))).toEqual({ page: "chapter", id: c.id });
  });
});
