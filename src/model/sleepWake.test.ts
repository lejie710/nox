// Chapter 5's model: each stop's full state of the machine, the picture's geometry, the rules of the
// reader's turn, and the wording.
import { describe, expect, it } from "vitest";
import { SLEEP_WAKE_SOURCES } from "../chapters/SleepWake";
import {
  BIT_ORDER,
  BITS,
  LAYER_BOX,
  MARK_IDS,
  PARTS,
  PLATE,
  SLEEP_STEPS,
  STEP_COUNT,
  TURN,
  WORDS_X,
  bitSet,
  clockAt,
  fire,
  fit,
  initialTurn,
  labelSpot,
  moonMix,
  nextBeat,
  pick,
  plain,
  restSub,
  sleepNow,
  stepView,
  timeOf,
  timeRange,
  toggleArm,
  turnView,
  userWake,
  type ArmId,
  type PartId,
  type Scene,
  type Turn,
  type WakerId,
} from "./sleepWake";
import { toView } from "./layout";
import { SOURCES } from "./sources";

const byId = (id: string) => SLEEP_STEPS.find((s) => s.id === id)!;
/** Every picture the main line can show, in order: each stop, and the second half of a stop that has one. */
const scenes = SLEEP_STEPS.flatMap((s) =>
  s.after
    ? [
        { id: s.id, scene: s.scene },
        { id: `${s.id}, after`, scene: s.after.scene },
      ]
    : [{ id: s.id, scene: s.scene }],
);
const wake = (t: Turn) => nextBeat(nextBeat(nextBeat(t)));

const ARMS: ArmId[] = ["usb", "net", "rtc"],
  WAKERS: WakerId[] = ["pwr", "usb", "net", "rtc"];
/** Every Your turn state the reader can reach, by the model's own actions. */
function reachable(): Turn[] {
  const acts = [
    ...ARMS.map((k) => (t: Turn) => toggleArm(t, k)),
    sleepNow,
    ...WAKERS.map((k) => (t: Turn) => fire(t, k)),
    nextBeat,
    ...WAKERS.map((k) => (t: Turn) => pick(t, k)),
  ];
  const seen = new Map<string, Turn>([[JSON.stringify(initialTurn()), initialTurn()]]);
  for (let frontier = [...seen.values()]; frontier.length;) {
    const next: Turn[] = [];
    for (const t of frontier)
      for (const act of acts) {
        const u = act(t),
          key = JSON.stringify(u);
        if (!seen.has(key)) {
          seen.set(key, u);
          next.push(u);
        }
      }
    frontier = next;
  }
  return [...seen.values()];
}
/** What must hold in every picture the chapter can draw. */
function sceneInvariants(s: Scene, where: string) {
  // The display needs the OS; the ring is lit whenever the case is; amber is firmware alone, before the display.
  if (s.mon) expect(s.glow, where).toBe("white");
  if (s.glow) expect(s.ring, where).toBe(true);
  if (s.glow === "amber") expect(s.mon, where).toBe(false);
  // A latched status sits on core logic, never on a device; the hand-off is the only cut.
  for (const id of MARK_IDS) if (id !== "core") expect(s.marks[id], `${where}: ${id}`).not.toBe("latch");
  if (s.cut) expect(s.glow, where).toBeNull();
}

