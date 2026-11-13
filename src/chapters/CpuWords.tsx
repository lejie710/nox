// Chapter 4's words: what stands beside the bench for a night step, for the reader's turn (with its
// buttons), and for a day step or, on narrow screens, a day stop that holds several steps.
import { Cite } from "../components/Chrome";
import {
  DAY,
  DAY0,
  DAY_STOPS,
  LAST_NIGHT,
  NIGHT,
  PICKS,
  PLAY_CITATIONS,
  YOUR_TURN,
  question,
  storyFor,
  type DayStop,
  type Pick,
} from "../model/cpuPower";
import { stillNow } from "../stage/motion";
import type { Play } from "./useCpuBench";

const SkipDay = () => (
  <p className="cp-hint">
    <a
      className="cp-skip"
      href="#cp-day-desc"
      onClick={(e) => {
        e.preventDefault();
        const t = document.getElementById("cp-day-desc");
        t?.scrollIntoView({ block: "start" });
        t?.focus({ preventScroll: true });
      }}
    >
      Skip to the day in words, then In the field
    </a>
  </p>
);

/** One step's words: beside the figure on wide screens, in a card under it on narrow ones. */
export function StepWords({
  i,
  play,
  onPick,
  onOs,
  onAgain,
  onCases,
  onBus,
  cases,
  primary = false,
  stop,
}: {
  i: number;
  play: Play;
  onPick?: (p: Pick) => void;
  onOs?: () => void;
  onAgain?: () => void;
  onCases?: () => void;
  onBus?: () => void;
  cases?: string;
  primary?: boolean;
  stop?: DayStop;
}) {
  if (i === LAST_NIGHT) {
    const k = play.picks.findIndex((x) => !x);
    return (
      <>
        <p className="cp-pos">
          Step {LAST_NIGHT + 1} of {LAST_NIGHT + 1}
        </p>
        <h3 className="cp-title">{YOUR_TURN.title}</h3>
        <p className="twotone cp-text">
          <b>{YOUR_TURN.lead}</b> {YOUR_TURN.rest}
          <Cite ids={PLAY_CITATIONS} />
        </p>
        <p className="cp-q" id={primary ? "cp-picker-q" : undefined}>
          {k >= 0 ? question(k) : play.os ? YOUR_TURN.osDone : YOUR_TURN.allDone}
        </p>
        {onPick && k >= 0 && (
          <div
            className="cp-picker"
            role="group"
            aria-label="Pick a depth for core 0"
            aria-describedby={primary ? "cp-picker-q" : undefined}
          >
            {PICKS.map(([v, w]) => (
              <button key={v} type="button" className="cp-act" onClick={() => onPick(v)}>
                {w}
              </button>
            ))}
          </div>
        )}
        <p className="cp-story">
          {play.picks.map((s, j) =>
            s ? (
              <span key={j}>
                {storyFor(play.picks, j, true)}
                <br />
              </span>
            ) : null,
          )}
        </p>
        <p className="cp-hint">{YOUR_TURN.hint}</p>
        {onOs && onAgain && (
          <div className="cp-acts">
            <button
              type="button"
              className="cp-act"
              id={primary ? "cp-os" : undefined}
              disabled={play.os}
              onClick={onOs}
            >
              Let the OS choose
            </button>
            <button type="button" className="cp-act" id={primary ? "cp-again" : undefined} onClick={onAgain}>
              Start again
            </button>
          </div>
        )}
      </>
    );
  }
  // Narrow screens by day: one stop holds several steps, each with its own heading and sources.
  if (i >= DAY0 && stop) {
    return (
      <>
        <p className="cp-pos">
          By day, {DAY_STOPS.indexOf(stop) + 1} of {DAY_STOPS.length}
        </p>
        {DAY.slice(stop.from, stop.to + 1).map((d) => (
          <div className="cp-stop-step" key={d.rail}>
            <h3 className="cp-title">{d.title}</h3>
            <p className="twotone cp-text">
              <b>{d.lead}</b>
              {d.rest ? ` ${d.rest}` : ""}
              {d.citations.length > 0 && <Cite ids={d.citations} />}
            </p>
          </div>
        ))}
        <SkipDay />
      </>
    );
  }
  if (i >= DAY0) {
    const d = DAY[i - DAY0];
    return (
      <>
        <p className="cp-pos">
          By day, {i - DAY0 + 1} of {DAY.length}
        </p>
        <h3 className="cp-title">{d.title}</h3>
        <p className="twotone cp-text">
          <b>{d.lead}</b>
          {d.rest ? ` ${d.rest}` : ""}
          {d.citations.length > 0 && <Cite ids={d.citations} />}
        </p>
        <SkipDay />
      </>
    );
  }
  const s = NIGHT[i];
  return (
    <>
      <p className="cp-pos">
        Step {i + 1} of {LAST_NIGHT + 1}
      </p>
      <h3 className="cp-title">{s.title}</h3>
      <p className="twotone cp-text">
        <b>{s.lead}</b> {s.rest}
        <Cite ids={s.citations} />
      </p>
      <p className="cp-rule">
        <b>The rule.</b> {s.rule}
        <Cite ids={s.ruleCitations} up />
      </p>
      {s.note && <p className="cp-hint">{s.note}</p>}
      {s.scale === "cppc" && onCases && (
        <div className="cp-acts">
          <button type="button" className="cp-act" onClick={onCases}>
            {cases}
          </button>
        </div>
      )}
      {s.busMaster && onBus && !stillNow() && (
        <div className="cp-acts">
          <button type="button" className="cp-act" onClick={onBus}>
            Show the bus-master pass again
          </button>
        </div>
      )}
    </>
  );
}
