// What the pinned scenes share besides their steps (useStepScroll): measuring the view the picture is fitted
// to, timers that a step change cancels, work that follows the scroll once per frame, and the two ways a
// scene hands over to the light part of its page (a fade at its lower edge, or a dawn).
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type DependencyList, type RefObject } from "react";
import { NARROW, NAV_HEIGHT, clamp01 } from "../model/layout";
import { isStill } from "./motion";

/** A view's size in CSS pixels. */
export interface ViewSize {
  vw: number;
  vh: number;
}

/**
 * The size of the element a picture is fitted to, and whether the window is narrow. Measured before the
 * first paint and again whenever the element changes size. `first` is the size assumed until then, which
 * is also what a page rendered on a server is drawn for.
 */
export function useViewSize(view: RefObject<HTMLElement | null>, first: ViewSize) {
  const [size, setSize] = useState(first);
  const [narrow, setNarrow] = useState(false);
  useLayoutEffect(() => {
    const el = view.current;
    if (!el) return;
    const measure = () => {
      setSize({ vw: el.clientWidth, vh: el.clientHeight });
      setNarrow(window.innerWidth < NARROW);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);
  return { size, narrow };
}

/**
 * useViewSize for a stage whose picture starts under a rail that may wrap (chapters 3 and 4). Before each
 * measurement the rail's lower edge is given to the stylesheet as `--rail-b` on the stage (and on the scene
 * around it when `onSceneToo`, for a track that starts under the pinned picture). `reflow` is true from a
 * measurement until two frames after it, so the picture takes its new frame at once, without sliding.
 * `short` is a narrow window no taller than 600 px (a phone on its side).
 */
export function useRailedViewSize(
  view: RefObject<HTMLElement | null>,
  stage: RefObject<HTMLElement | null>,
  rail: RefObject<HTMLElement | null>,
  first: ViewSize,
  onSceneToo = false,
) {
  const [size, setSize] = useState(first);
  const [narrow, setNarrow] = useState(false);
  const [short, setShort] = useState(false);
  const [reflow, setReflow] = useState(true);
  useLayoutEffect(() => {
    const el = view.current,
      st = stage.current,
      r = rail.current;
    if (!el || !st || !r) return;
    const measure = () => {
      setReflow(true);
      const railBottom = `${r.offsetTop + r.offsetHeight}px`;
      st.style.setProperty("--rail-b", railBottom);
      if (onSceneToo) st.parentElement?.style.setProperty("--rail-b", railBottom);
      setSize({ vw: el.clientWidth, vh: el.clientHeight });
      setNarrow(window.innerWidth < NARROW);
      setShort(window.innerWidth < NARROW && window.innerHeight <= 600);
      requestAnimationFrame(() => requestAnimationFrame(() => setReflow(false)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(r);
    return () => ro.disconnect();
  }, [view, stage, rail, onSceneToo]);
  return { size, narrow, short, reflow };
}

/**
 * Timers that belong to one moment of a scene: `later` starts one, `clear` cancels all that are still
 * waiting (a step change does), and leaving the page cancels them too.
 */
export function useTimers() {
  const timers = useRef<number[]>([]);
  const clear = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  }, []);
  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => clear, [clear]);
  return { later, clear };
}

/**
 * The line a screen reader hears. `announce` empties it and writes the new message a moment later, so the
 * same message said twice is still spoken twice. `status` goes in the scene's role="status" element.
 */
export function useAnnouncer(later: (ms: number, fn: () => void) => void) {
  const [status, setStatus] = useState("");
  const announce = useCallback(
    (message: string) => {
      setStatus("");
      later(60, () => setStatus(message));
    },
    [later],
  );
  return { status, announce };
}

/**
 * Runs `read` now, and then at most once per animation frame while the page scrolls or the window is
 * resized. Nothing runs on a still page. Starts over when `deps` change, like an effect.
 */
export function useScrollFrame(read: () => void, deps: DependencyList) {
  useEffect(() => {
    if (isStill()) return;
    let frame = 0;
    const run = () => {
      frame = 0;
      read();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(run);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    run();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the caller lists what `read` uses, and ESLint checks that list at each call
  }, deps);
}

/**
 * Leaving a scene whose night ends in a band below it (chapters 2 and 3): `--exit` on the stage goes from
 * 0 to 1 while the stage, no longer pinned, scrolls out under the navigation bar. The stage stays pinned
 * as long as the scene's lower edge is below the stage's own.
 */
export function useExitFade(stage: RefObject<HTMLElement | null>) {
  useScrollFrame(() => {
    const el = stage.current,
      scene = el?.parentElement?.getBoundingClientRect();
    if (!el || !scene) return;
    const end = NAV_HEIGHT + el.offsetHeight;
    el.style.setProperty("--exit", clamp01((end - scene.bottom) / end).toFixed(3));
  }, [stage]);
}

/**
 * How far a scrubbed dawn has come (chapters 5 and 6): 0 when the dawn span after the last stop reaches the
 * middle of the window, 1 when the pinned stage lets go.
 */
export function dawnShare(span: HTMLElement): number {
  const mid = window.innerHeight / 2,
    r = span.getBoundingClientRect();
  return r.height ? clamp01((mid - r.top) / (r.height + mid - NAV_HEIGHT)) : 0;
}

/**
 * Shows that share of the dawn on a stage: `--dawn` for the stylesheet, and the stage's controls out of
 * reach from a quarter of it on, where they have faded out (their opacity is 1 - 4 x dawn).
 */
export function showDawn(stage: HTMLElement, dawn: number) {
  stage.style.setProperty("--dawn", dawn.toFixed(3));
  stage.toggleAttribute("inert", dawn >= 0.25);
}

/**
 * The line a screen reader hears, for a scene that can say what it shows in one sentence: `text` is spoken a
 * moment after it changes, never for the first state. A change of `again` speaks it once more, so the same
 * reply to a second press is still heard. `clean` turns the model's text into plain words.
 */
export function useSpoken(text: string, again: unknown, clean: (text: string) => string) {
  const [status, setStatus] = useState("");
  // What was on show at the last run. Compared, not counted: in development React runs an effect twice on
  // mount, and the first state must stay unspoken both times.
  const shown = useRef({ text, again });
  useEffect(() => {
    if (shown.current.text === text && shown.current.again === again) return;
    shown.current = { text, again };
    setStatus("");
    const id = window.setTimeout(() => setStatus(clean(text)), 60);
    return () => window.clearTimeout(id);
  }, [text, again, clean]);
  return status;
}

/**
 * True for `ms` after the camera's frame changes: what is drawn on the plate hides while the plate moves,
 * then comes back at its new size. Never on a still page, where nothing moves.
 */
export function useCameraMoving(frame: string, ms: number) {
  const [moving, setMoving] = useState(false);
  const last = useRef(frame);
  useLayoutEffect(() => {
    if (last.current === frame) return;
    last.current = frame;
    if (isStill()) return;
    setMoving(true);
    const id = window.setTimeout(() => setMoving(false), ms);
    return () => window.clearTimeout(id);
  }, [frame, ms]);
  return moving;
}

/**
 * On narrow screens the rail is one row that scrolls sideways: keeps the current chip in view, without
 * moving the page. Measured again when the step, the layout or the view's width changes.
 */
export function useChipInView(
  chips: RefObject<(HTMLButtonElement | null)[]>,
  current: number,
  narrow: boolean,
  viewWidth: number,
) {
  useLayoutEffect(() => {
    const chip = chips.current[current],
      rail = chip?.parentElement;
    if (chip && rail && rail.scrollWidth > rail.clientWidth)
      rail.scrollLeft = chip.offsetLeft - (rail.clientWidth - chip.offsetWidth) / 2;
  }, [chips, current, narrow, viewWidth]);
}
