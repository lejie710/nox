// The app: which page is on show (the main page or one chapter, by the address's hash), how one page gives
// way to the next, and the navigation bar's state on each.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Nav } from "./components/Chrome";
import type { ChapterId } from "./model/chapters";
import { NAV_HEIGHT } from "./model/layout";
import { parseRoute, type Route } from "./model/route";
import { ChapterPage } from "./chapters/ChapterPage";
import { isStill } from "./stage/motion";
import { Closing } from "./scenes/Closing";
import { Hero } from "./scenes/Hero";
import { Story } from "./scenes/Story";
import { MAP_START, TopicMap } from "./scenes/TopicMap";

/**
 * Which part of the main page is at the middle of the viewport: the opening
 * and the story ("night"), the chapter list ("story-end") or the sources
 * ("sources"). Each part carries a marker; IntersectionObserver only, no
 * scroll listeners. The nav's dot follows it.
 */
function useActivePart(initial: string): string {
  const [active, setActive] = useState(initial);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.step ?? initial);
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    document.querySelectorAll<HTMLElement>(".step-marker").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [initial]);
  return active;
}

/**
 * How one page gives way to the next: the old page fades into the night and the
 * new one out of it, and the chapter's name travels between its tab in the chapter list and the chapter's
 * headline. The motion itself is in nox.css ("Page to page").
 */
function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  const current = useRef(route);
  useEffect(() => {
    const on = () => {
      const next = parseRoute(location.hash),
        prev = current.current;
      current.current = next;
      // Only a change of page is a transition; a jump inside the main page is the browser's own.
      const pageChange =
        prev.page !== next.page || (prev.page === "chapter" && next.page === "chapter" && prev.id !== next.id);
      // The View Transition API is in every current engine; without it, or without motion, the swap is instant.
      if (!pageChange || isStill() || !document.startViewTransition) {
        setRoute(next);
        return;
      }
      // flushSync: the new page (and its scroll position, set in a layout effect) must exist when the callback returns.
      const transition = document.startViewTransition(() => flushSync(() => setRoute(next)));
      // The browser skips the animation when the window is hidden or a second page change overtakes the first,
      // and then rejects `ready`. The page has changed all the same, so that is not an error. A failure of the
      // page change itself still surfaces, through `finished`.
      transition.ready.catch(() => {});
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

/** The story, then the topic map and the closing. Mounted only on the story route. */
function Main({ anchor, mapStart }: { anchor: string | null; mapStart: ChapterId }) {
  const active = useActivePart("night");
  // Arriving from a chapter: the anchor's element exists only now.
  useLayoutEffect(() => {
    if (anchor) document.getElementById(anchor)?.scrollIntoView();
  }, [anchor]);
  return (
    <>
      <Nav current={active === "story-end" ? "chapters" : active === "sources" ? "sources" : "night"} />
      <main>
        <Hero />
        <Story />
        <TopicMap start={mapStart} />
        <Closing />
      </main>
    </>
  );
}

/** Follow the light section at the nav's lower edge, including static pages. */
function Chapter({ id }: { id: ChapterId }) {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const section = document.querySelector(".chapter-light");
    if (!section) return;
    // Resize the observer's band with the viewport, so short/narrow windows
    // still switch when the light canvas reaches the navigation bar.
    let io: IntersectionObserver | undefined;
    const observe = () => {
      io?.disconnect();
      const bottom = Math.max(0, window.innerHeight - NAV_HEIGHT - 1);
      io = new IntersectionObserver(([entry]) => setLight(entry.isIntersecting), {
        rootMargin: `-${NAV_HEIGHT}px 0px -${bottom}px 0px`,
      });
      io.observe(section);
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, [id]);
  return (
    <>
      <Nav light={light} current="chapters" />
      <ChapterPage id={id} />
    </>
  );
}

export function App() {
  const route = useRoute();
  // The map reopens on the chapter the reader last opened.
  const [mapStart, setMapStart] = useState<ChapterId>(MAP_START);
  useLayoutEffect(() => {
    const html = document.documentElement;
    if (route.page === "chapter") {
      html.dataset.page = "chapter";
      setMapStart(route.id);
      window.scrollTo(0, 0);
    } else {
      delete html.dataset.page;
    }
  }, [route]);
  if (route.page === "chapter") {
    return <Chapter key={route.id} id={route.id} />;
  }
  return <Main anchor={route.anchor} mapStart={mapStart} />;
}
