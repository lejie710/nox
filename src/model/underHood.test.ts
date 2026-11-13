// Chapter 6's model: each stop's full state, what is drawn on the photograph, the camera, and the rules of
// the reader's turn.
import { describe, expect, it } from "vitest";
import {
  AT,
  CAVEAT,
  CHIP,
  DAY_DESCRIPTION,
  DOT,
  FIND_IDS,
  FRAME,
  NAME,
  NAME_IDS,
  NEEDS,
  PLATE,
  PLATE_W,
  SSD_BOX,
  STEP_COUNT,
  STOPS,
  STRIP,
  STRIP_ROWS,
  STRIP_WORDS,
  TABLE,
  TABLE_IDS,
  THREAD,
  THREAD_IDS,
  TOP,
  TURN,
  TURN_FOOT,
  XSDT_ENTRIES,
  fit,
  frameFor,
  initialTurn,
  litAt,
  nameAt,
  press,
  pt,
  sigAt,
  spanPoints,
  threadPath,
  turnView,
  type Action,
  type ChipId,
  type FindId,
  type FrameId,
  type Pt,
  type Turn,
} from "./underHood";
import { toView } from "./layout";
import { NARROW } from "./layout";
import { SOURCES } from "./sources";

/** Whether p lies inside a chip's parallelogram. */
function onChip(c: ChipId, p: Pt): boolean {
  const { L, T, B } = CHIP[c],
    ax = T[0] - L[0],
    ay = T[1] - L[1],
    bx = B[0] - L[0],
    by = B[1] - L[1],
    det = ax * by - ay * bx;
  const u = ((p[0] - L[0]) * by - (p[1] - L[1]) * bx) / det,
    v = (ax * (p[1] - L[1]) - ay * (p[0] - L[0])) / det;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}
const every = (fn: (s: string, where: string) => void) => {
  for (const s of STOPS) for (const [k, v] of Object.entries(s)) if (typeof v === "string") fn(v, `${s.id}.${k}`);
  for (const [k, v] of Object.entries(TURN)) {
    if (typeof v === "string") fn(v, `turn.${k}`);
    else if (!Array.isArray(v)) for (const x of Object.values(v as Record<string, string>)) fn(x, `turn.${k}`);
  }
  fn(CAVEAT, "caveat");
  fn(DAY_DESCRIPTION, "day");
  fn(STRIP_WORDS, "strip");
  // Every reply the reader can get, in every turn they can reach.
  for (const t of reachable())
    for (const a of ALL) {
      const s = press(t, a).said;
      if (s) {
        fn(s.lead, `said.${a}`);
        fn(s.rest, `said.${a}`);
      }
    }
};
const ALL: Action[] = ["rsdp", "xsdt", "facp", "ssdt1", "facs", "dsdt", "sta", "off", "on", "part"];
/** Every turn the reader can reach, by pressing anything in any order (the state space is small). */
function reachable(): Turn[] {
  const seen = new Map<string, Turn>(),
    key = (t: Turn) => `${t.phase}|${[...t.got].sort().join(",")}|${t.on}`;
  const queue: Turn[] = [initialTurn()];
  const all = ALL;
  while (queue.length) {
    const t = queue.pop()!;
    if (seen.has(key(t))) continue;
    seen.set(key(t), t);
    for (const a of all) queue.push(press(t, a));
  }
  return [...seen.values()];
}

describe("chapter 6 stops", () => {
  it("has seven stops and the reader's turn", () => {
    expect(STOPS).toHaveLength(7);
    expect(STEP_COUNT).toBe(8);
    expect(STOPS.map((s) => s.rail)).toEqual([
      "Found",
      "Followed",
      "Branched",
      "Bytes",
      "Loaded",
      "Added",
      "Evaluated",
    ]);
  });

  it("cites only sources that exist, for every claim and rule", () => {
    for (const s of STOPS) {
      expect(s.citations.length).toBeGreaterThan(0);
      expect(s.ruleCitations.length).toBeGreaterThan(0);
      for (const c of [...s.citations, ...s.ruleCitations, ...(s.noteCitations ?? [])])
        expect(SOURCES[c], `${s.id}: ${c}`).toBeDefined();
    }
    for (const c of TURN.citations) expect(SOURCES[c]).toBeDefined();
  });

  it("keeps the wording the sources support", () => {
    every((s, where) => {
      // The spec says a translator and a byte stream; it never says byte code, and loading is not running.
      expect(s, where).not.toMatch(/byte ?code|compiled|compiler/i);
      // No chip vendor, and no vendor term.
      expect(s, where).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
      // The site names a section by its title, never by a bare number.
      expect(s, where).not.toMatch(/\b\d+\.\d+(\.\d+)*\b/);
      // The firmware writes; it never runs or evaluates a method.
      expect(s, where).not.toMatch(/firmware (runs|evaluates|executes)/i);
    });
    // The two claims the chapter exists to correct.
    expect(STOPS[1].rule).toContain("`FACP`");
    expect(STOPS[6].rest).toContain("The firmware wrote those bytes, and the OS's interpreter ran them.");
    // Stop 6 does not say that everything firmware describes is a name: table fields are not.
    expect(STOPS[5].rule).toContain("What the FADT and the FACS hold stays in those tables.");
    // What this figure chose is said to be its choice.
    expect(STOPS[5].note).toContain("this figure's own choice");
    expect(STOPS[6].note).toContain("this figure's own choice");
  });

  it("moves the camera in for the stops on the memory, and shows the whole machine for the rest", () => {
    expect(STOPS.map((s) => s.frame)).toEqual(["all", "mem", "mem", "bytes", "all", "all", "all"]);
  });
});