describe("chapter 5 stops", () => {
  it("has eight stops and the reader's turn", () => {
    expect(SLEEP_STEPS.map((s) => s.id)).toEqual([
      "sleep",
      "arm",
      "devices",
      "slpEn",
      "asleep",
      "button",
      "firmware",
      "osBack",
    ]);
    expect(STEP_COUNT).toBe(9);
  });

  it("cites only sources that exist, for every claim, rule and note", () => {
    for (const s of SLEEP_STEPS) {
      expect(s.citations.length, s.id).toBeGreaterThan(0);
      expect(s.ruleCitations.length, s.id).toBeGreaterThan(0);
      for (const c of [...s.citations, ...s.ruleCitations, ...(s.noteCitations ?? [])])
        expect(SOURCES[c], `${s.id}: ${c}`).toBeDefined();
    }
    for (const c of [...TURN.citations, ...TURN.ruleCitations, ...TURN.autoCitations])
      expect(SOURCES[c], c).toBeDefined();
  });

  const text = (id: string) => {
    const s = byId(id);
    return `${s.lead} ${s.rest} ${s.rule}`;
  };

  it("keeps the eleven facts of the S3 round trip in order across the eight stops", () => {
    expect(text("sleep")).toContain("_TTS(3)");
    expect(text("arm")).toMatch(/_PRW[\s\S]*_DSW/);
    expect(text("devices")).toContain("_PTS(3)");
    expect(text("slpEn")).toMatch(/waking vector[\s\S]*enables the wake events[\s\S]*SLP_TYPa[\s\S]*SLP_EN/);
    expect(text("button")).toMatch(/PWRBTN_STS[\s\S]*WAK_STS/);
    expect(text("firmware")).toMatch(/reset vector[\s\S]*SCI_EN[\s\S]*waking vector/);
    expect(text("osBack")).toMatch(/_WAK\(3\)[\s\S]*not first[\s\S]*_TTS\(0\)/);
  });

  it("names who acts on a register: hardware latches, firmware leaves the bits alone, the OS reads and clears", () => {
    expect(byId("button").lead).toMatch(/Hardware latches/);
    expect(byId("button").rule).toMatch(/The OS finds the latched bit/);
    expect(byId("firmware").rest).toMatch(/^Firmware restores/);
    expect(byId("osBack").rest).toMatch(/^The OS reads and clears/);
    expect(text("asleep")).toMatch(/No instruction runs/);
  });

  it("gives the fixed power button an enable bit that waking does not depend on (binding fact)", () => {
    expect(byId("arm").rule).toContain("whatever its enable bit says");
    expect(byId("arm").rule).not.toMatch(/no enable/);
    expect(byId("arm").labels.find((l) => l.part === "pwr")!.state).toBe("fixed: no arming needed");
  });

  it("says the system state of every stop in the step line, agreeing with the picture", () => {
    expect(SLEEP_STEPS.map((s) => s.sys)).toEqual([
      "S0, working",
      "S0, working",
      "S0, working",
      "S0, working",
      "S3, sleeping",
      "waking",
      "waking",
      "S0, working",
    ]);
    for (const s of SLEEP_STEPS) if (s.sys === "S0, working") expect(s.scene.glow, s.id).toBe("white");
    expect(byId("asleep").scene.glow).toBeNull();
  });

  it("gives the two stops that change by scroll more room than the others", () => {
    const usual = SLEEP_STEPS.filter((s) => !s.after && s.scene.moon !== "scrub").map((s) => s.h);
    expect(new Set(usual).size).toBe(1);
    expect(byId("slpEn").h).toBeGreaterThan(usual[0]);
    expect(byId("asleep").h).toBeGreaterThan(byId("slpEn").h);
  });

  it("rests, where nothing scrolls, on the dark half of SLP_EN and on 03:12 at Asleep", () => {
    const slp = byId("slpEn"),
      asleep = byId("asleep");
    expect(stepView(slp, restSub(slp))).toMatchObject({
      after: true,
      note: "The write has landed: the machine's light is out.",
    });
    expect(timeOf(asleep, restSub(asleep))).toBe("03:12");
    expect(timeRange(asleep)).toBe("23:14 to 03:12");
    expect(timeOf(byId("button"), 0.3)).toBe("03:12");
  });

  it("never gives two labels of one view the same part or the same drawn spot, wide or narrow", () => {
    const armAll = toggleArm(toggleArm(initialTurn(), "net"), "rtc");
    const sets = [
      ...SLEEP_STEPS.flatMap((s) => [
        { id: s.id, labels: s.labels as { part: PartId; act?: unknown }[] },
        ...(s.after ? [{ id: `${s.id}, after`, labels: s.after.labels as { part: PartId; act?: unknown }[] }] : []),
      ]),
      { id: "turn, arm", labels: turnView(armAll).labels },
      { id: "turn, asleep", labels: turnView(sleepNow(armAll)).labels },
    ];
    for (const { id, labels } of sets) {
      expect(new Set(labels.map((l) => l.part)).size, id).toBe(labels.length);
      for (const [vw, vh, narrow] of [
        [1366, 708, false],
        [1280, 660, false],
        [1100, 660, false],
        [390, 354, true],
        [360, 256, true],
      ] as const) {
        const f = fit(vw, vh, narrow);
        // On narrow screens the buttons share one group; only plain labels are placed.
        const spots = labels
          .filter((l) => !(narrow && l.act))
          .map((l) => {
            const at = labelSpot(l.part, f, narrow);
            return `${Math.round(at.x)},${Math.round(at.y)}`;
          });
        expect(new Set(spots).size, `${id} at ${vw}x${vh}`).toBe(spots.length);
      }
    }
  });

  it("shows the machine's light in three states only: white for the OS, amber for firmware, none when no code runs", () => {
    const glow = (id: string) => scenes.find((x) => x.id === id)!.scene.glow;
    for (const id of ["sleep", "arm", "devices", "slpEn", "osBack"]) expect(glow(id), id).toBe("white");
    for (const id of ["slpEn, after", "asleep", "button"]) expect(glow(id), id).toBeNull();
    expect(scenes.filter((x) => x.scene.glow === "amber").map((x) => x.id)).toEqual(["firmware"]);
  });

  it("lights the power button's ring alone when hardware has power and no code runs", () => {
    expect(byId("button").scene).toMatchObject({ glow: null, ring: true });
    expect(byId("asleep").scene.ring).toBe(false);
    for (const x of scenes) if (x.scene.glow) expect(x.scene.ring, x.id).toBe(true);
  });

  it("turns the display off when devices go down, while the OS still runs, and back only when the OS returns", () => {
    expect(scenes.map((x) => x.scene.mon)).toEqual([true, true, false, false, false, false, false, false, true]);
    expect(byId("devices").scene).toMatchObject({ mon: false, glow: "white" });
  });

  it("arms the wakers before devices go down, enables their events last, and keeps them lit through S3 and after", () => {
    expect(byId("sleep").scene.marks).toEqual({});
    expect(byId("arm").scene.marks).toEqual({ usb: "dim", net: "dim" });
    expect(byId("devices").scene.marks).toEqual({ usb: "dim", net: "dim" });
    expect(byId("slpEn").scene.marks).toMatchObject({ usb: "on", net: "on", core: "on", mem: "on" });
    for (const id of ["slpEn, after", "asleep", "button", "firmware", "osBack"])
      expect(scenes.find((x) => x.id === id)!.scene.marks, id).toMatchObject({ usb: "ember", net: "ember" });
    // In S3 nothing else is lit: only what the OS left set.
    expect(scenes.find((x) => x.id === "slpEn, after")!.scene.marks).toEqual({
      usb: "ember",
      net: "ember",
      mem: "ember",
    });
    expect(byId("asleep").scene.marks).toEqual({ usb: "ember", net: "ember", mem: "ember" });
    // The RTC is never armed in the main line: it has only RTC_EN, and this night uses the button.
    for (const x of scenes) expect(x.scene.marks.rtc, x.id).toBeUndefined();
  });

  it("latches the status on core logic only once the button is pressed, and firmware leaves it", () => {
    for (const id of ["sleep", "arm", "devices", "slpEn, after", "asleep"])
      expect(scenes.find((x) => x.id === id)!.scene.marks.core, id).not.toBe("latch");
    expect(byId("button").scene.marks.core).toBe("latch");
    expect(byId("firmware").scene.marks.core).toBe("latch");
    // The OS clears PWRBTN_STS when it is back.
    expect(byId("osBack").scene.marks.core).toBeUndefined();
  });

  it("holds the waking vector in memory through S3 and lights it when firmware jumps to it", () => {
    expect(scenes.find((x) => x.id === "slpEn, after")!.scene.marks.mem).toBe("ember");
    expect(byId("asleep").scene.marks.mem).toBe("ember");
    expect(byId("firmware").scene.marks.mem).toBe("on");
  });

  it("cuts every light at the hand-off, in the second half of the SLP_EN stop", () => {
    const s = byId("slpEn");
    expect(stepView(s, 0.3)).toMatchObject({ after: false, sys: "S0, working" });
    expect(stepView(s, 0.7)).toMatchObject({ after: true, sys: "entering S3" });
    expect(s.after!.scene).toMatchObject({ cut: true, glow: null, ring: false });
    expect(SLEEP_STEPS.filter((x) => x.after).map((x) => x.id)).toEqual(["slpEn"]);
    // Where nothing scrolls, the stop rests on what it ends in.
    expect(stepView(s, restSub(s)).after).toBe(true);
    expect(restSub(byId("asleep"))).toBe(1);
  });

  it("lets moonlight follow the clock, not the machine", () => {
    const moons = scenes.map((x) => x.scene.moon);
    expect(moons).toEqual([null, null, null, null, null, "scrub", "late", "late", "late"]);
    const asleep = byId("asleep").scene;
    expect(moonMix(asleep, 0)).toEqual({ early: 0, late: 0 });
    expect(moonMix(asleep, 0.2).early).toBe(1);
    expect(moonMix(asleep, 1)).toEqual({ early: 0, late: 1 });
    // Under the machine's own light the moonlight is weaker, never gone.
    expect(moonMix(byId("firmware").scene, 0.3).late).toBeGreaterThan(0);
    expect(moonMix(byId("button").scene, 0.3).late).toBe(1);
  });

  it("runs the clock from 23:14 to 03:12 across the Asleep stop, and prints no seconds", () => {
    expect(clockAt(0)).toBe("23:14");
    expect(clockAt(1)).toBe("03:12");
    expect(clockAt(0.5)).toMatch(/^0[01]:\d\d$/);
    for (const s of SLEEP_STEPS) expect(s.time, s.id).toMatch(/^(night|\d\d:\d\d)$/);
  });

  it("says AML in a label's words on the Arming stop, under the OS's white light: it has no colour of its own", () => {
    expect(byId("arm").labels.find((l) => l.part === "net")!.state).toContain("AML");
    expect(byId("arm").scene.glow).toBe("white");
  });

  it("lists in the page's sources every citation the stops and the reader's turn can show, also after acting", () => {
    expect(new Set(SLEEP_WAKE_SOURCES).size).toBe(SLEEP_WAKE_SOURCES.length);
    for (const id of SLEEP_WAKE_SOURCES) expect(SOURCES[id], id).toBeDefined();
    const shown = [
      ...SLEEP_STEPS.flatMap((s) => [...s.citations, ...s.ruleCitations, ...(s.noteCitations ?? [])]),
      ...TURN.citations,
      ...TURN.ruleCitations,
      ...TURN.autoCitations,
      ...reachable().flatMap((x) => turnView(x).leadCitations),
    ];
    for (const c of shown) expect(SLEEP_WAKE_SOURCES, c).toContain(c);
  });

  it("labels only parts the model knows, at most four a stop", () => {
    for (const s of SLEEP_STEPS)
      for (const set of [s.labels, s.after?.labels ?? []]) {
        expect(set.length, s.id).toBeLessThanOrEqual(4);
        for (const l of set) expect(PARTS[l.part], `${s.id}: ${l.part}`).toBeDefined();
      }
  });
});

