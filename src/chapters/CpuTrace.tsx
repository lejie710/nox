// Chapter 4's trace: core 0's power over time, drawn along the bench's edge in the plate's coordinates (on
// narrow screens the same drawing sits in its own strip under the picture). One trace per night step, four
// cores and their cluster on the containers step, and the reader's three idle periods on their turn.
import type { ReactNode } from "react";
import {
  ALL_IDLE_FROM,
  ALL_IDLE_TO,
  CLUSTER_LAT,
  CORE_LANES,
  GAPS,
  LANE,
  LAT,
  PLATE,
  PLAY_SPAN,
  POWER,
  RES,
  RUN_GAP,
  gapStart,
  lane,
  pathOf,
  type Lane,
  type NightStep,
  type Perf,
  type Pick,
  type Seg,
} from "../model/cpuPower";

export type TraceKind =
  | { kind: "step"; step: NightStep; level?: Perf; phase: number }
  | { kind: "play"; picks: (Pick | null)[] }
  | { kind: "none" };

function StepTrace({ step, phase, geo }: { step: NightStep; phase: number; geo: Lane }) {
  const m = step.lane!.marks;
  return (
    <>
      {m.includes("shade") && (
        <line className="cp-trace-base" x1={LANE.x0} y1={geo.Y(POWER.poll)} x2={LANE.x1} y2={geo.Y(POWER.poll)} />
      )}
      {geo.idles.map((i, n) => {
        const xi = geo.X(i.irq),
          xu = geo.X(i.up),
          yl = geo.Y(POWER[i.st]);
        const xs = geo.X(i.t0 + Math.min(0.8, i.gap / 3)),
          xr = geo.X(Math.min(i.t0 + RES[i.st], i.irq));
        return (
          <g key={n}>
            {m.includes("shade") && (
              <rect
                className="cp-waste"
                x={xs}
                y={geo.Y(POWER.poll)}
                width={Math.max(0, xr - xs)}
                height={yl - geo.Y(POWER.poll)}
              />
            )}
            {m.includes("shade") && i.t0 + RES[i.st] < i.irq && (
              <rect className="cp-save" x={xr} y={geo.Y(POWER.poll)} width={xi - xr} height={yl - geo.Y(POWER.poll)} />
            )}
            {m.includes("hatch") && (
              <polygon
                className="cp-hatch"
                points={`${xi},${yl} ${xu},${geo.Y(1)} ${xu},${geo.base} ${xi},${geo.base}`}
              />
            )}
            {m.includes("irq") && (
              <>
                <line className="cp-irq" x1={xi} y1={geo.base + 14} x2={xi} y2={geo.Y(1) - 30} />
                <circle className="cp-irq-dot" cx={xi} cy={geo.Y(1) - 34} r="7" />
              </>
            )}
            {m.includes("res") && (
              <line
                className="cp-res"
                x1={geo.X(i.t0 + RES[i.st])}
                y1={geo.Y(1) - 20}
                x2={geo.X(i.t0 + RES[i.st])}
                y2={geo.base + 10}
              />
            )}
          </g>
        );
      })}
      {m.includes("plevels") &&
        geo.runs.map((r, n) => (
          <text key={n} className="cp-lane-name mono" x={geo.X(r.t0) + 14} y={geo.Y(r.p) - 14}>
            {r.perf.toUpperCase()}
          </text>
        ))}
      {m.includes("stria") &&
        (() => {
          const y = geo.Y(geo.runs[0].p),
            k = [1.4, 1, 0.72][phase];
          const stria = [],
            comb = [];
          for (let t = 0; t < 100; t += 1.6 / k)
            stria.push(<line key={`s${t}`} className="cp-stria" x1={geo.X(t)} y1={y - 9} x2={geo.X(t)} y2={y + 9} />);
          for (let t = 0; t < 100; t += 1.6)
            comb.push(
              <line
                key={`c${t}`}
                className="cp-comb"
                x1={geo.X(t)}
                y1={geo.base + 2}
                x2={geo.X(t)}
                y2={geo.base + 14}
              />,
            );
          return (
            <>
              {stria}
              {comb}
            </>
          );
        })()}
      <path className="cp-lane" d={pathOf(geo.pts)} />
    </>
  );
}

