// Chapter 4's labels on the figure: bare text beside a part of the bench or a point of the trace, some with
// a hairline to it. They are HTML laid over the view, placed through the same transform as the plate, so
// their text keeps its size while the camera moves.
import {
  ALL_IDLE_FROM,
  ALL_IDLE_TO,
  BAND,
  CLUSTER_LAT,
  CPPC_CASES,
  GAPS,
  LANE,
  LAST_NIGHT,
  LAT,
  NIGHT,
  POWER,
  RECTS,
  RES,
  SCALE,
  TOP,
  TOP_Y,
  gapStart,
  lane,
  type Pick,
} from "../model/cpuPower";
import { strong } from "../components/rich";
import type { Transform } from "../model/layout";
import { playLane } from "./CpuTrace";

/** A label: bare text at (x, y); with `lead` (screen px) a hairline runs from the text to a dot on the part. */
export interface Tag {
  key: string;
  x: number;
  y: number;
  lead?: number;
  name: string;
  state?: string;
  state2?: string;
  note?: string;
  warn?: boolean;
  tone?: string;
  cls?: string;
  mw?: number;
}

export function Tags({ tags, moving }: { tags: Tag[]; moving: boolean }) {
  return (
    <div className={`cp-tags${moving ? " moving" : ""}`} aria-hidden="true">
      {tags.map((g) => (
        <div
          key={g.key}
          className={`cp-tag${g.cls ? ` ${g.cls}` : ""}${g.lead ? " led" : ""}`}
          data-tone={g.tone || ""}
          style={{
            left: `${g.x}px`,
            top: `${g.y}px`,
            maxWidth: g.mw ? `${g.mw}px` : undefined,
            ["--lead" as string]: g.lead ? `${g.lead.toFixed(1)}px` : undefined,
          }}
        >
          <span className="cp-tag-name">{g.name}</span>
          {g.state && <span className="cp-tag-state">{strong(g.state)}</span>}
          {g.state2 && <span className="cp-tag-state">{strong(g.state2)}</span>}
          {g.note && <span className={`cp-tag-note${g.warn ? " warn" : ""}`}>{g.note}</span>}
        </div>
      ))}
    </div>
  );
}

