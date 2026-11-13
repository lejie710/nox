// Chapter 2, Modern Standby: one
// continuous night. The halo floats on a full-bleed sky with its labels on
// the rings; eight scroll steps (the eighth is the reader's turn: find the
// blocker), and the whole night follows the state; then dawn into the light
// part. Every fact comes from src/model/modernStandby.ts or carries its own
// citation here.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Cite } from "../components/Chrome";
import moonImage from "../assets/halo-moon.webp";
import { litPath } from "../model/moon";
import {
  BLOCKER_CITATIONS,
  CONDITIONS,
  CONDITION_CITATIONS,
  FIGURE,
  K_DRIPS,
  K_SCREEN_OFF,
  RINGS,
  STANDBY_STEPS,
  STEP_COUNT,
  YOUR_TURN,
  inDrips,
  playState,
  type CondState,
  type ConditionId,
} from "../model/modernStandby";
import { StepRail } from "../stage/StepRail";
import { useExitFade } from "../stage/useScene";
import { useStepScroll } from "../stage/useStepScroll";

const INTRO_CITATIONS = ["msModernStandby", "msStandbyVsS3", "msIdleActive"];
const FIGURE_CITATIONS = ["msPrepareHardware"];
const FIELD_CITATIONS = ["msIdleActive", "msSleepStudy", "linuxSleepStates"];
const COMPARE_CITATIONS = ["msStandbyVsS3", "msStandbyStates"];
/** The words on the rail's chips: one per step, then the reader's turn. */
const RAIL = [...STANDBY_STEPS.map((s) => s.rail), YOUR_TURN.rail];

/** Every source this chapter cites, for the page's source list. */
export const MODERN_STANDBY_SOURCES: string[] = [
  ...new Set([
    ...INTRO_CITATIONS,
    ...FIGURE_CITATIONS,
    ...STANDBY_STEPS.flatMap((s) => [...s.citations, ...(s.noteCitations ?? [])]),
    ...CONDITION_CITATIONS,
    ...BLOCKER_CITATIONS,
    ...FIELD_CITATIONS,
    ...COMPARE_CITATIONS,
  ]),
];

export function ModernStandbyIntro() {
  return (
    <p className="twotone chapter-intro">
      The screen goes dark, but the system stays in S0 while in standby.{" "}
      <b>
        Underneath, it powers down layer by layer, and reaches its deepest idle only when five conditions are met at
        once.
      </b>
      <Cite ids={INTRO_CITATIONS} />
    </p>
  );
}

/** Where each ring's label sits on its upper-right arc (degrees up from the x axis). */
const ANCHOR: Partial<Record<ConditionId, number>> = { devices: 52, network: 33, hosts: 17, cpu: -14 };
const { c: C, moonR: MOON_R, socR: SOC_R } = FIGURE;

interface NightView {
  states: Record<ConditionId, CondState>;
  open: boolean;
  focus: (ConditionId | "moon")[];
  words: Partial<Record<ConditionId, string>>;
}

function stateWord(id: ConditionId, view: NightView): string {
  const c = CONDITIONS.find((x) => x.id === id)!;
  const st = view.states[id];
  return view.words[id] ?? (st === "met" ? c.met : st);
}

/** The ring a condition draws: a met network keeps its pilot glow. */
const ringState = (id: ConditionId, st: CondState) => (id === "network" && st === "met" ? "listening" : st);

