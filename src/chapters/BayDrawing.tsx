// Chapter 3's light part: the same flat by day, four
// times. One ink drawing of the very bay from the night plate is used for
// every panel; each panel's state is drawn on top in SVG, so the panels differ
// only where the state differs. A row from 1000 px of figure width, otherwise
// 2 x 2 with short captions, so the text stays at about 13 px or more.
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { Cite } from "../components/Chrome";
import bayImage from "../assets/bay-drawing.webp";
import { BAY, BAY_DESCRIPTION, BAY_PANELS, type BayPanel } from "../model/devicePower";

export const BAY_CITATIONS = ["acpiDevicePower", "msDeviceLowPower", "msDevicePowerStates"];
const INK = "#2F3E5C";
const { crop: CROP, plate: PLATE, window: WIN, deskY: DESK_Y, tube: TUBE, corridor: CORR } = BAY;
const WIRE = `M ${CROP.x + CROP.w} 425 H ${PLATE.x + PLATE.w / 2} V ${PLATE.y}`;
const PANEL_W = 1040;
const PANEL_H = (PANEL_W * CROP.h) / CROP.w;

function Panel({ p, x, y, uid }: { p: BayPanel; x: number; y: number; uid: string }) {
  const pcx = PLATE.x + PLATE.w / 2,
    pcy = PLATE.y + PLATE.h / 2;
  return (
    <g className="bay-panel" data-state={p.id}>
      <svg
        x={x}
        y={y}
        width={PANEL_W}
        height={PANEL_H}
        viewBox={`${CROP.x} ${CROP.y} ${CROP.w} ${CROP.h}`}
        overflow="hidden"
      >
        <image href={bayImage} x="0" y="0" width={BAY.image.w} height={BAY.image.h} />
        {p.corridor === "on" ? (
          <>
            <rect x={CORR.x} y={CORR.y} width={CORR.w} height={CORR.h} fill={`url(#${uid}-tube)`} />
            <rect
              x={TUBE.x + 6}
              y={TUBE.y + 6}
              width={TUBE.w - 12}
              height={TUBE.h - 12}
              rx="6"
              fill="#ffffff"
              stroke="#7fb0ec"
              strokeWidth="5"
              filter={`url(#${uid}-soft)`}
            />
          </>
        ) : (
          <rect x={CORR.x} y={CORR.y} width={CORR.w} height={CORR.h} fill={INK} opacity=".16" />
        )}
        {p.lamp ? (
          <rect x={WIN.x} y={WIN.y} width={WIN.w} height={WIN.h} fill={`url(#${uid}-lamp)`} opacity={p.lamp} />
        ) : (
          <rect
            x={WIN.x}
            y={WIN.y}
            width={WIN.w}
            height={WIN.h}
            fill={INK}
            opacity={p.corridor === "off" ? 0.26 : 0.14}
          />
        )}
        {p.things && (
          <g stroke={INK} strokeWidth="4" strokeLinejoin="round">
            <path
              d={`M ${WIN.x + 40} ${DESK_Y} v -70 M ${WIN.x + 18} ${DESK_Y - 70} h 44 l -12 -34 h -20 z`}
              fill="#f2c27a"
            />
            <rect x={WIN.x + 96} y={DESK_Y - 26} width="70" height="26" fill="#9db7df" />
            <rect x={WIN.x + 102} y={DESK_Y - 50} width="60" height="24" fill="#e2a08f" />
            <rect x={WIN.x + 190} y={DESK_Y - 38} width="30" height="38" rx="5" fill="#f3ecdc" />
            <rect x={WIN.x + 246} y={DESK_Y - 28} width="30" height="28" fill="#c79566" />
            <circle cx={WIN.x + 261} cy={DESK_Y - 46} r="20" fill="#8cc18a" />
          </g>
        )}
        {p.box && (
          <g stroke={INK} strokeWidth="4" strokeLinejoin="round" fill="#e3c89c">
            <path d={`M ${WIN.x + 110} ${DESK_Y} v -64 h 130 v 64 z`} />
            <path d={`M ${WIN.x + 110} ${DESK_Y - 64} l 18 -20 h 130 l -18 20 z`} fill="#ecd6b0" />
            <path d={`M ${WIN.x + 240} ${DESK_Y} l 18 -20 v -64 l -18 20 z`} fill="#d4b483" />
          </g>
        )}
        {/* The window's bars, from the drawing itself, so the desk sits behind the grille. */}
        <image href={bayImage} x="0" y="0" width={BAY.image.w} height={BAY.image.h} clipPath={`url(#${uid}-bars)`} />
        {p.plate === "lit" ? (
          <>
            <rect
              x={pcx - 78}
              y={pcy - 40}
              width="156"
              height="80"
              rx="14"
              fill="#bcd8ff"
              filter={`url(#${uid}-soft)`}
            />
            <rect
              x={pcx - 60}
              y={pcy - 22}
              width="120"
              height="44"
              rx="8"
              fill="#ffffff"
              stroke={INK}
              strokeWidth="4"
            />
          </>
        ) : (
          <rect x={pcx - 60} y={pcy - 22} width="120" height="44" rx="8" fill={INK} stroke="#c9cfdb" strokeWidth="4" />
        )}
        {p.wire === "lit" ? (
          <path d={WIRE} fill="none" stroke="#3d7bd9" strokeWidth="14" filter={`url(#${uid}-line)`} />
        ) : (
          <path d={WIRE} fill="none" stroke="#6c7594" strokeWidth="8" strokeDasharray="24 36" opacity=".45" />
        )}
      </svg>
      <rect
        x={x}
        y={y}
        width={PANEL_W}
        height={PANEL_H}
        rx="18"
        fill="none"
        stroke={p.dashed ? "#2f5d9a" : "#c9cfdb"}
        strokeWidth={p.dashed ? 5 : 3}
        strokeDasharray={p.dashed ? "18 14" : undefined}
      />
    </g>
  );
}

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-lamp`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f2a93b" stopOpacity=".55" />
        <stop offset="1" stopColor="#f2a93b" stopOpacity=".22" />
      </linearGradient>
      <linearGradient id={`${uid}-tube`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity=".62" />
        <stop offset=".45" stopColor="#e8f1ff" stopOpacity=".3" />
        <stop offset="1" stopColor="#e8f1ff" stopOpacity="0" />
      </linearGradient>
      <filter id={`${uid}-soft`} x="-50%" y="-200%" width="200%" height="500%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id={`${uid}-line`} x="-5%" y="-5%" width="110%" height="110%">
        <feGaussianBlur stdDeviation="3" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <clipPath id={`${uid}-bars`} clipPathUnits="userSpaceOnUse">
        {BAY.bars.map(([a, b]) => (
          <rect key={a} x={a} y={WIN.y} width={b - a} height={WIN.h} />
        ))}
        <rect x={WIN.x} y={BAY.midRail.y} width={WIN.w} height={BAY.midRail.h} />
      </clipPath>
      <marker
        id={`${uid}-ar`}
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" fill="#2f5d9a" />
      </marker>
      <marker
        id={`${uid}-ar-up`}
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="5"
        markerHeight="5"
        orient="auto-start-reverse"
      >
        <path d="M0 0 L10 5 L0 10 z" fill="#5d6f92" />
      </marker>
    </defs>
  );
}

function Caption({ p, cx, y, size, short }: { p: BayPanel; cx: number; y: number; size: number; short: boolean }) {
  return (
    <text className="bay-cap" textAnchor="middle" fontSize={size}>
      <tspan x={cx} y={y} className="bay-cap-1">
        {short ? p.short1 : p.line1}
      </tspan>
      <tspan x={cx} dy={size * 1.25} className="bay-cap-2">
        {short ? p.short2 : p.line2}
      </tspan>
    </text>
  );
}

const Label = ({
  x,
  y,
  size,
  cls = "bay-arrow-t",
  anchor = "middle",
  children,
}: {
  x: number;
  y: number;
  size: number;
  cls?: string;
  anchor?: "start" | "middle" | "end";
  children: ReactNode;
}) => (
  <text className={cls} x={x} y={y} textAnchor={anchor} fontSize={size}>
    {children}
  </text>
);

/** Desktop: one row, a shared rail underneath back to D0. */
function Row() {
  const uid = "bay-row",
    W = PANEL_W,
    H = PANEL_H,
    G = 280,
    top = 230,
    fs = 68,
    lf = fs * 0.95;
  const xs = [0, 1, 2, 3].map((k) => k * (W + G));
  const mid = (k: number) => xs[k] + W / 2,
    capY = top + H + 90,
    railY = capY + 2 * fs + 110;
  const total = xs[3] + W,
    height = railY + 130,
    gx = xs[2] + W + G / 2;
  return (
    <svg viewBox={`0 0 ${total} ${height}`} role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>The same flat in four device power states</title>
      <desc id={`${uid}-d`}>{BAY_DESCRIPTION}</desc>
      <Defs uid={uid} />
      {BAY_PANELS.map((p, k) => (
        <Panel key={p.id} p={p} x={xs[k]} y={top} uid={uid} />
      ))}
      {BAY_PANELS.map((p, k) => (
        <Caption key={p.id} p={p} cx={mid(k)} y={capY} size={fs} short={false} />
      ))}
      <path
        className="bay-arrow opt"
        d={`M ${xs[0] + W + 20} ${top + H * 0.42} H ${xs[1] - 24}`}
        markerEnd={`url(#${uid}-ar)`}
      />
      <Label x={xs[0] + W + G / 2} y={top + H * 0.42 - 26} size={lf}>
        optional
      </Label>
      <path
        className="bay-arrow"
        d={`M ${mid(0)} ${top - 20} C ${mid(0)} ${top - 150}, ${mid(2)} ${top - 150}, ${mid(2)} ${top - 26}`}
        markerEnd={`url(#${uid}-ar)`}
      />
      <Label x={(mid(0) + mid(2)) / 2} y={top - 145} size={lf}>
        driver
      </Label>
      <path
        className="bay-arrow opt"
        d={`M ${xs[2] + W + 20} ${top + H * 0.5} H ${xs[3] - 24}`}
        markerEnd={`url(#${uid}-ar)`}
      />
      <Label x={gx} y={top + H * 0.5 - 140} size={lf}>
        OS:
      </Label>
      <Label x={gx} y={top + H * 0.5 - 45} size={lf} cls="bay-arrow-t bay-mono">
        _PR3
      </Label>
      <Label x={gx} y={top + H * 0.5 + 90} size={lf} cls="bay-arrow-t bay-mono">
        off
      </Label>
      <Label x={gx} y={top + H * 0.5 + 172} size={fs * 0.78}>
        if allowed
      </Label>
      <path
        className="bay-rail"
        d={`M ${mid(3)} ${railY - 70} V ${railY} H ${mid(0)} V ${railY - 70}`}
        markerEnd={`url(#${uid}-ar-up)`}
      />
      <path className="bay-rail" d={`M ${mid(1)} ${railY - 70} V ${railY} M ${mid(2)} ${railY - 70} V ${railY}`} />
      <Label x={mid(0) - 18} y={railY + 82} size={lf} cls="bay-rail-t" anchor="start">
        every way back goes to D0
      </Label>
      <Label x={mid(3) + 18} y={railY + 82} size={lf} cls="bay-rail-t" anchor="end">
        from D3cold: reinitialise, longest
      </Label>
    </svg>
  );
}

