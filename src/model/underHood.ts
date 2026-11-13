// Chapter 6, Under the hood:
// the chapter 1 laptop taken apart, one photograph. Amber is what the firmware wrote (the tables, drawn
// as spans on the memory); white is what the OS does (addresses followed, the tree of names, a method
// evaluated). The camera moves between three framings of the one photograph. Every sentence is checked
// against the ACPI 6.6 text and the Linux and Microsoft pages; the AML grammar lines behind
// stop 4 were read in the spec's chapter 20.

// ---- The plate (uh-apart-base.webp, 2400 x 1500), measured on its own pixels -------------------------
import type { SceneFit } from "./layout";

export const PLATE = { w: 2400, h: 1500 } as const;
/** The parts end near x 1580; right of this the plate is black, for the words. */
export const PLATE_W = 1640;
export type Pt = readonly [number, number];
export type ChipId = "m1" | "m2" | "m3" | "m4";
/** The four memory chips, each a parallelogram: its left corner L, its far corner T, its near corner B. */
export const CHIP: Record<ChipId, { L: Pt; T: Pt; B: Pt }> = {
  m1: { L: [332, 975], T: [530, 930], B: [400, 1115] },
  m2: { L: [555, 925], T: [740, 885], B: [645, 1065] },
  m3: { L: [435, 1150], T: [645, 1100], B: [525, 1315] },
  m4: { L: [670, 1085], T: [865, 1030], B: [765, 1235] },
};
/** A point on a chip: u along its long edge (L to T), v across it (L to B), both 0 to 1. */
export function pt(c: ChipId, u: number, v: number): Pt {
  const { L, T, B } = CHIP[c];
  return [L[0] + u * (T[0] - L[0]) + v * (B[0] - L[0]), L[1] + u * (T[1] - L[1]) + v * (B[1] - L[1])];
}

// ---- The tables, as spans on the chips. Where a span lies is not an address (the caveat says so). ----
export type TableId = "rsdp" | "xsdt" | "ssdt1" | "facp" | "facs" | "ssdt2" | "unk" | "dsdt";
export interface Table {
  chip: ChipId;
  u0: number;
  u1: number;
  v: number;
  d: number;
  sig: string;
}
/** Each address is a hop to a neighbouring chip: the RSDP and the XSDT near the left edge, where the
    address is handed in; the DSDT at the far left, where the tree leaves. */
export const TABLE: Record<TableId, Table> = {
  rsdp: { chip: "m3", u0: 0.1, u1: 0.4, v: 0.34, d: 0.05, sig: "RSD PTR" },
  xsdt: { chip: "m3", u0: 0.2, u1: 0.92, v: 0.68, d: 0.05, sig: "XSDT" },
  ssdt1: { chip: "m2", u0: 0.34, u1: 0.9, v: 0.32, d: 0.05, sig: "SSDT" },
  facp: { chip: "m2", u0: 0.1, u1: 0.54, v: 0.68, d: 0.05, sig: "FACP" },
  facs: { chip: "m4", u0: 0.14, u1: 0.4, v: 0.32, d: 0.05, sig: "FACS" },
  ssdt2: { chip: "m4", u0: 0.08, u1: 0.44, v: 0.68, d: 0.05, sig: "SSDT" },
  unk: { chip: "m4", u0: 0.58, u1: 0.9, v: 0.68, d: 0.05, sig: "? ? ? ?" },
  dsdt: { chip: "m1", u0: 0.06, u1: 0.94, v: 0.46, d: 0.08, sig: "DSDT" },
};
export const TABLE_IDS = Object.keys(TABLE) as TableId[];
const start = (t: TableId): Pt => pt(TABLE[t].chip, TABLE[t].u0, TABLE[t].v);
const end = (t: TableId): Pt => pt(TABLE[t].chip, TABLE[t].u1, TABLE[t].v);
export function spanPoints(t: TableId): Pt[] {
  const { chip, u0, u1, v, d } = TABLE[t];
  return [pt(chip, u0, v - d), pt(chip, u1, v - d), pt(chip, u1, v + d), pt(chip, u0, v + d)];
}
/** The FACS is written by both sides: a white core inside its amber span. */
export function facsCore(): Pt[] {
  const { chip, u0, u1, v } = TABLE.facs;
  return [
    pt(chip, u0 + 0.04, v - 0.02),
    pt(chip, u1 - 0.04, v - 0.02),
    pt(chip, u1 - 0.04, v + 0.02),
    pt(chip, u0 + 0.04, v + 0.02),
  ];
}
/** Where a table's four letters stand: above a span in a chip's upper row, below one in its lower row. */
export function sigAt(t: TableId): Pt {
  const { chip, u0, v, d } = TABLE[t];
  return v < 0.5 ? pt(chip, u0 + 0.02, v - d - 0.06) : pt(chip, u0 + 0.02, v + d + 0.17);
}
/** The XSDT's four entries. The spec fixes no slot for the FADT: here it is the second. */
export const SLOT_U = [0.48, 0.6, 0.72, 0.84] as const;
export const XSDT_ENTRIES: TableId[] = ["ssdt1", "facp", "ssdt2", "unk"];
const slot = (k: number): Pt => pt("m3", SLOT_U[k], TABLE.xsdt.v);
export function slotLine(k: number): [Pt, Pt] {
  const { v, d } = TABLE.xsdt;
  return [pt("m3", SLOT_U[k] - 0.06, v - d), pt("m3", SLOT_U[k] - 0.06, v + d)];
}

