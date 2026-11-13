// What chapter 5's night follows and remembers besides its drawing: how far the current stop has scrolled
// (and the dawn after the last one), the reader's turn with its waking beats, and where focus goes when a
// label the reader pressed is rebuilt.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  SLEEP_STEPS,
  TURN,
  fire,
  initialTurn,
  nextBeat,
  pick,
  sleepNow,
  toggleArm,
  type Turn,
  type WakerId,
} from "../model/sleepWake";
import { clamp01 } from "../model/layout";
import { isStill } from "../stage/motion";
import { dawnShare, showDawn, useScrollFrame } from "../stage/useScene";

// ---- Following the scroll --------------------------------------------------------------------------------

/**
 * `sub`: how far the current stop has scrolled (0 to 1, in steps of 1/60). Two stops change by it: SLP_EN
 * at its middle, and Asleep, whose night it scrubs. Also shows the dawn that follows the last stop.
 */
export function useStopScroll(
  i: number,
  markers: RefObject<(HTMLElement | null)[]>,
  stage: RefObject<HTMLElement | null>,
  dawnSpan: RefObject<HTMLElement | null>,
) {
  const [sub, setSub] = useState(0.3);
  // The scroll listener outlives a step change: it reads the step from here.
  const iRef = useRef(i);
  iRef.current = i;

  // How far stop k has scrolled past the middle of the screen, kept only as far as the stop uses it:
  // SLP_EN needs which half, Asleep the night's progress, the others nothing. A plain stop never re-renders on scroll.
  const subOf = useCallback(
    (k: number) => {
      const m = markers.current[k],
        s = SLEEP_STEPS[k];
      if (!m || !s || (!s.after && s.scene.moon !== "scrub")) return 0.3;
      const r = m.getBoundingClientRect(),
        q = Math.round(clamp01((window.innerHeight / 2 - r.top) / r.height) * 60) / 60;
      return s.after ? (q >= 0.5 ? 0.7 : 0.3) : q;
    },
    [markers],
  );
  // The stop and its progress come from two mechanisms (an observer and a scroll listener). When the stop
  // changes, measure the new one before paint, so SLP_EN and Asleep never open on the old stop's progress.
  useLayoutEffect(() => {
    if (!isStill()) setSub(subOf(i));
  }, [i, subOf]);

  // Scroll inside the current stop (SLP_EN's hand-off, the night at Asleep), and the dawn after the last one.
  useScrollFrame(() => {
    setSub(subOf(iRef.current));
    const st = stage.current,
      dn = dawnSpan.current;
    if (st && dn) showDawn(st, dawnShare(dn));
  }, [subOf, stage, dawnSpan]);

  return { sub, setSub };
}

// ---- The reader's turn -----------------------------------------------------------------------------------

/** What the reader can do on their turn: arm a wake source, put the machine to sleep, fire a wake source, name the bit that woke it. */
export interface Acts {
  arm: (id: "usb" | "net" | "rtc") => void;
  sleep: () => void;
  fire: (id: WakerId) => void;
  pick: (id: WakerId) => void;
}

export function useTurn() {
  const [turn, setTurn] = useState<Turn>(initialTurn);

  // The waking beats: each a change of state on a timer the reader started, so they keep their time in ?static too.
  useEffect(() => {
    if (turn.phase !== "waking") return;
    const ms = TURN.beatAt[turn.beat] - (turn.beat ? TURN.beatAt[turn.beat - 1] : 0);
    const id = window.setTimeout(() => setTurn(nextBeat), ms);
    return () => window.clearTimeout(id);
  }, [turn.phase, turn.beat]);

  const acts: Acts = {
    arm: (id) => setTurn((x) => toggleArm(x, id)),
    sleep: () => setTurn(sleepNow),
    fire: (id) => setTurn((x) => fire(x, id)),
    pick: (id) => setTurn((x) => pick(x, id)),
  };
  const reset = () => setTurn(initialTurn());
  return { turn, acts, reset };
}

/**
 * A label the reader pressed is rebuilt when the turn's phase changes: this keeps their place in the stage.
 * Returns the handlers the stage needs to know whether focus is inside it.
 */
export function useTurnFocus(
  i: number,
  turn: Turn,
  stage: RefObject<HTMLElement | null>,
  wordsEl: RefObject<HTMLElement | null>,
  chips: RefObject<(HTMLButtonElement | null)[]>,
) {
  const focusIn = useRef(false);

  useLayoutEffect(() => {
    const st = stage.current,
      a = document.activeElement as HTMLElement | null;
    if (!st) return;
    // The rail's focus follows the current stop, so arrow keys start from it.
    if (a && a !== chips.current[i] && chips.current.includes(a as HTMLButtonElement)) {
      chips.current[i]?.focus({ preventScroll: true });
      return;
    }
    if (!focusIn.current) return;
    // Focus parked on the words (while the beats run) is not a place: the question's first button takes it.
    const parked = a === wordsEl.current;
    if (a && a !== document.body && !parked) {
      if (!st.contains(a)) focusIn.current = false;
      return;
    }
    // The first candidate that is on screen: a label button; then Start again, in the words or in the card
    // (not while the beats run, where a held Enter would restart the turn); the words; the current chip.
    const again =
      turn.phase === "waking" ? [] : [...(st.parentElement?.querySelectorAll<HTMLElement>(".sw-again") ?? [])];
    const target = [
      st.querySelector<HTMLElement>('.sw-labels button:not([aria-disabled="true"])'),
      ...again,
      wordsEl.current,
      chips.current[i],
    ].find((el) => el && el.getClientRects().length > 0);
    if (target && target !== a) target.focus({ preventScroll: true });
  }, [turn.phase, turn.beat, i, chips, stage, wordsEl]);

  return {
    onFocusCapture: () => {
      focusIn.current = true;
    },
    onBlurCapture: (e: { relatedTarget: EventTarget | null }) => {
      if (e.relatedTarget && !stage.current?.contains(e.relatedTarget as Node)) focusIn.current = false;
    },
    // A press on the picture itself, not on a button: the reader has left the controls.
    onPointerDown: (e: { target: EventTarget }) => {
      if (!(e.target as HTMLElement).closest("button")) focusIn.current = false;
    },
  };
}