/** Narrow: 2 x 2, the rail on the right. */
function Grid() {
  const uid = "bay-grid",
    W = PANEL_W,
    H = PANEL_H,
    G = 230,
    fs = 104,
    capH = 2 * fs * 1.25 + 60;
  const right = W + G,
    rows = [260, 260 + H + capH + G];
  const pos = [
    [0, rows[0]],
    [right, rows[0]],
    [0, rows[1]],
    [right, rows[1]],
  ];
  const railX = right + W + 150,
    total = railX + 60,
    height = rows[1] + H + capH + 300;
  const cx = (k: number) => pos[k][0] + W / 2;
  return (
    <svg viewBox={`0 0 ${total} ${height}`} role="img" aria-labelledby={`${uid}-t ${uid}-d`}>
      <title id={`${uid}-t`}>The same flat in four device power states</title>
      <desc id={`${uid}-d`}>{BAY_DESCRIPTION}</desc>
      <Defs uid={uid} />
      {BAY_PANELS.map((p, k) => (
        <Panel key={p.id} p={p} x={pos[k][0]} y={pos[k][1]} uid={uid} />
      ))}
      {BAY_PANELS.map((p, k) => (
        <Caption key={p.id} p={p} cx={cx(k)} y={pos[k][1] + H + fs * 1.3} size={fs} short />
      ))}
      <path
        className="bay-arrow opt"
        d={`M ${W + 20} ${rows[0] + H * 0.45} H ${right - 24}`}
        markerEnd={`url(#${uid}-ar)`}
      />
      <path
        className="bay-arrow"
        d={`M ${cx(0) - W * 0.32} ${rows[0] + H + capH - 30} V ${rows[1] - 24}`}
        markerEnd={`url(#${uid}-ar)`}
      />
      <Label x={cx(0) - W * 0.32 + 40} y={rows[1] - G / 2 + 20} size={fs} anchor="start">
        driver
      </Label>
      <path
        className="bay-arrow opt"
        d={`M ${W + 20} ${rows[1] + H * 0.5} H ${right - 24}`}
        markerEnd={`url(#${uid}-ar)`}
      />
      <Label x={W + G / 2} y={rows[1] + H * 0.5 - 40} size={fs}>
        OS
      </Label>
      <Label x={W + G / 2} y={rows[1] + H * 0.5 + 125} size={fs} cls="bay-arrow-t bay-mono">
        _PR3
      </Label>
      <Label x={W + G / 2} y={rows[1] + H * 0.5 + 290} size={fs} cls="bay-arrow-t bay-mono">
        off
      </Label>
      <path
        className="bay-rail"
        d={`M ${right + W + 20} ${rows[1] + H * 0.5} H ${railX} V 150 H ${cx(0)} V ${rows[0] - 24}`}
        markerEnd={`url(#${uid}-ar-up)`}
      />
      <path
        className="bay-rail"
        d={`M ${right + W + 20} ${rows[0] + H * 0.5} H ${railX} M ${cx(2)} ${rows[1] + H + capH - 30} V ${height - 170} H ${railX} V ${rows[1] + H * 0.5}`}
      />
      <Label x={cx(0) + 60} y={120} size={fs} cls="bay-rail-t" anchor="start">
        every way back goes to D0
      </Label>
      <Label x={right + W} y={height - 40} size={fs} cls="bay-rail-t" anchor="end">
        from D3cold: reinitialise, longest
      </Label>
    </svg>
  );
}

export function BayDrawing() {
  const host = useRef<HTMLDivElement>(null);
  const [row, setRow] = useState(true);
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    const pick = () => setRow(el.clientWidth >= 1000);
    pick();
    const ro = new ResizeObserver(pick);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <section className="bay-block" aria-labelledby="bay-title">
      <p className="fcard-label bay-label">One flat, four states</p>
      <h2 className="bay-heading" id="bay-title">
        The same flat, by day.
      </h2>
      <div className="bay-figure" ref={host}>
        {row ? <Row /> : <Grid />}
      </div>
      <p className="bay-note">
        Drawn as Windows moves a device. ACPI also allows a device to go straight to any deeper state, but every way
        back goes through D0.
        <Cite ids={BAY_CITATIONS} up />
      </p>
    </section>
  );
}
