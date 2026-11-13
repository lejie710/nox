// The main page's story, "chapter 0": one laptop through one night, on the chapters' grammar. One photograph
// from one camera (the lid open, half closed, closed), pinned large on the left; the words beside it change
// in place; no rail and no step count. While the lid is shut, the night is one line drawn in the room the open lid
// left, each stop naming one thing on it. Facts and wording: src/model/story.ts.
import { useRef, type CSSProperties } from "react";
import { Cite } from "../components/Chrome";
import awakePlate from "../assets/st-awake.webp";
import closedPlate from "../assets/st-closed.webp";
import dawnPlate from "../assets/st-dawn.webp";
import halfPlate from "../assets/st-half.webp";
import openPlate from "../assets/st-open.webp";
import { stillNow } from "../stage/motion";
import { useViewSize } from "../stage/useScene";
import { useStepScroll } from "../stage/useStepScroll";
import type { SceneFit } from "../model/layout";
import { LEVELS, minuteOf } from "../model/night";
import {
  CAVEAT,
  LED,
  LEVEL_Y,
  LINE,
  PLATE,
  SCREEN,
  STEP_COUNT,
  STOPS,
  STOP_H,
  TIGHT_BELOW,
  drawnShare,
  fit,
  labelsAt,
  lineShown,
  linePath,
  lineX,
  type PlateId,
} from "../model/story";

/** The photograph each plate id shows: five states of one laptop from one camera, each an edit of the first. */
const PLATES: { id: PlateId; src: string }[] = [
  { id: "open", src: openPlate },
  { id: "half", src: halfPlate },
  { id: "closed", src: closedPlate },
  { id: "awake", src: awakePlate },
  { id: "dawn", src: dawnPlate },
];
const TICKS = ["23:00", "01:00", "03:00", "05:00", "07:00"];

