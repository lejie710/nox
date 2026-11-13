// Chapter 6, Under the hood: the chapter 1 laptop taken apart, one photograph. Everything drawn
// on it is one SVG in the plate's own pixels: amber spans on the memory for the tables the firmware wrote,
// white threads for the addresses the OS follows, then the tree of names landing on the parts. The camera
// moves between three framings of the photograph. Seven scroll stops, the reader's turn, the same frame at
// dawn, then the same machine by day as a line drawing. Facts and wording: src/model/underHood.ts.
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Cite } from "../components/Chrome";
import { rich } from "../components/rich";
import basePlate from "../assets/uh-apart-base.webp";
import dawnPlate from "../assets/uh-apart-dawn.webp";
import poweredPatch from "../assets/uh-ssd-powered.webp";
import {
  CAVEAT,
  DAWN_H,
  DOT,
  DOT_IDS,
  NAME,
  NAME_IDS,
  PLATE,
  POWERED_BOX,
  SSD_BOX,
  STEP_COUNT,
  STOPS,
  STOP_H,
  STRIP,
  STRIP_ROWS,
  TABLE,
  TABLE_IDS,
  THREAD,
  THREAD_IDS,
  TURN,
  TURN_H,
  TURN_FOOT,
  facsCore,
  fit,
  frameFor,
  initialTurn,
  litAt,
  nameAt,
  plain,
  press,
  sigAt,
  slotLine,
  spanPoints,
  threadPath,
  turnView,
  type Action,
  type Fit,
  type FrameId,
  type Lit,
  type Pt,
  type Turn,
  type TurnView,
} from "../model/underHood";
import { toView } from "../model/layout";
import { StepRail } from "../stage/StepRail";
import { REFERENCE_CITATIONS, Reference } from "./UnderHoodReference";
import { stillNow } from "../stage/motion";
import {
  dawnShare,
  showDawn,
  useCameraMoving,
  useChipInView,
  useScrollFrame,
  useSpoken,
  useViewSize,
} from "../stage/useScene";
import { useStepScroll } from "../stage/useStepScroll";

const INTRO_CITATIONS = ["acpiRsdp", "acpiDefBlocks", "acpiMethodsAsl"];
const CAVEAT_CITATIONS = ["acpiRsdp"];
const LAST = STOPS.length;
/** The words on the rail's chips: one per step, then the reader's turn. */
const RAIL = [...STOPS.map((s) => s.rail), TURN.rail];

/** Every source this chapter cites, for the page's source list. */
export const UNDER_HOOD_SOURCES: string[] = [
  ...new Set([
    ...INTRO_CITATIONS,
    ...CAVEAT_CITATIONS,
    ...STOPS.flatMap((s) => [...s.citations, ...s.ruleCitations, ...(s.noteCitations ?? [])]),
    ...TURN.citations,
    ...REFERENCE_CITATIONS,
  ]),
];

export function UnderHoodIntro() {
  return (
    <p className="twotone chapter-intro">
      The earlier chapters' objects live in tables the firmware leaves in memory.{" "}
      <b>
        The firmware only writes them: the operating system finds them, builds one tree of names, and runs their methods
        itself.
      </b>
      <Cite ids={INTRO_CITATIONS} />
    </p>
  );
}