// ---- Parts, and the places in the black where names stand ---------------------------------------------
export const AT = {
  root: [548, 806],
  sb: [632, 772],
  pci: [748, 796],
  fetDot: [800, 652],
  fet: [812, 716],
  methods: [812, 756],
  cstDot: [1040, 925],
  cst: [985, 968],
  pr3Dot: [1040, 600],
  pr3: [1165, 642],
  // A field has no place on the board: its name stands in the black.
  ioDot: [1318, 1108],
  ct: [1335, 1118],
} as const satisfies Record<string, Pt>;
/** The part the power resource feeds in this figure (the SSD): a box the reader can press. */
export const SSD_BOX = [306, 545, 862, 672] as const;
/** The patch of the "powered" photograph around the SSD's status light, and where it lies. */
export const POWERED_BOX = [740, 540, 200, 160] as const;

// ---- Threads: an address followed (on the memory), or a branch of the tree of names -------------------
export type ThreadId =
  | "hand"
  | "rx"
  | "s1"
  | "s2"
  | "s3"
  | "s4"
  | "ff"
  | "fd"
  | "trunk"
  | "t1"
  | "t2"
  | "t3"
  | "a1"
  | "a2"
  | "t4"
  | "t5"
  | "io";
interface Thread {
  a: Pt;
  b: Pt;
  lift: number;
  delay?: 2 | 3;
}
export const THREAD: Record<ThreadId, Thread> = {
  hand: { a: [-30, 1250], b: start("rsdp"), lift: -20 },
  rx: { a: end("rsdp"), b: start("xsdt"), lift: 26 },
  // One thread per entry of the XSDT, in the list's own order (XSDT_ENTRIES).
  s1: { a: slot(0), b: start(XSDT_ENTRIES[0]), lift: -90, delay: 2 },
  s2: { a: slot(1), b: start(XSDT_ENTRIES[1]), lift: -36, delay: 2 },
  s3: { a: slot(2), b: start(XSDT_ENTRIES[2]), lift: 40, delay: 2 },
  s4: { a: slot(3), b: start(XSDT_ENTRIES[3]), lift: 70, delay: 2 },
  ff: { a: end("facp"), b: start("facs"), lift: 30 },
  fd: { a: pt("m2", 0.14, 0.68 - 0.05), b: pt("m1", 0.88, 0.46 + 0.08), lift: -16, delay: 2 },
  trunk: { a: pt("m1", 0.5, 0.46 - 0.08), b: AT.root, lift: -30 },
  t1: { a: AT.root, b: AT.sb, lift: -14, delay: 2 },
  t2: { a: AT.sb, b: AT.pci, lift: 12, delay: 2 },
  t3: { a: AT.pci, b: AT.fetDot, lift: -10, delay: 3 },
  // The SSDTs add to the tree; a processor object hangs from \_SB, not from the PCI host bridge.
  a1: { a: start("ssdt1"), b: AT.sb, lift: -30 },
  a2: { a: start("ssdt2"), b: AT.pci, lift: 30 },
  t4: { a: AT.sb, b: AT.cstDot, lift: -60, delay: 2 },
  t5: { a: AT.pci, b: AT.pr3Dot, lift: -70, delay: 2 },
  // The write leaves from _ON itself, the last of the three methods.
  io: { a: [AT.methods[0] + 250, AT.methods[1] - 10], b: AT.ioDot, lift: -120 },
};
export const THREAD_IDS = Object.keys(THREAD) as ThreadId[];
/** A thread's path: a curve that arcs away from the straight line by its lift, in plate px. */
export function threadPath(id: ThreadId): string {
  const { a, b, lift } = THREAD[id],
    f = (n: number) => n.toFixed(1);
  return `M ${f(a[0])} ${f(a[1])} Q ${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 + lift)} ${f(b[0])} ${f(b[1])}`;
}