describe("chapter 5 picture geometry", () => {
  it("keeps every part, mark and light layer inside the plate", () => {
    for (const [id, p] of Object.entries(PARTS)) {
      expect(p.at[0], id).toBeGreaterThan(0);
      expect(p.at[0], id).toBeLessThan(PLATE.w);
      expect(p.at[1], id).toBeGreaterThan(0);
      expect(p.at[1], id).toBeLessThan(PLATE.h);
    }
    for (const id of MARK_IDS) expect(PARTS[id]).toBeDefined();
    for (const [x, y, w, h] of Object.values(LAYER_BOX)) {
      expect(x + w).toBeLessThanOrEqual(PLATE.w);
      expect(y + h).toBeLessThanOrEqual(PLATE.h);
    }
  });

  it("fits the whole plate's height on wide screens and never lets the picture pass under the words", () => {
    for (const [vw, vh] of [
      [1366, 708],
      [1280, 660],
      [1280, 740],
      [1880, 840],
      [1100, 900],
    ] as const) {
      const f = fit(vw, vh, false);
      expect(PLATE.h * f.s, `${vw}x${vh}`).toBeLessThanOrEqual(vh + 1e-6);
      // The picture and the words are one centred group, and the picture is as large as the tighter limit allows:
      // the view's height, or the room left of the words (48 px clear).
      expect(f.tx, `${vw}x${vh}`).toBeCloseTo(vw - (f.wordsLeft + f.wordsWidth), 6);
      expect(Math.min(vh - PLATE.h * f.s, vw - 48 - f.wordsWidth - WORDS_X * f.s), `${vw}x${vh}`).toBeCloseTo(0, 6);
      expect(f.wordsLeft + f.wordsWidth, `${vw}x${vh}`).toBeLessThanOrEqual(vw + 1e-6);
      // Every wide label starts left of the words, and one in the room wraps before them.
      for (const part of Object.keys(PARTS) as PartId[]) {
        const at = labelSpot(part, f, false);
        expect(at.x, `${part} ${vw}x${vh}`).toBeLessThan(f.wordsLeft);
        if (at.maxWidth !== undefined) expect(at.x + at.maxWidth).toBeLessThanOrEqual(f.wordsLeft);
      }
    }
  });

  it("frames the case and the monitor on narrow screens, with a minimum pitch between labels on the shroud", () => {
    // The last size is width-limited (a tall phone), the others height-limited: both branches of the camera run.
    for (const [vw, vh] of [
      [390, 388],
      [360, 256],
      [768, 470],
      [360, 391],
    ] as const) {
      const f = fit(vw, vh, true);
      const [caseLeft] = toView(f, [180, 0]),
        [monRight] = toView(f, [1500, 0]);
      expect(caseLeft, `${vw}x${vh}`).toBeGreaterThanOrEqual(0);
      expect(monRight, `${vw}x${vh}`).toBeLessThanOrEqual(vw);
      expect(PLATE.h * f.s, `${vw}x${vh}`).toBeLessThanOrEqual(vh + 1e-6);
      // Every plain label starts on screen and wraps inside it.
      for (const part of Object.keys(PARTS) as PartId[]) {
        const at = labelSpot(part, f, true);
        expect(at.maxWidth, `${part} ${vw}x${vh}`).toBeGreaterThanOrEqual(80);
        if (!at.right) expect(at.x + at.maxWidth!, `${part} ${vw}x${vh}`).toBeLessThanOrEqual(vw);
      }
      const usb = labelSpot("usb", f, true),
        core = labelSpot("core", f, true),
        net = labelSpot("net", f, true);
      expect(core.x - usb.x, `${vw}`).toBeGreaterThanOrEqual(120 - 1e-6);
      // 46 px between the two rows at every size, and the second row stays in the figure.
      expect(net.y - usb.y, `${vw}`).toBeGreaterThanOrEqual(46 - 1e-6);
      expect(net.y, `${vw}`).toBeLessThanOrEqual(vh - 32 + 1e-6);
    }
  });
});

