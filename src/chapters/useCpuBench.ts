// What chapter 4's bench works out and remembers besides its drawing, one thing per function: the camera,
// the lit tiles, the timed motion of a step, the dawn, the reader's turn, and what happens on arriving at a
// step (focus and the announcement). CpuPower.tsx puts them together.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  ALL_IDLE_FROM,
  ALL_IDLE_TO,
  BAND,
  CLUSTER_LAT,
  CPPC_CASES,
  DAY,
  DAY0,
  DAY_STOPS,
  GAPS,
  LANE,
  LAST_NIGHT,
  LAT,
  NEIGHBOURS,
  NIGHT,
  RECTS,
  STRIP,
  TOP,
  YOUR_TURN,
  dayStopOf,
  fit,
  lane,
  osPick,
  question,
  storyFor,
  type Pick,
  type TileId,
  type TileState,
} from "../model/cpuPower";
import { NAV_HEIGHT, clamp01, type Transform } from "../model/layout";
import { isStill } from "../stage/motion";
import { useScrollFrame, type ViewSize } from "../stage/useScene";

type Later = (ms: number, fn: () => void) => void;
type Announce = (message: string) => void;

// ---- The camera ------------------------------------------------------------------------------------------

/** The stop a day step belongs to on a narrow screen, where one stop stands for several steps. None by night or on a wide screen. */
export const stopAt = (at: number, narrow: boolean) => (narrow && at >= DAY0 ? DAY_STOPS[dayStopOf(at - DAY0)] : null);

/** The step a chip leads to: on a narrow screen a day step leads to the last step of its stop. */
export function reach(at: number, narrow: boolean) {
  const stop = stopAt(at, narrow);
  return stop ? DAY0 + stop.to : at;
}

/** Where a plate point of the trace sits on a narrow screen: in its own strip under the picture. */
export function stripTransform(vw: number, vh: number): Transform {
  const top = vh * 0.62,
    h = vh * 0.38,
    k = Math.min(vw / STRIP.w, h / STRIP.h);
  return { s: k, tx: (vw - STRIP.w * k) / 2 - STRIP.x * k, ty: top + (h - STRIP.h * k) / 2 - STRIP.y * k };
}

/**
 * What the bench shows at step `i`. On narrow screens by day a stop stands for its steps: it is shown at
 * its last step, with only its own ink, in its own frame. Wide screens keep the twelve day steps.
 */
export function benchCamera(i: number, narrow: boolean, size: ViewSize) {
  const day = i >= DAY0;
  const stop = stopAt(i, narrow);
  const dayAt = stop ? stop.to : i - DAY0;
  const frame = day ? DAY[dayAt].frame : i < LAST_NIGHT ? NIGHT[i].frame : "full";
  const t = fit(frame, size.vw, size.vh, narrow, stop?.box);
  return {
    stop,
    frame,
    /** The plate in the view. */
    t,
    /** The trace in the view: on the plate, or in its strip on narrow screens. */
    traceT: narrow ? stripTransform(size.vw, size.vh) : t,
    /** The day's ink that is drawn: the steps from `inkFrom` to `inkTo`, counted from 1 (none by night). */
    inkFrom: stop?.box ? stop.from + 1 : 1,
    inkTo: day ? dayAt + 1 : 0,
  };
}

/** The frame the camera is on at step `i`, by the step alone: what tells that the plate is about to move. */
export const stepFrame = (i: number) => (i >= DAY0 ? DAY[i - DAY0].frame : i < LAST_NIGHT ? NIGHT[i].frame : "full");

// ---- The tiles -------------------------------------------------------------------------------------------

/** The state each tile shows at step `i`, and how much light that puts on the bench (the ambient glow). */
export function benchTiles(
  i: number,
  tileOver: Partial<Record<TileId, TileState>>,
  phase: number,
  picks: (Pick | null)[],
) {
  const step = i < LAST_NIGHT ? NIGHT[i] : null;
  const tiles = {
    ...(step?.tiles ?? (i === LAST_NIGHT ? ({ t0: "run", t1: "run", t2: "cg", t3: "run" } as const) : {})),
    ...tileOver,
  };
  if (i === LAST_NIGHT) {
    // The reader's turn: core 0 rests at the depth picked last.
    const last = [...picks].reverse().find(Boolean);
    if (last && last !== "poll") tiles.t0 = last;
  }
  const shown = step?.scale === "cppc" ? CPPC_CASES[phase].tiles : tiles;
  const lit = Object.values({ ...NEIGHBOURS, ...shown }).reduce(
    (a, v) => a + (v === "run" ? 1 : v === "cg" || v === "c1" ? 0.35 : v === "c2" ? 0.2 : 0),
    0,
  );
  return { tiles: shown, lit };
}

// ---- The timed motion of a step --------------------------------------------------------------------------

