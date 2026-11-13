// Chapter 5, the sleep and wake sequence: one photograph of a desktop at night and
// one camera for the whole chapter. Nothing is drawn on the photograph but light: every light is
// a lit plate minus the unlit one, added back (mix-blend-mode: screen), and the points of light
// sit on the real parts. Labels are bare text with a hairline (no boxes). Eight scroll stops,
// the reader's turn, then the same frame at dawn. Facts and wording: src/model/sleepWake.ts.
import {
  Fragment,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Cite } from "../components/Chrome";
import { rich } from "../components/rich";
import basePlate from "../assets/sw-frame-base.webp";
import dawnPlate from "../assets/sw-frame-dawn.webp";
import glowAmber from "../assets/sw-glow-amber.webp";
import glowWhite from "../assets/sw-glow-white.webp";
import monLight from "../assets/sw-mon-light.webp";
import moonEarly from "../assets/sw-moon-early.webp";
import moonLate from "../assets/sw-moon-late.webp";
import ringLight from "../assets/sw-ring.webp";
import {
  DAWN_H,
  FLOOR_Y,
  LAYER_BOX,
  MARK_IDS,
  PARTS,
  PLATE,
  SHROUD,
  SLEEP_STEPS,
  STEP_COUNT,
  TURN,
  TURN_H,
  fit,
  labelSpot,
  moonMix,
  plain,
  restSub,
  stepView,
  timeOf,
  timeRange,
  turnView,
  type Label,
  type Scene,
  type Sys,
  type Turn,
  type TurnLabel,
  type TurnView,
} from "../model/sleepWake";
import { NARROW, NAV_HEIGHT, toView, type SceneFit } from "../model/layout";
import { REFERENCE_CITATIONS, Reference } from "./SleepWakeReference";
import { StepRail } from "../stage/StepRail";
import { isStill, stillNow } from "../stage/motion";
import { useChipInView, useSpoken, useViewSize } from "../stage/useScene";
import { useStopScroll, useTurn, useTurnFocus, type Acts } from "./useSleepWake";
import { railTarget, useStepScroll } from "../stage/useStepScroll";

const INTRO_CITATIONS = ["acpiSleepMethods", "acpiSleeping"];
const CAVEAT_CITATIONS = ["acpiSleeping", "acpiFixedHardware"];
/** The reader's turn comes after the stops: its index is their number, which is also the n of "Step 3 of n". */
const LAST = SLEEP_STEPS.length;
/** The words on the rail's chips: one per step, then the reader's turn. */
const RAIL = [...SLEEP_STEPS.map((s) => s.rail), TURN.rail];

/** Every source this chapter cites, for the page's source list. */
export const SLEEP_WAKE_SOURCES: string[] = [
  ...new Set([
    ...INTRO_CITATIONS,
    ...CAVEAT_CITATIONS,
    ...SLEEP_STEPS.flatMap((s) => [...s.citations, ...s.ruleCitations, ...(s.noteCitations ?? [])]),
    ...TURN.citations,
    ...TURN.ruleCitations,
    ...TURN.autoCitations,
    ...REFERENCE_CITATIONS,
  ]),
];

export function SleepWakeIntro() {
  return (
    <p className="twotone chapter-intro">
      Going to S3 is a hand-off: the operating system prepares,{" "}
      <b>
        one write gives the machine to the hardware, and on the way back the firmware runs before the operating system
        does.
      </b>
      <Cite ids={INTRO_CITATIONS} />
    </p>
  );
}

const CAVEAT =
  "An illustrative desktop that supports S3, in generated photographs, not a real product. Which sleep states exist, what stays powered and what can wake it vary by platform. The machine's light and the points of light are this chapter's devices for whose code runs and which bits are set. No real machine shows them.";

// ---- The picture: the plate, its light, the points of light ---------------------------------

const box = ([x, y, w, h]: readonly [number, number, number, number]): CSSProperties => ({
  left: x,
  top: y,
  width: w,
  height: h,
});