describe("chapter 6 figure", () => {
  it("draws every table on its own chip, and no two tables over each other", () => {
    for (const id of TABLE_IDS) for (const p of spanPoints(id)) expect(onChip(TABLE[id].chip, p), id).toBe(true);
    for (const a of TABLE_IDS)
      for (const b of TABLE_IDS) {
        if (a >= b || TABLE[a].chip !== TABLE[b].chip) continue;
        const A = TABLE[a],
          B = TABLE[b],
          rows = Math.abs(A.v - B.v) >= A.d + B.d,
          along = A.u1 <= B.u0 || B.u1 <= A.u0;
        expect(rows || along, `${a} x ${b}`).toBe(true);
      }
  });

  it("does not put the FADT in the XSDT's first entry (the spec fixes no slot for it)", () => {
    expect(XSDT_ENTRIES).toHaveLength(4);
    expect(XSDT_ENTRIES[0]).not.toBe("facp");
    expect(XSDT_ENTRIES).toContain("facp");
    // The DSDT and the FACS are reached from the FADT, not drawn as entries of the list.
    expect(XSDT_ENTRIES).not.toContain("dsdt");
    expect(XSDT_ENTRIES).not.toContain("facs");
    expect(TABLE.facp.sig).toBe("FACP");
    // The drawn threads follow that list: each entry's thread ends on its own table.
    (["s1", "s2", "s3", "s4"] as const).forEach((id, k) => {
      const T = TABLE[XSDT_ENTRIES[k]];
      expect(THREAD[id].b, id).toEqual(pt(T.chip, T.u0, T.v));
    });
    // The FADT's own two addresses: to the FACS and to the DSDT.
    expect(onChip(TABLE.facp.chip, THREAD.ff.a)).toBe(true);
    expect(THREAD.ff.b).toEqual(pt(TABLE.facs.chip, TABLE.facs.u0, TABLE.facs.v));
    expect(onChip(TABLE.facp.chip, THREAD.fd.a)).toBe(true);
    expect(onChip(TABLE.dsdt.chip, THREAD.fd.b)).toBe(true);
  });

  it("hangs _CST from _SB, not from the PCI host bridge, and FET0 from PCI0", () => {
    expect(THREAD.t4.a).toEqual(AT.sb);
    expect(THREAD.t4.b).toEqual(AT.cstDot);
    expect(THREAD.t3.a).toEqual(AT.pci);
    expect(THREAD.t3.b).toEqual(AT.fetDot);
    // The part FET0 lands on is the part the reader can press.
    expect(AT.fetDot[0]).toBeGreaterThan(SSD_BOX[0]);
    expect(AT.fetDot[0]).toBeLessThan(SSD_BOX[2]);
    expect(AT.fetDot[1]).toBeGreaterThan(SSD_BOX[1]);
    expect(AT.fetDot[1]).toBeLessThan(SSD_BOX[3]);
  });

  it("gives every thread a path inside the plate, apart from the address handed in from outside", () => {
    for (const id of THREAD_IDS) {
      expect(threadPath(id)).toMatch(/^M -?[\d.]+ -?[\d.]+ Q -?[\d.]+ -?[\d.]+ -?[\d.]+ -?[\d.]+$/);
      const { a, b } = THREAD[id];
      for (const p of id === "hand" ? [b] : [a, b]) {
        expect(p[0]).toBeGreaterThan(0);
        expect(p[0]).toBeLessThan(PLATE_W);
        expect(p[1]).toBeGreaterThan(0);
        expect(p[1]).toBeLessThan(PLATE.h);
      }
    }
    expect(THREAD.hand.a[0]).toBeLessThan(0);
  });

  it("prints at stop 4 only bytes the spec's grammar gives, and four characters for every name", () => {
    const known = new Set(["10", "5C", "14", "70", "FF", "··"]);
    for (const r of STRIP_ROWS)
      for (const b of r.bytes) {
        if (/^[0-9A-F]{2}$/.test(b.text) || b.text === "··") expect(known.has(b.text), b.text).toBe(true);
        else expect(b.text, r.asl).toMatch(/^[A-Z_][A-Z0-9_]{3}$/);
      }
    // The Method row ends at the name: the byte after it is the flags byte, not a length.
    expect(STRIP_ROWS[1].bytes.map((b) => b.text)).toEqual(["14", "··", "_ON_"]);
    expect(STRIP_ROWS.map((r) => r.asl)).toEqual(["Scope (\\_SB)", "Method (_ON)", "CT01 = Ones"]);
    expect(STRIP.y + 2 * STRIP.pitch).toBeLessThan(PLATE.h);
  });

  it("accumulates: what a stop lights stays lit at every later stop", () => {
    for (let i = 0; i < 6; i++) {
      const now = litAt(i),
        next = litAt(i + 1);
      for (const k of Object.keys(now)) if (k !== "strip") expect(next[k], `${k} after stop ${i + 1}`).toBeTruthy();
    }
    // Stop 1: one table and the address handed in. The bytes show at stop 4 only.
    expect(Object.keys(litAt(0)).sort()).toEqual(["edge-rsdp", "sig-rsdp", "span-rsdp", "thr-hand"]);
    expect(litAt(3).strip).toBe("on");
    expect(litAt(2).strip).toBeUndefined();
    expect(litAt(4).strip).toBeUndefined();
    // The table the OS does not know stays a ghost.
    for (let i = 1; i <= 6; i++) {
      expect(litAt(i)["span-unk"]).toBe("ghost");
      expect(litAt(i)["thr-s4"]).toBe("faint");
    }
    // The tree does not exist before the DSDT is loaded (stop 5), and nothing is evaluated before stop 7.
    for (let i = 0; i < 4; i++)
      for (const k of Object.keys(litAt(i))) expect(k.startsWith("name-"), `${k} at stop ${i + 1}`).toBe(false);
    for (let i = 0; i < 6; i++) {
      expect(litAt(i).powered).toBeUndefined();
      expect(litAt(i)["thr-io"]).toBeUndefined();
    }
    expect(litAt(6)["name-on"]).toBe("on hot");
    expect(litAt(6).powered).toBe("on");
  });

  it.each([
    [1366, 708],
    [1280, 660],
    [1100, 640],
    [1880, 840],
  ])("keeps every name and every table's letters apart from each other in the wide view at %i x %i", (vw, vh) => {
    // Text is 13 px: one line is 13 * 1.25 px tall and a character 7.8 px wide, whatever the plate's scale.
    const z = fit("all", vw, vh, false).s,
      line = (13 * 1.25) / z,
      ch = 7.8 / z;
    const boxes = [
      ...NAME_IDS.map((id) => ({
        id: `name-${id}`,
        x: nameAt(id, z)[0],
        y: nameAt(id, z)[1],
        w: NAME[id].text.length * ch,
      })),
      ...TABLE_IDS.map((id) => ({ id: `sig-${id}`, x: sigAt(id)[0], y: sigAt(id)[1], w: TABLE[id].sig.length * ch })),
    ];
    for (const a of boxes)
      for (const b of boxes) {
        if (a.id >= b.id) continue;
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x || Math.abs(a.y - b.y) >= line;
        expect(apart, `${a.id} x ${b.id}`).toBe(true);
      }
    // Dots sit where their threads end.
    expect(THREAD.t3.b).toEqual(DOT.fet);
    expect(THREAD.t4.b).toEqual(DOT.cst);
    expect(THREAD.t5.b).toEqual(DOT.pr3);
    expect(THREAD.io.b).toEqual(DOT.io);
  });
});

