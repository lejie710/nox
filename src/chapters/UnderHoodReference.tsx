// Chapter 6's light part: the same machine by day as a line drawing with the tables and the names on it,
// where each table is and how the OS reaches it, how to read your own machine's tables, and ASL beside AML.
import { Cite } from "../components/Chrome";
import drawingPlate from "../assets/uh-apart-drawing.webp";
import {
  DAY_DESCRIPTION,
  DOT,
  NAME,
  TABLE,
  TABLE_IDS,
  nameAt,
  sigAt,
  spanPoints,
  threadPath,
  type Pt,
} from "../model/underHood";

const points = (ps: Pt[]) => ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

const ROW_RSDP = ["acpiRsdp"];
const ROW_XSDT = ["acpiTableHeader"];
const ROW_FADT = ["acpiFadt"];
const ROW_FACS = ["acpiFacs"];
const ROW_BLOCKS = ["acpiDefBlocks"];
const FIELD_LINUX = ["linuxAcpiEnumeration", "linuxAcpiTableUpgrade", "linuxAcpiNamespace"];
const FIELD_WINDOWS = ["msAslCompiler", "msDeviceNamespaceObjects"];
const COMPARE_CITATIONS = ["acpiMethodsAsl", "acpiAslNames", "acpiAml"];
/** Every source this part cites, for the page's source list. */
export const REFERENCE_CITATIONS = [
  ...ROW_RSDP,
  ...ROW_XSDT,
  ...ROW_FADT,
  ...ROW_FACS,
  ...ROW_BLOCKS,
  ...FIELD_LINUX,
  ...FIELD_WINDOWS,
  ...COMPARE_CITATIONS,
];

const DAY_THREADS = ["rx", "s1", "s2", "s3", "ff", "fd"] as const;
const DAY_TWIGS = ["trunk", "t1", "t2", "t3", "t4", "t5"] as const;
const DAY_NAMES = ["root", "sb", "pci", "fet", "sta", "off", "on", "cst", "pr3"] as const;
const DAY_DOTS = ["fet", "cst", "pr3"] as const;
/** The drawing's text is 27 units of a 1700-unit view: the scale at which 13 px text would be that size. */
const DAY_Z = 13 / 27;

function DayDrawing() {
  const tables = TABLE_IDS.filter((id) => id !== "unk");
  return (
    <figure className="uh-drawing">
      <div className="uh-drawing-box">
        <div className="uh-drawing-plate" aria-hidden="true" style={{ backgroundImage: `url(${drawingPlate})` }} />
        <svg className="uh-draw-ov" viewBox="0 0 1700 1500" role="img" aria-label={DAY_DESCRIPTION}>
          {tables.map((id) => (
            <polygon key={id} className="d-span" points={points(spanPoints(id))} />
          ))}
          {DAY_THREADS.map((id) => (
            <path key={id} className="d-thr" d={threadPath(id)} />
          ))}
          {DAY_TWIGS.map((id) => (
            <path key={id} className="d-twig" d={threadPath(id)} />
          ))}
          {DAY_DOTS.map((id) => (
            <circle key={id} className="d-dot" cx={DOT[id][0]} cy={DOT[id][1]} r={7} />
          ))}
          {tables.map((id) => {
            const [x, y] = sigAt(id);
            return (
              <text key={id} className="d-sig" x={x.toFixed(1)} y={y.toFixed(1)}>
                {TABLE[id].sig}
              </text>
            );
          })}
          {DAY_NAMES.map((id) => {
            const [x, y] = nameAt(id, DAY_Z);
            return (
              <text key={id} x={x} y={y.toFixed(1)}>
                {NAME[id].text}
              </text>
            );
          })}
        </svg>
      </div>
      <figcaption>
        Blue: the tables on the memory and the addresses that lead from one to the next. Black: the names the operating
        system built from them, each by the part it describes.
      </figcaption>
    </figure>
  );
}