describe("chapter 5, your turn", () => {
  it("opens with the keyboard armed and nothing asleep", () => {
    const t = initialTurn();
    expect(t).toMatchObject({ phase: "arm", armed: { usb: true, net: false, rtc: false }, decoy: false });
    const v = turnView(t);
    expect(v.labels.filter((l) => l.act).map((l) => l.part)).toEqual(["usb", "net", "rtc", "mon"]);
    // The power button cannot be disarmed: it is a label, not a control.
    expect(v.labels.find((l) => l.part === "pwr")!.act).toBeUndefined();
    // The RTC has nothing to arm, so it gets no point of light until RTC_EN is set at Sleep.
    expect(turnView(toggleArm(t, "rtc")).scene.marks.rtc).toBeUndefined();
    expect(turnView(sleepNow(toggleArm(t, "rtc"))).scene.marks.rtc).toBe("ember");
  });

  it("wakes on the fixed power button whatever was armed", () => {
    let t = sleepNow(toggleArm(initialTurn(), "usb"));
    expect(t.armed).toEqual({ usb: false, net: false, rtc: false });
    t = fire(t, "pwr");
    expect(t).toMatchObject({ phase: "waking", waker: "pwr", beat: 0 });
  });

  it("does not wake on a device that was not armed, and says why", () => {
    const t = fire(sleepNow(initialTurn()), "net");
    expect(t.phase).toBe("asleep");
    expect(t.verdict!.rest).toMatch(/not armed/);
    expect(t.verdict!.rest).not.toMatch(/no power/);
  });

  it("latches RTC_STS without waking when RTC_EN is clear (the decoy), and tells it apart later", () => {
    let t = fire(sleepNow(initialTurn()), "rtc");
    expect(t).toMatchObject({ phase: "asleep", decoy: true });
    expect(turnView(t).scene).toMatchObject({ glow: null, mon: false });
    t = wake(fire(t, "pwr"));
    expect(t.phase).toBe("find");
    expect(BIT_ORDER.filter((k) => bitSet(t, k))).toEqual(["pwr", "rtc"]);
    const wrong = pick(t, "rtc");
    expect(wrong.phase).toBe("find");
    expect(wrong.verdict!.rest).toMatch(/RTC_EN.*off.*alarm could not wake/);
    expect(pick(t, "net").verdict!.lead).toBe("GPE: network is clear.");
    expect(pick(wrong, "pwr")).toMatchObject({ phase: "done" });
  });

  it("repeats stops 6, 7 and 8 in its three waking beats: the ring alone, amber, then white", () => {
    let t = fire(sleepNow(toggleArm(initialTurn(), "net")), "net");
    const beats = [0, 1, 2].map(() => {
      const v = turnView(t);
      t = nextBeat(t);
      return v;
    });
    expect(beats.map((v) => v.scene.glow)).toEqual([null, "amber", "white"]);
    expect(beats.map((v) => v.sys)).toEqual(["waking", "waking", "S0, working"]);
    expect(beats.map((v) => v.scene.marks.mem)).toEqual(["ember", "on", undefined]);
    // The status latches in core logic, whoever raised the event; the device only flashes.
    for (const v of beats) expect(v.scene.marks.core).toBe("latch");
    // The same light as stops 6, 7 and 8: the ring alone, then amber, then white.
    expect(beats.map((v) => [v.scene.glow, v.scene.ring])).toEqual(
      ["button", "firmware", "osBack"].map((id) => [byId(id).scene.glow, byId(id).scene.ring]),
    );
    // A network wake is automatic: the display stays off through all three. The device only flashes.
    expect(beats.map((v) => v.scene.mon)).toEqual([false, false, false]);
    expect(beats.map((v) => v.scene.marks.net)).toEqual(["on", "ember", "ember"]);
    expect(beats.map((v) => v.beats.length)).toEqual([1, 2, 3]);
    expect(t.phase).toBe("find");
  });

  it("brings the display back for a person and leaves it dark for an automatic wake, scoped to Windows", () => {
    const person = wake(fire(sleepNow(initialTurn()), "usb"));
    expect(userWake(person)).toBe(true);
    expect(turnView(person).scene.mon).toBe(true);
    const auto = wake(fire(sleepNow(toggleArm(initialTurn(), "rtc")), "rtc"));
    expect(userWake(auto)).toBe(false);
    const v = turnView(auto);
    expect(v.scene.mon).toBe(false);
    expect(v.lead).toMatch(/on Windows an automatic wake leaves the display off/);
    expect(v.leadCitations).toEqual(["msWakeEvents"]);
    expect(pick(auto, "rtc")).toMatchObject({ phase: "done" });
  });

  it("keeps the armed points lit once the machine is awake, and ignores actions out of turn", () => {
    const t = wake(fire(sleepNow(toggleArm(initialTurn(), "net")), "pwr"));
    expect(turnView(t).scene.marks).toMatchObject({ usb: "ember", net: "ember", core: "latch" });
    expect(toggleArm(t, "usb")).toBe(t);
    expect(fire(t, "pwr")).toBe(t);
    expect(pick(initialTurn(), "pwr").phase).toBe("arm");
  });

  it("draws, in every state the reader can reach, only pictures the main line could draw", () => {
    const all = reachable();
    expect(all.length).toBeGreaterThan(100);
    for (const s of scenes) sceneInvariants(s.scene, s.id);
    for (const t of all) {
      const v = turnView(t),
        where = JSON.stringify(t);
      sceneInvariants(v.scene, where);
      // Asleep: no code, no display, no ring; only what was armed is still lit.
      if (t.phase === "asleep") {
        expect(v.scene, where).toMatchObject({ glow: null, mon: false, ring: false });
        for (const k of ARMS) expect(v.scene.marks[k], `${where}: ${k}`).toBe(t.armed[k] ? "ember" : undefined);
        // RTC_STS latched without waking shows on core logic, and only then.
        expect(v.scene.marks.core, where).toBe(t.decoy ? "dim" : undefined);
      }
      // Awake again: the display is on only for a person's wake; an unarmed device never woke it.
      if (t.phase === "find" || t.phase === "done") {
        expect(v.scene.mon, where).toBe(userWake(t));
        expect(t.waker === "pwr" || t.armed[t.waker as ArmId], where).toBe(true);
        expect(
          v.bits.map((b) => b.id),
          where,
        ).toEqual(BIT_ORDER);
        expect(
          v.bits.filter((b) => b.set).map((b) => b.id),
          where,
        ).toContain(t.waker);
      }
      // A person's wake never carries the Windows note; an automatic one always does, with its source.
      if (t.phase === "find") expect(v.leadCitations, where).toEqual(userWake(t) ? [] : ["msWakeEvents"]);
    }
  });

  it("answers the right pick with the bit's name, and closes with the status and enable rule", () => {
    const button = pick(wake(fire(sleepNow(toggleArm(initialTurn(), "usb")), "pwr")), "pwr");
    expect(button.verdict).toEqual({
      lead: "Yes: PWRBTN_STS.",
      rest: expect.stringContaining("whatever its enable bit says"),
    });
    const card = pick(wake(fire(sleepNow(toggleArm(initialTurn(), "net")), "net")), "net");
    expect(card.verdict).toEqual({ lead: `Yes: ${BITS.net}.`, rest: expect.stringContaining("its enable was set") });
    for (const clause of ["an enable bit the OS sets", "by writing 1 to it", "`WAK_STS` has no enable"])
      expect(TURN.rule).toContain(clause);
  });
});