/** The halo: rings, SoC boundary and moon in SVG; labels and key in HTML. */
function Halo({ view, play, onToggle }: { view: NightView; play: boolean; onToggle: (id: ConditionId) => void }) {
  const focused = (id: ConditionId | "moon") => view.focus.includes(id);
  const lit = litPath(view.open ? K_DRIPS : K_SCREEN_OFF, MOON_R, C) ?? "";
  const label = (id: ConditionId, extra?: ReactNode) => {
    const c = CONDITIONS.find((x) => x.id === id)!;
    const inner = (
      <>
        <span className="ms-label-dot" aria-hidden="true" />
        <span className="ms-label-text">
          <span className="ms-label-name">{c.name}</span>
          <span className="ms-label-state">{stateWord(id, view)}</span>
          {extra}
        </span>
      </>
    );
    const cls = `ms-label${focused(id) ? " focus" : ""}`;
    return play ? (
      <button
        type="button"
        className={cls}
        data-id={id}
        data-state={view.states[id]}
        aria-pressed={view.states[id] === "busy"}
        aria-describedby="ms-play-hint"
        onClick={() => onToggle(id)}
      >
        {inner}
      </button>
    ) : (
      <span className={cls} data-id={id} data-state={view.states[id]}>
        {inner}
      </span>
    );
  };
  return (
    <div className="ms-halo-area">
      <div className="ms-halo-box">
        <svg className="ms-halo" viewBox="0 0 1000 1000" aria-hidden="true">
          <defs>
            <filter id="ms-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="9" />
            </filter>
            <clipPath id="ms-disc">
              <circle cx={C} cy={C} r={MOON_R} />
            </clipPath>
            <clipPath id="ms-lit">
              <path d={lit} />
            </clipPath>
          </defs>
          <circle className="ms-soc" cx={C} cy={C} r={SOC_R} />
          <text className="ms-soc-label" x={C} y={C + SOC_R - 16} textAnchor="middle">
            SoC
          </text>
          {RINGS.map((g) => (
            <g
              key={g.id}
              className={`ms-ring${focused(g.id) ? " focus" : ""}`}
              data-state={ringState(g.id, view.states[g.id])}
            >
              <circle className="ms-ring-glow" cx={C} cy={C} r={g.r!} filter="url(#ms-blur)" />
              <circle className="ms-ring-line" cx={C} cy={C} r={g.r!} />
              {play && <circle className="ms-ring-hit" cx={C} cy={C} r={g.r!} onClick={() => onToggle(g.id)} />}
              <text className="ms-ring-n" x={C} y={C - g.r! - 14} textAnchor="middle">
                {g.n}
              </text>
            </g>
          ))}
          <g className={`ms-moon${focused("moon") ? " focus" : ""}`}>
            <g clipPath="url(#ms-disc)" className="ms-moon-dark">
              <image href={moonImage} x={C - MOON_R} y={C - MOON_R} width={2 * MOON_R} height={2 * MOON_R} />
            </g>
            <g clipPath="url(#ms-lit)">
              <image href={moonImage} x={C - MOON_R} y={C - MOON_R} width={2 * MOON_R} height={2 * MOON_R} />
            </g>
            <circle className="ms-moon-edge" cx={C} cy={C} r={MOON_R + 6} />
          </g>
        </svg>
        <div className="ms-labels">
          {RINGS.map((g) => {
            const a = (ANCHOR[g.id]! * Math.PI) / 180;
            return (
              <div
                key={g.id}
                className="ms-label-at"
                style={{ left: `${(C + g.r! * Math.cos(a)) / 10}%`, top: `${(C - g.r! * Math.sin(a)) / 10}%` }}
              >
                {label(g.id)}
              </div>
            );
          })}
        </div>
        <p className={`ms-soc-word ${view.open ? "open" : "shut"}`}>
          {view.open ? "The SoC: in DRIPS" : "The SoC: out of DRIPS"}
        </p>
      </div>
      <div className="ms-veil-label">{label("tasks", <span className="ms-label-where">the cloud veil</span>)}</div>
      {/* Phones: a one-line key; the reader's toggles are in the step 8 card. */}
      <div className="ms-key">
        {CONDITIONS.map((c) => (
          <span key={c.id} className="ms-key-chip" data-state={view.states[c.id]}>
            <span aria-hidden="true">
              {c.n ?? "~"} {c.short}
            </span>
            <span className="sr-only">
              {c.name}: {stateWord(c.id, view)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const FIG_NOTE =
  "An illustrative figure: the rings show the order Windows powers layers down, outside in, not where parts sit.";

/** One step's words: in the pinned stage on wide screens, in a scrolling card on phones. */
function StepWords({
  i,
  story,
  kept,
  toggles,
}: {
  i: number;
  story: { lead: string; rest: string };
  kept: boolean;
  toggles?: { states: Record<ConditionId, CondState>; onToggle: (id: ConditionId) => void };
}) {
  if (i === STANDBY_STEPS.length) {
    return (
      <>
        <p className="ms-pos">
          Step {STEP_COUNT} of {STEP_COUNT}
        </p>
        <h3 className="ms-title">{YOUR_TURN.title}</h3>
        <p className="twotone ms-text">
          <b>{kept ? YOUR_TURN.kept : YOUR_TURN.lead}</b> {YOUR_TURN.rest}
        </p>
        <p className="twotone ms-story">
          <b>{story.lead}</b> {story.rest}
          <Cite ids={BLOCKER_CITATIONS} />
        </p>
        {toggles && (
          <div className="ms-card-toggles">
            {CONDITIONS.map((c) => (
              <button
                key={c.id}
                type="button"
                className="ms-key-chip"
                data-state={toggles.states[c.id]}
                aria-pressed={toggles.states[c.id] === "busy"}
                aria-describedby="ms-play-hint"
                onClick={() => toggles.onToggle(c.id)}
              >
                <span aria-hidden="true">
                  {c.n ?? "~"} {c.short}
                </span>
                <span className="sr-only">
                  {c.name}: {toggles.states[c.id] === "met" ? c.met : toggles.states[c.id]}
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="ms-hint">Select a condition to keep it busy. Select it again to let it finish.</p>
      </>
    );
  }
  const s = STANDBY_STEPS[i];
  return (
    <>
      <p className="ms-pos">
        Step {i + 1} of {STEP_COUNT}
      </p>
      <h3 className="ms-title">{s.title}</h3>
      <p className="twotone ms-text">
        <b>{s.lead}</b> {s.rest}
        <Cite ids={s.citations} />
      </p>
      <p className="ms-rule">
        <b>The rule.</b> {s.rule}
        <Cite ids={s.citations} up />
      </p>
      {s.note && (
        <p className="ms-fig-note ms-step-note">
          {s.note}
          <Cite ids={s.noteCitations ?? s.citations} up />
        </p>
      )}
    </>
  );
}

/** The scene: one pinned night, seven steps, then the reader's turn, then the way to dawn. */
function Night() {
  const { i, go, markers, chips, onKey } = useStepScroll(STEP_COUNT);
  const play = i === STANDBY_STEPS.length;
  const [busy, setBusy] = useState<ReadonlySet<ConditionId>>(new Set());
  const [status, setStatus] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  // Whether focus was on a figure control; checked after a step change,
  // when that control may already have been removed.
  const focusInFigure = useRef(false);
  const p = playState(busy);
  const s = STANDBY_STEPS[Math.min(i, STANDBY_STEPS.length - 1)];
  const view: NightView = play
    ? { states: p.states, open: p.open, focus: [], words: {} }
    : { states: s.states, open: inDrips(s.states), focus: s.focus, words: s.words ?? {} };
  const depth = play ? p.depth : s.depth;
  const veil = view.states.tasks;

  // Announce each step once the reader moves; keep focus off a removed control.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setStatus(
      play
        ? `Step ${STEP_COUNT} of ${STEP_COUNT}: your turn. ${playState(busy).lead}`
        : `Step ${i + 1} of ${STEP_COUNT}: ${STANDBY_STEPS[i].title}.`,
    );
    if (focusInFigure.current && !area.current?.contains(document.activeElement)) {
      focusInFigure.current = false;
      chips.current[i]?.focus({ preventScroll: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a step change announces; a change of the busy conditions is announced in toggle()
  }, [i]);

  // As the scene ends, the moon fades and the halo drifts up into the dawn.
  useExitFade(stage);

  const toggle = (id: ConditionId) => {
    const next = new Set(busy);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setBusy(next);
    const q = playState(next);
    setStatus(`${q.lead} ${q.rest}`);
  };

  const cardToggle = (id: ConditionId) => {
    if (!play) go(STANDBY_STEPS.length);
    toggle(id);
  };

  return (
    <>
      {/* As in chapter 1: one caveat line, with room, before the pinned figure. */}
      <div className="ms-caveat-band">
        <p className="board-caveat ms-caveat">
          {FIG_NOTE}
          <Cite ids={FIGURE_CITATIONS} />
        </p>
      </div>
      <section className="ms-scene" aria-labelledby="ms-scene-title" style={{ ["--steps" as string]: STEP_COUNT }}>
        <h2 className="sr-only" id="ms-scene-title">
          Into Modern Standby, layer by layer, then your turn
        </h2>
        <div
          className={`ms-stage${play ? " play" : ""}${view.focus.length ? " has-focus" : ""}${!play && s.warm ? " warm" : ""}`}
          ref={stage}
          data-veil={veil}
          style={{ ["--depth" as string]: depth }}
        >
          <div className="ms-night" aria-hidden="true">
            <div className="ms-sky" />
            <div className="ms-veil" />
            <div className="ms-veil-busy" />
            <div className="ms-deep" />
            <div className="ms-warm" />
            <div className="ms-fade" />
          </div>
          <StepRail prefix="ms" labels={RAIL} current={i} chips={chips} onChoose={go} onKey={onKey} />
          <div className="ms-grid">
            <div
              ref={area}
              onFocusCapture={() => {
                focusInFigure.current = true;
              }}
              onBlurCapture={(e) => {
                if (e.relatedTarget && !area.current?.contains(e.relatedTarget as Node)) focusInFigure.current = false;
              }}
            >
              <Halo view={view} play={play} onToggle={toggle} />
            </div>
            <div className="ms-words">
              <StepWords i={i} story={p} kept={busy.size > 0} />
            </div>
          </div>
          <p className="sr-only" role="status" aria-atomic="true">
            {status}
          </p>
          <p className="sr-only" id="ms-play-hint">
            Select a condition to keep it busy. Select it again to let it finish.
          </p>
        </div>
        <div className="ms-track">
          {Array.from({ length: STEP_COUNT }, (_, at) => (
            <div
              key={at}
              className="ms-marker"
              data-index={at}
              ref={(el) => {
                markers.current[at] = el;
              }}
            >
              {/* Phones: the step's words scroll past under the pinned halo. */}
              <div className="ms-card">
                <StepWords
                  i={at}
                  story={p}
                  kept={busy.size > 0}
                  toggles={at === STANDBY_STEPS.length ? { states: p.states, onToggle: cardToggle } : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/** Compare: the two power models as two rows of states. */
function CompareRows() {
  return (
    <ol className="model-rows" aria-label="Two power models">
      <li className="model-row">
        <span className="model-name">S3</span>
        <span className="model-chips">
          <span className="model-chip">Active</span>
          <span className="model-arrow" aria-hidden="true">
            →
          </span>
          <span className="model-chip">S3</span>
        </span>
        <span className="model-note">Either active or in S3. No software runs while asleep.</span>
      </li>
      <li className="model-row">
        <span className="model-name">Modern Standby</span>
        <span className="model-chips">
          <span className="model-chip">Active</span>
          <span className="model-arrow" aria-hidden="true">
            →
          </span>
          <span className="model-chip">Screen Off</span>
          <span className="model-arrow" aria-hidden="true">
            →
          </span>
          <span className="model-chip">Sleep</span>
        </span>
        <span className="model-note">Steps down as parts go unused. Still S0, with short bursts of allowed work.</span>
      </li>
    </ol>
  );
}

function StandbyCards() {
  return (
    <div className="field-cards">
      <section className="fcard" aria-labelledby="ms-field-title">
        <p className="fcard-label">In the field</p>
        <h2 className="fcard-title" id="ms-field-title">
          The battery drained overnight.
        </h2>
        <p>
          Almost every Modern Standby power problem comes down to one of the five conditions not being met. On Windows,{" "}
          <code>powercfg /sleepstudy</code>, run as administrator, writes an HTML report of the last three days (up to
          28 with <code>/duration</code>). Each Sleep session lists its five most active components, the top offenders.
          On Linux, the closest equivalent state is suspend-to-idle, <code>s2idle</code> in{" "}
          <code>/sys/power/mem_sleep</code>.
          <Cite ids={FIELD_CITATIONS} />
        </p>
      </section>
      <section className="fcard" aria-labelledby="ms-compare-title">
        <p className="fcard-label">Compare</p>
        <h2 className="fcard-title" id="ms-compare-title">
          Same floor, different path.
        </h2>
        <CompareRows />
        <p>
          At their lowest power the two look alike: processors powered off, memory in self-refresh. The difference is
          the path: stepping down without a firmware step makes getting in and out much quicker, and Microsoft's
          telemetry shows resume at least twice as fast as from S3.
          <Cite ids={COMPARE_CITATIONS} />
        </p>
      </section>
    </div>
  );
}

export function ModernStandby({ children }: { children?: ReactNode }) {
  return (
    <>
      <Night />
      <div className="chapter-dawn" aria-hidden="true" />
      <div className="chapter-light">
        <StandbyCards />
        {/* A cross-reference, after the cards and in their column. */}
        <p className="ms-names-link">
          What ACPI, Windows and Linux call this state: <a href="#/chapter/big-picture">chapter 1's names table</a>.
        </p>
        {children}
      </div>
    </>
  );
}