describe("chapter 6 camera", () => {
  const SIZES = [
    [1366, 708, false],
    [1280, 660, false],
    [1880, 840, false],
    [1580, 860, false],
    [1000, 420, true],
    [390, 388, true],
    [360, 256, true],
  ] as const;

  it("shows a frame's whole box in the room left of the words, at every size", () => {
    for (const [vw, vh, narrow] of SIZES)
      for (const id of ["mem", "bytes"] as FrameId[]) {
        const t = fit(id, vw, vh, narrow),
          F = FRAME[id]!;
        const [x0, y0] = toView(t, [F[0], F[1]]),
          [x1, y1] = toView(t, [F[0] + F[2], F[1] + F[3]]);
        expect(x0, `${vw} ${id}`).toBeGreaterThanOrEqual(0);
        expect(y0, `${vw} ${id}`).toBeGreaterThanOrEqual(narrow ? 0 : TOP);
        expect(x1, `${vw} ${id}`).toBeLessThanOrEqual(t.room + 1e-6);
        expect(y1, `${vw} ${id}`).toBeLessThanOrEqual(vh + 1e-6);
        // Never enlarged past the photograph's own pixels by more than a tenth.
        expect(t.s).toBeLessThanOrEqual(1.1 + 1e-9);
      }
  });

  it("moves in: the memory is larger in its frame than in the whole machine", () => {
    for (const [vw, vh, narrow] of SIZES) {
      const all = fit("all", vw, vh, narrow).s;
      expect(fit("mem", vw, vh, narrow).s, `${vw}`).toBeGreaterThan(all * 1.3);
      expect(fit("bytes", vw, vh, narrow).s, `${vw}`).toBeGreaterThan(all);
    }
  });

  it("keeps the words in one place whatever the framing, and the whole machine under the rail", () => {
    for (const [vw, vh, narrow] of SIZES) {
      const a = fit("all", vw, vh, narrow),
        m = fit("mem", vw, vh, narrow);
      expect(m.wordsLeft).toBe(a.wordsLeft);
      expect(m.wordsWidth).toBe(a.wordsWidth);
      if (!narrow) {
        expect(a.ty).toBeGreaterThanOrEqual(TOP);
        expect(a.wordsLeft + a.wordsWidth).toBeLessThanOrEqual(vw + 1e-6);
      }
    }
  });

  it("frames the memory, with all four chips and every table inside the frame", () => {
    const [fx, fy, fw, fh] = FRAME.mem!;
    for (const c of Object.values(CHIP))
      for (const p of [c.L, c.T, c.B]) {
        expect(p[0]).toBeGreaterThan(fx);
        expect(p[0]).toBeLessThan(fx + fw);
        expect(p[1]).toBeGreaterThan(fy);
        expect(p[1]).toBeLessThan(fy + fh);
      }
    const [bx, by, bw, bh] = FRAME.bytes!;
    // The bytes' frame holds the three rows as well as the DSDT they came from.
    expect(STRIP.x).toBeGreaterThan(bx);
    expect(STRIP.y + 2 * STRIP.pitch).toBeLessThan(by + bh);
    for (const p of spanPoints("dsdt")) {
      expect(p[0]).toBeGreaterThan(bx);
      expect(p[0]).toBeLessThan(bx + bw);
      expect(p[1]).toBeGreaterThan(by);
    }
    expect(NARROW).toBe(1060);
  });

  it("keeps the memory's framing for the bytes on narrow screens, and room at the figure's foot for the turn's buttons", () => {
    expect(frameFor("bytes", true)).toBe("mem");
    expect(frameFor("bytes", false)).toBe("bytes");
    expect(frameFor("mem", true)).toBe("mem");
    expect(frameFor("all", true)).toBe("all");
    const F = FRAME.mem!;
    for (const [vw, vh] of [
      [390, 388],
      [360, 256],
    ] as const) {
      const t = fit("mem", vw, vh, true, TURN_FOOT);
      expect(toView(t, [F[0], F[1]])[1], `${vw}`).toBeGreaterThanOrEqual(0);
      expect(toView(t, [F[0], F[1] + F[3]])[1], `${vw}`).toBeLessThanOrEqual(vh - TURN_FOOT + 1e-6);
    }
  });
});

