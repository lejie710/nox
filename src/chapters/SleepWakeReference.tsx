// Chapter 5's light part: where to look on a real machine, a laptop's lid and Linux's own stage names, which
// code runs at each stage of the S3 round trip, and where execution resumes after each sleep state.
import { Cite } from "../components/Chrome";

const FIELD_WINDOWS = ["msPowercfg"];
const FIELD_LINUX = ["linuxSleepStates", "linuxPmDebug"];
const BEYOND_LID = ["acpiFixedHardware", "acpiButtons", "acpiEvents", "acpiEcQuery"];
const BEYOND_LINUX = ["linuxSuspendFlows", "linuxDevicePm"];
const DOWN_CITATIONS = ["acpiSleepMethods", "acpiSleeping", "acpiFacs", "acpiFixedHardware"];
const ASLEEP_CITATIONS = ["acpiSleeping", "acpiFixedHardware"];
const WAKING_CITATIONS = ["acpiSleeping", "acpiFacs", "acpiFixedHardware"];
const BACK_CITATIONS = ["acpiSleepMethods", "acpiSleeping"];
const RESUME_PLAIN = ["acpiSleeping"];
const RESUME_VECTOR = ["acpiSleeping", "acpiFacs"];
const RESUME_S4 = ["acpiSleepMethods", "acpiSleeping"];
const IDLE_CITATIONS = ["acpiFlexible", "linuxSuspendFlows", "msSystemPowerStates"];
const REGISTER_CITATIONS = ["acpiFixedHardware", "acpiEvents", "acpiFlexible"];
/** Every source this part cites, for the page's source list. */
export const REFERENCE_CITATIONS = [
  ...FIELD_WINDOWS,
  ...FIELD_LINUX,
  ...BEYOND_LID,
  ...BEYOND_LINUX,
  ...DOWN_CITATIONS,
  ...ASLEEP_CITATIONS,
  ...WAKING_CITATIONS,
  ...BACK_CITATIONS,
  ...RESUME_PLAIN,
  ...RESUME_VECTOR,
  ...RESUME_S4,
  ...IDLE_CITATIONS,
  ...REGISTER_CITATIONS,
];

