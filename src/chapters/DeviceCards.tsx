// Chapter 3's light part: where D3cold is decided on a real machine, and D3hot beside D3cold.
import { Cite } from "../components/Chrome";

const FIELD_CITATIONS = ["acpiPowerResources", "msD3cold", "msD3coldDriver", "linuxDevicePm", "linuxRuntimePm"];
const COMPARE_CITATIONS = ["acpiDevicePower", "acpiPowerResources", "msDeviceLowPower", "msD3cold", "msD3coldDriver"];
/** Every source the two cards cite, for the page's source list. */
export const CARD_CITATIONS = [...FIELD_CITATIONS, ...COMPARE_CITATIONS];

export function DeviceCards() {
  return (
    <div className="field-cards">
      <section className="fcard" aria-labelledby="dp-field-title">
        <p className="fcard-label">In the field</p>
        <h2 className="fcard-title" id="dp-field-title">
          Where D3cold is decided.
        </h2>
        <p>
          In a disassembled DSDT, a device that supports D3cold provides <code>_PR3</code>, its power resources have{" "}
          <code>_ON</code>, <code>_OFF</code> and <code>_STA</code>, and <code>_S0W</code> returns 4 if it can wake from
          D3cold. For a PCIe endpoint, these objects sit on its root port.
          <Cite ids={["acpiPowerResources", "msD3cold"]} />
        </p>
        <p>
          On Windows, D3cold also needs <code>_OSC</code> bit 2 for <code>_PR3</code>, an <code>_S0W</code>, and the
          driver's opt-in (its INF or <code>SetD3ColdSupport</code>). Without them the device stops at D3hot. A device
          that cannot come back may stay unavailable until a restart or a sleep.
          <Cite ids={["msD3cold", "msD3coldDriver"]} />
        </p>
        <p>
          On Linux, <code>power/control</code> allows (<code>auto</code>) or forbids (<code>on</code>) runtime power
          management, and <code>power/wakeup</code> sets wake policy. A device shown as suspended is a software state,
          not proof of D3.
          <Cite ids={["linuxDevicePm", "linuxRuntimePm"]} />
        </p>
      </section>
      <section className="fcard" aria-labelledby="dp-compare-title">
        <p className="fcard-label">Compare</p>
        <h2 className="fcard-title" id="dp-compare-title">
          D3hot and D3cold.
        </h2>
        <div className="dp-compare" role="table" aria-label="D3hot compared with D3cold">
          <div role="row" className="dp-crow dp-chead">
            <span role="columnheader">
              <span className="sr-only">Aspect</span>
            </span>
            <span role="columnheader">D3hot</span>
            <span role="columnheader">D3cold</span>
          </div>
          <div role="row" className="dp-crow">
            <span role="rowheader">Power</span>
            <span role="cell">A trickle, not cut off from main power</span>
            <span role="cell">Main power removed. Wake logic may keep a little</span>
          </div>
          <div role="row" className="dp-crow">
            <span role="rowheader">Found on its bus</span>
            <span role="cell">Yes, the bus stays in D0</span>
            <span role="cell">No, though still connected</span>
          </div>
          <div role="row" className="dp-crow">
            <span role="rowheader">Who moves it there</span>
            <span role="cell">Its driver, from D0</span>
            <span role="cell">
              The OS, by turning off its <code>_PR3</code> power resources
            </span>
          </div>
          <div role="row" className="dp-crow">
            <span role="rowheader">Context</span>
            <span role="cell">May be lost, and the driver restores it</span>
            <span role="cell">Lost, and the device is reinitialised</span>
          </div>
          <div role="row" className="dp-crow">
            <span role="rowheader">Coming back</span>
            <span role="cell">To D0</span>
            <span role="cell">To D0, with the longest restore time</span>
          </div>
        </div>
        <p className="dp-compare-cite">
          Sources for the table
          <Cite ids={COMPARE_CITATIONS} up />
        </p>
      </section>
    </div>
  );
}
