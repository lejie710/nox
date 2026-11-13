// The page's chrome: navigation and citation markers.
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { source, sourceNumber } from "../model/sources";
import { Moon } from "./Moon";

export function Nav({
  light = false,
  current = "night",
}: {
  light?: boolean;
  current?: "night" | "chapters" | "sources";
}) {
  return (
    <nav className={`lnav${light ? " light" : ""}`} aria-label="Site">
      <a className="name" href="#top">
        <Moon k={0.3} r={11} tone={light ? "light" : "dark"} />
        Nox
      </a>
      <span className="links">
        <a href="#top" aria-current={current === "night" ? "location" : undefined}>
          The night
        </a>
        <a href="#chapters" aria-current={current === "chapters" ? "location" : undefined}>
          Chapters
        </a>
        <a href="#sources" aria-current={current === "sources" ? "location" : undefined}>
          Sources
        </a>
      </span>
    </nav>
  );
}

/**
 * A citation marker: one button per group of sources. Hovering shows its panel
 * until the pointer leaves; a click (or Enter) pins it open until a second click,
 * Escape or a click outside. The panel is kept inside the viewport.
 */
export function Cite({ ids, up = false }: { ids: string[]; up?: boolean }) {
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const wrap = useRef<HTMLSpanElement>(null);
  const pop = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  // Pinned: opened by a click, so leaving with the pointer does not close it.
  const pinned = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const panelId = useId();
  // Numbers read in ascending order, whatever order the claim lists them in.
  const sorted = [...ids].sort((a, b) => sourceNumber(a) - sourceNumber(b));
  const list = sorted.map(source);
  const n = sorted.map(sourceNumber).join(", ");
  const label = `Sources ${n}: ` + list.map((s) => `${s.title}, ${s.where}`).join("; ");

  // New sources close an open panel; the button itself stays, so keyboard
  // focus survives when a stepper changes what it cites.
  const idKey = ids.join(",");
  useEffect(() => setOpen(false), [idKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The panel is about to go: focus that was inside it returns to the marker, not to the page.
      if (pop.current?.contains(document.activeElement)) button.current?.focus();
      setOpen(false);
    };
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Keep the panel inside the viewport with a 16 px margin.
  useLayoutEffect(() => {
    if (!open || !pop.current) return setShift(0);
    const r = pop.current.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const base = r.left - shift;
    let s = 0;
    if (base < 16) s = 16 - base;
    else if (base + r.width > vw - 16) s = vw - 16 - (base + r.width);
    setShift(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured once when the panel opens; the shift it sets must not run it again
  }, [open]);

  useEffect(() => {
    if (!open) pinned.current = false;
  }, [open]);

  const hold = () => window.clearTimeout(closeTimer.current);
  const release = () => {
    if (pinned.current) return;
    closeTimer.current = window.setTimeout(() => setOpen(false), 200);
  };
  // A click on a panel that hovering opened pins it (a touch arrives as a hover, then a click); a click on a
  // pinned panel closes it; a click on a closed marker opens it pinned.
  const toggle = () => {
    hold();
    if (open && !pinned.current) {
      pinned.current = true;
      return;
    }
    pinned.current = !open;
    setOpen(!open);
  };

  return (
    <span
      className={`cite-wrap${up ? " up" : ""}`}
      ref={wrap}
      onMouseEnter={() => {
        hold();
        setOpen(true);
      }}
      onMouseLeave={release}
    >
      <button
        type="button"
        className="cite"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        ref={button}
        onClick={toggle}
      >
        {n}
      </button>
      {open && (
        <span className="cite-pop" id={panelId} ref={pop} style={{ marginLeft: shift }} onMouseEnter={hold}>
          {list.map((s) => (
            <span key={s.id} className="cite-item">
              <span className="cite-n">{sourceNumber(s.id)}</span> <b>{s.title}</b>, {s.where}.{" "}
              <a href={s.url} target="_blank" rel="noreferrer">
                {new URL(s.url).host}
              </a>
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
