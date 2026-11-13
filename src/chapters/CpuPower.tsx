// Chapter 4, CPU power: the night bench. One full-bleed plate (a fictional die on a probe station, unlit);
// every light, trace, label and control is drawn in the plate's own coordinates. Eight night steps, the
// reader's turn, then a dawn inside the same pin and twelve day steps in which the bench itself is written
// on in ink. Facts and wording: src/model/cpuPower.ts.
//
// This file puts the scene together. Its parts each own one thing:
//   CpuOverlay.tsx   the picture: the plate, the tiles, the scale, the day's ink (CpuDayInk.tsx)
//   CpuTrace.tsx     core 0's power over time
//   CpuTags.tsx      the labels on the figure
//   CpuRail.tsx      the rail of chips, night and day
//   CpuWords.tsx     the words of a step
//   CpuCards.tsx     the two cards of the light part
//   useCpuBench.ts   the camera, the timed motion of a step, the dawn, the reader's turn
import { useRef, type ReactNode } from "react";
import { Cite } from "../components/Chrome";
import {
  CAVEAT,
  CPPC_CASES,
  DAY,
  DAY0,
  DAY_STOPS,
  IDLE_STRETCH,
  LAST_NIGHT,
  NIGHT,
  PICKS,
  PLAY_CITATIONS,
  STEP_COUNT,
  STRIP,
  TOP_Y,
  dayStopOf,
  textFloor,
} from "../model/cpuPower";
import { place } from "../model/layout";
import { CARD_CITATIONS, CpuCards } from "./CpuCards";
import { BenchMoon, BenchPicture } from "./CpuOverlay";
import { BenchRail } from "./CpuRail";
import { DayInkInWords } from "./CpuDayInk";
import { Tags, tagsFor } from "./CpuTags";
import { Trace, type TraceKind } from "./CpuTrace";
import { StepWords } from "./CpuWords";
import { stillNow } from "../stage/motion";
import {
  benchCamera,
  benchTiles,
  stepFrame,
  stopAt,
  useBenchDawn,
  useStepArrival,
  useStepMotion,
  useYourTurn,
} from "./useCpuBench";
import { useAnnouncer, useCameraMoving, useChipInView, useRailedViewSize, useTimers } from "../stage/useScene";
import { useStepScroll } from "../stage/useStepScroll";

const INTRO_CITATIONS = ["acpiProcessorDefs", "acpiProcessor", "linuxCpuidle"];
const CAVEAT_CITATIONS = ["acpiProcessor", "acpiLpi", "acpiCppc"];

/** Every source this chapter cites, for the page's source list. */
export const CPU_POWER_SOURCES: string[] = [
  ...new Set([
    ...INTRO_CITATIONS,
    ...CAVEAT_CITATIONS,
    ...NIGHT.flatMap((s) => [...s.citations, ...s.ruleCitations]),
    ...PLAY_CITATIONS,
    ...DAY.flatMap((s) => s.citations),
    ...CARD_CITATIONS,
  ]),
];

export function CpuPowerIntro() {
  return (
    <p className="twotone chapter-intro">
      Idle cores rest at depths the OS picks for each moment, and running cores run at a performance level.{" "}
      <b>The deeper the rest, the less power it draws and, in general, the longer it takes to come back.</b>
      <Cite ids={INTRO_CITATIONS} />
    </p>
  );
}

/** The dawn span's slot among the markers the step hook observes: one past the steps. */
const DAWN = STEP_COUNT;

