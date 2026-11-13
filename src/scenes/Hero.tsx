// The opening: the laptop closed and asleep in side view, its standby light breathing,
// the title at the lower left. As the reader scrolls, the lid opens, the light holds steady (awake) and
// the title gives way.
import type { CSSProperties } from "react";
import { LaptopSide, SIDE_HINGE, sideOpenShift } from "../components/Laptop";
import { Moon } from "../components/Moon";
import { HEADER, HERO_MOTION } from "../model/story";

export function Hero() {
  const m = HERO_MOTION;
  const at = (p: number) => `${p * m.spanVh}svh`;
  const timing = {
    "--hero-span": at(1),
    "--open-from": at(m.openFrom),
    "--open-to": at(m.openTo),
    "--fit-to": at(m.fitTo),
    "--led-from": at(m.ledFrom),
    "--led-to": at(m.ledTo),
    "--text-from": at(m.textFrom),
    "--text-to": at(m.textTo),
    "--open-deg": `${m.openMax}deg`,
    "--open-dx": `${sideOpenShift(m.openMax).dx}`,
    "--open-dy": `${sideOpenShift(m.openMax).dy}`,
    "--hinge-x": `${SIDE_HINGE.x}px`,
    "--hinge-y": `${SIDE_HINGE.y}px`,
  } as CSSProperties;
  return (
    <section className="scene hero" id="top" aria-label="Nox, after dark" style={timing}>
      {/* The nav marks "The night" from the very top of the page, not only from the story's stage on. */}
      <div className="step-marker" data-step="night" style={{ top: 0, height: "100%" }} aria-hidden="true" />
      <div className="hero-stage">
        <div className="hero-device">
          <div className="hero-scale">
            <LaptopSide />
          </div>
        </div>
        <div className="hero-text">
          <p className="eyebrow">{HEADER.eyebrow}</p>
          <h1 className="headline hero-headline">{HEADER.title}</h1>
          <p className="subhead">{HEADER.lead}</p>
        </div>
        <div className="hero-invite">
          <Moon k={0.3} r={15} tone="dark" />
          <span>
            Scroll to follow one night
            <small>An explainer of ACPI power management by Le Jie Tan, from public specifications</small>
          </span>
        </div>
      </div>
    </section>
  );
}
