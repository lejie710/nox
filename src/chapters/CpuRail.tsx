// Chapter 4's rail of chips. It has two groups, the night's steps and the day's, and shows one at a time;
// the last chip of the night's group ("By day") and the first of the day's (back to the first night step)
// cross over. On narrow screens a day chip stands for a stop that holds several steps.
import type { KeyboardEvent, Ref, RefObject } from "react";
import { DAY, DAY0, DAY_STOPS, LAST_NIGHT, NIGHT, STEP_COUNT, YOUR_TURN, dayStopOf } from "../model/cpuPower";
import { reach, stopAt } from "./useCpuBench";
import { railTarget } from "../stage/useStepScroll";

interface BenchRailProps {
  /** The step the page is on. */
  i: number;
  narrow: boolean;
  chips: RefObject<(HTMLButtonElement | null)[]>;
  railRef: Ref<HTMLDivElement>;
  go: (step: number) => void;
  /** The key handler of a rail with one chip per step (useStepScroll), used on wide screens. */
  onKey: (e: KeyboardEvent<HTMLButtonElement>, step: number) => void;
}

export function BenchRail({ i, narrow, chips, railRef, go, onKey }: BenchRailProps) {
  const day = i >= DAY0;
  /** Whether chip `at` belongs to the group on show. */
  const shown = (at: number) =>
    day ? (at >= DAY0 && (!narrow || reach(at, narrow) === at)) || at === 0 : at < DAY0 || at === DAY0;
  // The chip that crosses over: "By day" at the end of the night's group, the first night step at the start of the day's.
  const crossing = (at: number) => (day ? at === 0 : at === DAY0);
  const label = (at: number) =>
    crossing(at)
      ? day
        ? NIGHT[0].rail
        : "By day"
      : at === LAST_NIGHT
        ? YOUR_TURN.rail
        : at >= DAY0
          ? (stopAt(at, narrow)?.rail ?? DAY[at - DAY0].rail)
          : NIGHT[at].rail;
  /** A day chip's place in its group, counted from 0: its stop on narrow screens, its step on wide ones. */
  const dayPlace = (at: number) => (narrow ? dayStopOf(at - DAY0) : at - DAY0);
  // Arrow keys on a narrow screen step over the day steps that have no stop of their own.
  const railKey = (e: KeyboardEvent<HTMLButtonElement>, at: number) => {
    if (!narrow) {
      onKey(e, at);
      return;
    }
    const order = [...Array.from({ length: DAY0 }, (_, n) => n), ...DAY_STOPS.map((s) => DAY0 + s.to)];
    const to = railTarget(e, order.indexOf(reach(at, narrow)), order.length - 1);
    if (to === null) return;
    e.preventDefault();
    go(order[to]);
    chips.current[order[to]]?.focus({ preventScroll: true });
  };

  return (
    <div
      className="cp-rail"
      ref={railRef}
      role="radiogroup"
      aria-label="Steps. Choose one to read about it."
      data-g={day ? "day" : "night"}
    >
      {Array.from(
        { length: STEP_COUNT },
        (_, at) =>
          shown(at) && (
            <button
              key={at}
              type="button"
              role="radio"
              aria-checked={at === i}
              tabIndex={at === i ? 0 : -1}
              aria-setsize={day ? (narrow ? DAY_STOPS.length : DAY.length) + 1 : DAY0 + 1}
              aria-posinset={day ? (at === 0 ? 1 : dayPlace(at) + 2) : at + 1}
              aria-label={
                crossing(at)
                  ? day
                    ? `${NIGHT[0].rail}: back to the night`
                    : "By day: on to the daytime steps"
                  : undefined
              }
              ref={(el) => {
                chips.current[at] = el;
              }}
              className={`cp-chip${at === LAST_NIGHT ? " cp-chip-play" : ""}${crossing(at) ? " cp-chip-cross" : ""}`}
              onClick={() => go(reach(at, narrow))}
              onKeyDown={(e) => railKey(e, at)}
            >
              {crossing(at) ? (
                <span className="cp-chip-label">
                  {day && <span aria-hidden="true">← </span>}
                  {label(at)}
                  {!day && <span aria-hidden="true"> →</span>}
                </span>
              ) : (
                <>
                  <span className="cp-chip-n">{at >= DAY0 ? dayPlace(at) + 1 : at + 1}</span>{" "}
                  <span className="cp-chip-label">{label(at)}</span>
                </>
              )}
            </button>
          ),
      )}
    </div>
  );
}