/** The scene: one pinned bench, the night's steps, the reader's turn, the dawn, the day's steps. */
function Bench() {
  const { i, go, markers, chips, onKey } = useStepScroll(STEP_COUNT);
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const day = i >= DAY0;
  const yourTurn = i === LAST_NIGHT;
  const step = i < LAST_NIGHT ? NIGHT[i] : null;
  const still = stillNow();

  // Measuring the view. A short narrow window (a phone on its side) keeps the words column beside the figure, not cards.
  const { size, narrow, short, reflow } = useRailedViewSize(view, stage, rail, { vw: 1280, vh: 640 }, true);

  // The camera.
  const { stop, frame, t, traceT, inkFrom, inkTo } = benchCamera(i, narrow, size);
  // The labels hide while the plate moves to a new frame, or they would float.
  const moving = useCameraMoving(stepFrame(i), 950);
  useBenchDawn(stage, markers, DAWN, day);

  // The timed motion of a step, the reader's turn, and what a screen reader hears. useStepMotion comes
  // first: it clears the step's timers on a step change, and useStepArrival then starts the announcement's.
  const { later, clear: clearTimers } = useTimers();
  const { status, announce } = useAnnouncer(later);
  const motion = useStepMotion(i, later, clearTimers, announce);
  const turn = useYourTurn(later, announce);
  const stageFocus = useStepArrival(i, narrow, stage, rail, chips, announce);
  useChipInView(chips, i, narrow, size.vw);

  // The picture.
  const { tiles, lit } = benchTiles(i, motion.tileOver, motion.phase, turn.play.picks);
  const trace: TraceKind = yourTurn
    ? { kind: "play", picks: turn.play.picks }
    : step && (step.lane || step.lanes)
      ? {
          kind: "step",
          step,
          level: step.scale === "cppc" ? CPPC_CASES[motion.phase].level : undefined,
          phase: motion.phase,
        }
      : { kind: "none" };
  const traceEl = <Trace kind={trace} run={motion.run} />;
  const tags = day ? [] : tagsFor(i, narrow, t, traceT, motion.phase, turn.play.picks);

  // The words: beside the figure (the column), and once per step in the track (the cards of a narrow screen).
  // The controls of the step on show live in the column, or in that step's card where the cards are what is read.
  const casesLabel = still ? "Next case" : "Play the three cases again";
  const controlsInColumn = !narrow || still || short;

  return (
    <>
      <div className="cp-caveat-band">
        <p className="board-caveat cp-caveat">
          {CAVEAT}
          <Cite ids={CAVEAT_CITATIONS} />
        </p>
      </div>
      <section className="cp-scene" aria-labelledby="cp-scene-title">
        <h2 className="sr-only" id="cp-scene-title">
          The night bench: processor idle states, wake cost, containers, performance states and CPPC, then your turn.
          Then by day, the same bench written on in ink
        </h2>
        <div
          className={`cp-stage${day ? " day" : ""}${yourTurn ? " play" : ""}${reflow || still ? " reflow" : ""}`}
          ref={stage}
          onFocusCapture={stageFocus.onFocusCapture}
          onBlurCapture={stageFocus.onBlurCapture}
        >
          <div className="cp-view" ref={view}>
            <BenchPicture
              t={t}
              frame={frame}
              step={step}
              tiles={tiles}
              lit={lit}
              picked={yourTurn && turn.waiting >= 0}
              motion={motion}
              trace={!narrow && traceEl}
              ink={{ from: inkFrom, to: inkTo, stretch: narrow ? IDLE_STRETCH : 1 }}
              still={still}
            />
            {narrow && (
              <svg
                className="cp-strip"
                style={{ ["--k" as string]: textFloor(24, 1, traceT.s).toFixed(3) }}
                viewBox={`${STRIP.x} ${STRIP.y} ${STRIP.w} ${STRIP.h}`}
                preserveAspectRatio="xMidYMid meet"
                aria-hidden="true"
              >
                {traceEl}
              </svg>
            )}
            <Tags tags={tags} moving={moving} />
            <div className="cp-sky-fade" aria-hidden="true" />
            <div className="cp-exit-fade" aria-hidden="true" />
          </div>
          <BenchMoon />
          <BenchRail i={i} narrow={narrow} chips={chips} railRef={rail} go={go} onKey={onKey} />
          <div className="cp-words-col">
            <div className="cp-words">
              <StepWords
                i={i}
                play={turn.play}
                onPick={turn.pick}
                onOs={turn.osChoose}
                onAgain={turn.again}
                onCases={motion.playCases}
                cases={casesLabel}
                primary={controlsInColumn}
                onBus={motion.passBus}
                stop={stop ?? undefined}
              />
            </div>
          </div>
          {/* Your turn: a depth ladder beside core 0, on the figure (the words' buttons are the keyboard route). */}
          {yourTurn && !narrow && turn.waiting >= 0 && (
            <div className={`cp-controls${moving ? " moving" : ""}`} aria-hidden="true">
              {PICKS.map(([v, w], j) => (
                <button
                  key={v}
                  type="button"
                  tabIndex={-1}
                  className="cp-ladder"
                  style={{ ...place(t, 452, TOP_Y), marginTop: `${j * 50}px` }}
                  onClick={() => turn.pick(v)}
                >
                  {w}
                </button>
              ))}
            </div>
          )}
          <p className="sr-only" role="status" aria-atomic="true">
            {status}
          </p>
        </div>
        <div className="cp-track">
          {Array.from({ length: STEP_COUNT }, (_, at) => (
            <div key={at} style={{ display: "contents" }}>
              {at === DAY0 && (
                <div
                  className="cp-dawn-span"
                  data-index={LAST_NIGHT}
                  ref={(el) => {
                    markers.current[DAWN] = el;
                  }}
                />
              )}
              <div
                className={`cp-marker${at >= DAY0 ? ` day${DAY_STOPS[dayStopOf(at - DAY0)].to === at - DAY0 ? "" : " cp-nostop"}` : ""}`}
                data-index={at}
                ref={(el) => {
                  markers.current[at] = el;
                }}
              >
                <div className="cp-card">
                  <StepWords
                    i={at}
                    play={turn.play}
                    onPick={at === i ? turn.pick : undefined}
                    onOs={at === i ? turn.osChoose : undefined}
                    onAgain={at === i ? turn.again : undefined}
                    onCases={at === i ? motion.playCases : undefined}
                    onBus={at === i ? motion.passBus : undefined}
                    cases={casesLabel}
                    primary={!controlsInColumn && at === i}
                    stop={stopAt(at, narrow) ?? undefined}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export function CpuPower({ children }: { children?: ReactNode }) {
  return (
    <>
      <Bench />
      <div className="chapter-light cp-light">
        <DayInkInWords />
        <CpuCards />
        {children}
      </div>
    </>
  );
}
