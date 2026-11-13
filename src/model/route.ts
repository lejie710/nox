// Hash routes, so the site works on static hosting with no server fallback.
// "#/chapter/<id>" opens a chapter; anything else is the story, and a plain
// "#name" is an anchor inside it (for example "#chapters").
import { CHAPTERS, type ChapterId } from "./chapters";

export type Route = { page: "story"; anchor: string | null } | { page: "chapter"; id: ChapterId };

export function parseRoute(hash: string): Route {
  const m = /^#\/chapter\/([a-z-]+)\/?$/.exec(hash);
  if (m) {
    const c = CHAPTERS.find((x) => x.id === m[1]);
    if (c) return { page: "chapter", id: c.id };
    return { page: "story", anchor: "chapters" };
  }
  const a = /^#([A-Za-z][\w-]*)$/.exec(hash);
  return { page: "story", anchor: a ? a[1] : null };
}

export function chapterHref(id: ChapterId): string {
  return `#/chapter/${id}`;
}
