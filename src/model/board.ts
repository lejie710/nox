// The board picture (src/assets/nox-board.webp, 1536 x 1024, an illustrative
// image made for this project): where each part sits, measured by eye, and
// how a part can look in a state. The light is the state: the board is lit
// while the machine works and dark when it does not, and only the parts that
// still have power stay lit. No outlines and no colour key.

export const BOARD = { w: 1536, h: 1024 };

export type PartId = "cpu" | "memory" | "wifi" | "ssd" | "ec" | "rtc";

/**
 * on: powered. idle: powered, idling deeply. low: little power. wake: kept
 * ready to wake the machine. holds: powered and holding the session. file:
 * unpowered, holding the session in a file. off: not needed in this state.
 */
export type Look = "on" | "idle" | "low" | "wake" | "holds" | "file" | "off";

export interface Part {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Lens magnification for this part. */
  zoom: number;
  name: string;
}

export const PARTS: Record<PartId, Part> = {
  cpu: { x: 566, y: 186, w: 204, h: 204, zoom: 2, name: "Processor" },
  memory: { x: 852, y: 142, w: 232, h: 222, zoom: 1.6, name: "Memory" },
  wifi: { x: 1212, y: 156, w: 156, h: 176, zoom: 2, name: "Wi-Fi card" },
  ssd: { x: 908, y: 384, w: 506, h: 142, zoom: 1.3, name: "SSD" },
  ec: { x: 192, y: 432, w: 92, h: 96, zoom: 2.6, name: "Embedded controller" },
  rtc: { x: 318, y: 414, w: 144, h: 128, zoom: 2.4, name: "Clock battery" },
};

export const PART_IDS = Object.keys(PARTS) as PartId[];

/** The lens width as a share of the board's width. */
export const LENS = 0.27;

/**
 * Where the lens sits for a part, all as shares of the board (width units
 * for x and lengths, height units for top), and the background position
 * that centres the magnified part in it.
 */
export function lensGeometry(part: Part) {
  const cx = (part.x + part.w / 2) / BOARD.w;
  const cy = (part.y + part.h / 2) / BOARD.h;
  const bottom = (part.y + part.h) / BOARD.h;
  const left = Math.min(Math.max(cx - LENS / 2, 0.01), 0.99 - LENS);
  const top = Math.max(0.5, bottom + 0.06);
  // The leader runs from the lens's top centre to the part's bottom centre.
  const dx = cx - left - LENS / 2;
  const dy = ((top - bottom) * BOARD.h) / BOARD.w;
  const imageHeight = (part.zoom * BOARD.h) / BOARD.w;
  return {
    cx,
    cy,
    bottom,
    left,
    top,
    dx,
    dy,
    textLeft: left + LENS / 2 > 0.5,
    bgSize: (part.zoom / LENS) * 100,
    bgX: ((cx * part.zoom - LENS / 2) / (part.zoom - LENS)) * 100,
    bgY: ((cy * imageHeight - LENS / 2) / (imageHeight - LENS)) * 100,
  };
}

/** What each look means, for the key under the board and for screen readers. */
export const LOOK_WORDS: Record<Look, string> = {
  on: "powered",
  idle: "powered, idling deeply",
  low: "on little power",
  wake: "kept powered so a key, the network or a USB device can wake the machine",
  holds: "powered, and holds the session",
  file: "holds the session in a file, without power",
  off: "not shown as powered",
};

/** How lit a part is, 0 to 1. A part kept for wake, or holding the session in a file, is dark with a point of light. */
export const LIT: Record<Look, number> = { on: 1, idle: 0.8, low: 0.45, wake: 0, holds: 1, file: 0, off: 0 };

/** The point of light on a part: cream where the session is, amber on what is kept to wake the machine. */
export const MARK: Partial<Record<Look, "session" | "wake">> = { holds: "session", file: "session", wake: "wake" };

/** The controller is an example, not a claim about every laptop's wake rails. */
export const EXAMPLE_NOTE: Partial<Record<PartId, string>> = {
  ec: "This picture uses the embedded controller as the example. Which parts stay powered varies by platform.",
};

/** The tag shown on a part that holds the session. */
export const TAGS: Partial<Record<Look, string>> = { holds: "session", file: "session, in a file" };
