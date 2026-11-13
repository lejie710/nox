// Chapter 3's words: what stands beside the building for a step, and for the reader's turn (with the
// controls in a row where the card is what is read).
import { Cite } from "../components/Chrome";
import { DEVICE_STEPS, PLAY_CITATIONS, STEP_COUNT, YOUR_TURN, type Story } from "../model/devicePower";
import { ControlButtons } from "./DeviceLabels";
import type { Controls } from "./useDeviceNight";

const LAST = DEVICE_STEPS.length;

/** One step's words: beside the figure on wide screens, in a card under it on narrow ones. */
export function StepWords({
  i,
  story,
  controls,
  onRing,
  onReset,
}: {
  i: number;
  story: Story;
  controls?: Controls;
  onRing?: () => void;
  onReset?: () => void;
}) {
  if (i === LAST) {
    return (
      <>
        <p className="dp-pos">
          Step {STEP_COUNT} of {STEP_COUNT}
        </p>
        <h3 className="dp-title">{YOUR_TURN.title}</h3>
        <p className="twotone dp-text">
          <b>{YOUR_TURN.lead}</b> {YOUR_TURN.rest}
        </p>
        <p className="twotone dp-story">
          <b>{story.lead}</b> {story.rest}
          <Cite ids={PLAY_CITATIONS} />
        </p>
        <p className="dp-hint">{YOUR_TURN.hint}</p>
        {controls && (
          <div className="dp-card-controls">
            <ControlButtons c={controls} inline />
          </div>
        )}
        {onReset && (
          <div className="dp-acts">
            <button type="button" className="dp-act" onClick={onReset}>
              Start the night again
            </button>
          </div>
        )}
      </>
    );
  }
  const s = DEVICE_STEPS[i];
  return (
    <>
      <p className="dp-pos">
        Step {i + 1} of {STEP_COUNT}
      </p>
      <h3 className="dp-title">{s.title}</h3>
      <p className="twotone dp-text">
        <b>{s.lead}</b> {s.rest}
        <Cite ids={s.citations} />
      </p>
      <p className="dp-rule">
        <b>The rule.</b> {s.rule}
        <Cite ids={s.ruleCitations} up />
      </p>
      {s.note && <p className="dp-hint">{s.note}</p>}
      {s.wake && onRing && (
        <div className="dp-acts">
          <button type="button" className="dp-act" onClick={onRing}>
            Ring again
          </button>
        </div>
      )}
    </>
  );
}
