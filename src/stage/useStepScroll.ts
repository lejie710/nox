// The pinned board's scroll steps, shared by every chapter that uses one:
// one invisible marker per step crosses the viewport, and the step whose
// marker is at the viewport's middle is the current one. Each step holds a
// complete state, so fast or reverse scrolling lands correctly.
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { NAV_HEIGHT } from "../model/layout";
import { isStill } from "./motion";

/** A key press, as far as a rail needs to know it. */
export interface RailKey {
  key: string;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/**
 * Where a key pressed on chip `at` moves along a rail whose last chip is `last`: the arrow keys go one step
 * in reading order, Home and End go to the ends. Null for any other key, and for a key pressed with Alt,
 * Ctrl or Meta, which is a shortcut of the browser's (Alt and the left arrow goes back a page).
 */
export function railTarget({ key, altKey, ctrlKey, metaKey }: RailKey, at: number, last: number): number | null {
  if (altKey || ctrlKey || metaKey) return null;
  if (key === "ArrowRight" || key === "ArrowDown") return Math.min(at + 1, last);
  if (key === "ArrowLeft" || key === "ArrowUp") return Math.max(at - 1, 0);
  if (key === "Home") return 0;
  if (key === "End") return last;
  return null;
}

export function useStepScroll(count: number) {
  const [i, setI] = useState(0);
  const markers = useRef<(HTMLDivElement | null)[]>([]);
  /** The rail's radio buttons, one per step, for roving focus. */
  const chips = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isStill()) return;
    let io: IntersectionObserver | undefined;
    const observe = () => {
      io?.disconnect();
      // IntersectionObserver percentage margins use the root's width, even
      // vertically. Pixels keep the activation band at the viewport midpoint.
      const middle = Math.floor(window.innerHeight / 2);
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && !isStill()) setI(Number((entry.target as HTMLElement).dataset.index));
          }
        },
        { rootMargin: `-${middle}px 0px -${Math.max(0, window.innerHeight - middle - 1)}px 0px` },
      );
      markers.current.forEach((marker) => marker && io?.observe(marker));
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, []);

  /** Choose a step, and scroll its marker to the viewport's middle. */
  const go = (to: number) => {
    setI(to);
    if (!isStill()) {
      const marker = markers.current[to];
      if (marker) {
        // Match the observer's viewport centre, independently of the story's
        // scroll-padding. An instant jump also avoids announcing skipped steps.
        const r = marker.getBoundingClientRect();
        // Never above the point where the stage pins under the navigation bar, so
        // choosing the first step keeps the stage pinned.
        const scene = marker.parentElement?.parentElement;
        const pinned = scene ? window.scrollY + scene.getBoundingClientRect().top - NAV_HEIGHT : 0;
        window.scrollTo({
          top: Math.max(pinned, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2),
          behavior: "instant",
        });
      }
    }
  };

  // Arrow keys move along the rail in reading order, Home and End jump.
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, at: number) => {
    const to = railTarget(e, at, count - 1);
    if (to === null) return;
    e.preventDefault();
    go(to);
    chips.current[to]?.focus({ preventScroll: true });
  };

  return { i, go, markers, chips, onKey };
}
