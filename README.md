# Nox

_What your laptop does after dark: an interactive guide to how a PC sleeps and wakes, from ACPI down to the hardware._

![Nox. After dark. What your laptop does while you sleep. A closed laptop at night under a crescent moon.](docs/cover.webp)

**Live site:** https://lejie710.github.io/nox/

## The question

Every laptop sleeps and wakes many times a day. What happens in between (which parts keep power, how deep the machine goes, what may wake it, how it finds its way back) is defined in a specification of more than a thousand pages, and in operating-system documentation spread over hundreds more.

**Can that path be turned into something a reader scrolls through, without losing the ability to check any sentence of it against its source?**

Nox is one answer: a scroll story that follows one laptop through one night, and six chapters that each go one layer deeper.

See it page by page in the [walkthrough](docs/WALKTHROUGH.md).

## What the evidence shows

| Claim                                            | Evidence                                                                                                                                                                                                                                                                                  | Where                                                  |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Every statement can be traced to a public source | 67 sources, all on three public sites (the ACPI Specification 6.6 at uefi.org, Microsoft Learn, the Linux kernel documentation). Every citation marker on all seven pages resolves to a listed source, every page lists the sources it cites, and no source is listed that nothing cites. | `src/citations.test.tsx`, run with the tests           |
| The cited pages exist                            | 40 distinct addresses checked on 2026-11-12: 33 answered an automated request, 7 on uefi.org refuse automated requests and were opened by hand the same day, none dead.                                                                                                                   | `docs/link-check.md`, written by `npm run check:links` |
| A section number is printed only when confirmed  | Sources name a section by its title, and a chapter or a table by a number checked by hand against the 6.6 text. A test rejects any section number in the source list.                                                                                                                     | `src/model/model.test.ts`                              |
| The picture is right however the reader scrolls  | Every step stores the complete state of its picture, not a change from the step before, so scrolling fast, backwards or jumping lands on the same picture. Tests check each step's declared state.                                                                                        | `src/model/*.test.ts`                                  |
| It works without motion                          | With `?static` or the system's reduced-motion setting, nothing pins or animates, and each scene's own controls step through it. A browser without CSS scroll-driven animations gets the full site except the opening's lid, which holds still.                                            | `index.html` (the gate), `src/still.test.tsx`          |

293 tests in 21 files. The type check and the production build pass. The same tests run in GitHub Actions before every deployment, and a failing test stops it.

## Limits

What this project does not show, stated so that nobody has to find out:

- **Whether a reader understands it is not measured.** The evidence above is about correctness and traceability. No reader study was run.
- **Checked in Chromium only.** Firefox, Safari, a physical phone and a screen reader have not been tested.
- **The link check is a dated record, not a guarantee.** It is run before publishing, not on every build, so that another site's outage cannot fail a build. A link can die the day after.
- **Six topics.** The big picture of G and S states, Modern Standby, device power, CPU power, the sleep and wake sequence, and the ACPI tables. Thermal, battery, PCIe and USB power management are not covered.
- **Vendor-neutral and illustrative.** It explains what the specification and the operating systems define, not any vendor's implementation. The laptop, the night and every picture are illustrations, not a real product, and example values are marked as examples.
- **An explainer, not a replacement for the specification.** Each claim links to the place to read the exact rule.
- **Built for a wide screen.** It reads on a phone, with fewer stops and simpler motion. English only.

## What is in it

- **The main page** follows one laptop from 22:47 to 07:30 in ten stops: the lid closes, the machine goes quiet, something wakes it, it goes back, morning.
- **Six chapters**, each one pinned picture with its words beside it and a short turn for the reader at the end:

| Chapter           | The picture                                              | What it explains                                                                  |
| ----------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1 The big picture | A laptop's board, where light shows what still has power | The global and sleeping states, G0 to G3, S0 to S5                                |
| 2 Modern Standby  | A moon whose phase is the depth of rest                  | Why the screen-off laptop is still in S0, and what lets it reach its deepest idle |
| 3 Device power    | A building where each flat is a device                   | D0 to D3cold, shared power resources, wake                                        |
| 4 CPU power       | A processor die on a bench, by night and by day          | Idle states, wake cost, containers, performance states and CPPC                   |
| 5 Sleep and wake  | A desktop PC through one S3 cycle                        | The order of events going down and coming back                                    |
| 6 Under the hood  | The firmware's tables as chips on a board                | How the OS finds, reads and runs the ACPI tables                                  |

## How it is built

Four runtime dependencies: React, React DOM and two self-hosted fonts. No animation library, no router, no state library.

```
src/model/      what is true      one file per page: its steps, each with its full state, words and citations
src/chapters/   what is drawn     the chapters: each scene is drawn from its model; the reference cards under it carry their own cited text
src/stage/      what scenes share steps chosen by scroll, the rail of chips, timers, measuring the view
src/scenes/     the main page     the opening, the story, the chapter list, the sources
src/components/ shared parts      the nav, the citation marker
src/styles/     how it looks      shared tokens, the chapters' common parts, and one stylesheet per scene
scripts/        publication checks (the link check)
```