// ---- Names on the figure -------------------------------------------------------------------------------
export type NameId = "root" | "sb" | "pci" | "fet" | "sta" | "off" | "on" | "cst" | "pr3" | "ct" | "ctsub";
export const NAME: Record<NameId, { at: Pt; text: string; sub?: boolean; delay?: number; below?: NameId }> = {
  // Stop 5: the names appear along the chain, one after another; the methods last.
  root: { at: [AT.root[0] - 8, AT.root[1] + 34], text: "\\", delay: 0.9 },
  sb: { at: [AT.sb[0] + 10, AT.sb[1] - 8], text: "_SB", delay: 1.2 },
  pci: { at: [AT.pci[0] + 12, AT.pci[1] + 8], text: "PCI0", delay: 1.5 },
  fet: { at: AT.fet, text: "FET0", delay: 1.9 },
  // A name written under another keeps one line of text below it at every scale (see nameAt).
  sta: { at: AT.methods, text: "_STA", delay: 2.3, below: "fet" },
  off: { at: [AT.methods[0] + 96, AT.methods[1]], text: "_OFF", delay: 2.4, below: "fet" },
  on: { at: [AT.methods[0] + 192, AT.methods[1]], text: "_ON", delay: 2.5, below: "fet" },
  cst: { at: AT.cst, text: "_CST" },
  pr3: { at: AT.pr3, text: "_PR3  _PRW" },
  ct: { at: AT.ct, text: "CT01" },
  ctsub: { at: [AT.ct[0], AT.ct[1] + 40], text: "SystemIO 0x125", sub: true, below: "ct" },
};
/** One line of label text, in screen px (13 px text). */
export const NAME_LINE = 18.5;
/** Where a name stands when the plate is drawn at scale z: a name under another sits one text line below it,
    whatever the scale (text keeps its size on screen, so the gap in plate px grows as the plate shrinks). */
export function nameAt(id: NameId, z: number): Pt {
  const n = NAME[id];
  return n.below ? [n.at[0], NAME[n.below].at[1] + NAME_LINE / z] : n.at;
}
export const NAME_IDS = Object.keys(NAME) as NameId[];
export type DotId = "fet" | "cst" | "pr3" | "io";
export const DOT: Record<DotId, Pt> = { fet: AT.fetDot, cst: AT.cstDot, pr3: AT.pr3Dot, io: AT.ioDot };
export const DOT_IDS = Object.keys(DOT) as DotId[];

