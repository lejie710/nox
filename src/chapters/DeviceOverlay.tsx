// Chapter 3's picture: what is drawn on the photograph of the flats, in the plate's own coordinates. Each
// corridor's light is a power resource and its switch is at the stairwell; each of four rooms is a device,
// with a door plate (lit while the device is found on its bus), the things on its desk (its context) and,
// for a device that can wake, a bell wire down to the gate.
import moonImage from "../assets/halo-moon.webp";
import {
  BELL,
  CORRIDOR,
  DEVICE_STEPS,
  FLATS,
  K_MOON,
  LEVELS,
  LIT_LEVELS,
  NEIGHBOURS,
  PLATE,
  SWITCH_X,
  TUBE_X,
  doorOf,
  found,
  isD3,
  windowOf,
  wirePath,
  type FlatId,
  type LevelId,
  type NightState,
} from "../model/devicePower";
import { litPath } from "../model/moon";
import { begin, stillNow } from "../stage/motion";
import type { Motion } from "./useDeviceNight";

function Room({ id, st, restoring }: { id: FlatId; st: NightState["flats"][FlatId]; restoring?: "slow" | "fast" }) {
  const f = FLATS.find((x) => x.id === id)!;
  const w = windowOf(f.level, f.bay),
    d = doorOf(f.level, f.bay),
    deskY = w.y + w.h - 30;
  const gone = isD3(st.d) && !restoring;
  const boxed = isD3(st.d) || !!restoring;
  return (
    <g
      className={`dp-flat${boxed ? " boxed" : ""}${restoring ? ` restoring ${restoring}` : ""}`}
      data-d={st.d}
      data-found={found(st.d)}
    >
      <clipPath id={`dp-clip-${id}`}>
        <rect x={w.x} y={w.y} width={w.w} height={w.h} />
      </clipPath>
      <g clipPath={`url(#dp-clip-${id})`}>
        <rect className="dp-room" x={w.x} y={w.y} width={w.w} height={w.h} />
        <rect className="dp-lamp" x={w.x} y={w.y} width={w.w} height={w.h} />
        <line className="dp-desk" x1={w.x + 6} y1={deskY} x2={w.x + w.w - 6} y2={deskY} />
        {/* The device's context: a lamp, books, a mug, a plant. */}
        <g className={`dp-thing${gone ? " gone" : ""}`} style={{ ["--i" as string]: 0 }}>
          <path
            d={`M ${w.x + 14} ${deskY} v -26 m -8 0 h 16 l -5 -14 h -6 z`}
            fill="#f4d9a8"
            stroke="#f4d9a8"
            strokeWidth="2"
          />
        </g>
        <g className={`dp-thing${gone ? " gone" : ""}`} style={{ ["--i" as string]: 1 }}>
          <rect x={w.x + 34} y={deskY - 10} width="26" height="10" fill="#7da2d6" />
          <rect x={w.x + 36} y={deskY - 19} width="22" height="9" fill="#d97b6c" />
        </g>
        <g className={`dp-thing${gone ? " gone" : ""}`} style={{ ["--i" as string]: 2 }}>
          <rect x={w.x + 68} y={deskY - 14} width="11" height="14" rx="2" fill="#e8e2d2" />
        </g>
        <g className={`dp-thing${gone ? " gone" : ""}`} style={{ ["--i" as string]: 3 }}>
          <rect x={w.x + 86} y={deskY - 10} width="10" height="10" fill="#b07a4f" />
          <circle cx={w.x + 91} cy={deskY - 16} r="7" fill="#6fae6a" />
        </g>
        {/* The driver's box: where the context goes while the device is in D3. */}
        <path
          className="dp-box"
          d={`M ${w.x + 30} ${deskY} v -22 h 46 v 22 M ${w.x + 30} ${deskY - 22} l 6 -7 h 46 l -6 7 M ${w.x + 76} ${deskY} l 6 -7 v -22`}
        />
      </g>
      {Array.from({ length: 4 }, (_, k) => (
        <line key={k} className="dp-grille" x1={w.x + 21 * (k + 1)} y1={w.y} x2={w.x + 21 * (k + 1)} y2={w.y + w.h} />
      ))}
      <line className="dp-grille" x1={w.x} y1={w.y + w.h / 2} x2={w.x + w.w} y2={w.y + w.h / 2} />
      <rect className="dp-plate-glow" x={d.cx - 18} y={d.y + 10} width="36" height="18" rx="4" />
      <rect className="dp-plate" x={d.cx - 14} y={d.y + 13} width="28" height="12" rx="3" />
    </g>
  );
}