export function Reference() {
  return (
    <>
      <section className="chapter-block uh-day" aria-labelledby="uh-day-title">
        <h2 className="block-title" id="uh-day-title">
          Where each thing is.
        </h2>
        <p className="block-sub">The same machine, by day.</p>
        <DayDrawing />
        <div className="names-wrap">
          <table className="names uh-table">
            <thead>
              <tr>
                <th scope="col">In a dump</th>
                <th scope="col">What it is</th>
                <th scope="col">How the OS reaches it, and what it holds</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <code>RSD PTR </code>
                </th>
                <td>RSDP, the root pointer</td>
                <td>
                  Handed over by the OS loader on UEFI, or found by a search of two memory ranges on a legacy PC. Its
                  own layout and an 8-byte signature. It holds the address of the XSDT.
                  <Cite ids={ROW_RSDP} up />
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <code>XSDT</code>
                </th>
                <td>The list of tables</td>
                <td>
                  From the RSDP. A header, then 64-bit addresses, each pointing to a table. An OS must use it if present
                  (the older <code>RSDT</code> holds 32-bit addresses).
                  <Cite ids={ROW_XSDT} up />
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <code>FACP</code>
                </th>
                <td>FADT, the fixed description</td>
                <td>
                  From the XSDT. Fixed hardware information, flags, and the addresses of the FACS and the DSDT.
                  <Cite ids={ROW_FADT} up />
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <code>FACS</code>
                </th>
                <td>Shared control memory</td>
                <td>
                  From the FADT. Memory both firmware and the OS write: the hardware signature, the waking vector, the
                  Global Lock. Optional only on a hardware-reduced platform.
                  <Cite ids={ROW_FACS} up />
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <code>DSDT</code>
                </th>
                <td>The main definition block</td>
                <td>
                  From the FADT. A header, then AML. Loaded first. It creates the namespace.
                  <Cite ids={ROW_BLOCKS} up />
                </td>
              </tr>
              <tr>
                <th scope="row">
                  <code>SSDT</code>
                </th>
                <td>Further definition blocks</td>
                <td>
                  From the XSDT. There can be several, loaded after the DSDT in the order listed. They add to the
                  namespace and cannot overwrite it.
                  <Cite ids={ROW_BLOCKS} up />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <div className="field-cards">
        <section className="fcard" aria-labelledby="uh-field-title">
          <p className="fcard-label">In the field</p>
          <h2 className="fcard-title" id="uh-field-title">
            Read your own machine's tables.
          </h2>
          <p>
            On Linux, the kernel documentation shows the loop: <code>acpidump &gt; acpidump</code>, then{" "}
            <code>acpixtract -a acpidump</code>, then <code>iasl -e ssdt?.* -d dsdt.dat</code> gives{" "}
            <code>dsdt.dsl</code>, source rebuilt from the bytes. The tables in use are also under{" "}
            <code>/sys/firmware/acpi/tables</code>, and every namespace device has a link in{" "}
            <code>/sys/bus/acpi/devices</code> whose <code>path</code> file holds its full name, such as{" "}
            <code>\_SB_.PCI0</code>.<Cite ids={FIELD_LINUX} />
          </p>
          <p>
            On Windows, the ASL compiler in the Windows Driver Kit can unassemble a table chosen by its signature into
            ASL source (<code>asl /tab=DSDT</code>), and do the same for an AML file (<code>asl /u</code>). In Device
            Manager, the Hardware IDs of a device that ACPI describes are built from identification objects in the
            namespace, such as <code>_HID</code> and <code>_CID</code>.<Cite ids={FIELD_WINDOWS} />
          </p>
        </section>
        <section className="fcard" aria-labelledby="uh-compare-title">
          <p className="fcard-label">Compare</p>
          <h2 className="fcard-title" id="uh-compare-title">
            ASL and AML.
          </h2>
          <div className="uh-compare" role="table" aria-label="ASL compared with AML">
            <div role="row" className="uh-crow uh-chead">
              <span role="columnheader">
                <span className="sr-only">Aspect</span>
              </span>
              <span role="columnheader">ASL</span>
              <span role="columnheader">AML</span>
            </div>
            <div role="row" className="uh-crow">
              <span role="rowheader">What it is</span>
              <span role="cell">The source language</span>
              <span role="cell">The encoded byte stream</span>
            </div>
            <div role="row" className="uh-crow">
              <span role="rowheader">Who handles it</span>
              <span role="cell">Firmware vendors write it, and a translator turns it into AML</span>
              <span role="cell">The OS loads it, and its AML interpreter evaluates it</span>
            </div>
            <div role="row" className="uh-crow">
              <span role="rowheader">Where it is</span>
              <span role="cell">Not in the tables: it is translated to AML before it ships</span>
              <span role="cell">In the DSDT and SSDTs, after each header</span>
            </div>
            <div role="row" className="uh-crow">
              <span role="rowheader">A name</span>
              <span role="cell">
                One to four characters: <code>_SB</code>
              </span>
              <span role="cell">
                Always four bytes: <code>_SB_</code>
              </span>
            </div>
          </div>
          <p className="uh-compare-cite">
            Sources for the table
            <Cite ids={COMPARE_CITATIONS} up />
          </p>
        </section>
      </div>
    </>
  );
}