export function Reference() {
  return (
    <>
      <div className="field-cards">
        <section className="fcard" aria-labelledby="sw-field-title">
          <p className="fcard-label">In the field</p>
          <h2 className="fcard-title" id="sw-field-title">
            Where to look.
          </h2>
          <p>
            On Windows, <code>powercfg /a</code> lists the sleep states the machine supports and why others are missing,{" "}
            <code>/lastwake</code> names what woke it last, <code>/waketimers</code> lists timers set to wake it, and{" "}
            <code>/devicequery wake_armed</code> lists the devices currently allowed to wake it.
            <Cite ids={FIELD_WINDOWS} />
          </p>
          <p>
            On Linux, <code>/sys/power/mem_sleep</code> shows which suspend variant <code>mem</code> means. By
            convention <code>deep</code> is suspend to RAM, S3 on ACPI systems, and some systems default to{" "}
            <code>s2idle</code>. With <code>/sys/power/pm_test</code> (kernels built with <code>CONFIG_PM_DEBUG</code>)
            a test suspend stops after one stage: freezer, devices, platform, processors or core. A failure at{" "}
            <code>platform</code> points at the ACPI firmware's global methods.
            <Cite ids={FIELD_LINUX} />
          </p>
        </section>
        <section className="fcard" aria-labelledby="sw-beyond-title">
          <p className="fcard-label">Beyond this desktop</p>
          <h2 className="fcard-title" id="sw-beyond-title">
            A laptop, and Linux's own names.
          </h2>
          <p>
            A laptop adds a lid and often an embedded controller. In the spec's example a lid change sets a status bit.
            With its enable set it raises an interrupt, and the handler does <code>Notify(LID, 0x80)</code>: the status
            changed. The OS reads <code>_LID</code>, and its own policy decides. Lid wake is optional and happens only
            when the lid opens. An embedded controller signals on its own GPE. The OS sends it the query command{" "}
            <code>0x84</code>, gets a byte back and runs the matching <code>_Qxx</code> method.
            <Cite ids={BEYOND_LID} />
          </p>
          <p>
            Linux names its own stages. Going down, tasks are frozen first. Devices then go through prepare, suspend,
            suspend_late and suspend_noirq. Non-boot CPUs go offline, and last come the platform's hooks, which in many
            cases call into firmware. Coming back runs roughly the other way: devices resume, tasks thaw, then the
            resume notifiers run. No source places these stages against <code>_TTS</code>, <code>_PTS</code> and{" "}
            <code>_WAK</code>, so they stay apart here.
            <Cite ids={BEYOND_LINUX} />
          </p>
        </section>
      </div>
      <section className="chapter-block" aria-labelledby="sw-who-title">
        <h2 className="block-title" id="sw-who-title">
          Which code runs when.
        </h2>
        <p className="block-sub">The S3 round trip, by who is running.</p>
        <div className="names-wrap">
          <table className="names sw-table">
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">Running</th>
                <th scope="col">What it does</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Going down</th>
                <td>The OS, and AML the OS runs</td>
                <td>
                  <code>_TTS</code>, arming (<code>_PRW</code>, <code>_DSW</code>), devices to low power,{" "}
                  <code>_PTS</code>. Then the way back: the other processors' context saved, the waking vector into the
                  FACS, <code>WAK_STS</code> cleared by writing 1, its own context saved, caches flushed. Last, the wake
                  events enabled and one write: <code>SLP_TYPa</code> with <code>SLP_EN</code> to PM1a, then PM1b if
                  there is one. The platform must assume every <code>_TTS</code> to a sleeping state is followed by{" "}
                  <code>_TTS(0)</code>, even if the transition is cancelled.
                  <Cite ids={DOWN_CITATIONS} up />
                </td>
              </tr>
              <tr>
                <th scope="row">Asleep</th>
                <td>Nothing</td>
                <td>
                  Hardware keeps memory in self-refresh (the spec's example) and watches the enabled wake events.
                  <Cite ids={ASLEEP_CITATIONS} up />
                </td>
              </tr>
              <tr>
                <th scope="row">Waking</th>
                <td>Hardware, then platform firmware</td>
                <td>
                  Back to the working state without the processor, then firmware from the reset vector: it reads the
                  preserved <code>SLP_TYP</code>, restores the minimum, sets <code>SCI_EN</code> and leaves the status
                  and enable bits alone (only if the GPE context was lost does it reset the GPE enable bits), looks for
                  the 64-bit waking vector first, and jumps.
                  <Cite ids={WAKING_CITATIONS} up />
                </td>
              </tr>
              <tr>
                <th scope="row">Back</th>
                <td>The OS, and AML the OS runs</td>
                <td>
                  Context, <code>_WAK</code> alongside the drivers, devices, <code>_TTS(0)</code> last.
                  <Cite ids={BACK_CITATIONS} up />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section className="chapter-block" aria-labelledby="sw-resume-title">
        <h2 className="block-title" id="sw-resume-title">
          Where execution resumes.
        </h2>
        <p className="block-sub">After each sleep state.</p>
        <div className="names-wrap">
          <table className="names sw-table two">
            <thead>
              <tr>
                <th scope="col">From</th>
                <th scope="col">Execution resumes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">S1</th>
                <td>
                  It continues where it stopped.
                  <Cite ids={RESUME_PLAIN} up />
                </td>
              </tr>
              <tr>
                <th scope="row">S2, S3</th>
                <td>
                  At the processor's reset vector, in platform firmware, which then jumps to the waking vector in the
                  FACS.
                  <Cite ids={RESUME_VECTOR} up />
                </td>
              </tr>
              <tr>
                <th scope="row">S4 (OS-initiated)</th>
                <td>
                  A normal boot. The OS loader restores memory (the spec's Chapter 7 entry for <code>\_S4</code> words
                  this differently).
                  <Cite ids={RESUME_S4} up />
                </td>
              </tr>
              <tr>
                <th scope="row">S4BIOS</th>
                <td>
                  Firmware restores memory, then uses the waking vector.
                  <Cite ids={RESUME_VECTOR} up />
                </td>
              </tr>
              <tr>
                <th scope="row">S5</th>
                <td>
                  A normal power-on boot into a fresh OS: no waking vector, nothing resumes.
                  <Cite ids={RESUME_PLAIN} up />
                </td>
              </tr>
              <tr>
                <th scope="row">S0 idle</th>
                <td>
                  It never leaves S0. Windows calls this Modern Standby on some systems. Linux's suspend-to-idle has no
                  sleep-register write and no firmware hand-off.
                  <Cite ids={IDLE_CITATIONS} up />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="sw-aside">
          The wake registers. Each wake event has a status bit that hardware latches and an enable bit the OS sets.{" "}
          <code>WAK_STS</code>, which only records that a wake happened, has no enable bit in the PM1 enable register
          (one sentence of the event model names a <code>WAK_EN</code>). Software clears a status bit by writing 1 to
          it. The OS owns these registers, and AML cannot write them. Hardware-reduced platforms have no fixed registers
          like these: wake-capable interrupts and a sleep control and status register take their place.
          <Cite ids={REGISTER_CITATIONS} up />
        </p>
      </section>
    </>
  );
}
