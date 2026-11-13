# Walkthrough

Ten screenshots of Nox as it runs, in the order a reader meets it: the main page, then one moment from each chapter. They were taken in Chromium at 1440 x 900 on 2026-11-12. The pictures inside the app are illustrations, not photographs of a real product.

A screenshot cannot show the part that took the most work, which is how the picture changes as you scroll. To see that, run the app (see the [README](../README.md#run-it)).

## The main page

### The opening

![The opening screen: a closed laptop seen edge-on in the dark, the words "Nox. After dark. What your laptop does while you sleep." and an invitation to scroll.](walkthrough/01-opening.webp)

The page opens on a closed laptop. As the reader scrolls, the lid opens and the story of one night begins.

### One night, one line

![A stop of the story at 23:20. Above the closed laptop a line steps down from "In use" to "Awake, screen off" to "Low-power idle". Labels name the processor cores, the devices and Wi-Fi.](walkthrough/02-story-night.webp)

The story follows the laptop from 22:47 to 07:30 in ten stops. While the lid is shut, the night is drawn as one line above the laptop, and each stop adds one thing to it. Here, at 23:20, the processor and the devices are idle and the chip has reached its deepest idle state, still in S0. The small numbers after a sentence are its sources.

### The chapter list

![The list of six chapters. The first is selected: a picture of a laptop's board, the question "What separates asleep, hibernating and off?" and a button to open the chapter.](walkthrough/03-chapters.webp)

After the story, six chapters go one layer deeper each. Each has its own picture and one question it answers.

## The chapters

### 1. The big picture

![Chapter 1 at S3. A laptop's board is dark except for the memory, which is lit and magnified in a lens with the caption "Memory. Kept refreshed: it holds the session."](walkthrough/04-ch1.webp)

One board, eight states from working to mechanical off. Light is the state: a part that still has power is lit, the rest is dark. A cream point marks where the session is kept, and an amber point marks what is kept to wake the machine. In S3 only the memory still holds the session.

### 2. Modern Standby

![Chapter 2, step 6. A moon in partial phase sits inside four numbered rings, with labels for devices outside the SoC, network and radio, host controllers, and CPU and GPU.](walkthrough/05-ch2.webp)

A laptop in Modern Standby looks asleep but stays in S0. The moon's phase is how deeply the chip rests, and the four rings are the things that must go quiet before it can reach its deepest idle. This step is disconnected standby, where no app traffic is allowed during sleep.

### 3. Device power

![Chapter 3, step 6. A block of flats at night. Two flats labelled Webcam and Touchpad share one corridor light, which stays on.](walkthrough/06-ch3.webp)

Each flat is a device and each corridor light is a power resource. Here the webcam and the touchpad share one light. The touchpad is armed to wake the system and can do that only from D3hot, so the light stays on and both devices stay in D3hot.

### 4. CPU power, by night

![Chapter 4, step 6. A processor die with eight core tiles, one lit. A dashed outline marks cluster 0. Under the die, five lines trace four cores and the cluster going idle one after another.](walkthrough/07-ch4-night.webp)

A processor die on a test bench. Each tile is a core, and its brightness is its state. The lines under the die trace the same moments over time: the cluster can rest only when its last core has gone idle, and on the way back the wake latencies add.

### 4. CPU power, by day

![Chapter 4 by day. The same die on the same bench in daylight, with core 0, cluster 0 and the system outlined in ink on the die itself.](walkthrough/08-ch4-day.webp)

The same bench the next morning. The night's ideas are written on it in ink, with the detail the night left out: here the three levels that each have idle states of their own.

### 5. Sleep and wake

![Chapter 5, step 6. A desktop PC in a dark room at 03:12. Labels point to the power button (pressed), the memory (holds the way back) and the core logic, where two status bits are latched.](walkthrough/09-ch5.webp)

One desktop PC through one S3 cycle, in order. This is the first moment of waking: the button is pressed, hardware latches two status bits and brings the power back, and no instruction has run yet.

### 6. Under the hood

![Chapter 6, step 2. Four chips on a board stand for ACPI tables. Lines run from one labelled RSD PTR to the XSDT and on to the tables it lists.](walkthrough/10-ch6.webp)

The firmware's tables, drawn as chips on a board. The operating system starts from one address, follows it to a list, and follows the list to each table. The chapter goes on to how those tables are read and run.
