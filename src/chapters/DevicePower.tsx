// Chapter 3, Device power: the flats at night. One full-bleed plate (unlit); every light, label and control
// is drawn in the plate's own coordinates, so each state is exact and testable. Each step frames part of
// the building; tags and controls follow the same transform. Seven scroll steps, then the reader's turn
// (the caretaker's night), then dawn into "the same flat, by day". Facts and wording: src/model/devicePower.ts.
//
// This file puts the scene together. Its parts each own one thing:
//   DeviceOverlay.tsx   what is drawn on the building: lights, rooms, door plates, wires, switches, the moon
//   DeviceLabels.tsx    what is laid over it: the labels, and the reader's controls
//   DeviceWords.tsx     the words of a step
//   DeviceCards.tsx     the two cards of the light part
//   BayDrawing.tsx      the same flat, by day
//   useDeviceNight.ts   the wake of step 7 and the reader's turn
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Cite } from "../components/Chrome";
import plateImage from "../assets/flats-plate.webp";
import {
  DEVICE_STEPS,
  PLATE,
  PLAY_CITATIONS,
  STEP_COUNT,
  YOUR_TURN,
  defaultStory,
  fit,
  settle,
  stepState,
  tagsFor,
  wokenState,
  type NightState,
} from "../model/devicePower";
import { BayDrawing, BAY_CITATIONS } from "./BayDrawing";
import { CARD_CITATIONS, DeviceCards } from "./DeviceCards";
import { ControlButtons, Tags } from "./DeviceLabels";
import { FlatsMoon, Overlay } from "./DeviceOverlay";
import { StepWords } from "./DeviceWords";
import { StepRail } from "../stage/StepRail";
import { stillNow } from "../stage/motion";
import { NO_MOTION, useCaretaker, useFirstSeconds, useWakeBell, type Motion } from "./useDeviceNight";
import { useAnnouncer, useExitFade, useRailedViewSize, useTimers } from "../stage/useScene";
import { useStepScroll } from "../stage/useStepScroll";

const INTRO_CITATIONS = ["acpiDevicePower", "acpiPowerResources", "msDeviceLowPower"];
const CAVEAT_CITATIONS = ["acpiPowerResources", "msD3cold"];
const LAST = DEVICE_STEPS.length;
/** The words on the rail's chips: one per step, then the reader's turn. */
const RAIL = [...DEVICE_STEPS.map((s) => s.rail), YOUR_TURN.rail];

/** Every source this chapter cites, for the page's source list. */
export const DEVICE_POWER_SOURCES: string[] = [
  ...new Set([
    ...INTRO_CITATIONS,
    ...CAVEAT_CITATIONS,
    ...DEVICE_STEPS.flatMap((s) => [...s.citations, ...s.ruleCitations]),
    ...PLAY_CITATIONS,
    ...BAY_CITATIONS,
    ...CARD_CITATIONS,
  ]),
];

export function DevicePowerIntro() {
  return (
    <p className="twotone chapter-intro">
      The system can stay in S0 while its devices sleep, each in its own power state.{" "}
      <b>
        Underneath, devices share power resources, and one device that must still be able to wake can keep its
        neighbours from switching off.
      </b>
      <Cite ids={INTRO_CITATIONS} />
    </p>
  );
}

const CAVEAT =
  "An illustrative building, not a real one: each flat is a device and each corridor light a power resource on an example laptop. Which devices share a power resource, and which can wake from D3cold, varies by platform.";

/** What the Wi-Fi card's label says while the wake of step 7 runs. */
const WAKE_NOTES = [
  undefined,
  { name: "A wake packet arrives", state: "the Wi-Fi card signals on its wake path" },
  { name: "Device Wake (Notify value 2)", state: "the OS turns the Level 3 light on, and the driver restores context" },
  { name: "Device Wake (Notify value 2)", state: "Wi-Fi back in D0, context restored" },
] as const;