export function Overlay({
  state,
  step,
  motion,
  refused,
}: {
  state: NightState;
  step: number;
  motion: Motion;
  refused: { lv: LevelId; n: number } | null;
}) {
  const s = DEVICE_STEPS[step];
  const still = stillNow();
  return (
    <svg
      className="dp-overlay"
      viewBox={`0 0 ${PLATE.w} ${PLATE.h}`}
      width={PLATE.w}
      height={PLATE.h}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dp-corr" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef3ff" stopOpacity=".62" />
          <stop offset=".5" stopColor="#e4ecff" stopOpacity=".22" />
          <stop offset="1" stopColor="#e4ecff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="dp-lamp" cx=".3" cy=".25" r=".95">
          <stop offset="0" stopColor="#ffd08a" stopOpacity=".95" />
          <stop offset=".55" stopColor="#f2a93b" stopOpacity=".5" />
          <stop offset="1" stopColor="#f2a93b" stopOpacity=".12" />
        </radialGradient>
        <linearGradient id="dp-cool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cfdaf2" stopOpacity=".55" />
          <stop offset="1" stopColor="#9fb0d6" stopOpacity=".2" />
        </linearGradient>
        <filter id="dp-soft" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="dp-soft-line" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Corridors: each floor's light is its power resource; the switch is at the stairwell. */}
      {LIT_LEVELS.map((lv) => {
        const L = LEVELS[lv];
        const held = s?.held === lv && !still;
        const flash = refused?.lv === lv;
        return (
          <g key={lv} className={`dp-level${held ? " held" : ""}`} data-on={state.on[lv]}>
            <rect
              className="dp-corr-dark"
              x={CORRIDOR.x0}
              y={L.top}
              width={CORRIDOR.x1 - CORRIDOR.x0}
              height={L.par - L.top}
            />
            <rect
              key={flash ? `g${refused!.n}` : "g"}
              className={`dp-corr-glow${flash ? " dip" : ""}`}
              x={CORRIDOR.x0}
              y={L.top}
              width={CORRIDOR.x1 - CORRIDOR.x0}
              height={L.par - L.top}
            />
            <rect className="dp-tube" x={TUBE_X} y={L.tube - 5} width="67" height="10" rx="4" />
            <rect className="dp-switch" x={SWITCH_X} y={L.door + 22} width="30" height="54" rx="4" />
            <rect
              key={flash ? `l${refused!.n}` : "l"}
              className={`dp-lever${flash ? " spring" : ""}`}
              x={SWITCH_X + 6}
              y={L.door + 28}
              width="18"
              height="20"
              rx="3"
            />
          </g>
        );
      })}
      {/* Other devices: a steady glow, drawn over the corridor so a dark corridor never dims them. */}
      {NEIGHBOURS.map(([lv, bay]) => {
        const w = windowOf(lv, bay);
        return (
          <rect
            key={`${lv}-${bay}`}
            className="dp-neighbour"
            x={w.x + 3}
            y={w.y + 3}
            width={w.w - 6}
            height={w.h - 6}
          />
        );
      })}
      {FLATS.map((f) => (
        <Room key={f.id} id={f.id} st={state.flats[f.id]} restoring={motion.restoring[f.id]} />
      ))}
      {/* Bell wires (_PRW), only for devices that can wake. */}
      {FLATS.filter((f) => f.wake).map((f) => (
        <path key={f.id} className="dp-wire" d={wirePath(f.level, f.bay)} data-armed={state.flats[f.id].armed} />
      ))}
      <circle className="dp-bell" cx={BELL.x} cy={BELL.y} r="10" />
      {/* The bus scan along a corridor (steps 4 and 5); a found device's plate answers. */}
      {s?.scan &&
        !still &&
        (() => {
          const L = LEVELS[s.scan],
            target = FLATS.find((f) => f.id === s.focus[0])!,
            d = doorOf(target.level, target.bay);
          const x0 = CORRIDOR.x1 - 10,
            x1 = CORRIDOR.x0 + 20,
            k = ((x0 - d.cx) / (x0 - x1)) * (2.6 / 3.5);
          return (
            <g key={`scan-${step}`}>
              <circle className="dp-scan" cx={x0} cy={L.door + 18} r="7">
                <animate
                  ref={begin}
                  begin="indefinite"
                  attributeName="cx"
                  values={`${x0};${x1};${x1}`}
                  keyTimes="0;0.743;1"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
                <animate
                  ref={begin}
                  begin="indefinite"
                  attributeName="opacity"
                  values=".9;.9;0;0"
                  keyTimes="0;0.72;0.743;1"
                  dur="3.5s"
                  repeatCount="indefinite"
                />
              </circle>
              {found(state.flats[target.id].d) && (
                <rect className="dp-answer" x={d.cx - 18} y={d.y + 10} width="36" height="18" rx="4">
                  <animate
                    ref={begin}
                    begin="indefinite"
                    attributeName="opacity"
                    values={`0;0;1;0;0`}
                    keyTimes={`0;${Math.max(k - 0.02, 0).toFixed(3)};${k.toFixed(3)};${Math.min(k + 0.12, 0.99).toFixed(3)};1`}
                    dur="3.5s"
                    repeatCount="indefinite"
                  />
                </rect>
              )}
            </g>
          );
        })()}
      {/* Wake pulses travel from the device down its bell wire to the gate (the OS). */}
      {!still &&
        motion.pulses.map((id) => {
          const f = FLATS.find((x) => x.id === id)!;
          return (
            <circle key={`${id}-${motion.run}`} className="dp-pulse" r="9" cx="0" cy="0">
              <animateMotion
                ref={begin}
                begin="indefinite"
                dur="1.2s"
                fill="freeze"
                keyPoints="1;0"
                keyTimes="0;1"
                calcMode="linear"
                path={wirePath(f.level, f.bay)}
              />
              <animate
                ref={begin}
                begin="indefinite"
                attributeName="opacity"
                values="1;1;0"
                keyTimes="0;.92;1"
                dur="1.2s"
                fill="freeze"
              />
            </circle>
          );
        })}
    </svg>
  );
}

/** The moon over the flats, at the phase the site uses for Modern Standby: the system's state, the same all night. */
export function FlatsMoon() {
  return (
    <div className="dp-moon" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <clipPath id="dp-moon-disc">
            <circle cx="50" cy="50" r="46" />
          </clipPath>
          <clipPath id="dp-moon-lit">
            <path d={litPath(K_MOON, 46, 50) ?? ""} />
          </clipPath>
        </defs>
        <g clipPath="url(#dp-moon-disc)" className="dp-moon-dark">
          <image href={moonImage} x="4" y="4" width="92" height="92" />
        </g>
        <g clipPath="url(#dp-moon-lit)">
          <image href={moonImage} x="4" y="4" width="92" height="92" />
        </g>
      </svg>
      <p className="dp-moon-word">System: S0, Modern Standby, unchanged</p>
    </div>
  );
}