/**
 * What moves by itself after a step change: the tiles following core 0's lane as the trace draws, the
 * cluster resting, the bus-master pulse and the tiles that snoop as it passes, and the three CPPC cases in
 * turn. A step change cancels what is still running. On a still page nothing is timed.
 *
 * It clears the step's timers when the step changes, so call it before any hook that starts a timer then.
 */
export function useStepMotion(i: number, later: Later, clearTimers: () => void, announce: Announce) {
  const [tileOver, setTileOver] = useState<Partial<Record<TileId, TileState>>>({});
  const [clusterRest, setClusterRest] = useState(false);
  /** Which of the three CPPC cases is shown. */
  const [phase, setPhase] = useState(0);
  /** Counts the step changes that draw a trace, so each draws itself afresh. */
  const [run, setRun] = useState(0);
  /** Counts the bus-master passes, so each starts a new pulse. */
  const [bm, setBm] = useState(0);
  const [snoop, setSnoop] = useState<Set<TileId>>(new Set());

  const sayCase = useCallback(
    (n: number) => {
      setPhase(n);
      announce(`${CPPC_CASES[n].name}: ${CPPC_CASES[n].state}.`);
    },
    [announce],
  );

  // The bus-master pulse crosses the cache band once; a tile that snoops (C1, C2, running) flashes as it passes.
  const passBus = useCallback(() => {
    setBm((n) => n + 1);
    // The pulse is drawn by CpuOverlay's SVG animation: 3.5 s long, across the band in its first 0.74.
    const x0 = BAND.x1 - 10,
      x1 = BAND.x0 + 10,
      travel = 3500 * 0.74;
    const shown = { ...NIGHT[1].tiles };
    TOP.forEach((id) => {
      const [a, , b] = RECTS[id],
        at = (travel * (x0 - (a + b) / 2)) / (x0 - x1);
      if (!["c1", "c2", "run"].includes(shown[id] ?? "")) return;
      later(at, () => setSnoop((s0) => new Set(s0).add(id)));
      later(at + 700, () =>
        setSnoop((s0) => {
          const n = new Set(s0);
          n.delete(id);
          return n;
        }),
      );
    });
  }, [later]);

  useLayoutEffect(() => {
    clearTimers();
    setTileOver({});
    setClusterRest(false);
    // A tile whose flash was cut short by the timers just cleared.
    setSnoop((s0) => (s0.size ? new Set() : s0));
    const still = isStill();
    const s = i < LAST_NIGHT ? NIGHT[i] : null;
    if (s?.scale === "cppc") setPhase(still ? 1 : 0);
    if (!s || still) return;
    setRun((n) => n + 1);
    // The tiles follow core 0's lane as the trace draws: 2400 plate units in 2.4 s, so a plate x is also a time in ms.
    if (s.lanes) {
      const X = (u: number) => LANE.x0 + (u / 100) * (LANE.x1 - LANE.x0);
      setTileOver({ t0: "run", t1: "run", t2: "run", t3: "run" });
      const seq: [number, TileId | "cl", TileState | boolean][] = [
        [10, "t0", "pd"],
        [22, "t1", "pd"],
        [34, "t2", "pd"],
        [46, "t3", "pd"],
        [ALL_IDLE_FROM, "cl", true],
        [ALL_IDLE_TO, "cl", false],
        [ALL_IDLE_TO + CLUSTER_LAT + LAT.pd, "t0", "run"],
      ];
      for (const [u, id, v] of seq)
        later(X(u), () => {
          if (id === "cl") setClusterRest(v as boolean);
          else setTileOver((o) => ({ ...o, [id]: v as TileState }));
        });
      later(2600, () => setTileOver({}));
    } else if (s.lane && s.scale !== "cppc") {
      const geo = lane(s.lane.segs);
      if (geo.idles.length) {
        setTileOver({ t0: "run" });
        for (const d of geo.idles) {
          later(geo.X(d.t0 + 0.4), () => setTileOver({ t0: d.st }));
          later(geo.X(d.up), () => setTileOver({ t0: "run" }));
        }
        later(2600, () => setTileOver({}));
      }
    }
    if (s.busMaster) passBus();
    if (s.scale === "cppc") {
      // One pass through the three cases, then it stops on the last.
      later(3200, () => sayCase(1));
      later(6400, () => sayCase(2));
    }
  }, [i, clearTimers, later, passBus, sayCase]);

  /** The reader asks for the three cases again (one case further on a still page). */
  const playCases = () => {
    clearTimers();
    if (isStill()) {
      sayCase((phase + 1) % 3);
      return;
    }
    sayCase(0);
    later(3200, () => sayCase(1));
    later(6400, () => sayCase(2));
  };

  return { tileOver, clusterRest, phase, run, bm, snoop, passBus, playCases };
}

// ---- The dawn --------------------------------------------------------------------------------------------

/**
 * The dawn between the night's steps and the day's: `--day` on the stage follows the dawn span past the
 * middle of the window, and `--exit` fades the scene into the light part of the page as the stage lets go.
 * On a still page there is no scrubbed dawn: it is night or day, by the step.
 */
