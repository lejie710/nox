// The six chapters and what the topic map
// says about each. Every sentence that states a fact carries the sources in
// `citations`; the picture above the tabs is the chapter's own picture.

export type ChapterId =
  "big-picture" | "modern-standby" | "device-power" | "cpu-power" | "sleep-wake" | "under-the-hood";

export interface Chapter {
  id: ChapterId;
  n: number;
  /** Tab label. */
  tab: string;
  /** "Open ..." control label. */
  open: string;
  /** The question the chapter answers, set in white. */
  question: string;
  /** The grey answer that follows the question. */
  answer: string;
  /** Under the picture: the chapter's subject. */
  caption: string;
  /** For screen readers: the chapter's picture, which the map shows for this tab. */
  figureText: string;
  citations: string[];
}

export const CHAPTERS: Chapter[] = [
  {
    id: "big-picture",
    n: 1,
    tab: "The big picture",
    open: "Open the big picture",
    question: "What separates asleep, hibernating and off?",
    answer:
      "Asleep (S3) and hibernating (S4) are both sleeping states: S3 keeps the session in memory that stays powered, S4 saves it to disk. Soft off (S5) saves nothing.",
    caption: "Chapter 1: the global and sleeping states (G0 to G3, S0 to S5)",
    figureText:
      "The chapter's picture: a laptop with its bottom cover off, seen from above, with the fan, the processor, the memory, the storage, the Wi-Fi card and the battery in view.",
    citations: ["acpiTerms", "msSystemPowerStates"],
  },
  {
    id: "modern-standby",
    n: 2,
    tab: "Modern Standby",
    open: "Open Modern Standby",
    question: "How can a laptop sleep without leaving S0?",
    answer:
      "In Modern Standby the system stays in the working state. Whenever nothing needs it, the platform aims for its deepest runtime idle platform state, DRIPS.",
    caption: "Chapter 2: Modern Standby and DRIPS (S0 low-power idle)",
    figureText:
      "The chapter's picture: a full moon in a night sky with thin rings of light around it, one ring for each layer of the laptop that goes quiet.",
    citations: ["msModernStandby", "msStandbyStates", "msPrepareHardware"],
  },
  {
    id: "device-power",
    n: 3,
    tab: "Device power",
    open: "Open device power",
    question: "What does off mean for a device?",
    answer:
      "Each device has its own power states, from D0, fully on, to D3. In D3hot it keeps a trickle of power, so software can still find it on its bus. In D3cold its power is removed, except perhaps for wake logic.",
    caption: "Chapter 3: device power states (D0 to D3cold)",
    figureText:
      "The chapter's picture: a block of flats at night under one street lamp, each flat standing for a device that can be lit or dark.",
    citations: ["msDeviceLowPower", "msDevicePowerStates", "msD3cold"],
  },
  {
    id: "cpu-power",
    n: 4,
    tab: "CPU power",
    open: "Open CPU power",
    question: "Why does a deeper idle state cost time to leave?",
    answer:
      "An idle processor can rest at different depths, and the operating system picks one each time: in general, the deeper the state, the less power it draws and the longer it takes to come back.",
    caption: "Chapter 4: how deep each core rests (C-states)",
    figureText:
      "The chapter's picture: one processor die on a test bench, seen from above, with fine probes touching one corner.",
    citations: ["linuxCpuidle", "acpiProcessor"],
  },
  {
    id: "sleep-wake",
    n: 5,
    tab: "Sleep and wake",
    open: "Open sleep and wake",
    question: "Who does what when a PC goes to S3?",
    answer:
      "Sleep is a hand-off between the operating system, the firmware and the hardware. The operating system records a waking vector, then writes the sleep registers. On a wake event, the firmware returns control through that vector.",
    caption: "Chapter 5: the S3 sleep and wake sequence",
    figureText:
      "The chapter's picture: a desktop tower with a glass side in a dark study, its inside lit, a monitor glowing on the desk behind it.",
    citations: ["acpiSleepMethods", "acpiSleeping"],
  },
  {
    id: "under-the-hood",
    n: 6,
    tab: "Under the hood",
    open: "Open under the hood",
    question: "Where does the firmware describe all this?",
    answer:
      "At boot the firmware leaves a chain of tables in memory. The DSDT and SSDTs hold AML, a byte stream the operating system's own interpreter evaluates: the firmware only wrote it.",
    caption: "Chapter 6: ACPI tables, the namespace and AML",
    figureText:
      "The chapter's picture: the first chapter's laptop taken apart, its main board, storage, fan, battery and lid floating separately in the dark.",
    citations: ["acpiRsdp", "acpiTableHeader", "acpiFadt", "acpiDefBlocks"],
  },
];

export function chapter(id: string): Chapter {
  const c = CHAPTERS.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown chapter ${id}`);
  return c;
}