describe("chapter 6, your turn: you are the OS", () => {
  const go = (...as: Action[]) => as.reduce(press, initialTurn());

  it("starts in the dark, moved in on the memory, with the six tables as buttons", () => {
    const v = turnView(initialTurn());
    expect(v.frame).toBe("mem");
    expect(v.lit).toEqual({});
    expect(v.buttons.map((b) => b.id)).toEqual(FIND_IDS);
    expect(v.buttons.map((b) => b.text)).toEqual(["RSD PTR", "XSDT", "FACP", "SSDT", "FACS", "DSDT"]);
    expect(v.part).toBe(false);
  });

  it("answers only for a table that something already read points to", () => {
    // Only the RSDP answers at first: its address is handed over.
    for (const id of FIND_IDS) {
      const t = press(initialTurn(), id);
      expect(t.got, id).toEqual(id === "rsdp" ? ["rsdp"] : []);
      if (id !== "rsdp") expect(t.said?.lead).toBe("Still dark.");
    }
    // The DSDT and the FACS are reached through the FADT, never straight from the list.
    expect(go("rsdp", "xsdt", "dsdt").got).toEqual(["rsdp", "xsdt"]);
    expect(go("rsdp", "xsdt", "facs").got).toEqual(["rsdp", "xsdt"]);
    expect(go("rsdp", "xsdt", "facp", "facs").got).toEqual(["rsdp", "xsdt", "facp", "facs"]);
    expect(NEEDS.ssdt1).toBe("xsdt");
    expect(NEEDS.dsdt).toBe("facp");
    expect(NEEDS.facs).toBe("facp");
    expect(NEEDS.facp).toBe("xsdt");
    expect(NEEDS.xsdt).toBe("rsdp");
    expect(NEEDS.rsdp).toBeNull();
    // Pressing a table twice changes nothing but the reply.
    expect(go("rsdp", "rsdp").got).toEqual(["rsdp"]);
    expect(go("rsdp", "rsdp").said?.lead).toBe("Already read.");
  });

  it("loads the DSDT only by the chain, and then the tree exists and the camera pulls back", () => {
    const t = go("rsdp", "xsdt", "facp", "dsdt"),
      v = turnView(t);
    expect(t.phase).toBe("run");
    expect(t.on).toBe(false);
    expect(v.frame).toBe("all");
    expect(v.lit["name-fet"]).toBe("on");
    expect(v.lit["name-root"]).toBe("on");
    expect(v.lit.powered).toBeUndefined();
    expect(v.buttons.map((b) => b.text)).toEqual(["_STA", "_OFF", "_ON"]);
    expect(v.part).toBe(true);
  });

  it("powers the part only when the OS evaluates _ON; pressing the part does nothing", () => {
    const run = go("rsdp", "xsdt", "facp", "dsdt");
    expect(press(run, "part").on).toBe(false);
    expect(press(run, "part").said?.lead).toBe("Nothing happened.");
    expect(press(run, "sta").said?.rest).toContain("clear");
    const on = press(run, "on");
    expect(on.on).toBe(true);
    expect(turnView(on).lit.powered).toBe("on");
    expect(press(on, "sta").said?.rest).toContain("set");
    expect(press(on, "sta").on).toBe(true);
    expect(press(on, "part").on).toBe(true);
    expect(press(on, "off").on).toBe(false);
    expect(turnView(press(on, "off")).lit.powered).toBeUndefined();
    // A table pressed while running, or a method while finding, changes nothing.
    expect(press(run, "rsdp")).toBe(run);
    expect(press(initialTurn(), "on")).toEqual(initialTurn());
  });

  it("holds in every turn the reader can reach", () => {
    const all = reachable();
    expect(all.length).toBeGreaterThanOrEqual(16);
    for (const t of all) {
      // Nothing is read whose way in has not been read.
      for (const g of t.got) {
        const need = NEEDS[g as FindId];
        if (need) expect(t.got, g).toContain(need);
      }
      // The tree exists exactly when the DSDT has been loaded, and power only then.
      expect(t.phase === "run").toBe(t.got.includes("dsdt"));
      if (t.on) expect(t.phase).toBe("run");
      const v = turnView(t);
      expect(!!v.lit["name-fet"]).toBe(t.phase === "run");
      expect(!!v.lit.powered).toBe(t.on);
      // A table is lit exactly when it has been read.
      for (const id of FIND_IDS) expect(!!v.lit[`span-${id}`], id).toBe(t.got.includes(id));
      // A new reply object on every press, so the same reply is spoken again.
      for (const a of ALL) {
        const n = press(t, a);
        if (n !== t) expect(n.said).not.toBe(t.said);
        // Power changes only when the OS evaluates _ON or _OFF, and only once the tree exists.
        expect(n.on, a).toBe(a === "on" ? t.phase === "run" : a === "off" ? false : t.on);
      }
    }
  });

  it("puts each table's button on its own chip, and no two buttons of one phase on the same spot", () => {
    const v = turnView(initialTurn());
    for (const b of v.buttons) expect(onChip(TABLE[b.id as FindId].chip, b.at), b.id).toBe(true);
    const run = turnView(go("rsdp", "xsdt", "facp", "dsdt"));
    for (const view of [v, run])
      for (const a of view.buttons)
        for (const b of view.buttons)
          if (a.id < b.id)
            expect(Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]), `${a.id} x ${b.id}`).toBeGreaterThan(70);
    expect(pt("m1", 0, 0)).toEqual(CHIP.m1.L);
  });
});