function World({ scene, sub, t }: { scene: Scene; sub: number; t: SceneFit }) {
  const moon = moonMix(scene, sub);
  const layer = (src: string, b: readonly [number, number, number, number], on: number, cls = "") => (
    <img className={`sw-lyr${cls}`} src={src} alt="" decoding="async" style={{ ...box(b), opacity: on }} />
  );
  return (
    <div
      className={`sw-world${scene.cut ? " cut" : ""}`}
      aria-hidden="true"
      style={{ transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.s})` }}
    >
      <img className="sw-plate" src={basePlate} width={PLATE.w} height={PLATE.h} alt="" />
      {layer(monLight, LAYER_BOX.mon, scene.mon ? 1 : 0)}
      {layer(moonEarly, LAYER_BOX.moonEarly, moon.early, " slow")}
      {layer(moonLate, LAYER_BOX.moonLate, moon.late, " slow")}
      {layer(glowWhite, LAYER_BOX.glowWhite, scene.glow === "white" ? 1 : 0)}
      {layer(glowAmber, LAYER_BOX.glowAmber, scene.glow === "amber" ? 1 : 0)}
      {layer(ringLight, LAYER_BOX.ring, scene.ring ? 1 : 0)}
      {/* Points of light on the real parts, each on a soft dark underlay so it holds on bright metal. */}
      {MARK_IDS.map((id) => {
        const [x, y] = PARTS[id].at,
          st = scene.marks[id];
        return (
          <Fragment key={id}>
            <i className={`sw-under${st ? " show" : ""}`} style={{ left: x, top: y }} />
            <i className={`sw-mark${st ? ` ${st}` : ""}`} style={{ left: x, top: y }} />
          </Fragment>
        );
      })}
      <img className="sw-plate sw-dawn" src={dawnPlate} width={PLATE.w} height={PLATE.h} alt="" decoding="async" />
    </div>
  );
}

// ---- Labels: a dot on the part, a hairline, bare text; in Your turn the label is the button ----

const actKey = (l: TurnLabel) => (l.act ? (l.act.kind === "sleep" ? "sleep" : `${l.act.kind}:${l.act.id}`) : l.part);
const runAct = (l: TurnLabel, a: Acts) => {
  const x = l.act;
  if (!x) return;
  if (x.kind === "arm") a.arm(x.id);
  else if (x.kind === "sleep") a.sleep();
  else a.fire(x.id);
};

function LabelInner({ l }: { l: TurnLabel }) {
  const toggle = l.pressed !== undefined;
  return (
    <>
      <b>
        {l.name}
        {toggle && <span className="sr-only"> wake</span>}
      </b>
      <span className="sr-only">: </span>
      <i className={l.hot ? "hot" : undefined} aria-hidden={toggle || undefined}>
        {rich(l.state)}
      </i>
    </>
  );
}

export function Labels({
  labels,
  bits,
  t,
  narrow,
  acts,
  done,
}: {
  labels: TurnLabel[];
  bits: TurnView["bits"];
  t: SceneFit;
  narrow: boolean;
  acts: Acts;
  done: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ ax: number; ay: number; ex: number; ey: number; line: boolean }[]>([]);
  // On narrow screens every button shares one group at the foot of the figure, spaced in screen px.
  const placed = labels.filter((l) => !(l.act && narrow));
  const grouped = labels.filter((l) => l.act && narrow);
  const key = `${placed.map((l) => `${actKey(l)}|${l.state}`).join(";")}@${t.s.toFixed(4)},${t.tx.toFixed(1)},${t.ty.toFixed(1)},${narrow}`;

  // Leaders: from the dot to the nearest point of the label's box, stopping at the box.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const nodes = [...el.querySelectorAll<HTMLElement>("[data-ax]")];
    const measure = () => {
      const vb = el.getBoundingClientRect();
      setLines(
        nodes.flatMap((n) => {
          const ax = Number(n.dataset.ax),
            ay = Number(n.dataset.ay);
          if (ax < -4 || ax > vb.width + 4) return [];
          const b = n.getBoundingClientRect(),
            pad = n.tagName === "BUTTON" ? 0 : 5;
          const ex = Math.min(Math.max(ax, b.left - vb.left - pad), b.right - vb.left + pad);
          const ey = Math.min(Math.max(ay, b.top - vb.top - pad), b.bottom - vb.top + pad);
          return [{ ax, ay, ex, ey, line: Math.hypot(ex - ax, ey - ay) > 10 }];
        }),
      );
    };
    measure();
    // A label's box changes when the web font arrives or its text re-wraps: measure again.
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    nodes.forEach((n) => ro.observe(n));
    return () => ro.disconnect();
  }, [key]);

  const [gx, gy] = toView(t, [SHROUD.x, SHROUD.y]);
  return (
    <>
      <svg className="sw-leaders" aria-hidden="true">
        {lines.map((l, k) => (
          <Fragment key={k}>
            {l.line && <line x1={l.ax} y1={l.ay} x2={l.ex} y2={l.ey} />}
            <circle cx={l.ax} cy={l.ay} r="2.5" />
          </Fragment>
        ))}
      </svg>
      <div className="sw-labels" ref={root} role="group" aria-label="On the machine">
        {placed.map((l) => {
          const at = labelSpot(l.part, t, narrow),
            [ax, ay] = toView(t, PARTS[l.part].at);
          const style: CSSProperties = { left: at.x, top: at.y, maxWidth: at.maxWidth };
          const cls = `sw-lb${at.right ? " r" : ""}`;
          return l.act ? (
            <button
              key={actKey(l)}
              type="button"
              className={cls}
              style={style}
              data-ax={ax}
              data-ay={ay}
              aria-pressed={l.pressed}
              onClick={() => runAct(l, acts)}
            >
              <LabelInner l={l} />
            </button>
          ) : (
            <span key={actKey(l)} className={cls} style={style} data-ax={ax} data-ay={ay}>
              <LabelInner l={l} />
            </span>
          );
        })}
        {(grouped.length > 0 || bits.length > 0) && (
          <div
            className={`sw-btns${narrow ? " low" : ""}`}
            style={narrow ? undefined : { left: gx, top: gy, maxWidth: (SHROUD.right - SHROUD.x) * t.s }}
          >
            {grouped.map((l) => (
              <button
                key={actKey(l)}
                type="button"
                className="sw-lb"
                aria-pressed={l.pressed}
                onClick={() => runAct(l, acts)}
              >
                <LabelInner l={l} />
              </button>
            ))}
            {bits.map((b) => (
              <button
                key={`pick:${b.id}`}
                type="button"
                className="sw-lb"
                aria-disabled={done || undefined}
                onClick={() => acts.pick(b.id)}
              >
                <b>{b.name}</b>
                <span className="sr-only">: </span>
                <i className={b.set ? "hot" : undefined}>{b.set ? "set" : "clear"}</i>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ---- The words: beside the picture on wide screens, in a card under it on narrow ones ---------

function Counter({ what, sys, time }: { what: string; sys: Sys; time: string }) {
  return (
    <p className="sw-pos">
      <span>{what}</span>
      <span className="sw-sys">{sys}</span>
      {time && <time>{time}</time>}
    </p>
  );
}

function StepWords({ i, sub, live }: { i: number; sub: number; live: boolean }) {
  const s = SLEEP_STEPS[i],
    v = stepView(s, sub);
  const note = v.after ? v.note : s.note;
  return (
    <>
      <Counter what={`Step ${i + 1} of ${LAST}`} sys={v.sys} time={live ? timeOf(s, sub) : timeRange(s)} />
      <h3 className="sw-title">{s.title}</h3>
      <p className="twotone sw-text">
        <b>{rich(s.lead)}</b>
        {s.rest && <> {rich(s.rest)}</>}
        <Cite ids={s.citations} />
      </p>
      <p className="sw-rule">
        <b>The rule.</b> {rich(s.rule)}
        <Cite ids={s.ruleCitations} up />
      </p>
      {note && (
        <p className="sw-hint">
          {note}
          {!v.after && s.noteCitations && <Cite ids={s.noteCitations} up />}
        </p>
      )}
    </>
  );
}

export function TurnWords({ turn, view, onReset }: { turn: Turn; view: TurnView; onReset: () => void }) {
  return (
    <>
      <Counter what="Your turn" sys={view.sys} time={view.time} />
      <h3 className="sw-title">{TURN.title}</h3>
      {turn.phase === "waking" ? (
        <p className="twotone sw-text">
          {view.beats.map((b, k) => (
            <Fragment key={k}>
              {k > 0 && <br />}
              {k === view.beats.length - 1 ? <b>{b}</b> : b}
            </Fragment>
          ))}
        </p>
      ) : (
        <p className="twotone sw-text">
          <b>{rich(view.lead)}</b>
          {view.leadCitations.length > 0 && <Cite ids={view.leadCitations} />}
        </p>
      )}
      {turn.verdict && (
        <p className="twotone sw-verdict">
          <b>{rich(turn.verdict.lead)}</b> {rich(turn.verdict.rest)}
        </p>
      )}
      {view.note && <p className="sw-hint">{view.note}</p>}
      {turn.phase !== "arm" && (
        <div className="sw-acts">
          <button type="button" className="sw-again" onClick={onReset}>
            Start again
          </button>
        </div>
      )}
      {turn.phase === "done" && (
        <p className="sw-rule">
          <b>The rule.</b> {rich(TURN.rule)}
          <Cite ids={[...TURN.ruleCitations]} up />
        </p>
      )}
    </>
  );
}

// ---- The scene ---------------------------------------------------------------------------------

function Night() {
  const { i, go, markers, chips } = useStepScroll(STEP_COUNT);
  const play = i === LAST;
  const still = stillNow();
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const wordsEl = useRef<HTMLDivElement>(null);
  const dawnSpan = useRef<HTMLDivElement>(null);
  // The view's size frames the plate; one camera, so a resize only re-fits.
  const { size, narrow } = useViewSize(view, { vw: 1366, vh: 708 });
  // What follows the scroll, the reader's turn, and where focus goes on that turn.
  const { sub, setSub } = useStopScroll(i, markers, stage, dawnSpan);
  const { turn, acts, reset } = useTurn();
  const stageFocus = useTurnFocus(i, turn, stage, wordsEl, chips);

  const step = SLEEP_STEPS[Math.min(i, LAST - 1)];
  const at = still ? restSub(step) : sub;
  const tv = turnView(turn);
  const sv = stepView(step, at);
  const scene = play ? tv.scene : sv.scene;
  const labels: TurnLabel[] = play ? tv.labels : sv.labels;
  const t = fit(size.vw, size.vh, narrow);

  // Each change the reader should hear: the stop, its second half, or the reply to their action.
  const said = play
    ? `${TURN.title.replace(/\?$/, "")}. System: ${tv.sys}. ${turn.verdict ? `${turn.verdict.lead} ${turn.verdict.rest}` : tv.lead}${tv.bits.length ? ` ${tv.bits.map((b) => `${b.name}, ${b.set ? "set" : "clear"}`).join("; ")}.` : ""}`
    : `Step ${i + 1} of ${LAST}: ${step.title}. System: ${sv.sys}.${sv.after ? ` ${sv.note}` : ""} On the machine: ${sv.labels.map((l: Label) => `${l.name}, ${l.state}`).join("; ")}.`;
  // The verdict object is new on every answered press, so the same reply is spoken again.
  const status = useSpoken(said, turn.verdict, plain);

  useChipInView(chips, i, narrow, size.vw);

  // A chip lands three tenths into its stop, not at its middle: SLP_EN opens lit, before the hand-off,
  // and Asleep opens under the early moon. (The shared hook centres the marker.)
  const goStop = (k: number) => {
    go(k);
    setSub(0.3);
    const m = markers.current[k];
    const scene = stage.current?.parentElement;
    if (!m || !scene || isStill()) return;
    // Never above the point where the stage pins under the navigation bar.
    const pinned = window.scrollY + scene.getBoundingClientRect().top - NAV_HEIGHT;
    // Narrow: the stop's card should sit just under the figure, so only a little short of the middle.
    window.scrollTo({
      top: Math.max(pinned, window.scrollY - m.offsetHeight * (window.innerWidth < NARROW ? 0.08 : 0.2)),
      behavior: "instant",
    });
  };
  const railKey = (e: KeyboardEvent<HTMLButtonElement>, k: number) => {
    const n = railTarget(e, k, LAST);
    if (n === null) return;
    e.preventDefault();
    goStop(n);
    chips.current[n]?.focus({ preventScroll: true });
  };
  const sceneH = SLEEP_STEPS.reduce((a, s) => a + s.h, 0) + TURN_H;
  const stageStyle = {
    ["--floor" as string]: `${(view.current?.offsetTop ?? 0) + t.ty + FLOOR_Y * t.s}px`,
    ["--edge0" as string]: `${t.tx + 1620 * t.s}px`,
    ["--edge1" as string]: `${t.tx + 2150 * t.s}px`,
  } as CSSProperties;

  return (
    <>
      <div className="sw-caveat-band">
        <p className="board-caveat sw-caveat">
          {CAVEAT}
          <Cite ids={CAVEAT_CITATIONS} />
        </p>
      </div>
      <section
        className="sw-scene"
        aria-labelledby="sw-scene-title"
        style={{ ["--sum" as string]: sceneH, ["--dawn-h" as string]: DAWN_H }}
      >
        <h2 className="sr-only" id="sw-scene-title">
          The desktop at night: the S3 sleep and wake sequence, then your turn
        </h2>
        <div
          className={`sw-stage${play ? " play" : ""}`}
          ref={stage}
          style={stageStyle}
          onFocusCapture={stageFocus.onFocusCapture}
          onBlurCapture={stageFocus.onBlurCapture}
          onPointerDown={stageFocus.onPointerDown}
        >
          <StepRail prefix="sw" labels={RAIL} current={i} chips={chips} onChoose={goStop} onKey={railKey} />
          <div className="sw-fill" aria-hidden="true" />
          <div className="sw-view" ref={view}>
            <World scene={scene} sub={at} t={t} />
            <div className="sw-shade" aria-hidden="true" />
            <Labels
              labels={labels}
              bits={play ? tv.bits : []}
              t={t}
              narrow={narrow}
              acts={acts}
              done={turn.phase === "done"}
            />
          </div>
          <div className="sw-paper" aria-hidden="true" />
          {/* The words column shows on wide screens, and on narrow ones only in ?static (no cards then). */}
          <div
            className="sw-words"
            ref={wordsEl}
            tabIndex={-1}
            style={narrow ? undefined : { left: t.wordsLeft, width: t.wordsWidth }}
          >
            {play ? <TurnWords turn={turn} view={tv} onReset={reset} /> : <StepWords i={i} sub={at} live />}
          </div>
          <p className="sr-only" role="status" aria-atomic="true">
            {status}
          </p>
        </div>
        <div className="sw-track">
          {Array.from({ length: STEP_COUNT }, (_, k) => (
            <div
              key={k}
              className={`sw-marker${k === i ? " on" : ""}${k === LAST ? " turn" : ""}`}
              data-index={k}
              style={{ ["--h" as string]: k === LAST ? TURN_H : SLEEP_STEPS[k].h }}
              ref={(el) => {
                markers.current[k] = el;
              }}
            >
              {/* Narrow screens: the stop's words scroll past under the pinned figure. */}
              <div className="sw-card" inert={play && k !== LAST}>
                {k === LAST ? (
                  <TurnWords turn={turn} view={tv} onReset={reset} />
                ) : (
                  <StepWords i={k} sub={k === i ? at : 0.3} live={false} />
                )}
              </div>
            </div>
          ))}
          {/* The dawn: the last stop stays current while the same frame turns to morning. */}
          <div
            className="sw-dawn-span"
            data-index={LAST}
            ref={(el) => {
              dawnSpan.current = el;
              markers.current[STEP_COUNT] = el;
            }}
          />
        </div>
      </section>
    </>
  );
}

export function SleepWake({ children }: { children?: ReactNode }) {
  return (
    <>
      <Night />
      {/* Narrow screens have no scrubbed dawn: the night gives way in a band, as in chapters 1 to 3. */}
      <div className="chapter-dawn sw-dawn-band" aria-hidden="true" />
      <div className="chapter-light sw-light">
        <Reference />
        {children}
      </div>
    </>
  );
}
