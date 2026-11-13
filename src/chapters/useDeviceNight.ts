// What chapter 3's night remembers besides its drawing: the wake of step 7 (a bell rung on a timer) and the
// reader's turn (the caretaker's night: lights, bells, the gate). Both move the same building, so the
// motion itself is one state that DevicePower.tsx owns and hands to both.
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  FLATS,
  bellSwitch,
  defaultStory,
  initialPlay,
  lightSwitch,
  settle,
  wakeAll,
  type FlatId,
  type LevelId,
  type NightState,
  type Story,
} from "../model/devicePower";
import { isStill } from "../stage/motion";

type Later = (ms: number, fn: () => void) => void;

/** What is moving on the building right now. */
export interface Motion {
  /** Device restoring its context: things come back one by one. */
  restoring: Partial<Record<FlatId, "slow" | "fast">>;
  /** Wake pulses running down these bell wires; the number restarts them. */
  pulses: FlatId[];
  run: number;
}
export const NO_MOTION: Motion = { restoring: {}, pulses: [], run: 0 };

/** The reader's controls on the building: its state, what each control does, and which switch just refused. */
export interface Controls {
  state: NightState;
  onLight: (lv: LevelId) => void;
  onBell: (id: FlatId) => void;
  onGate: () => void;
  shake: { key: string; n: number } | null;
}

// The things on a desk come back one by one in the stylesheet (devicePower.css, .dp-flat.restoring .dp-thing):
// the first after 0.3 s, then one every 0.52 s when slow and every 0.2 s when fast. The same numbers, in ms.
const RESTORE_GAP = { slow: 520, fast: 200 } as const;
/** When the last thing is back on the desk (four things, as DeviceOverlay's Room draws them). */
const restoreDone = (speed: "slow" | "fast") => 300 + RESTORE_GAP[speed] * 5;

/** True for the first moments on the page, never on a still page: the first step opens on a device still in D0. */
export function useFirstSeconds() {
  const [first, setFirst] = useState(true);
  useEffect(() => {
    if (isStill()) {
      setFirst(false);
      return;
    }
    const t = window.setTimeout(() => setFirst(false), 900);
    return () => window.clearTimeout(t);
  }, []);
  return first;
}

/**
 * The wake of step 7: a packet arrives (phase 1), the device signals and the OS brings it back (phase 2),
 * its context is restored (phase 3). `run` counts "Ring again", so the step's effect can start it afresh.
 */
export function useWakeBell(later: Later, setMotion: Dispatch<SetStateAction<Motion>>) {
  const [phase, setPhase] = useState(0);
  const [run, setRun] = useState(0);
  /** On a step change: rings for the device this step wakes, or puts the bell back for a step that wakes none. */
  const onStep = (wake: FlatId | undefined) => {
    if (!wake) {
      setPhase(0);
      return;
    }
    if (isStill()) {
      setPhase(3);
      return;
    }
    setPhase(0);
    later(700, () => {
      setPhase(1);
      setMotion({ restoring: {}, pulses: [wake], run: Date.now() });
    });
    later(2000, () => {
      setPhase(2);
      setMotion({ restoring: { [wake]: "slow" }, pulses: [], run: 0 });
    });
    later(2000 + restoreDone("slow"), () => {
      setPhase(3);
      setMotion(NO_MOTION);
    });
  };
  return { phase, run, ring: () => setRun((n) => n + 1), onStep };
}

/**
 * The reader's turn. `night` is the building as the reader left it, `story` the reply to their last action
 * (or what the building shows, when there is none). A control used from another step's card first calls
 * `toPlay`, which moves the page to the reader's turn.
 */
export function useCaretaker(
  later: Later,
  clearTimers: () => void,
  announce: (message: string) => void,
  setMotion: Dispatch<SetStateAction<Motion>>,
  toPlay: () => void,
) {
  const [night, setNight] = useState<NightState>(initialPlay);
  const [story, setStory] = useState<Story | null>(null);
  const [refused, setRefused] = useState<{ lv: LevelId; n: number } | null>(null);
  const [shake, setShake] = useState<{ key: string; n: number } | null>(null);

  /** On a step change: whatever was on its way lands, and the last reply is forgotten. */
  const settleNight = () => {
    setNight((n) => settle(n));
    setStory(null);
    setShake(null);
    setRefused(null);
  };
  const act = (r: { state: NightState; story: Story }) => {
    clearTimers();
    setMotion(NO_MOTION);
    setNight(r.state);
    setStory(r.story);
    announce(`${r.story.lead} ${r.story.rest}`);
  };
  const controls: Controls = {
    state: night,
    shake,
    onLight: (lv) => {
      toPlay();
      const r = lightSwitch(night, lv);
      act(r);
      if (r.refused) {
        setRefused((p) => ({ lv, n: (p?.n ?? 0) + 1 }));
        setShake((p) => ({ key: `sw-${lv}`, n: (p?.n ?? 0) + 1 }));
      }
    },
    onBell: (id) => {
      toPlay();
      act(bellSwitch(night, id));
    },
    onGate: () => {
      toPlay();
      if (isStill()) {
        act(wakeAll(night, true));
        return;
      }
      const r = wakeAll(night, false);
      if (!r.armed.length) {
        act(r);
        return;
      }
      // The pulses run down the bell wires first; the devices come back when they reach the gate.
      clearTimers();
      setNight(settle(night));
      setStory(null);
      announce(`${r.armed.map((id) => FLATS.find((f) => f.id === id)!.name).join(" and ")} signal wake.`);
      setMotion({ restoring: {}, pulses: r.armed, run: Date.now() });
      later(1150, () => {
        setNight(r.state);
        setStory(r.story);
        announce(`${r.story.lead} ${r.story.rest}`);
        const speeds = Object.fromEntries(
          r.armed.map((id) => [id, r.fromCold.includes(id) ? "slow" : "fast"]),
        ) as Motion["restoring"];
        setMotion({ restoring: speeds, pulses: [], run: 0 });
        // Each device's box goes once its own last thing is back.
        for (const id of r.armed) {
          later(restoreDone(speeds[id]!), () =>
            setMotion((m) => {
              const rest = { ...m.restoring };
              delete rest[id];
              return { ...m, restoring: rest };
            }),
          );
        }
        later(4200, () => {
          setNight((n) => settle(n));
          setStory(null);
        });
      });
    },
  };
  const reset = () => {
    setShake(null);
    setRefused(null);
    act({
      state: initialPlay(),
      story: { lead: "The night starts again:", rest: "every device in D3hot, every light on." },
    });
  };

  return { night, story: story ?? defaultStory(night), refused, controls, reset, settleNight };
}