describe("chapter 5 wording", () => {
  const lab = (ls: { name: string; state: string }[]) => ls.flatMap((l) => [l.name, l.state]);
  const turns = reachable().flatMap((t) => {
    const v = turnView(t);
    return [
      v.lead,
      v.rest,
      v.note,
      v.time,
      ...v.beats,
      ...lab(v.labels),
      ...v.bits.map((b) => b.name),
      t.verdict?.lead ?? "",
      t.verdict?.rest ?? "",
    ];
  });
  const all = plain(
    [
      ...SLEEP_STEPS.flatMap((s) => [
        s.rail,
        s.title,
        s.lead,
        s.rest,
        s.rule,
        s.note ?? "",
        ...lab(s.labels),
        s.after?.note ?? "",
        ...lab(s.after?.labels ?? []),
      ]),
      TURN.rail,
      TURN.title,
      TURN.rule,
      ...TURN.beats,
      ...turns,
    ].join(" \n "),
  );

  it("names no chip vendor and does not use the vendor term S0ix, also in what shows only after the reader acts", () => {
    expect(all).not.toMatch(/\b(AMD|Intel|Qualcomm|Apple|Arm)\b/);
    expect(all).not.toMatch(/S0ix/i);
  });

  it("gives no measured duration for the hand-off: times are clock times, to the minute (binding fact)", () => {
    expect(all).not.toMatch(/\b\d+(\.\d+)?\s?(ms|milliseconds?|seconds?|µs)\b/i);
    expect(all).not.toMatch(/\b\d\d:\d\d:\d\d/);
  });

  it("never says amber for anything but platform firmware, and never calls AML a colour", () => {
    for (const s of all.split(" \n ")) if (/amber/i.test(s)) expect(s).toMatch(/firmware/i);
  });
});