export function useBenchDawn(
  stage: RefObject<HTMLElement | null>,
  markers: RefObject<(HTMLElement | null)[]>,
  dawnSlot: number,
  day: boolean,
) {
  const read = useCallback(() => {
    const st = stage.current;
    if (!st) return;
    const span = markers.current[dawnSlot],
      scene = st.parentElement?.getBoundingClientRect();
    if (span) {
      const r = span.getBoundingClientRect();
      st.style.setProperty("--day", clamp01((window.innerHeight * 0.5 - r.top) / r.height).toFixed(3));
    }
    if (scene) {
      const end = NAV_HEIGHT + st.offsetHeight,
        len = 0.6 * window.innerHeight;
      st.style.setProperty("--exit", clamp01(1 - (scene.bottom - end) / len).toFixed(3));
    }
  }, [stage, markers, dawnSlot]);
  useScrollFrame(read, [read]);
  // A chip can jump between night and day: read once more as soon as the step has crossed.
  useEffect(() => {
    if (isStill()) stage.current?.style.setProperty("--day", day ? "1" : "0");
    else read();
  }, [stage, day, read]);
}

// ---- The reader's turn -----------------------------------------------------------------------------------

/** The reader's turn: a depth picked, or not yet, for each of three idle periods, and whether the OS picked them. */
export interface Play {
  picks: (Pick | null)[];
  os: boolean;
}

export function useYourTurn(later: Later, announce: Announce) {
  const [play, setPlay] = useState<Play>({ picks: [null, null, null], os: false });
  /** The idle period waiting for a pick, or -1 when all three are picked. */
  const waiting = play.picks.findIndex((x) => !x);

  const pick = (p: Pick) => {
    if (waiting < 0) return;
    const picks = play.picks.map((x, j) => (j === waiting ? p : x));
    setPlay({ picks, os: false });
    const next = picks.findIndex((x) => !x);
    announce(storyFor(picks, waiting) + (next >= 0 ? ` ${question(next)}` : ""));
    // The picker has gone: focus moves on to "Let the OS choose".
    if (next < 0) later(0, () => document.getElementById("cp-os")?.focus({ preventScroll: true }));
  };
  const osChoose = () => {
    const picks = GAPS.map(osPick);
    setPlay({ picks, os: true });
    announce("The OS's picks. " + picks.map((_, j) => storyFor(picks, j)).join(" "));
    later(0, () => document.getElementById("cp-again")?.focus({ preventScroll: true }));
  };
  const again = () => {
    setPlay({ picks: [null, null, null], os: false });
    announce(`Three new idle periods are coming. ${question(0)}`);
  };
  return { play, waiting, pick, osChoose, again };
}

// ---- Arriving at a step ----------------------------------------------------------------------------------

/**
 * On arriving at a step: focus stays with the reader (on the current chip when the control that had it is
 * gone, or when it was on another chip), and the step is announced. Returns the two handlers the stage
 * needs to know whether focus is inside it.
 */
export function useStepArrival(
  i: number,
  narrow: boolean,
  stage: RefObject<HTMLElement | null>,
  rail: RefObject<HTMLElement | null>,
  chips: RefObject<(HTMLButtonElement | null)[]>,
  announce: Announce,
) {
  const first = useRef(true);
  const lastStep = useRef(i);
  const focusIn = useRef(false);

  useLayoutEffect(() => {
    const changed = lastStep.current !== i;
    lastStep.current = i;
    if (focusIn.current && !stage.current?.contains(document.activeElement)) {
      focusIn.current = false;
      chips.current[i]?.focus({ preventScroll: true });
    } else if (rail.current?.contains(document.activeElement) && document.activeElement !== chips.current[i])
      chips.current[i]?.focus({ preventScroll: true });
    if (first.current) {
      first.current = false;
      return;
    }
    if (!changed) return;
    const day = i >= DAY0;
    const title = (i === LAST_NIGHT ? YOUR_TURN.title : day ? DAY[i - DAY0].title : NIGHT[i].title).replace(/\.$/, "");
    const stop = stopAt(i, narrow);
    announce(
      stop
        ? `By day, ${DAY_STOPS.indexOf(stop) + 1} of ${DAY_STOPS.length}: ${stop.rail}.`
        : day
          ? `By day, ${i - DAY0 + 1} of ${DAY.length}: ${title}.`
          : `Step ${i + 1} of ${LAST_NIGHT + 1}: ${title}.`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the step changes, and reads the window's width as it is at that moment
  }, [i]);

  return {
    onFocusCapture: () => {
      focusIn.current = true;
    },
    onBlurCapture: (e: { relatedTarget: EventTarget | null }) => {
      if (e.relatedTarget && !stage.current?.contains(e.relatedTarget as Node)) focusIn.current = false;
    },
  };
}
