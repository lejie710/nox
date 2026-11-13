// What chapter 3 lays over the building: the labels of a step and, on the reader's turn, the controls. Both
// are HTML over the view, placed through the same transform as the plate, so their text keeps its size.
import { BELL, FLATS, LEVELS, LIT_LEVELS, SWITCH_X, tagLead, windowOf, type Tag } from "../model/devicePower";
import { place, type Transform } from "../model/layout";
import type { Controls } from "./useDeviceNight";

/** The labels on the building: a name, a state and a note, each led to its part. */
export function Tags({ tags, t }: { tags: Tag[]; t: Transform }) {
  return (
    <div className="dp-tags" aria-hidden="true">
      {tags.map((g) => (
        <div
          key={g.key}
          className={`dp-tag ${g.align}`}
          data-tone={g.tone || ""}
          style={{ ...place(t, g.x, g.y), ["--lead" as string]: `${tagLead(g.lead, t.s).toFixed(1)}px` }}
        >
          {/* Two lines at most (name; state and note), so the text stays on its parapet at every framing. */}
          <span className="dp-tag-body">
            <span className="dp-tag-name">{g.name}</span>
            {g.state && (
              <span className="dp-tag-state">
                <b>{g.state.word}</b>
                {g.state.rest ? ` · ${g.state.rest}` : ""}
                {g.note && <span className={`dp-tag-note${g.warn ? " warn" : ""}`}> · {g.note}</span>}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * The reader's controls: a light switch per floor, a wake bell per device that can wake, and the gate. On wide
 * screens they sit on the building (placed through `t`); `inline` puts them in a row, for a card.
 */
export function ControlButtons({ c, inline, t }: { c: Controls; inline: boolean; t?: Transform }) {
  const at = (x: number, y: number) => (inline || !t ? undefined : place(t, x, y));
  const shook = (key: string) => (c.shake?.key === key ? ` shake s${c.shake.n % 2}` : "");
  return (
    <>
      {LIT_LEVELS.map((lv) => {
        const L = LEVELS[lv];
        return (
          <button
            key={lv}
            type="button"
            className={`dp-ctl light${inline ? " inline" : ""}${shook(`sw-${lv}`)}`}
            aria-pressed={c.state.on[lv]}
            style={at(SWITCH_X + 70, L.door + 50)}
            onClick={() => c.onLight(lv)}
          >
            Level {L.n} light<span aria-hidden="true">: {c.state.on[lv] ? "on" : "off"}</span>
          </button>
        );
      })}
      {FLATS.filter((f) => f.wake).map((f) => {
        const w = windowOf(f.level, f.bay);
        return (
          <button
            key={f.id}
            type="button"
            className={`dp-ctl bell${inline ? " inline" : ""}`}
            aria-pressed={c.state.flats[f.id].armed}
            style={at(w.x + w.w + 70, LEVELS[f.level].door + 50)}
            onClick={() => c.onBell(f.id)}
          >
            {f.name} wake<span aria-hidden="true">: {c.state.flats[f.id].armed ? "armed" : "off"}</span>
          </button>
        );
      })}
      <button
        type="button"
        className={`dp-ctl gate${inline ? " inline" : ""}`}
        style={at(BELL.x, BELL.y - 40)}
        onClick={c.onGate}
        aria-label="Send a packet and a touch: every armed device signals wake to the OS at the gate"
      >
        Send a packet and a touch
      </button>
    </>
  );
}
