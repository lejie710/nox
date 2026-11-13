// The board picture both of chapter 1's figures use (the state map and the sandbox): one photograph of a
// laptop with its cover off. The light is the state: the board is as bright as the state says, each part
// that still has power is a lit window in it, and a point of light marks where the session is or what is
// kept to wake the machine. Hover, focus or tap names a part. Positions come from src/model/board.ts.
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import boardImage from "../assets/nox-board.webp";
import { Cite } from "../components/Chrome";
import {
  BOARD,
  EXAMPLE_NOTE,
  LENS,
  LIT,
  LOOK_WORDS,
  MARK,
  PARTS,
  PART_IDS,
  TAGS,
  lensGeometry,
  type Look,
  type PartId,
} from "../model/board";

/**
 * Puts a part's label beside the part: to its right, else to its left (narrower if that keeps it beside, so
 * a tapped part stays in view on a phone), else under it, else over it, and always inside the picture.
 */
function placeLabel(container: HTMLElement, tooltip: HTMLElement, button: HTMLElement) {
  const box = container.getBoundingClientRect();
  const part = button.getBoundingClientRect();
  const pad = 8;
  const gap = 8;
  const x = part.left - box.left;
  const y = part.top - box.top;
  const maxWidth = Math.min(270, box.width - pad * 2);
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
  let width = maxWidth;
  let left = x + part.width + gap;
  let top = y;
  // A narrower side label can keep the tapped part exposed on a phone.
  const sides = [
    { space: box.width - pad - left, left: () => x + part.width + gap },
    { space: x - gap - pad, left: (w: number) => x - gap - w },
  ];
  let beside = false;
  for (const side of sides) {
    const candidate = Math.min(maxWidth, side.space);
    if (candidate < Math.min(200, maxWidth)) continue;
    tooltip.style.width = `${candidate}px`;
    if (tooltip.offsetHeight <= box.height - pad * 2) {
      width = candidate;
      left = side.left(width);
      beside = true;
      break;
    }
  }
  tooltip.style.width = `${width}px`;
  const height = tooltip.offsetHeight;
  if (!beside) {
    left = x + part.width / 2 - width / 2;
    top = y + part.height + gap;
  }
  if (top + height > box.height - pad) top = y - height - gap;
  tooltip.style.left = `${clamp(left, pad, box.width - width - pad)}px`;
  tooltip.style.top = `${clamp(top, pad, box.height - height - pad)}px`;
}

/** Hover, focus or tap explains the current look without changing the step. */
function BoardHotspots({ looks }: { looks: Record<PartId, Look> }) {
  const [active, setActive] = useState<PartId | null>(null);
  const activeRef = useRef<PartId | null>(null);
  const pinned = useRef(false);
  const area = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const buttons = useRef<Partial<Record<PartId, HTMLButtonElement>>>({});
  const closeTimer = useRef<number | undefined>(undefined);
  const labelId = useId();
  const cancelClose = useCallback(() => window.clearTimeout(closeTimer.current), []);
  const close = useCallback(() => {
    cancelClose();
    activeRef.current = null;
    pinned.current = false;
    setActive(null);
  }, [cancelClose]);
  const open = (id: PartId) => {
    cancelClose();
    if (activeRef.current !== id) pinned.current = false;
    activeRef.current = id;
    setActive(id);
  };
  // A label pinned by a click, or opened by keyboard focus, stays until it is
  // dismissed on purpose; only a hover-opened label closes when the pointer leaves.
  const closeSoon = () => {
    const id = activeRef.current;
    if (pinned.current || (id && document.activeElement === buttons.current[id])) return;
    cancelClose();
    closeTimer.current = window.setTimeout(close, 160);
  };
  const look = active ? looks[active] : null;
  const words = look ? `${LOOK_WORDS[look][0].toUpperCase()}${LOOK_WORDS[look].slice(1)}.` : "";

  useEffect(() => {
    const escape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !area.current?.contains(event.target)) close();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      cancelClose();
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [cancelClose, close]);

  // Measure after text changes, before paint. Resize also preserves containment.
  useLayoutEffect(() => {
    const container = area.current;
    const tooltip = label.current;
    const button = active ? buttons.current[active] : null;
    if (!container || !tooltip || !button) return;
    const place = () => placeLabel(container, tooltip, button);
    place();
    const resize = new ResizeObserver(place);
    resize.observe(container);
    resize.observe(tooltip);
    return () => resize.disconnect();
  }, [active, words]);

  return (
    <div className="board-hotspots" ref={area}>
      {PART_IDS.map((id) => {
        const p = PARTS[id];
        return (
          <button
            key={id}
            type="button"
            className="board-hotspot"
            data-part={id}
            ref={(el) => {
              if (el) buttons.current[id] = el;
              else delete buttons.current[id];
            }}
            aria-label={p.name}
            aria-expanded={active === id}
            aria-describedby={active === id ? labelId : undefined}
            style={{
              left: `${(p.x / BOARD.w) * 100}%`,
              top: `${(p.y / BOARD.h) * 100}%`,
              width: `${(p.w / BOARD.w) * 100}%`,
              height: `${(p.h / BOARD.h) * 100}%`,
            }}
            onPointerEnter={(e) => {
              if (e.pointerType !== "touch") open(id);
            }}
            onPointerLeave={(e) => {
              if (
                e.pointerType !== "touch" &&
                !(e.relatedTarget instanceof Node && label.current?.contains(e.relatedTarget))
              )
                closeSoon();
            }}
            onFocus={() => open(id)}
            onBlur={() => {
              if (activeRef.current === id) close();
            }}
            onClick={() => {
              if (activeRef.current === id && pinned.current) close();
              else {
                open(id);
                pinned.current = true;
              }
            }}
          />
        );
      })}
      {active && (
        <div
          className="board-hotspot-label"
          id={labelId}
          ref={label}
          role="tooltip"
          onPointerEnter={cancelClose}
          onMouseDown={(e) => e.preventDefault()}
          onPointerLeave={(e) => {
            if (e.pointerType !== "touch" && e.relatedTarget !== buttons.current[active]) closeSoon();
          }}
        >
          <strong className="board-hotspot-name">{PARTS[active].name}</strong>
          <span className="board-hotspot-words">{words}</span>
          {EXAMPLE_NOTE[active] && <span className="board-hotspot-example">{EXAMPLE_NOTE[active]}</span>}
        </div>
      )}
    </div>
  );
}