/** The picture: the plates stacked, the standby light, the clock on the open screen, and the night line. */
export function World({ i, t, tight = false }: { i: number; t: SceneFit; tight?: boolean }) {
  const s = STOPS[i];
  const line = lineShown(i);
  const labels = labelsAt(i);
  const open = s.plate === "open" || s.plate === "dawn";
  return (
    <div
      className="st-world"
      aria-hidden="true"
      style={{ transform: `translate(${t.tx.toFixed(1)}px, ${t.ty.toFixed(1)}px) scale(${t.s.toFixed(4)})` }}
    >
      <i className={`st-sky${s.plate === "dawn" ? " on" : s.id === "open" ? " half" : ""}`} />
      {PLATES.map((p) => (
        <img
          key={p.id}
          className={`st-plate${p.id === s.plate ? " on" : ""}`}
          src={p.src}
          width={PLATE.w}
          height={PLATE.h}
          alt=""
          decoding="async"
        />
      ))}
      {/* The standby light breathes while idle (a soft shade over the photographed amber light); the wake has its own photograph, the light white and steady. */}
      <i className={`st-led-breath${s.plate === "closed" ? " on" : ""}`} style={{ left: LED[0], top: LED[1] }} />
      <p
        className={`st-clock${open ? " on" : ""}${s.plate === "dawn" ? " dawn" : ""}`}
        style={{ left: SCREEN.cx, top: SCREEN.cy }}
      >
        {s.time}
        <small>{s.plate === "dawn" ? "Monday, 9 November" : "Sunday, 8 November"}</small>
      </p>
      <svg
        className={`st-ov${line ? " on" : ""}${tight ? " tight" : ""}`}
        viewBox={`0 0 ${PLATE.w} ${PLATE.h}`}
        style={{ ["--k" as string]: (1 / t.s).toFixed(4) }}
      >
        {LEVELS.map((name, k) => (
          <text
            key={name}
            className="st-level"
            x={LINE.x0 - 26}
            y={LEVEL_Y[k]}
            textAnchor="end"
            dominantBaseline="middle"
          >
            {name}
          </text>
        ))}
        <path className="st-line-ghost" d={linePath()} />
        <path
          className="st-line"
          d={linePath()}
          pathLength={1}
          style={{ strokeDashoffset: 1 - drawnShare(s.drawnTo) }}
        />
        {TICKS.map((tk) => (
          <text key={tk} className="st-tick" x={lineX(minuteOf(tk))} y={LINE.y1 + 48} textAnchor="middle">
            {tk}
          </text>
        ))}
        {STOPS.flatMap((st) => (st.label ? [st.label] : [])).map((l) => {
          const on = labels.includes(l),
            px = lineX(l.at),
            py = LEVEL_Y[l.level];
          return (
            <g key={`${l.x}-${l.y}`} className={`st-label${on ? " on" : ""}`}>
              <line x1={px} y1={py} x2={l.x - 12} y2={l.y - 8} />
              <circle cx={px} cy={py} r={7} />
              <text x={l.x} y={l.y}>
                {l.parts.map((p, j) => (
                  <tspan key={p.name} dx={j ? "1.6em" : 0}>
                    {p.name}
                    <tspan className={p.warm ? "state warm" : "state"}> · {p.state}</tspan>
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** A stop as plain text, with no controls: what a reader who goes through the page in order gets for every stop. */
function PlainWords({ i }: { i: number }) {
  const s = STOPS[i];
  return (
    <>
      <h3>
        {s.time}. {s.title}
      </h3>
      <p>
        {s.state}. {s.lead}
        {s.rest && <> {s.rest}</>}
      </p>
      {s.rule && <p>{s.rule}</p>}
    </>
  );
}

export function StepWords({ i }: { i: number }) {
  const s = STOPS[i];
  const labels = lineShown(i) ? labelsAt(i) : [];
  return (
    <>
      <p className="st-pos">
        <span className="st-time">{s.time}</span> · {s.state}
      </p>
      <h3 className="st-title">{s.title}</h3>
      <p className="twotone st-text">
        <b>{s.lead}</b>
        {s.rest && <> {s.rest}</>}
        <Cite ids={s.citations} />
      </p>
      {s.rule && (
        <p className="st-rule">
          {s.rule}
          {s.ruleCitations && <Cite ids={s.ruleCitations} up />}
        </p>
      )}
      {/* The line's labels as text: read aloud everywhere, shown on narrow screens, where the line's own text is too small. */}
      {labels.length > 0 && (
        <ul className="st-list" aria-label="On the night's line so far">
          {labels.map((l) => (
            <li key={`${l.x}-${l.y}`}>
              {l.parts.map((p) => (
                <span key={p.name}>
                  {p.name}
                  <span className={p.warm ? "state warm" : "state"}> · {p.state}</span>
                </span>
              ))}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function Story() {
  const { i, go, markers } = useStepScroll(STEP_COUNT);
  const view = useRef<HTMLDivElement>(null);
  const { size, narrow } = useViewSize(view, { vw: 1366, vh: 708 });
  const still = stillNow();

  const t = fit(size.vw, size.vh, narrow);
  const tight = !narrow && t.s < TIGHT_BELOW;
  const s = STOPS[i];

  return (
    <div className="chapter story">
      <div className="step-marker" data-step="night" style={{ top: 0, height: "100%" }} aria-hidden="true" />
      <div className="st-caveat-band">
        <p className="board-caveat">
          {CAVEAT.text}
          <Cite ids={CAVEAT.citations} />
        </p>
      </div>
      <section
        className="st-scene"
        aria-labelledby="st-scene-title"
        style={{ ["--sum" as string]: STEP_COUNT * STOP_H } as CSSProperties}
      >
        <h2 className="sr-only" id="st-scene-title">
          One laptop through one night, from 22:47 to 07:30
        </h2>
        <div className="st-stage">
          {/* No rail of chips on the main page: the step line says where the reader is. */}
          <div className="st-view" ref={view}>
            <World i={i} t={t} tight={tight} />
          </div>
          {/* The words column shows on wide screens, and on narrow ones only when still (no cards then). */}
          <div
            className={`st-words${tight ? " tight" : ""}`}
            style={narrow ? undefined : { left: t.wordsLeft, width: t.wordsWidth }}
          >
            <StepWords i={i} />
            {/* Still (?static, reduced motion): nothing scrolls the stops, so two plain controls step through them. */}
            {still && (
              <p className="st-nav">
                {/* aria-disabled, not disabled: the control keeps focus at either end. */}
                <button
                  type="button"
                  aria-disabled={i === 0}
                  onClick={() => {
                    if (i > 0) go(i - 1);
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  aria-disabled={i === STEP_COUNT - 1}
                  onClick={() => {
                    if (i < STEP_COUNT - 1) go(i + 1);
                  }}
                >
                  Next
                </button>
              </p>
            )}
          </div>
          <p className="sr-only" role="status" aria-atomic="true">{`${s.time}. ${s.title}`}</p>
        </div>
        {!still && (
          <div className="st-track">
            {STOPS.map((st, k) => (
              <div
                key={st.id}
                className={`st-marker${k === i ? " on" : ""}`}
                data-index={k}
                style={{ ["--h" as string]: STOP_H } as CSSProperties}
                ref={(el) => {
                  markers.current[k] = el;
                }}
              >
                {/* Every stop is in the page, in order, for a reader who does not scroll by sight. Narrow screens: the
                    stop's words scroll past under the pinned figure. Wide screens: the same stop as plain text, out of
                    sight (the words column beside the picture is the one that shows), with nothing to tab to. */}
                <div className="st-card">{narrow ? <StepWords i={k} /> : <PlainWords i={k} />}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