/** The labels of night step `i`, placed through the plate's transform `t` and the trace's `tt`. */
export function tagsFor(
  i: number,
  narrow: boolean,
  t: Transform,
  tt: Transform,
  phase: number,
  picks: (Pick | null)[],
): Tag[] {
  // `lead` is given in plate px (the distance from the text to its part) and drawn in screen px.
  const at = (x: number, y: number, o: Omit<Tag, "x" | "y">): Tag => ({
    ...o,
    x: t.tx + x * t.s,
    y: t.ty + y * t.s,
    lead: o.lead && o.lead * t.s,
  });
  const atT = (x: number, y: number, o: Omit<Tag, "x" | "y">): Tag => ({
    ...o,
    x: tt.tx + x * tt.s,
    y: tt.ty + y * tt.s,
    lead: o.lead && o.lead * tt.s,
  });
  const tags: Tag[] = [];
  // `alone`: no neighbouring tile is labelled, so the text may run wider than its tile and stay on fewer lines.
  const tile = (k: number, name: string, state: string, note: string, tone: string, alone = false) => {
    const [x0, , x1] = RECTS[TOP[k]];
    tags.push(
      at(x0 + 14, TOP_Y - 14, {
        key: `t${k}`,
        lead: 34,
        name,
        state: narrow ? "" : state,
        note: narrow ? "" : note,
        tone,
        cls: "above",
        mw: alone && !narrow ? 300 : Math.max(narrow ? 40 : 90, (x1 - x0) * t.s - 4),
      }),
    );
  };
  const s = NIGHT[i];
  if (i === LAST_NIGHT) {
    const k = picks.findIndex((x) => !x),
      geo = playLane(picks);
    if (k >= 0)
      tags.push(
        atT(geo.X(gapStart(picks, k)), geo.Y(1) - 85, {
          key: "est",
          lead: 85,
          cls: "above",
          name: `Idle ${k + 1} of 3`,
          state: `estimate: about *${GAPS[k].est}* units`,
          state2: `latency limit: *${GAPS[k].limit}* from the interrupt`,
        }),
      );
    tags.push(
      at(RECTS.t0[0] + 14, TOP_Y - 14, {
        key: "t0",
        lead: 34,
        cls: "above",
        name: "Core 0",
        state: narrow ? "" : `*${k >= 0 ? "about to idle" : "done"}*`,
        tone: "run",
      }),
    );
    return tags;
  }
  if (!s) return tags;
  const geo =
    s.lane && !s.lanes ? lane(s.scale === "cppc" ? [["run", 100, CPPC_CASES[phase].level]] : s.lane.segs) : null;
  const row = geo ? geo.Y(1) - 75 : 0;
  // A label beside the trace: its offset and its hairline are one value, never under 8 px on screen.
  const side = Math.max(12, 8 / tt.s);
  switch (s.id) {
    case "c0":
      tile(0, "Core 0", "*C0* · executing", "", "run", true);
      if (!narrow)
        tags.push(
          at(RECTS.b0[0] + 14, RECTS.b0[3] + 16, {
            key: "others",
            lead: 36,
            cls: "below",
            name: "Other cores",
            state: "not followed here",
          }),
        );
      tags.push(
        atT(LANE.x0, 1232, { key: "lane", cls: "above", name: "Core 0's power over time", state: "time not to scale" }),
      );
      if (geo && !narrow)
        tags.push(
          atT(geo.X(geo.idles[0].up) + side, geo.Y(0.55), {
            key: "climb",
            lead: side,
            cls: "mid",
            name: "Climbing back",
            state: "the cost of the rest",
          }),
        );
      break;
    case "states":
      tile(0, "C1", "*mandatory*", "latency the OS can ignore", "run");
      tile(1, "C2", "*optional*", "still snoops", "");
      tile(2, "C3", "*optional*", "caches kept, no snoop", "deep");
      tile(3, "C0", "*running*", "", "run");
      if (!narrow)
        tags.push(
          at(BAND.x1, BAND.y1 - 10, {
            key: "band",
            cls: "aboveRight",
            name: "Shared cache (illustrative)",
            state: "bus-master traffic passing",
          }),
        );
      break;
    case "pick":
      tile(0, "Core 0", "*power down* · chosen once", "", "deep", true);
      tags.push(
        atT(geo!.X(geo!.idles[0].t0), row, {
          key: "est",
          lead: 75,
          cls: "above",
          name: "OS estimate",
          state: "how long the idle may last",
        }),
      );
      tags.push(
        atT(geo!.X(geo!.idles[0].t0 + 4), geo!.Y(POWER.pd) - 12, {
          key: "pick",
          lead: 12,
          cls: "above",
          name: "One pick",
          state: "straight down, no steps",
          tone: "deep",
        }),
      );
      break;
    case "wake":
      tile(0, "Core 0", "*back in C0*", "", "run", true);
      tags.push(
        atT(geo!.X(geo!.idles[0].irq), row, {
          key: "irq",
          lead: 75,
          cls: "aboveRight",
          name: "Interrupt",
          state: "delayed, never lost",
        }),
      );
      tags.push(
        atT(geo!.X(geo!.idles[0].up) + side, geo!.Y(0.5), {
          key: "lat",
          lead: side,
          cls: "mid",
          name: "Wake latency",
          state: "*worst case*",
          note: "duration only, the shape is illustrative",
        }),
      );
      break;
    case "breakeven":
      tags.push(
        atT(geo!.X(geo!.idles[0].t0 + RES.pd), row, {
          key: "res",
          lead: 75,
          cls: "above",
          name: "Minimum residency",
          state: "break-even",
        }),
      );
      tags.push(
        atT(geo!.X(geo!.idles[1].irq) + 8, row, {
          key: "lost",
          lead: 75,
          cls: "above",
          name: "Interrupt came early",
          state: "deeper lost",
          warn: true,
        }),
      );
      break;
    case "containers": {
      const X = (u: number) => LANE.x0 + (u / 100) * (LANE.x1 - LANE.x0);
      tags.push(
        at(1124, 330, {
          key: "cl",
          cls: "above",
          name: "Cluster 0",
          state: "a processor container",
          note: narrow ? "" : "described by firmware",
        }),
      );
      tags.push(
        atT(X(ALL_IDLE_FROM), 1218, {
          key: "ov",
          cls: "above",
          name: "Every core idle",
          state: "only now can the cluster rest",
        }),
      );
      if (!narrow)
        tags.push(
          atT(X(ALL_IDLE_TO + CLUSTER_LAT + LAT.pd) + 10, 1218, {
            key: "stack",
            cls: "above",
            name: "Latencies add",
            state: "cluster 20 + core 50 = *70 us*",
            note: "spec example",
          }),
        );
      break;
    }
    case "pstates":
      tile(0, "Core 0", "*C0* · P-states apply only here", "", "run", true);
      tags.push(
        at(SCALE.x, SCALE.y0 - 20, { key: "pss", lead: 20, cls: "above", name: "_PSS", state: "spec example" }),
      );
      if (geo) {
        const r = geo.runs[1];
        tags.push(
          atT(geo.X(r.t0) + 60, geo.Y(r.p) - 40, {
            key: "p2",
            lead: 40,
            cls: "above",
            name: "Dropped to P2",
            state: "any lower-power state is allowed",
          }),
        );
      }
      break;
    case "cppc": {
      const c = CPPC_CASES[phase];
      tags.push(
        at(SCALE.x - 60, SCALE.y1 + 40, {
          key: "cppc",
          cls: "belowRight",
          name: c.name,
          state: c.state,
          state2: "solid: asked · hollow: delivered",
        }),
      );
      tags.push(
        atT(LANE.x0, 1232, {
          key: "ctr",
          cls: "above",
          name: "Delivered against reference",
          state: "ticks in proportion to delivered performance",
        }),
      );
      break;
    }
  }
  return tags;
}