function Lanes() {
  const X = (t: number) => LANE.x0 + (t / 100) * (LANE.x1 - LANE.x0);
  const base = (k: number) => 1262 + k * 44,
    amp = 30;
  return (
    <>
      <rect
        className="cp-save faint"
        x={X(ALL_IDLE_FROM)}
        y={1222}
        width={X(ALL_IDLE_TO) - X(ALL_IDLE_FROM)}
        height={4 * 44 + 44}
      />
      {CORE_LANES.map((segs, k) => {
        const b = base(k),
          pts: [number, number][] = [];
        let t = 0;
        for (const s of segs) {
          if (s[0] === "run") {
            pts.push([X(t), b - amp], [X(Math.min(t + s[1], 100)), b - amp]);
            t += s[1];
            continue;
          }
          const end = Math.min(t + s[2], 100);
          pts.push([X(t + 0.8), b - POWER.pd * amp], [X(end), b - POWER.pd * amp]);
          if (k === 0) {
            const c = ALL_IDLE_TO + CLUSTER_LAT,
              u = c + LAT.pd;
            pts.push([X(c), b - POWER.pd * amp], [X(u), b - amp], [X(100), b - amp]);
          }
          t = end;
        }
        return (
          <g key={k}>
            {k === 0 && (
              <polygon
                className="cp-hatch"
                points={`${X(ALL_IDLE_TO)},${b} ${X(ALL_IDLE_TO + CLUSTER_LAT)},${b} ${X(ALL_IDLE_TO + CLUSTER_LAT + LAT.pd)},${b - amp} ${X(ALL_IDLE_TO + CLUSTER_LAT + LAT.pd)},${b}`}
              />
            )}
            {k === 0 && (
              <line className="cp-irq" x1={X(ALL_IDLE_TO)} y1={b + 10} x2={X(ALL_IDLE_TO)} y2={b - amp - 14} />
            )}
            <path className="cp-lane thin" d={pathOf(pts)} />
            <text className="cp-lane-name" x={LANE.x0 - 14} y={b - 6} textAnchor="end">
              core {k}
            </text>
          </g>
        );
      })}
      {(() => {
        const b = base(4),
          pts: [number, number][] = [
            [X(0), b - amp],
            [X(ALL_IDLE_FROM), b - amp],
            [X(ALL_IDLE_FROM + 0.8), b - POWER.pd * amp],
            [X(ALL_IDLE_TO), b - POWER.pd * amp],
            [X(ALL_IDLE_TO + CLUSTER_LAT), b - amp],
            [X(100), b - amp],
          ];
        return (
          <>
            <path className="cp-lane thin cluster" d={pathOf(pts)} />
            <text className="cp-lane-name" x={LANE.x0 - 14} y={b - 6} textAnchor="end">
              cluster
            </text>
          </>
        );
      })()}
    </>
  );
}

