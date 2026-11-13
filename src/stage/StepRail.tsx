// The rail of chips over a pinned picture, as chapters 2, 3, 5 and 6 draw it: one radio button per step,
// numbered, the current one checked, the last one marked as the reader's turn. Chapter 1 (lanes of states)
// and chapter 4 (a night group and a day group) have rails of their own.
import type { KeyboardEvent, Ref, RefObject } from "react";

interface StepRailProps {
  /** The chapter's class prefix, such as "dp": its stylesheet styles dp-rail, dp-chip, dp-chip-n and dp-chip-label. */
  prefix: string;
  /** The words on each chip, in step order. The last step is the reader's turn. */
  labels: readonly string[];
  /** The step the page is on. */
  current: number;
  /** The chip buttons, kept by useStepScroll so focus can follow the current step. */
  chips: RefObject<(HTMLButtonElement | null)[]>;
  onChoose: (step: number) => void;
  onKey: (e: KeyboardEvent<HTMLButtonElement>, step: number) => void;
  /** The rail's own element, for a chapter that measures it. */
  railRef?: Ref<HTMLDivElement>;
}

export function StepRail({ prefix, labels, current, chips, onChoose, onKey, railRef }: StepRailProps) {
  const last = labels.length - 1;
  return (
    <div className={`${prefix}-rail`} ref={railRef} role="radiogroup" aria-label="Steps. Choose one to read about it.">
      {labels.map((label, step) => (
        <button
          key={step}
          type="button"
          role="radio"
          aria-checked={step === current}
          tabIndex={step === current ? 0 : -1}
          ref={(el) => {
            chips.current[step] = el;
          }}
          className={`${prefix}-chip${step === last ? ` ${prefix}-chip-play` : ""}`}
          onClick={() => onChoose(step)}
          onKeyDown={(e) => onKey(e, step)}
        >
          <span className={`${prefix}-chip-n`}>{step + 1}</span> <span className={`${prefix}-chip-label`}>{label}</span>
        </button>
      ))}
    </div>
  );
}