/** How far a part's pool of light reaches past its box, as a share of the box, on each side. */
const POOL = 0.45;

/**
 * The same photograph, part boxes and interactions for both chapter boards. The light is the state: the
 * whole board is as bright as `light`, each part that still has power is a lit window in it, and a point of
 * light marks where the session is (cream) or what is kept to wake the machine (amber).
 */
export function BoardPicture({
  looks,
  light,
  children,
}: {
  looks: Record<PartId, Look>;
  light: number;
  children?: ReactNode;
}) {
  const pc = (v: number, of: number) => `${((v / of) * 100).toFixed(3)}%`;
  return (
    <div className="board-picture" style={{ ["--light" as string]: light }}>
      <img
        className="board-base"
        src={boardImage}
        width={BOARD.w}
        height={BOARD.h}
        alt="A laptop with its bottom cover off: processor and fan, memory, Wi-Fi card, SSD, embedded controller, clock battery, and the battery pack."
      />
      <div className="board-lights" aria-hidden="true">
        {PART_IDS.map((id) => {
          const p = PARTS[id];
          const look = looks[id];
          // Never dimmer than the board around it: a lit board has no dark holes.
          const lit = look === "idle" ? undefined : Math.max(LIT[look], light);
          // A pool of light, not a crop: the window reaches past the part's box on every side and falls off to
          // nothing in an oval (the mask is in CSS), so no straight edge shows.
          const mx = p.w * POOL,
            my = p.h * POOL,
            x = p.x - mx,
            y = p.y - my,
            w = p.w + 2 * mx,
            h = p.h + 2 * my;
          return (
            <div
              key={id}
              className={`board-light ${look}`}
              data-part={id}
              style={{
                left: pc(x, BOARD.w),
                top: pc(y, BOARD.h),
                width: pc(w, BOARD.w),
                height: pc(h, BOARD.h),
                backgroundImage: `url(${boardImage})`,
                backgroundSize: `${pc(BOARD.w, w)} ${pc(BOARD.h, h)}`,
                backgroundPosition: `${pc(x, BOARD.w - w)} ${pc(y, BOARD.h - h)}`,
                opacity: lit,
              }}
            />
          );
        })}
        {PART_IDS.map((id) => {
          const p = PARTS[id];
          const look = looks[id];
          return (
            <div
              key={id}
              className={`board-spot${MARK[look] ? ` ${MARK[look]}` : ""}`}
              data-part={id}
              style={{ left: pc(p.x + p.w / 2, BOARD.w), top: pc(p.y + p.h / 2, BOARD.h) }}
            >
              <i className="board-mark" />
              <span className="board-tag">{TAGS[look]}</span>
            </div>
          );
        })}
      </div>
      <BoardHotspots looks={looks} />
      {children}
    </div>
  );
}

/** One line per part, for screen readers, in place of the picture's lights. */
export function PartsList({ looks, label }: { looks: Record<PartId, Look>; label: string }) {
  return (
    <ul className="sr-only" aria-label={label}>
      {PART_IDS.map((id) => (
        <li key={id}>
          {PARTS[id].name}: {LOOK_WORDS[looks[id]]}.
        </li>
      ))}
    </ul>
  );
}

/** The magnifying lens on one part, its leader line and its cited caption. */
export function BoardCallout({ focus, callout, citations }: { focus: PartId; callout: string; citations: string[] }) {
  const part = PARTS[focus];
  const { left, top, dx, dy, textLeft, bgSize, bgX, bgY } = lensGeometry(part);
  return (
    <div
      className={`board-callout${textLeft ? " text-left" : ""}`}
      data-focus={focus}
      style={{ left: `${left * 100}%`, top: `${top * 100}%` }}
    >
      <div
        className="board-leader"
        aria-hidden="true"
        style={{
          left: "50%",
          height: `${(Math.hypot(dx, dy) / LENS) * 100}%`,
          transform: `rotate(${(Math.atan2(dx, dy) * 180) / Math.PI}deg)`,
        }}
      />
      <div
        className="board-lens"
        aria-hidden="true"
        style={{
          backgroundImage: `url(${boardImage})`,
          backgroundSize: `${bgSize}% auto`,
          backgroundPosition: `${bgX}% ${bgY}%`,
        }}
      />
      <p className="board-callout-text">
        <span className="board-callout-name">{part.name}</span>
        {callout}
        <Cite ids={citations} up />
      </p>
    </div>
  );
}
