// Chapter 4's light part: where to look on a real machine, and the older and newer firmware descriptions
// side by side.
import { Cite } from "../components/Chrome";

const FIELD_CITATIONS = [
  "linuxCpuidle",
  "linuxCppc",
  "linuxCpufreq",
  "msPpm",
  "msIdlePromote",
  "msIdleDemote",
  "msPerfBoost",
];
const COMPARE_CITATIONS = ["acpiLpi", "acpiPerf", "acpiCppc"];
/** Every source the two cards cite, for the page's source list. */
export const CARD_CITATIONS = [...FIELD_CITATIONS, ...COMPARE_CITATIONS];

export function CpuCards() {
  return (
    <div className="field-cards" id="cp-field">
      <section className="fcard" aria-labelledby="cp-field-title">
        <p className="fcard-label">In the field</p>
        <h2 className="fcard-title" id="cp-field-title">
          Where to look.
        </h2>
        <p>
          On Linux, each CPU's idle states are under <code>cpuidle/stateN</code>: <code>latency</code> is the exit
          latency and <code>residency</code> the target residency, both in microseconds. <code>usage</code> counts
          entries, and <code>above</code> counts idle periods that turned out too short for the state. The idle governor
          picks a state whose target residency fits the predicted idle time and whose exit latency fits the latency
          limit.
          <Cite ids={["linuxCpuidle"]} />
        </p>
        <p>
          Where the firmware provides CPPC, Linux shows its values as abstract performance numbers (highest, nominal,
          lowest nonlinear, lowest) with the two feedback counters. Performance policies and their governors are under{" "}
          <code>cpufreq</code>.<Cite ids={["linuxCppc", "linuxCpufreq"]} />
        </p>
        <p>
          On Windows, processor power management has its own settings per power profile, among them{" "}
          <code>IdlePromoteThreshold</code> and <code>IdleDemoteThreshold</code>. Boost is set by{" "}
          <code>PERFBOOSTMODE</code>, which Microsoft lists per quality-of-service level.
          <Cite ids={["msPpm"]} /> Microsoft's own page for each of the three marks it as a hidden setting.
          <Cite ids={["msIdlePromote", "msIdleDemote", "msPerfBoost"]} />
        </p>
      </section>
      <section className="fcard" aria-labelledby="cp-compare-title">
        <p className="fcard-label">Compare</p>
        <h2 className="fcard-title" id="cp-compare-title">
          Old and new descriptions.
        </h2>
        <div className="cp-compare" role="table" aria-label="Legacy objects compared with the newer ones">
          <div role="row" className="cp-crow cp-chead">
            <span role="columnheader">
              <span className="sr-only">Aspect</span>
            </span>
            <span role="columnheader">Older</span>
            <span role="columnheader">Newer</span>
          </div>
          <div role="row" className="cp-crow">
            <span role="rowheader">Idle states</span>
            <span role="cell">
              <code>_CST</code>: a flat list of C-states, each with a type, worst-case latency and average power
            </span>
            <span role="cell">
              <code>_LPI</code>: local states per level of a hierarchy, with minimum residency and worst-case wakeup
              latency
            </span>
          </div>
          <div role="row" className="cp-crow">
            <span role="rowheader">Together</span>
            <span role="cell" className="span2" aria-colspan={2}>
              A platform may describe both. An OS that supports <code>_LPI</code> should prefer it, and at run time only
              one is used across the whole hierarchy, never a mix.
            </span>
          </div>
          <div role="row" className="cp-crow">
            <span role="rowheader">Performance</span>
            <span role="cell">
              <code>_PSS</code>: a short list of states in MHz, capped by <code>_PPC</code>
            </span>
            <span role="cell">
              <code>_CPC</code>: one unitless scale. The OS asks, the platform delivers
            </span>
          </div>
          <div role="row" className="cp-crow">
            <span role="rowheader">Together</span>
            <span role="cell" className="span2" aria-colspan={2}>
              When <code>_CPC</code> is present it supersedes <code>_PSS</code>, <code>_PPC</code>, <code>_PCT</code>{" "}
              and the throttling objects.
            </span>
          </div>
        </div>
        <p className="cp-compare-cite">
          Sources for the table
          <Cite ids={COMPARE_CITATIONS} up />
        </p>
      </section>
    </div>
  );
}