/** The scene: one pinned night at the flats, seven steps, then the reader's turn, then dawn. */
function Night() {
  const { i, go, markers, chips, onKey } = useStepScroll(STEP_COUNT);
  const play = i === LAST;
  const step = DEVICE_STEPS[Math.min(i, LAST - 1)];
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const still = stillNow();

  // The view's size frames the plate; a resize re-frames without sliding. The
  // rail's height places the figure under it on narrow screens (it may wrap).
  const { size, narrow, reflow } = useRailedViewSize(view, stage, rail, { vw: 1280, vh: 640 });
  // Leaving the scene: the night's lower edge fades into the dawn.
  useExitFade(stage);

  // The timed motion (the first seconds, the wake of step 7), the reader's turn, and what a screen reader hears.
  const { later, clear: clearTimers } = useTimers();
  const { status, announce } = useAnnouncer(later);
  const [motion, setMotion] = useState<Motion>(NO_MOTION);
  const firstSeconds = useFirstSeconds();
  const wake = useWakeBell(later, setMotion);
  // A step change the reader's own action caused (a card control on another step).
  const fromAct = useRef(false);
  const turn = useCaretaker(later, clearTimers, announce, setMotion, () => {
    if (!play) {
      fromAct.current = true;
      go(LAST);
    }
  });

  const first = useRef(true);
  const lastStep = useRef(i);
  // Whether focus was in the stage; checked after a step change removes a control.
  const focusIn = useRef(false);

  // Each step change (before paint): stop any motion, settle the reader's
  // night, start the wake if this is its step, keep focus, announce.
  useLayoutEffect(() => {
    const changed = lastStep.current !== i;
    lastStep.current = i;
    if (fromAct.current) {
      fromAct.current = false;
      first.current = false;
      return;
    }
    clearTimers();
    setMotion(NO_MOTION);
    turn.settleNight();
    wake.onStep(play ? undefined : step.wake);
    if (focusIn.current && !stage.current?.contains(document.activeElement)) {
      focusIn.current = false;
      chips.current[i]?.focus({ preventScroll: true });
    }
    if (first.current) {
      first.current = false;
      return;
    }
    if (changed)
      announce(
        play
          ? `Step ${STEP_COUNT} of ${STEP_COUNT}: your turn. ${defaultStory(settle(turn.night)).lead}`
          : `Step ${i + 1} of ${STEP_COUNT}: ${DEVICE_STEPS[i].title}.`,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs when the step changes or the wake is rung again, and reads everything else as it is at that moment
  }, [i, wake.run]);

  // What the night shows now.
  let state: NightState;
  if (play) state = turn.night;
  else if (step.wake) state = wake.phase >= 2 ? wokenState(step) : stepState(step);
  else {
    state = stepState(step);
    // For its first moments the first step shows the webcam still in D0.
    if (i === 0 && firstSeconds) state.flats.webcam = { d: "D0", armed: false };
  }
  const t = fit(play ? "full" : step.frame, size.vw, size.vh, narrow);
  const tags = tagsFor(state, i, narrow, !play && step.wake ? WAKE_NOTES[wake.phase] : undefined);

  return (
    <>
      {/* As in chapters 1 and 2: one caveat line, with room, before the pinned figure. */}
      <div className="dp-caveat-band">
        <p className="board-caveat dp-caveat">
          {CAVEAT}
          <Cite ids={CAVEAT_CITATIONS} />
        </p>
      </div>
      <section className="dp-scene" aria-labelledby="dp-scene-title" style={{ ["--steps" as string]: STEP_COUNT }}>
        <h2 className="sr-only" id="dp-scene-title">
          The flats at night: device power states, shared power resources and wake, then your turn
        </h2>
        <div
          className={`dp-stage${play ? " play" : ""}${reflow || still ? " reflow" : ""}`}
          ref={stage}
          onFocusCapture={() => {
            focusIn.current = true;
          }}
          onBlurCapture={(e) => {
            if (e.relatedTarget && !stage.current?.contains(e.relatedTarget as Node)) focusIn.current = false;
          }}
        >
          <div className="dp-view" ref={view}>
            <div
              className="dp-world"
              aria-hidden="true"
              style={{ transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.s})` }}
            >
              <img className="dp-plate-img" src={plateImage} width={PLATE.w} height={PLATE.h} alt="" decoding="async" />
              <Overlay state={state} step={i} motion={motion} refused={turn.refused} />
            </div>
            <Tags tags={tags} t={t} />
            <div className="dp-sky-fade" aria-hidden="true" />
            <div className="dp-exit-fade" aria-hidden="true" />
          </div>
          <FlatsMoon />
          <StepRail prefix="dp" labels={RAIL} current={i} chips={chips} onChoose={go} onKey={onKey} railRef={rail} />
          {/* The words column shows on wide screens, and on narrow ones only in ?static (no cards then). */}
          <div className="dp-words-col">
            <div className="dp-words">
              <StepWords
                i={i}
                story={turn.story}
                controls={play && narrow ? turn.controls : undefined}
                onRing={wake.ring}
                onReset={turn.reset}
              />
            </div>
          </div>
          {/* After the words in reading order; placed on the building. */}
          {play && !narrow && (
            <div className="dp-controls">
              <ControlButtons c={turn.controls} inline={false} t={t} />
            </div>
          )}
          <p className="sr-only" role="status" aria-atomic="true">
            {status}
          </p>
        </div>
        <div className="dp-track">
          {Array.from({ length: STEP_COUNT }, (_, at) => (
            <div
              key={at}
              className="dp-marker"
              data-index={at}
              ref={(el) => {
                markers.current[at] = el;
              }}
            >
              {/* Narrow screens: the step's words scroll past under the pinned figure. */}
              <div className="dp-card">
                <StepWords
                  i={at}
                  story={turn.story}
                  controls={at === LAST ? turn.controls : undefined}
                  onRing={at === i ? wake.ring : undefined}
                  onReset={at === LAST ? turn.reset : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function DevicePower({ children }: { children?: ReactNode }) {
  return (
    <>
      <Night />
      <div className="chapter-dawn" aria-hidden="true" />
      <div className="chapter-light">
        <BayDrawing />
        <DeviceCards />
        {children}
      </div>
    </>
  );
}
