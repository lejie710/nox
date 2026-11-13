// A centred chapter title, the chapter's sections, its sources, and the way on.
import type { ComponentType, ReactNode } from "react";
import { chapter, CHAPTERS, type ChapterId } from "../model/chapters";
import { chapterHref } from "../model/route";
import { source, sourceNumber } from "../model/sources";
import { BigPicture, BigPictureIntro, BIG_PICTURE_SOURCES } from "./BigPicture";
import { CpuPower, CpuPowerIntro, CPU_POWER_SOURCES } from "./CpuPower";
import { DevicePower, DevicePowerIntro, DEVICE_POWER_SOURCES } from "./DevicePower";
import { ModernStandby, ModernStandbyIntro, MODERN_STANDBY_SOURCES } from "./ModernStandby";
import { SleepWake, SleepWakeIntro, SLEEP_WAKE_SOURCES } from "./SleepWake";
import { UnderHood, UnderHoodIntro, UNDER_HOOD_SOURCES } from "./UnderHood";

/** What each chapter brings to its page. A full record: a chapter without an entry does not compile. */
const BODIES: Record<
  ChapterId,
  { intro: () => ReactNode; body: ComponentType<{ children?: ReactNode }>; sources: string[]; footerNote: string }
> = {
  "big-picture": {
    intro: BigPictureIntro,
    body: BigPicture,
    sources: BIG_PICTURE_SOURCES,
    footerNote: "The board picture is illustrative, not any real product.",
  },
  "modern-standby": {
    intro: ModernStandbyIntro,
    body: ModernStandby,
    sources: MODERN_STANDBY_SOURCES,
    footerNote:
      "The moon, sky and cloud images are illustrative generated plates, not photographs. The rings show the order Windows powers layers down, not where parts sit.",
  },
  "device-power": {
    intro: DevicePowerIntro,
    body: DevicePower,
    sources: DEVICE_POWER_SOURCES,
    footerNote:
      "The flats and the daylight drawing are illustrative generated images, not photographs of a real building.",
  },
  "cpu-power": {
    intro: CpuPowerIntro,
    body: CpuPower,
    sources: CPU_POWER_SOURCES,
    footerNote:
      "The bench photographs and the die drawing are illustrative generated images of a fictional chip, not photographs of a real product.",
  },
  "sleep-wake": {
    intro: SleepWakeIntro,
    body: SleepWake,
    sources: SLEEP_WAKE_SOURCES,
    footerNote:
      "The study and the computer are illustrative generated images of a generic desktop, not photographs of a real product. The light in the case, the points of light, the moonlight and the times are teaching devices.",
  },
  "under-the-hood": {
    intro: UnderHoodIntro,
    body: UnderHood,
    sources: UNDER_HOOD_SOURCES,
    footerNote:
      "The taken-apart laptop and its drawing are illustrative generated images, not photographs of a real product. Where a table is drawn on the memory is not its address, and names stand by the parts they describe, not where they are stored.",
  },
};

export function ChapterPage({ id }: { id: ChapterId }) {
  const ch = chapter(id);
  const entry = BODIES[id];
  const next = CHAPTERS.find((c) => c.n === ch.n + 1);
  const sources = [...new Set(entry.sources)].sort((a, b) => sourceNumber(a) - sourceNumber(b));
  const Body = entry.body;
  const ending = (
    <>
      <section className="chapter-sources" aria-labelledby="sources-title">
        <h2 id="sources-title">Sources</h2>
        <ol>
          {sources.map((s) => {
            const src = source(s);
            return (
              <li key={s} value={sourceNumber(s)}>
                {src.title}, {src.where}.{" "}
                <a href={src.url} target="_blank" rel="noreferrer">
                  {new URL(src.url).host}
                </a>
              </li>
            );
          })}
        </ol>
      </section>
      <nav className="chapter-next" aria-label="Chapters">
        <a href="#chapters">All chapters</a>
        {next && <a href={chapterHref(next.id)}>Next: {next.tab}</a>}
      </nav>
      <footer className="chapter-footer">
        A personal project based on public specifications. Not affiliated with or endorsed by any employer or vendor.
        {` ${entry.footerNote}`}
      </footer>
    </>
  );
  return (
    <main className={`chapter chapter--${id}`} aria-labelledby="chapter-title">
      <header className="chapter-head">
        <p className="chapter-eyebrow">Chapter {ch.n}</p>
        <h1 className="headline chapter-title" id="chapter-title">
          {ch.tab}.
        </h1>
        {entry.intro()}
      </header>
      <Body>{ending}</Body>
    </main>
  );
}