// ---- Stop 4: three lines of the spec's own ASL example, each facing the bytes it became ---------------
// Only byte values the spec's grammar gives are printed (ScopeOp 0x10, the root character 0x5C,
// MethodOp 0x14, StoreOp 0x70, OnesOp 0xFF); a length byte is two dots. A name is four characters.
export const STRIP = {
  x: 900,
  bytesX: 1150,
  y: 1352,
  pitch: 46,
  from: end("dsdt"),
  via: [960, 1080] as Pt,
  to: [1010, 1322] as Pt,
} as const;
export const STRIP_ROWS: { asl: string; bytes: { text: string; dim?: boolean }[] }[] = [
  { asl: "Scope (\\_SB)", bytes: [{ text: "10" }, { text: "··", dim: true }, { text: "5C" }, { text: "_SB_" }] },
  { asl: "Method (_ON)", bytes: [{ text: "14" }, { text: "··", dim: true }, { text: "_ON_" }] },
  { asl: "CT01 = Ones", bytes: [{ text: "70" }, { text: "FF" }, { text: "CT01" }] },
];
export const STRIP_WORDS =
  "Scope (\\_SB) became 10, a length, 5C, _SB_. Method (_ON) became 14, a length, _ON_. CT01 = Ones became 70, FF, CT01.";

// ---- The camera: the whole machine, or moved in. One photograph; only the framing changes. ------------
export type FrameId = "all" | "mem" | "bytes";
/** A framing's box on the plate: x, y, width, height. The whole machine has none. */
export const FRAME: Record<FrameId, readonly [number, number, number, number] | null> = {
  all: null,
  mem: [250, 830, 800, 570],
  bytes: [300, 850, 1130, 650],
};
/** Room for the rail above the plate on wide screens, so the moon in the lid's glass is never behind a chip. */
export const TOP = 40;
/** The camera's result: a SceneFit, and `room`, the right edge of the room the picture has (where the words begin). */
export interface Fit extends SceneFit {
  room: number;
}
/**
 * The plate's scale and offset in a view of vw by vh. The whole machine: the plate by height, and the
 * picture and the words centred as one group; the words keep that place in every framing. Moved in:
 * the frame's box fills the room left of the words (the whole view on narrow screens), less `foot` px kept
 * free at the bottom for the reader's buttons.
 */
export function fit(frame: FrameId, vw: number, vh: number, narrow: boolean, foot = 0): Fit {
  let z: number,
    x: number,
    y: number,
    room = vw,
    wordsWidth = 0;
  if (narrow) {
    z = Math.min(vh / PLATE.h, vw / PLATE_W);
    x = (vw - PLATE_W * z) / 2;
    y = (vh - PLATE.h * z) / 2;
  } else {
    wordsWidth = Math.min(430, vw * 0.33);
    z = Math.min((vh - TOP) / PLATE.h, (vw - wordsWidth - 48) / PLATE_W);
    x = Math.max(0, (vw - (PLATE_W * z + wordsWidth)) / 2);
    y = TOP + (vh - TOP - PLATE.h * z) / 2;
    room = x + PLATE_W * z;
  }
  const wordsLeft = room,
    F = FRAME[frame];
  if (F) {
    const top = narrow ? 0 : TOP,
      pad = narrow ? 6 : 20,
      rw = room - 2 * pad,
      rh = Math.max(vh - top - 2 * pad - foot, 40);
    z = Math.min(rw / F[2], rh / F[3], 1.1);
    x = pad + (rw - F[2] * z) / 2 - F[0] * z;
    y = top + pad + (rh - F[3] * z) / 2 - F[1] * z;
  }
  return { s: z, tx: x, ty: y, room, wordsLeft, wordsWidth };
}
/** The framing a stop uses: on narrow screens the bytes of stop 4 are in the words, so it stays on the memory. */
export const frameFor = (frame: FrameId, narrow: boolean): FrameId => (narrow && frame === "bytes" ? "mem" : frame);
/** Room kept at the figure's foot for the buttons of the reader's turn on narrow screens, in px. */
export const TURN_FOOT = 108;