const points = (ps: Pt[]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
const cls = (base: string, lit: Lit, key: string) => `${base}${lit[key] ? ` ${lit[key]}` : ""}`;

// ---- The picture: the plate, and one SVG for everything drawn on it ---------------------------------------

export function World({ lit, t, moving }: { lit: Lit; t: Fit; moving: boolean }) {
  // A stagger on the way on only: what goes dark goes at once.
  const delay = (key: string, s?: number): CSSProperties | undefined =>
    s && lit[key] && !stillNow() ? { transitionDelay: `${s}s` } : undefined;
  return (
    <div className="uh-world" aria-hidden="true" style={{ transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.s})` }}>
      <img className="uh-plate" src={basePlate} width={PLATE.w} height={PLATE.h} alt="" />
      <i className={cls("uh-glow", lit, "powered")} />
      <img
        className={cls("uh-led", lit, "powered")}
        src={poweredPatch}
        alt=""
        decoding="async"
        style={{ left: POWERED_BOX[0], top: POWERED_BOX[1], width: POWERED_BOX[2], height: POWERED_BOX[3] }}
      />
      <svg
        className={`uh-ov${moving ? " moving" : ""}`}
        viewBox={`0 0 ${PLATE.w} ${PLATE.h}`}
        style={{ ["--k" as string]: (1 / t.s).toFixed(4) }}
      >
        {TABLE_IDS.map((id) => (
          <polygon key={id} className={cls("uh-span", lit, `span-${id}`)} points={points(spanPoints(id))} />
        ))}
        {TABLE_IDS.map((id) => (
          <polygon key={id} className={cls("uh-edge", lit, `edge-${id}`)} points={points(spanPoints(id))} />
        ))}
        <polygon className={cls("uh-core", lit, "core-facs")} points={points(facsCore())} />
        {[0, 1, 2, 3].map((k) => {
          const [a, b] = slotLine(k);
          return <line key={k} className={cls("uh-slot", lit, `slot-${k}`)} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
        })}
        {THREAD_IDS.map((id) => (
          <path
            key={id}
            className={cls(`uh-thr${THREAD[id].delay ? ` d${THREAD[id].delay}` : ""}`, lit, `thr-${id}`)}
            d={threadPath(id)}
            pathLength={1}
          />
        ))}
        {DOT_IDS.map((id) => (
          <circle
            key={id}
            className={cls("uh-dot", lit, `dot-${id}`)}
            cx={DOT[id][0]}
            cy={DOT[id][1]}
            r={7}
            style={id === "fet" ? delay("dot-fet", 1.7) : undefined}
          />
        ))}
        {TABLE_IDS.map((id) => {
          const [x, y] = sigAt(id);
          return (
            <text key={id} className={cls("uh-sig", lit, `sig-${id}`)} x={x.toFixed(1)} y={y.toFixed(1)}>
              {TABLE[id].sig}
            </text>
          );
        })}
        {NAME_IDS.map((id) => {
          const n = NAME[id],
            [x, y] = nameAt(id, t.s);
          return (
            <text
              key={id}
              className={cls(`uh-name n-${id}${n.sub ? " sub" : ""}`, lit, `name-${id}`)}
              x={x}
              y={y.toFixed(1)}
              style={delay(`name-${id}`, n.delay)}
            >
              {n.text}
            </text>
          );
        })}
        <g className={cls("uh-strip", lit, "strip")}>
          <path
            className="uh-rowline"
            d={`M ${STRIP.from[0].toFixed(1)} ${STRIP.from[1].toFixed(1)} Q ${STRIP.via[0]} ${STRIP.via[1]} ${STRIP.to[0]} ${STRIP.to[1]}`}
          />
          {STRIP_ROWS.map((r, k) => (
            <Fragment key={k}>
              <text className="uh-asl" x={STRIP.x} y={STRIP.y + k * STRIP.pitch}>
                {r.asl}
              </text>
              <text className="uh-byte" x={STRIP.bytesX} y={STRIP.y + k * STRIP.pitch} xmlSpace="preserve">
                {r.bytes.map((b, j) => (
                  <tspan key={j} className={b.dim ? "dim" : undefined}>
                    {(j ? "  " : "") + b.text}
                  </tspan>
                ))}
              </text>
            </Fragment>
          ))}
        </g>
      </svg>
      <img className="uh-plate uh-dawn" src={dawnPlate} width={PLATE.w} height={PLATE.h} alt="" decoding="async" />
    </div>
  );
}

// ---- Your turn: the names on the machine are the buttons (one group at the figure's foot on narrow screens) ----

export function Buttons({
  view,
  t,
  narrow,
  held,
  onPress,
}: {
  view: TurnView;
  t: Fit;
  narrow: boolean;
  held: boolean;
  onPress: (a: Action) => void;
}) {
  const at = (p: Pt): CSSProperties => {
    const [x, y] = toView(t, p);
    return { left: x, top: y };
  };
  const [x0, y0] = toView(t, [SSD_BOX[0], SSD_BOX[1]]),
    [x1, y1] = toView(t, [SSD_BOX[2], SSD_BOX[3]]);
  const buttons = view.buttons.map((b) => (
    <button
      key={b.id}
      type="button"
      className={`uh-lb${b.done ? " done" : ""}`}
      data-act={b.id}
      style={narrow ? undefined : at(b.at)}
      onClick={() => onPress(b.id)}
    >
      {b.text}
    </button>
  ));
  return (
    <div className={`uh-labels${held ? " held" : ""}`} role="group" aria-label="On the machine">
      {narrow ? <div className="uh-btns">{buttons}</div> : buttons}
      {/* The part itself comes last: pressing it does nothing, which is the point. */}
      {view.part && (
        <button
          type="button"
          className="uh-lb part"
          data-act="part"
          aria-label="The part itself (the SSD)"
          style={{ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }}
          onClick={() => onPress("part")}
        />
      )}
    </div>
  );
}

// ---- The words: beside the picture on wide screens, in a card under it on narrow ones ---------------------

function StepWords({ i }: { i: number }) {
  const s = STOPS[i];
  return (
    <>
      <p className="uh-pos">
        Step {i + 1} of {LAST}
      </p>
      <h3 className="uh-title">{s.title}</h3>
      <p className="twotone uh-text">
        <b>{rich(s.lead)}</b>
        {s.rest && <> {rich(s.rest)}</>}
        <Cite ids={s.citations} />
      </p>
      <p className="uh-rule">
        <b>The rule.</b> {rich(s.rule)}
        <Cite ids={s.ruleCitations} up />
      </p>
      {s.note && (
        <p className="uh-hint">
          {rich(s.note)}
          {s.noteCitations && <Cite ids={s.noteCitations} up />}
        </p>
      )}
      {/* Stop 4's three pairs: drawn on the figure on wide screens (and said here for screen readers), listed here on narrow ones. */}
      {s.id === "bytes" && (
        <ul className="uh-pairs" aria-label="The three lines and their bytes">
          {STRIP_ROWS.map((r, k) => (
            <li key={k}>
              <code>{r.asl}</code>
              <span className="sr-only"> became </span>
              <code className="b">{r.bytes.map((b) => b.text).join(" ")}</code>
            </li>
          ))}
        </ul>
      )}
      {s.hidden && s.id !== "bytes" && <p className="sr-only">{s.hidden}</p>}
    </>
  );
}

export function TurnWords({ turn, view, onReset }: { turn: Turn; view: TurnView; onReset: () => void }) {
  return (
    <>
      <p className="uh-pos">Your turn</p>
      <h3 className="uh-title">{TURN.title}</h3>
      <p className="twotone uh-text">
        <b>{rich(view.lead)}</b> {rich(view.rest)}
        <Cite ids={[...TURN.citations]} />
      </p>
      {turn.said && (
        <p className="twotone uh-verdict">
          <b>{rich(turn.said.lead)}</b> {rich(turn.said.rest)}
        </p>
      )}
      {turn.got.length > 0 && (
        <div className="uh-acts">
          <button type="button" className="uh-again" onClick={onReset}>
            Start again
          </button>
        </div>
      )}
    </>
  );
}

// ---- The scene ---------------------------------------------------------------------------------------------

function Night() {
  const { i, go, markers, chips, onKey } = useStepScroll(STEP_COUNT);
  const play = i === LAST;
  const stage = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const dawnSpan = useRef<HTMLDivElement>(null);
  const { size, narrow } = useViewSize(view, { vw: 1366, vh: 708 });
  const [turn, setTurn] = useState<Turn>(initialTurn);
  // The dawn is one picture of the whole machine: the camera pulls back as it begins.
  const [dawning, setDawning] = useState(false);
  const [held, setHeld] = useState(false);
  const pressed = useRef<Action | "again" | null>(null);
  const wordsEl = useRef<HTMLDivElement>(null);

  // The dawn after the last stop, by scroll.
  useScrollFrame(() => {
    const st = stage.current,
      dn = dawnSpan.current;
    if (!st || !dn) return;
    const dawn = dawnShare(dn);
    showDawn(st, dawn);
    setDawning(dawn > 0.01);
  }, []);

  const tv = turnView(turn);
  const stop = STOPS[Math.min(i, LAST - 1)];
  const frame: FrameId = dawning ? "all" : play ? tv.frame : frameFor(stop.frame, narrow);
  const lit = play ? tv.lit : litAt(i);
  const t = fit(frame, size.vw, size.vh, narrow, narrow && play && !dawning ? TURN_FOOT : 0);

  // While the camera moves, what is drawn on the plate waits, then comes back at its right size.
  const moving = useCameraMoving(frame, 800);

  useEffect(() => {
    if (!play) setHeld(false);
  }, [play]);

  // Each change the reader should hear: the stop, or the reply to their action.
  const said = play
    ? `Your turn. ${turn.said ? `${turn.said.lead} ${turn.said.rest}` : `${tv.lead} ${tv.rest}`} Choices: ${tv.buttons.map((b) => b.text).join(", ")}${tv.part ? ", the part itself" : ""}.`
    : `Step ${i + 1} of ${LAST}: ${stop.title}`;
  // The reply object is new on every press, so the same reply is spoken again.
  const status = useSpoken(said, turn.said, plain);

  // A pressed button is rebuilt when the phase changes: focus stays on the same action, or goes to the first button.
  useLayoutEffect(() => {
    const st = stage.current,
      a = pressed.current;
    // The rail's focus follows the current stop, so arrow keys start from it.
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== chips.current[i] && chips.current.includes(active as HTMLButtonElement)) {
      chips.current[i]?.focus({ preventScroll: true });
      return;
    }
    if (!st || !a) return;
    pressed.current = null;
    // The same action; else the first button on the machine (after Start again, or when the phase changed); else the words.
    const target = [
      st.querySelector<HTMLElement>(`.uh-labels [data-act="${a}"]`),
      st.querySelector<HTMLElement>(".uh-labels button"),
      wordsEl.current,
    ].find((el) => el && el.getClientRects().length > 0);
    target?.focus({ preventScroll: true });
  }, [turn, i, chips]);

  useChipInView(chips, i, narrow, size.vw);

  const onPress = (a: Action) => {
    pressed.current = a;
    setHeld(true);
    setTurn((x) => press(x, a));
  };
  const reset = () => {
    pressed.current = "again";
    setHeld(false);
    setTurn(initialTurn());
  };
  const sceneH = STOPS.length * STOP_H + TURN_H;
  const moved = frame !== "all";
  const stageStyle = {
    ["--edge0" as string]: `${t.room - (moved ? 230 : 60)}px`,
    ["--edge1" as string]: `${t.room + (moved ? -4 : 240)}px`,
    ["--py" as string]: `${t.ty.toFixed(1)}px`,
    ["--ph" as string]: `${(PLATE.h * t.s).toFixed(1)}px`,
  } as CSSProperties;

  return (
    <>
      <div className="uh-caveat-band">
        <p className="board-caveat uh-caveat">
          {CAVEAT}
          <Cite ids={CAVEAT_CITATIONS} />
        </p>
      </div>
      <section
        className="uh-scene"
        aria-labelledby="uh-scene-title"
        style={{ ["--sum" as string]: sceneH, ["--dawn-h" as string]: DAWN_H }}
      >
        <h2 className="sr-only" id="uh-scene-title">
          The laptop taken apart at night: from the firmware's tables to a method the operating system runs, then your
          turn
        </h2>
        <div className={`uh-stage${play ? " play" : ""}`} ref={stage} style={stageStyle}>
          <StepRail prefix="uh" labels={RAIL} current={i} chips={chips} onChoose={go} onKey={onKey} />
          <div className="uh-view" ref={view}>
            <div className="uh-fill" aria-hidden="true" />
            <World lit={lit} t={t} moving={moving} />
            <div className="uh-shade" aria-hidden="true" />
            {play && <Buttons view={tv} t={t} narrow={narrow} held={held} onPress={onPress} />}
          </div>
          <div className="uh-paper" aria-hidden="true" />
          {/* The words column shows on wide screens, and on narrow ones only in ?static (no cards then). */}
          <div
            className="uh-words"
            ref={wordsEl}
            tabIndex={-1}
            style={narrow ? undefined : { left: t.wordsLeft, width: t.wordsWidth }}
          >
            {play ? <TurnWords turn={turn} view={tv} onReset={reset} /> : <StepWords i={i} />}
          </div>
          <p className="sr-only" role="status" aria-atomic="true">
            {status}
          </p>
        </div>
        <div className="uh-track">
          {Array.from({ length: STEP_COUNT }, (_, k) => (
            <div
              key={k}
              className={`uh-marker${k === i ? " on" : ""}${k === LAST ? " turn" : ""}`}
              data-index={k}
              style={{ ["--h" as string]: k === LAST ? TURN_H : STOP_H }}
              ref={(el) => {
                markers.current[k] = el;
              }}
            >
              {/* Narrow screens: the stop's words scroll past under the pinned figure. */}
              <div className="uh-card" inert={k === LAST ? !play : play}>
                {k === LAST ? <TurnWords turn={turn} view={tv} onReset={reset} /> : <StepWords i={k} />}
              </div>
            </div>
          ))}
          {/* The dawn: the last stop stays current while the same frame turns to morning. */}
          <div
            className="uh-dawn-span"
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

export function UnderHood({ children }: { children?: ReactNode }) {
  return (
    <>
      <Night />
      {/* Narrow screens have no scrubbed dawn: the night gives way in a band, as in chapters 1 to 3. */}
      <div className="chapter-dawn uh-dawn-band" aria-hidden="true" />
      <div className="chapter-light uh-light">
        <Reference />
        {children}
      </div>
    </>
  );
}