Three ideas carry the whole site:

1. **The model is the source of truth, and it is plain data.** A step is an object: its title, its sentences, the ids of its sources, and the complete state of the picture. Components draw what the model says. That is why the content can be tested without a browser, and why a wrong citation is a failing test, not a review comment.
2. **Scroll position selects a step. It does not drive a timeline.** Each step has an invisible marker in the page. The step whose marker crosses the middle of the window is the current one (`src/stage/useStepScroll.ts`, an IntersectionObserver). Motion between steps is CSS transitions, mostly on `transform` and `opacity`, and a few SVG animations that a step starts. A few things do follow scroll progress itself: the opening's lid (a CSS scroll-driven animation behind `@supports`), and in the chapters the fade at a scene's end, the dawns of chapters 4 to 6 and two stops of chapter 5, which a scroll listener reads at most once per frame (`src/stage/useScene.ts`).
3. **One page, three ways to read it.** The same markup serves the animated version, the still version (`?static` or reduced motion: nothing pins, controls step through) and a reader who does not see the picture (every step is in the page as text, in order). The choice is made in `index.html` before first paint.

## Decisions

**Complete state per step, not changes between steps.**
Context: a scroll story can be entered anywhere, scrolled backwards, or jumped through from the step rail. Chosen: every step declares everything the picture shows. Considered: each step as a change applied to the one before, which is shorter to write. Cost: repetition in the model files, and adding a part to a picture means touching every step.

**CSS and an IntersectionObserver, no animation library.**
Context: the site needs pinned pictures and a few scroll-linked moves. Chosen: sticky positioning, CSS transitions, one scroll-driven animation with a fallback. Considered: a scroll-animation library, which gives timelines and scrubbing for free. Cost: no scrubbed, frame-by-frame motion between steps, and a browser without scroll-driven animations gets the still version of the opening.

**The build never goes online.**
Context: the project's first measure is that every cited link works. Chosen: citations are checked offline with the tests, and the links by a separate command that writes a dated record. Considered: failing the build on a dead link. Cost: a dead link is caught at the next publication check, not at the next build. One site also refuses automated requests, so seven addresses are confirmed by a person.

## Tests

| What can go wrong for a reader                           | Covered by                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| A statement with no source, or a marker pointing nowhere | `src/citations.test.tsx`                                                    |
| A cited page that no longer exists                       | `npm run check:links` (before publishing)                                   |
| A section number printed without a check                 | `src/model/model.test.ts`                                                   |
| The wrong picture after fast or backward scrolling       | per-page model tests: each step's full state                                |
| A reader who cannot use motion gets a broken page        | page tests of the still version                                             |
| Text too small to read on a phone                        | geometry tests: 12 px floor at 390 px                                       |
| A change for phones altering the wide layout             | tests that the wide rendering keeps its steps and frames                    |
| It looks wrong in Firefox or Safari, or on a real phone  | **not tested**                                                              |
| A screen reader announces it badly                       | **not tested** (the text alternative exists, but nobody has listened to it) |

The tests are unit tests of the model and server-rendered page tests. There are no browser-driven end-to-end tests. Layout and motion were checked by hand in Chromium.

Two more checks run before the tests, here and in GitHub Actions: Prettier (one format for the whole project) and ESLint (TypeScript's recommended rules and the two React Hooks rules).

## Run it

Needs Node.js 22.12 or later (the test runner's floor). The link check needs Node.js 24, which runs its TypeScript import directly.

```
npm install
npm run dev
```

Open http://127.0.0.1:5180. Add `?static` to see the version without motion.

```
npm test              # 293 tests, offline
npm run build         # type check, then the production build
npm run format:check  # Prettier, the whole project (npm run format rewrites)
npm run lint          # ESLint (once, before the first run: npm ci --prefix tools/lint)
npm run check:links   # asks every cited address and writes docs/link-check.md
```

The linter is its own package in `tools/lint`. Its TypeScript parser needs the compiler's JavaScript API, and the TypeScript 7 that type-checks the site is the native compiler, which does not ship one, so the linter brings TypeScript 6 for itself.

## Sources, fonts and licence

Public sources only: the ACPI Specification 6.6 (UEFI Forum), Microsoft Learn and the Linux kernel documentation. The specification is paraphrased and cited, and every diagram is redrawn. None of its figures or tables is copied.

Fonts: Inter and IBM Plex Mono, under the SIL Open Font License, self-hosted through Fontsource.

Licence: the software is under the MIT License (see [LICENSE](LICENSE)). That licence covers the code only: the explanatory text shown on the site and the images are not part of the grant. The images are generated illustrations, not photographs of real products or places. Text and images are copyright 2026 Le Jie Tan, all rights reserved. Quote them with a link, but do not republish them.

A personal project based on public specifications. Not affiliated with or endorsed by any employer or vendor.