// ---- The stops. Text between backticks is an identifier. ----------------------------------------------
export interface Stop {
  id: string;
  rail: string;
  title: string;
  frame: FrameId;
  lead: string;
  rest?: string;
  citations: string[];
  rule: string;
  ruleCitations: string[];
  note?: string;
  noteCitations?: string[];
  /** What the figure adds at this stop, for a reader who cannot see it. */
  hidden?: string;
}
export const STOPS: Stop[] = [
  {
    id: "found",
    rail: "Found",
    title: "The firmware leaves a mark.",
    frame: "all",
    lead: "Before the OS starts, platform firmware sets up its tables in memory. The way in is one structure, the RSDP, which opens with eight bytes that read `RSD PTR `.",
    citations: ["acpiRsdp"],
    rule: "On a UEFI system no memory is searched: the OS loader reads the RSDP's address from the EFI configuration table and hands it to the OS. Its first 20 bytes must sum to zero.",
    ruleCitations: ["acpiRsdp"],
  },
  {
    id: "followed",
    rail: "Followed",
    title: "One address, then a list.",
    frame: "mem",
    lead: "The RSDP holds the address of the XSDT, and the XSDT is a list of addresses, each pointing to a table.",
    rest: "The OS reads each header: four letters say what it is, and the table's bytes must sum to zero. One whose letters the OS does not know is ignored.",
    citations: ["acpiRsdp", "acpiTableHeader"],
    rule: 'The FADT signs itself `FACP`. Search a dump for "FADT" and you find nothing.',
    ruleCitations: ["acpiFadt"],
  },
  {
    id: "branched",
    rail: "Branched",
    title: "FACP points on.",
    frame: "mem",
    lead: "The FADT describes the fixed hardware and carries two more addresses: one to the FACS, one to the DSDT.",
    rest: "The FACS is memory both sides write: before sleep the OS leaves its waking vector there, and the firmware reads it on the way back. The DSDT is the long one.",
    citations: ["acpiFadt", "acpiFacs"],
    rule: "A FACS may be missing only on a hardware-reduced platform.",
    ruleCitations: ["acpiFacs"],
  },
  {
    id: "bytes",
    rail: "Bytes",
    title: "Written as ASL, shipped as AML.",
    frame: "bytes",
    lead: "A firmware engineer writes the DSDT in ASL, a source language. A translator turns it into AML, a stream of bytes.",
    rest: "Each lead byte says how to read the bytes after it. A name is always four bytes: `_SB` is stored as `_SB_`.",
    citations: ["acpiMethodsAsl", "acpiAml"],
    rule: "The table holds only the bytes. The source you read from a dump was rebuilt from them by a disassembler.",
    ruleCitations: ["acpiAml", "linuxAcpiEnumeration", "linuxAcpiTableUpgrade"],
    note: "The three lines are from the spec's own example. Dots stand for length bytes not shown.",
    noteCitations: ["acpiMethodsAsl", "acpiAml"],
    hidden: STRIP_WORDS,
  },
  {
    id: "loaded",
    rail: "Loaded",
    title: "One pass, one tree of names.",
    frame: "all",
    lead: "The OS loads the DSDT: it makes a pass over the bytes and builds the ACPI namespace, one tree of named objects that represents the machine.",
    rest: "Under `\\_SB` sits a device, `PCI0`, and under it a power resource, `FET0`, with three methods, stored and not yet called.",
    citations: ["acpiDefBlocks", "acpiNamespace"],
    rule: "Every name is unique in its place: a collision while loading is fatal.",
    ruleCitations: ["acpiNamespace"],
    hidden:
      "On the figure a tree of names grows from the DSDT: the root, then _SB, then PCI0, then FET0 at the SSD with its methods _STA, _OFF and _ON.",
  },
  {
    id: "added",
    rail: "Added",
    title: "More tables only add.",
    frame: "all",
    lead: "Each SSDT in the list is loaded after the DSDT, in the order listed, into the same tree. It can add names. It cannot replace one.",
    rest: "Here they bring `_CST`, `_PR3` and `_PRW`, all met in earlier chapters.",
    citations: ["acpiDefBlocks"],
    rule: "The devices, power resources and methods of the earlier chapters are names in this one tree. What the FADT and the FACS hold stays in those tables.",
    ruleCitations: ["acpiDefBlocks", "acpiNamespace"],
    note: "Which SSDT brings which name, and where each name hangs, is this figure's own choice: on a real machine `_CST` sits under a processor object, and `_PR3` and `_PRW` under the device they describe.",
    noteCitations: ["acpiNamespace"],
  },
  {
    id: "evaluated",
    rail: "Evaluated",
    title: "The OS runs it. The firmware only wrote it.",
    frame: "all",
    lead: "When the device is needed, the OS's own AML interpreter evaluates `_ON`.",
    rest: "The method writes Ones to `CT01`, a field in an I/O region at 0x125. That one write is all it does to the hardware: power is asserted. The firmware wrote those bytes, and the OS's interpreter ran them.",
    citations: ["acpiRsdp", "acpiMethodsAsl"],
    rule: "A method touches hardware only through a field in an operation region.",
    ruleCitations: ["acpiMethodsAsl"],
    note: "Which part the power resource feeds is this figure's own choice.",
  },
];
export const STEP_COUNT = STOPS.length + 1;
/** Scroll heights in svh: a stop, the reader's turn, the dawn. */
export const STOP_H = 85,
  TURN_H = 85,
  DAWN_H = 60;

