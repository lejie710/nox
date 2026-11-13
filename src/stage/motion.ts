// Whether the page moves at all, and one helper for the SVG animations that a script starts.

/**
 * True when the page is still: `?static` is in the address, or the reader prefers reduced motion (index.html
 * decides before first paint). A still page pins nothing, runs no timed motion and shows each step's end state.
 * A browser without scroll-driven animations is not still: the chapters need none.
 */
export const isStill = () => document.documentElement.classList.contains("still");

/** isStill() for use while rendering: there is no document when a page is rendered on a server, as the tests do. */
export const stillNow = () => typeof document !== "undefined" && isStill();

/**
 * Starts an SVG animation that waits for a script (begin="indefinite"), as a `ref` on the animation element:
 * it starts when the element appears. Where the browser cannot, the animated mark stays as drawn.
 */
export const begin = (el: SVGAnimationElement | null) => {
  try {
    el?.beginElement();
  } catch {
    /* not supported */
  }
};
