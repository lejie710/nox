// Chapter 1, the big picture: the pinned board walkthrough,
// the names table, two field cards, and the "What survives?" sandbox.
// The board itself is drawn by Board.tsx.
// Every fact on the page comes from src/model/bigPicture.ts or carries its
// own citation below; BIG_PICTURE_SOURCES lists them all for the page.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BoardCallout, BoardPicture, PartsList } from "./Board";
import { isStill } from "../stage/motion";
import { useStepScroll } from "../stage/useStepScroll";
import { Cite } from "../components/Chrome";
import { LOOK_WORDS, PARTS, PART_IDS } from "../model/board";
import {
  MAP,
  NAMES,
  NAMES_CITATIONS,
  SANDBOX_LIGHT,
  STATE_STEPS,
  outcome,
  sandboxLooks,
  type SandboxEvent,
  type SandboxState,
} from "../model/bigPicture";

const INTRO_CITATIONS = ["acpiTerms"];
// What stays powered for wake, and that it varies by platform.
const HINT_CITATIONS = ["msSystemPowerStates", "linuxSleepStates"];
const FIELD_CITATIONS = ["msPowercfg", "linuxSleepStates"];
const COMPARE_CITATIONS = ["msSystemPowerStates"];

const SANDBOX_STATES: { id: SandboxState; label: string; name: string }[] = [
  { id: "s3", label: "S3", name: "asleep" },
  { id: "s4", label: "S4", name: "hibernating" },
  { id: "s5", label: "S5", name: "soft off" },
];
const SANDBOX_EVENTS: { id: SandboxEvent; label: string }[] = [
  { id: "button", label: "Press the power button" },
  { id: "powerLost", label: "Lose all power" },
];

function allSandboxCitations(): string[] {
  const ids: string[] = [];
  for (const s of SANDBOX_STATES) for (const e of SANDBOX_EVENTS) ids.push(...outcome(s.id, e.id).citations);
  return ids;
}

/** Every source this chapter cites, for the page's source list. */
export const BIG_PICTURE_SOURCES: string[] = [
  ...new Set([
    ...INTRO_CITATIONS,
    ...HINT_CITATIONS,
    ...STATE_STEPS.flatMap((s) => s.citations),
    ...NAMES_CITATIONS,
    ...FIELD_CITATIONS,
    ...COMPARE_CITATIONS,
    ...allSandboxCitations(),
  ]),
];

/** The chapter's two-tone sub-line under its title. */
export function BigPictureIntro() {
  return (
    <p className="twotone chapter-intro">
      Asleep, hibernating and off look the same from outside: a dark screen.{" "}
      <b>
        Underneath they differ in one thing that matters: where your session is kept, and what it takes to get it back.
      </b>
      <Cite ids={INTRO_CITATIONS} />
    </p>
  );
}

/** Fade a step's words in on each change without replacing them, so a
 *  focused citation button keeps its focus. */
function useWordFade(i: number) {
  const words = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (isStill()) return;
    words.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: "ease" });
  }, [i]);
  return words;
}