// ---- What is lit (it stays: the chain accumulates) ----------------------------------------------------
/** Every element drawn on the plate, by key: "span-rsdp", "thr-rx", "name-sb" and so on. */
export type Lit = Record<string, string>;
const FROM: [string, number][] = [
  ["span-rsdp", 0],
  ["edge-rsdp", 0],
  ["sig-rsdp", 0],
  ["thr-hand", 0],
  ["thr-rx", 1],
  ["span-xsdt", 1],
  ["edge-xsdt", 1],
  ["slot-0", 1],
  ["slot-1", 1],
  ["slot-2", 1],
  ["slot-3", 1],
  ["sig-xsdt", 1],
  ["thr-s1", 1],
  ["thr-s2", 1],
  ["thr-s3", 1],
  ["span-ssdt1", 1],
  ["span-facp", 1],
  ["span-ssdt2", 1],
  ["edge-facp", 1],
  ["sig-ssdt1", 1],
  ["sig-facp", 1],
  ["sig-ssdt2", 1],
  ["thr-ff", 2],
  ["thr-fd", 2],
  ["span-facs", 2],
  ["core-facs", 2],
  ["span-dsdt", 2],
  ["edge-dsdt", 2],
  ["sig-facs", 2],
  ["sig-dsdt", 2],
  ["thr-trunk", 4],
  ["name-root", 4],
  ["thr-t1", 4],
  ["name-sb", 4],
  ["thr-t2", 4],
  ["name-pci", 4],
  ["thr-t3", 4],
  ["dot-fet", 4],
  ["name-fet", 4],
  ["name-sta", 4],
  ["name-off", 4],
  ["name-on", 4],
  ["edge-ssdt1", 5],
  ["edge-ssdt2", 5],
  ["thr-a1", 5],
  ["thr-a2", 5],
  ["thr-t4", 5],
  ["thr-t5", 5],
  ["dot-cst", 5],
  ["name-cst", 5],
  ["dot-pr3", 5],
  ["name-pr3", 5],
  ["thr-io", 6],
  ["dot-io", 6],
  ["name-ct", 6],
  ["name-ctsub", 6],
  ["powered", 6],
];
/** The state of every lit element at stop i (0 to 6). An older thread falls back to an ember; once the tree
    grows, so do the tables' letters; at the last stop only the running method is bright. */
