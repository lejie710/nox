// What the pages with a pinned picture share about the window.

/**
 * The window width, in CSS pixels, below which a page is narrow: the picture is pinned at the top and each
 * step's words scroll past under it, instead of standing beside it.
 *
 * The story and chapters 3 to 6 use it: here for the camera, and as `max-width: 1059px` in their
 * stylesheets, which cannot import it (src/styles/styles.test.ts keeps the two in step). Chapters 1 and 2
 * have no camera and switch at their own widths, in src/styles/chapter.css.
 */
export const NARROW = 1060;

/** The height of the navigation bar, in CSS pixels: a pinned stage sits right under it (60px in the stylesheets). */
export const NAV_HEIGHT = 60;

/** A share kept between 0 and 1. */
export const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);

/** A rectangle: on a plate in the plate's own pixels, or in a view in CSS pixels. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * How a plate is drawn in a view: scaled by `s`, then moved by `tx` and `ty` CSS pixels. The plate point
 * (x, y) lands at (tx + x * s, ty + y * s), and everything drawn on the plate goes through the same numbers.
 */
export interface Transform {
  s: number;
  tx: number;
  ty: number;
}

/** The offset that puts the middle of `box` on the middle of `region`, with the plate drawn at scale `s`. */
export function centred(box: Box, region: Box, s: number): { tx: number; ty: number } {
  return {
    tx: region.x + region.w / 2 - (box.x + box.w / 2) * s,
    ty: region.y + region.h / 2 - (box.y + box.h / 2) * s,
  };
}

/** A plate point as the CSS position of an element laid over the view. */
export function place(t: Transform, x: number, y: number): { left: string; top: string } {
  return { left: `${t.tx + x * t.s}px`, top: `${t.ty + y * t.s}px` };
}

/**
 * A Transform for a scene whose words stand beside the picture on wide screens: `wordsLeft` and `wordsWidth`
 * are where that column starts and how wide it is, in the view's CSS pixels. The picture and the words are
 * placed as one group.
 */
export interface SceneFit extends Transform {
  wordsLeft: number;
  wordsWidth: number;
}

/** A plate point in the view's CSS pixels. */
export const toView = (t: Transform, [x, y]: readonly [number, number]): [number, number] => [
  t.tx + x * t.s,
  t.ty + y * t.s,
];