/** Each marker contains a complete state, so reverse scrolling works too. */
function StateMap() {
  const { i, go, markers, chips, onKey } = useStepScroll(STATE_STEPS.length);
  const words = useWordFade(i);
  const st = STATE_STEPS[i];
  const index = (chip: string) => STATE_STEPS.findIndex((s) => s.chip === chip);
  const lane = MAP.find((g) => g.global === st.global)!;

  const part = PARTS[st.focus];

  return (
    <section aria-labelledby="map-title">
      <h2 className="sr-only" id="map-title">
        The state map
      </h2>
      <p className="board-caveat">
        An illustrative laptop, not any real product. Which parts stay powered, including for wake, varies by platform.
        <Cite ids={HINT_CITATIONS} />
      </p>
      <div className="board-scrolly">
        <div className="board-stage">
          <div className="board-rail" role="radiogroup" aria-label="Power states. Choose one to read about it.">
            {MAP.map((g) => (
              <div key={g.global} className="board-lane" role="group" aria-label={`${g.global} ${g.name}`}>
                <button
                  type="button"
                  className="board-lane-name"
                  aria-label={`${g.global} ${g.name}: go to ${g.chips[0]}`}
                  onClick={() => go(index(g.chips[0]))}
                >
                  {g.global} {g.name}
                </button>
                {g.chips.map((c) => {
                  const at = index(c);
                  const on = at === i;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      ref={(el) => {
                        chips.current[at] = el;
                      }}
                      className="board-chip"
                      tabIndex={on ? 0 : -1}
                      onClick={() => go(at)}
                      onKeyDown={(e) => onKey(e, at)}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="board-stage-grid">
            <figure className="board-figure">
              <BoardPicture looks={st.looks} light={st.light}>
                <BoardCallout focus={st.focus} callout={st.callout} citations={st.citations} />
              </BoardPicture>
              <figcaption className="board-hint">Hover or tap a part for its name and state.</figcaption>
            </figure>
            <PartsList looks={st.looks} label={`Parts in ${st.chip}`} />
            <div className="board-words" ref={words}>
              <p className="board-pos" aria-hidden="true">
                Step {i + 1} of {STATE_STEPS.length}: {st.global} {lane.name}
              </p>
              <h3 className="board-title">{st.title}</h3>
              <p className="twotone board-text">
                <span className="board-readout">
                  Session: {st.session}
                  <span className="sr-only">.</span> <span aria-hidden="true">·</span> Back: {st.back}.
                </span>{" "}
                <b>{st.lead}</b> {st.rest}
                <Cite ids={st.citations} />
              </p>
              <p className="board-rule">
                <b>The rule.</b> {st.rule}
                <Cite ids={st.citations} up />
              </p>
              {st.note && (
                <p className="board-note">
                  {st.note}
                  <Cite ids={HINT_CITATIONS} up />
                </p>
              )}
              {/* One short announcement, without reading citation controls aloud. */}
              <p
                className="sr-only"
                role="status"
                aria-atomic="true"
              >{`Step ${i + 1} of ${STATE_STEPS.length}, ${st.global}: ${st.title}. ${part.name}: ${st.callout}`}</p>
            </div>
          </div>
        </div>
        <div className="board-track" aria-hidden="true">
          {STATE_STEPS.map((s, at) => (
            <div
              key={s.id}
              className="board-marker"
              data-index={at}
              ref={(el) => {
                markers.current[at] = el;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function NamesTable() {
  return (
    <section className="chapter-block" aria-labelledby="names-title">
      <h2 className="block-title" id="names-title">
        One state, three names.
      </h2>
      <p className="block-sub">
        What the specification, Windows and Linux each call the same state, or its closest equivalent.
        <Cite ids={NAMES_CITATIONS} />
      </p>
      <div className="names-wrap">
        <table className="names">
          <thead>
            <tr>
              <th scope="col">ACPI</th>
              <th scope="col">Windows</th>
              <th scope="col">Linux</th>
            </tr>
          </thead>
          <tbody>
            {NAMES.map((n) => (
              <tr key={n.acpi}>
                <th scope="row">{n.acpi}</th>
                <td>{n.windows}</td>
                <td>{n.linux}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FieldCards() {
  return (
    <div className="field-cards">
      <section className="fcard" aria-labelledby="field-title">
        <p className="fcard-label">In the field</p>
        <h2 className="fcard-title" id="field-title">
          Ask the machine what it supports.
        </h2>
        <p>
          On Windows, <code>powercfg /a</code> lists the sleep states this system offers and, where it can, why the
          others are not available. On Linux, <code>/sys/power/state</code> lists the supported states, and{" "}
          <code>/sys/power/mem_sleep</code> lists which of the names in the table above (<code>s2idle</code>,{" "}
          <code>shallow</code>, <code>deep</code>) this system supports for <code>mem</code>, with the one in use shown
          in [brackets].
          <Cite ids={FIELD_CITATIONS} />
        </p>
      </section>
      <section className="fcard" aria-labelledby="compare-title">
        <p className="fcard-label">Compare</p>
        <h2 className="fcard-title" id="compare-title">
          Shut down is not always S5.
        </h2>
        <p>
          In Windows, fast startup is the default when you shut down. It logs off user sessions, then writes only the
          kernel's contents (session 0) to the hibernation file: the system has actually gone through S4, so the next
          start is quicker. Your open work is not kept. A restart is a full shutdown: S5.
          <Cite ids={COMPARE_CITATIONS} />
        </p>
      </section>
    </div>
  );
}

function SandboxChoices<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
}: {
  name: string;
  legend: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="sandbox-choice">
      <legend>{legend}</legend>
      <div className="sandbox-pills">
        {options.map((o) => (
          <label key={o.id} className={`sandbox-pill${o.id === value ? " on" : ""}`}>
            <input type="radio" name={name} value={o.id} checked={o.id === value} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Sandbox() {
  const [state, setState] = useState<SandboxState>("s3");
  const [event, setEvent] = useState<SandboxEvent>("powerLost");
  const o = outcome(state, event);
  const looks = sandboxLooks(state, event);
  const stateName = SANDBOX_STATES.find((s) => s.id === state)!;
  const eventLabel = SANDBOX_EVENTS.find((e) => e.id === event)!.label;
  const verdict = o.survives ? "The session survives." : "The session is lost.";
  return (
    <section className="sandbox" aria-labelledby="sandbox-title">
      <h2 className="block-title" id="sandbox-title">
        What survives?
      </h2>
      <p className="block-sub">Put the laptop in a state, then something happens. Is your work still there?</p>
      <p
        className="sr-only"
        role="status"
        aria-atomic="true"
      >{`${stateName.label}, then ${eventLabel.toLowerCase()}: ${verdict} ${o.result}`}</p>
      <div className="sandbox-grid">
        <figure className="sandbox-board">
          <BoardPicture looks={looks} light={SANDBOX_LIGHT} />
          <ul className="sr-only" aria-label={`Parts in ${stateName.label}, after you ${eventLabel.toLowerCase()}`}>
            {PART_IDS.map((id) => (
              <li key={id}>
                {PARTS[id].name}: {LOOK_WORDS[looks[id]]}.
              </li>
            ))}
          </ul>
          <figcaption className="sandbox-board-hint">Hover or tap a part for its name and state.</figcaption>
        </figure>
        <div className="sandbox-words">
          <div className="sandbox-controls">
            <SandboxChoices
              name="sb-state"
              legend="1. Put the laptop in"
              options={SANDBOX_STATES.map((s) => ({ id: s.id, label: `${s.label}, ${s.name}` }))}
              value={state}
              onChange={setState}
            />
            <SandboxChoices
              name="sb-event"
              legend="2. Then"
              options={SANDBOX_EVENTS}
              value={event}
              onChange={setEvent}
            />
          </div>
          <p className="twotone sandbox-story">
            <b>{verdict}</b> {o.why} {o.result}
            <Cite ids={o.citations} />
          </p>
        </div>
      </div>
    </section>
  );
}

export function BigPicture({ children }: { children?: ReactNode }) {
  return (
    <>
      <StateMap />
      <Sandbox />
      <div className="chapter-dawn" aria-hidden="true" />
      <div className="chapter-light">
        <NamesTable />
        <FieldCards />
        {children}
      </div>
    </>
  );
}