export function litAt(i: number): Lit {
  const lit: Lit = {};
  for (const [k, from] of FROM) if (i >= from) lit[k] = k.startsWith("thr-") && i > from ? "on old" : "on";
  // The table whose letters the OS does not know: it stays a ghost, and its address a faint thread.
  if (i >= 1) {
    lit["span-unk"] = "ghost";
    lit["thr-s4"] = "faint";
    lit["sig-unk"] = "ghost";
  }
  if (i === 3) lit.strip = "on";
  if (i >= 4)
    for (const t of TABLE_IDS)
      if (t !== "dsdt" && t !== "unk" && lit[`sig-${t}`] && !(i === 5 && t.startsWith("ssdt")))
        lit[`sig-${t}`] = "on old";
  if (i === 6) {
    lit["name-on"] = "on hot";
    for (const k of ["name-off", "name-sta", "name-cst", "name-pr3"]) lit[k] = "on old";
  }
  return lit;
}

// ---- Your turn: find your way, then run the device. A pure state machine. -----------------------------
export type FindId = "rsdp" | "xsdt" | "facp" | "ssdt1" | "facs" | "dsdt";
export type RunId = "sta" | "off" | "on" | "part";
export type Action = FindId | RunId;
/** What must have been read before a table answers: only an address already read leads anywhere. */
export const NEEDS: Record<FindId, FindId | null> = {
  rsdp: null,
  xsdt: "rsdp",
  facp: "xsdt",
  ssdt1: "xsdt",
  facs: "facp",
  dsdt: "facp",
};
export const FIND_IDS = Object.keys(NEEDS) as FindId[];
export interface Said {
  lead: string;
  rest: string;
}
export interface Turn {
  phase: "find" | "run";
  got: FindId[];
  on: boolean;
  said: Said | null;
}
export const initialTurn = (): Turn => ({ phase: "find", got: [], on: false, said: null });
const SAID: Record<Exclude<FindId, "dsdt">, Said> = {
  rsdp: {
    lead: "The loader handed you this address.",
    rest: "Its first eight bytes read `RSD PTR `, and it holds one address worth following.",
  },
  xsdt: { lead: "The list.", rest: "Each entry is the address of a table. You read each one's four letters." },
  facp: { lead: "The FADT, signed `FACP`.", rest: "It holds two more addresses: the FACS and the DSDT." },
  ssdt1: { lead: "An SSDT.", rest: "You will load it, but only after the DSDT." },
  facs: { lead: "The FACS.", rest: "Shared memory, no AML: nothing to load from here." },
};
const isFind = (a: Action): a is FindId => a in NEEDS;
/** The reader presses a table, a method or the part. Returns a new turn; a new `said` every time. */
export function press(t: Turn, a: Action): Turn {
  if (t.phase === "find") {
    if (!isFind(a)) return t;
    if (t.got.includes(a)) return { ...t, said: { lead: "Already read.", rest: "Follow an address it holds." } };
    const need = NEEDS[a];
    if (need !== null && !t.got.includes(need))
      return {
        ...t,
        said: { lead: "Still dark.", rest: "Nothing you have read so far holds the address of this table." },
      };
    const got = [...t.got, a];
    if (a === "dsdt")
      return {
        phase: "run",
        got,
        on: false,
        said: { lead: "The DSDT. You load it, and the tree of names exists.", rest: "Now use it." },
      };
    return { ...t, got, said: SAID[a] };
  }
  if (isFind(a)) return t;
  if (a === "sta")
    return {
      ...t,
      said: {
        lead: "You evaluated `_STA`.",
        rest: `It returns \`CT01\`: ${t.on ? "set, power is asserted" : "clear, the power is off"}.`,
      },
    };
  if (a === "on")
    return {
      ...t,
      on: true,
      said: { lead: "You evaluated `_ON`: `CT01 = Ones`.", rest: "One write to an I/O field, and the part has power." },
    };
  if (a === "off")
    return { ...t, on: false, said: { lead: "You evaluated `_OFF`: `CT01 = Zero`.", rest: "The power is off again." } };
  return {
    ...t,
    said: {
      lead: "Nothing happened.",
      rest: "A part cannot run a method, and the firmware does not either: only you, the OS, evaluate it.",
    },
  };
}
export const TURN = {
  rail: "Your turn",
  title: "You are the OS.",
  find: {
    lead: "The machine has just started. Find your way to the DSDT.",
    rest: "Press the tables on the memory. Only one that something you have already read points to will answer.",
  },
  run: {
    lead: "The namespace exists, and the device is needed.",
    rest: "Ask with `_STA`, power it with `_ON`, and try pressing the part itself.",
  },
  citations: ["acpiTableHeader", "acpiFadt", "acpiMethodsAsl"],
} as const;
const LIT_FIND: Record<FindId, string[]> = {
  rsdp: ["span-rsdp", "edge-rsdp", "thr-hand"],
  xsdt: ["span-xsdt", "edge-xsdt", "thr-rx", "slot-0", "slot-1", "slot-2", "slot-3"],
  facp: ["span-facp", "edge-facp", "thr-s2"],
  ssdt1: ["span-ssdt1", "edge-ssdt1", "thr-s1"],
  facs: ["span-facs", "core-facs", "thr-ff"],
  dsdt: ["span-dsdt", "edge-dsdt", "thr-fd"],
};
const TREE = ["thr-trunk", "name-root", "thr-t1", "name-sb", "thr-t2", "name-pci", "thr-t3", "dot-fet", "name-fet"];
const POWERED = ["powered", "thr-io", "dot-io", "name-ct", "name-ctsub"];
/** Where each table's button sits on its chip (two to a chip never touch). */
const PRESS_AT: Record<FindId, [ChipId, number, number]> = {
  rsdp: ["m3", 0.06, 0.22],
  xsdt: ["m3", 0.3, 0.84],
  facp: ["m2", 0.08, 0.84],
  ssdt1: ["m2", 0.4, 0.2],
  facs: ["m4", 0.22, 0.2],
  dsdt: ["m1", 0.2, 0.52],
};
export interface TurnButton {
  id: Action;
  text: string;
  at: Pt;
  done?: boolean;
}
export interface TurnView {
  frame: FrameId;
  lit: Lit;
  lead: string;
  rest: string;
  buttons: TurnButton[];
  part: boolean;
}
export function turnView(t: Turn): TurnView {
  const find = t.phase === "find",
    lit: Lit = {};
  for (const k of t.got.flatMap((g) => LIT_FIND[g])) lit[k] = "on";
  if (!find) for (const k of [...TREE, ...(t.on ? POWERED : [])]) lit[k] = "on";
  return {
    // Moved in on the memory to find the tables; the whole machine once the tree exists.
    frame: find ? "mem" : "all",
    lit,
    ...(find ? TURN.find : TURN.run),
    buttons: find
      ? FIND_IDS.map((id) => ({ id, text: TABLE[id].sig, at: pt(...PRESS_AT[id]), done: t.got.includes(id) }))
      : // The three buttons stand in for the three names, in the figure's order.
        [
          { id: "sta", text: "_STA", at: [AT.methods[0], AT.methods[1] + 34] },
          { id: "off", text: "_OFF", at: [AT.methods[0] + 150, AT.methods[1] + 34] },
          { id: "on", text: "_ON", at: [AT.methods[0] + 300, AT.methods[1] + 34] },
        ],
    part: !find,
  };
}

/** Plain words from a string with backtick identifiers, for the status line. */
export const plain = (s: string) => s.replace(/`/g, "").replace(/\s+/g, " ").trim();

export const CAVEAT =
  "An illustrative laptop taken apart, in generated images, not a real product. Where a table is drawn is not its address. Tables and names vary by platform. Amber: the firmware wrote it. White: the operating system does it.";
export const DAY_DESCRIPTION =
  "The taken-apart laptop by day, as a line drawing. On the memory, the tables the firmware left: the RSDP, the XSDT, the FADT (signature FACP), the FACS, the DSDT and two SSDTs, joined by the addresses that lead from one to the next. On the parts, the names the operating system built from them: FET0 at the SSD, _CST at the processor, _PR3 and _PRW at the Wi-Fi card.";