/** The reader's three idle periods: picked ones drawn with their outcome, the next one waiting. */
export function playLane(picks: (Pick | null)[]): Lane {
  const segs: Seg[] = [["run", RUN_GAP]];
  GAPS.forEach((g, k) => {
    const s = picks[k];
    if (!s) return;
    segs.push(s === "poll" ? ["run", g.gap, "poll"] : ["idle", s, g.gap], ["run", RUN_GAP]);
  });
  return lane(segs, 1440, 150, PLAY_SPAN);
}
function PlayTrace({ picks, geo }: { picks: (Pick | null)[]; geo: Lane }) {
  const done = picks.filter(Boolean).length;
  return (
    <>
      <line className="cp-trace-base" x1={LANE.x0} y1={geo.Y(POWER.poll)} x2={LANE.x1} y2={geo.Y(POWER.poll)} />
      {GAPS.map((g, k) => {
        const s = picks[k],
          t = gapStart(picks, k);
        if (s && s !== "poll") {
          const yl = geo.Y(POWER[s]),
            xi = geo.X(t + g.gap),
            xu = geo.X(t + g.gap + LAT[s]);
          const xs = geo.X(t + 0.8),
            xr = geo.X(Math.min(t + RES[s], t + g.gap));
          return (
            <g key={k}>
              <rect
                className="cp-waste"
                x={xs}
                y={geo.Y(POWER.poll)}
                width={Math.max(0, xr - xs)}
                height={yl - geo.Y(POWER.poll)}
              />
              {RES[s] < g.gap && (
                <rect
                  className="cp-save"
                  x={xr}
                  y={geo.Y(POWER.poll)}
                  width={xi - xr}
                  height={yl - geo.Y(POWER.poll)}
                />
              )}
              <polygon
                className="cp-hatch"
                points={`${xi},${yl} ${xu},${geo.Y(1)} ${xu},${geo.base} ${xi},${geo.base}`}
              />
              <line className="cp-irq" x1={xi} y1={geo.base + 14} x2={xi} y2={geo.Y(1) - 30} />
              {/* The limit, measured from the interrupt; a wake that runs past it is late. */}
              <path
                className="cp-limit"
                d={`M ${xi} ${geo.Y(1) - 30} H ${geo.X(t + g.gap + g.limit)} V ${geo.Y(1) - 18}`}
              />
              {LAT[s] > g.limit && (
                <path
                  className="cp-late"
                  d={`M ${geo.X(t + g.gap + g.limit)} ${geo.Y(1) - 18} H ${xu} V ${geo.Y(1) - 6}`}
                />
              )}
            </g>
          );
        }
        if (k !== done) return null;
        const x0 = geo.X(t),
          y = geo.Y(1) - 54;
        return (
          <g key={k}>
            <path className="cp-est" d={`M ${x0} ${y + 12} V ${y} H ${geo.X(t + g.est)} V ${y + 12}`} />
            <path className="cp-limit" d={`M ${x0} ${y - 22} H ${geo.X(t + g.limit)}`} />
            <text className="cp-lane-name" x={x0 + 20} y={geo.Y(0.4)}>
              ?
            </text>
          </g>
        );
      })}
      <path className="cp-lane" d={pathOf(geo.pts)} />
    </>
  );
}

export function Trace({ kind, run }: { kind: TraceKind; run: number }) {
  if (kind.kind === "none") return null;
  let body: ReactNode;
  if (kind.kind === "play") body = <PlayTrace picks={kind.picks} geo={playLane(kind.picks)} />;
  else if (kind.step.lanes) body = <Lanes />;
  else {
    const segs = kind.step.scale === "cppc" ? ([["run", 100, kind.level ?? "run"]] as Seg[]) : kind.step.lane!.segs;
    body = <StepTrace step={kind.step} phase={kind.phase} geo={lane(segs)} />;
  }
  return (
    <g className="cp-trace">
      {/* The trace draws itself from left to right (a fresh clip per step). */}
      <clipPath id="cp-reveal">
        <rect
          key={run}
          className={`cp-reveal${kind.kind === "step" && kind.step.scale !== "cppc" ? " go" : ""}`}
          x="0"
          y="1100"
          width={PLATE.w}
          height="400"
        />
      </clipPath>
      <line className="cp-axis" x1={LANE.x0} y1={1462} x2={LANE.x1 + 10} y2={1462} />
      <g clipPath="url(#cp-reveal)">{body}</g>
      {/* The OS estimate projects forward before the gap's real length is drawn. */}
      {kind.kind === "step" &&
        kind.step.lane?.marks.includes("est") &&
        lane(kind.step.lane.segs).idles.map((d, n) => {
          const geo = lane(kind.step.lane!.segs);
          return d.est ? (
            <path
              key={n}
              className="cp-est"
              d={`M ${geo.X(d.t0)} ${geo.Y(1) - 42} V ${geo.Y(1) - 54} H ${geo.X(d.t0 + d.est)} V ${geo.Y(1) - 42}`}
            />
          ) : null;
        })}
    </g>
  );
}
