// The topic map: six chapter tabs under the chosen chapter's own picture,
// which melts into the page. Tabs follow the
// WAI-ARIA tabs pattern: one tab stop, arrow keys, Home and End, automatic
// activation.
import { useRef, useState, type KeyboardEvent } from "react";
import { Cite } from "../components/Chrome";
import { Moon } from "../components/Moon";
import { CHAPTERS, type ChapterId } from "../model/chapters";
import { chapterHref } from "../model/route";
import pic1 from "../assets/map-ch1.webp";
import pic2 from "../assets/map-ch2.webp";
import pic3 from "../assets/map-ch3.webp";
import pic4 from "../assets/map-ch4.webp";
import pic5 from "../assets/map-ch5.webp";
import pic6 from "../assets/map-ch6.webp";

/** Each chapter's picture: a still of its scene. */
const PICTURES: Record<ChapterId, string> = {
  "big-picture": pic1,
  "modern-standby": pic2,
  "device-power": pic3,
  "cpu-power": pic4,
  "sleep-wake": pic5,
  "under-the-hood": pic6,
};

/** The chapter the map opens on, until the reader has opened one. */
export const MAP_START: ChapterId = "big-picture";

export function TopicMap({ start = MAP_START }: { start?: ChapterId }) {
  const [active, setActive] = useState<ChapterId>(start);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const i = CHAPTERS.findIndex((c) => c.id === active);
  const ch = CHAPTERS[i];

  const go = (j: number) => {
    const n = (j + CHAPTERS.length) % CHAPTERS.length;
    setActive(CHAPTERS[n].id);
    tabs.current[n]?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: CHAPTERS.length - 1 };
    if (e.key in keys) {
      e.preventDefault();
      go(keys[e.key]);
    }
  };

  return (
    <section className="scene topic-map" id="chapters" aria-labelledby="map-title">
      <div className="step-marker" data-step="story-end" style={{ top: 0, height: "100%" }} aria-hidden="true" />
      <div className="map-text">
        <h2 className="section-headline" id="map-title">
          Six ways into the night.
        </h2>
        <p className="twotone">
          Each chapter goes one layer deeper than the story, with a figure you can drive yourself.{" "}
          <b>Every claim links to its public source.</b>
        </p>
      </div>
      <div className="map-pic" aria-hidden="true">
        {CHAPTERS.map((c) => (
          <img
            key={c.id}
            className={c.id === active ? "on" : ""}
            src={PICTURES[c.id]}
            width="1600"
            height="1000"
            alt=""
            loading={c.id === start ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>
      <p className="caption map-caption" aria-hidden="true">
        {ch.caption}
      </p>
      <div className="map-tabs" role="tablist" aria-label="Chapters" onKeyDown={onKey}>
        {CHAPTERS.map((c, j) => (
          <button
            key={c.id}
            ref={(el) => {
              tabs.current[j] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${c.id}`}
            aria-selected={c.id === active}
            aria-controls="map-panel"
            tabIndex={c.id === active ? 0 : -1}
            className="map-tab"
            onClick={() => setActive(c.id)}
          >
            <span className="map-tab-n" aria-hidden="true">
              {c.n}
            </span>
            {c.tab}
          </button>
        ))}
      </div>
      <div className="map-panel" role="tabpanel" id="map-panel" aria-labelledby={`tab-${ch.id}`}>
        <p className="twotone map-question">
          <b>{ch.question}</b> {ch.answer}
          <Cite key={ch.id} ids={ch.citations} />
        </p>
        <p className="sr-only">{ch.figureText}</p>
        <a className="map-open" href={chapterHref(ch.id)}>
          <Moon k={0.3} r={11} tone="dark" />
          {ch.open}
        </a>
      </div>
    </section>
  );
}
