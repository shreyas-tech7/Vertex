# Verification (branch `ti84-redesign`)

What was run, how to repeat it, and what came out. Nothing here ran a real TI-OS ROM. No ROM was or may be obtained.
See `docs/STATUS.md` for what that leaves unverified.

| Check                                                    | Result                                                      | Repeat with                                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Typecheck, lint, 389 unit tests (1 skipped), build, scan | pass                                                        | `npm run check`                                                               |
| 210 browser tests: 201 pass, 9 skipped on purpose        | pass (Chromium 105, phone 96, 9 desktop-only tests skipped) | `npm run test:e2e`                                                            |
| Zero requests to any other origin                        | pass                                                        | `node scripts/network-log.mjs`                                                |
| No ROM, OS image, TI art or TI host anywhere             | pass                                                        | `npm run scan`                                                                |
| Layout targets at 1920x855 and 390x844                   | 36 of 41 match, 5 do not (listed in F9)                     | `node scripts/measure-targets.mjs`                                            |
| Computed styles against the reference page               | **not run in this round** (reference file missing, see F1)  | `REF_DIR=<MIT repo checkout> node scripts/compare-reference.mjs`              |
| Firefox and WebKit                                       | **not run** (no binary here, see F5)                        | `scripts/browser-check.mjs firefox <binary>`, `... webkit <MiniBrowser>`      |
| Source archive rebuilds the same WebAssembly             | not re-run (emulator unchanged since the last round)        | unpack `public/source/vertex-emulator-source.tar.gz`, run `emulator/build.sh` |

Run on 2026-10-02 against the commit that carries this file. The browser was Chromium 1194 from `/opt/pw-browsers`
(`VERTEX_CHROMIUM_PATH`). Playwright's own headless Chromium hides scrollbars, so no 15 px scrollbar was in play.

## F1. Screenshots and comparison

**Follow-up round (R2b):** `compare-reference.mjs` was run and stopped at once with `ENOENT ... /home/user/bifdu9898/ti84calculator/index.html`.
That file is the MIT repo's own page, and this sandbox has no copy. Attaching the repo to the session was refused, so
nothing was fetched another way. The numbers below are from the last round and were not refreshed. The screenshots were
refreshed and show the new About copy.

- Vertex at 1920x855 and 390x844: `docs/screenshots/vertex-1920x855.png`, `docs/screenshots/vertex-390x844.png`. Raw numbers:
  `docs/screenshots/measure-targets.json` and `docs/screenshots/compare-reference.json`.
- **The live ti84calculator.io was not fetched** (the task forbids it). The reference is the MIT repo's own `index.html`,
  served locally with its iframe replaced by a blank page and its picture replaced by a grey square, so no request to TI or
  Pearson was made (`foreign requests: reference [], vertex []`). The live-site numbers in F9 are the targets from the task.
- 27 element pairs, 28 computed properties each, plus x, width and (for one-line elements) height, at 1920x855 and 390x844:

```
== desktop 1920x855 ==   24 identical, 3 differ        document height reference 4065, Vertex 4227
differs  top bar        display: block -> flex, gap: normal -> 16px, height 74.3 -> 80
differs  site name      display: inline -> block, width 160.1 -> 65.7 (the name is "Vertex", a flex item)
differs  footer link    x 949.8 -> 882.4, width 56.5 -> 40.7           (different link text)
== phone 390x844 ==     24 identical, 3 differ (the same three)        document height reference 5358, Vertex 5867
```

The top bar is 80 px (desktop) and 70 px (phone) in Vertex, which are the live-site targets. The repo's `index.html`
measures 74.3 and 59.1 because its bar has a different structure from the live one, so that pair is expected to differ.
The preview frame and image now compare identical (128 px content box, 1 px border, 40 px margins).

Not compared, because the reference has no such element: the language menu, the independent-site notice card (the
reference page has none), the privacy and terms links.

## F2. Keys

`src/calculator/emulator/emulator.test.ts` runs CEmu's real WebAssembly build, boots it with a synthetic ROM, and drives it
through the same `KeyHolders`, `KeyboardController` and `KeyScheduler` classes the page uses. After each press it reads
the key matrix back from CEmu's own keypad (`vertex_key_state`).

- 50 on-screen keys, one test each, including ON (row 2, column 0): exactly one bit set, then cleared. Pass.
- 44 keyboard shortcuts, one test each. Pass. Shift and Alt taps, Shift+9 is "(", V is 2nd then x squared and never both at
  once, key repeat ignored, Ctrl and Cmd combos left alone. Pass.
- Held keys stay down (120 frames), several keys at once, a key is released only by its last holder. Pass.
- `e2e/calculator.spec.ts` repeats this in a browser: real mouse presses on all 50 buttons (arrow wedges aimed away from
  the hub), every shortcut with `page.keyboard`, multi-pointer. The emulated matrix is read from the page's `data-matrix`
  attribute, which the worker fills from CEmu. Pass in Chromium and the phone profile.
- `src/core/os/keys.test.ts` checks every key's legends against the task's table, and the matrix against CEmu's
  `keymap.cpp` (copied into the test, and parsed from a CEmu checkout when one is present). Pass.

## F3. Zoom

`e2e/calculator.spec.ts` and `src/calculator/zoom.test.ts`: 50% to 200% in 10% steps (no float drift), plus and minus
disable at the ends, `transform-origin` is the top centre (`129px 0px`), transition `transform 0.3s ease`, the case is
516 px wide at 200% and 129 px at 50%, the requested level is in `localStorage` (`vertex_zoom_level`) and survives a
reload. The case is never wider than the frame at 100%: the scale is capped at `floor(frameWidth / 258 * 100) / 100`
(and at 2), plus is disabled at the cap, and the displayed percentage is the capped one. The landing page iframe
height follows `ceil(604 x zoom + 150)`: 754 at 100%, 1358 at 200%, 452 at 50% (tested). Messages go to the page's own
origin. The parent checks `event.origin` and `event.source`, and a message from the parent itself is ignored. Pass.

Phone matrix, measured on the landing page (`node scripts/measure-targets.mjs`). The frame is the viewport minus 40.

| Viewport | Frame | Cap  | Requested 50% | Requested 100% | Requested 200% | Frame height at 200% |
| -------- | ----- | ---- | ------------- | -------------- | -------------- | -------------------- |
| 320      | 280   | 1.08 | 50%           | 100%           | 108%           | 803                  |
| 360      | 320   | 1.24 | 50%           | 100%           | 124%           | 899                  |
| 390      | 350   | 1.35 | 50%           | 100%           | 135%           | 966                  |
| 430      | 390   | 1.51 | 50%           | 100%           | 151%           | 1063                 |

In every cell the case fit inside the frame, and plus was disabled only where the cap bound. At 50% the frame is 700 px
because of the phone's 700 px minimum height. At 100% it is 754 (see F9).

## F4. ROM panel and storage

Browser tests: the panel shows over the LCD with the heading, a picker, a drop zone and the CEmu link. A text file, an empty
file and 4 MB of zeros get "That file is not a TI-84 Plus CE ROM." or "That file is empty." A file with the right certificate
is accepted, stored in IndexedDB (name and size read back), and the calculator runs. A reload boots from the stored ROM.
Hiding the tab writes a state of more than 1 MB, and the next load boots from it (`data-boot="state"`). Change ROM opens
Replace, Remove and Cancel. A bad replacement leaves the running calculator alone. Remove deletes both records. Dropping a
ROM anywhere on the calculator works (tested on a key and on the arrow pad, while another ROM is running). A reload with a
stored ROM never shows the panel and `data-phase` is never `needRom` (a MutationObserver installed before the page
scripts records every phase). The panel fits the LCD in all nine languages (tested). With the WebAssembly download delayed, the loading state shows. With it blocked, the failure message
shows. Unit tests cover the storage layer with a memory backend (save, restore, wrong-ROM state refused, replace drops
state, remove clears both, damaged records ignored). The boot is real, using the synthetic ROM (4 MiB of 0xFF with only
the certificate CEmu checks, built in memory, no TI code). Pass.

`src/calculator/emulator/runner.test.ts` (real CEmu, fake clock): 60 frames per second of wall time, no catch-up after a
five-second stall, pause freezes the frame count and lifts held keys, resume restores 60 fps, a state saved from one runner
boots another. Pass.

## F5. Console errors, every page, three engines

**Round 2 status (unchanged in the follow-up):** only the Chromium and phone rows were re-run after the redesign (the browser
tests fail on any console error, page error or off-origin request). The Firefox and WebKit rows below are from the earlier
build. No Firefox or WebKit binary exists in this sandbox (checked again in the follow-up: no `firefox`, `MiniBrowser`,
`WebKitWebDriver` or Playwright browser other than Chromium) and the Playwright download is blocked, so they were not
repeated and should be run again (`scripts/browser-check.mjs`).

| Engine                        | Pages | Console errors | Page errors | CSP violations | Third-party requests |
| ----------------------------- | ----- | -------------- | ----------- | -------------- | -------------------- |
| Chromium (Playwright)         | 28    | 0              | 0           | 0              | 0                    |
| Phone profile (Pixel 7)       | 28    | 0              | 0           | 0              | 0                    |
| Firefox 157 (puppeteer, BiDi) | 28    | 0              | 0           | 0              | 0                    |
| WebKitGTK 2.52.6 (WebDriver)  | 28    | 0              | 0           | 0              | 0                    |

28 pages are 27 generated pages and `calculator.html`. Playwright could not download its own Firefox and WebKit here, so
Firefox came from conda-forge and WebKit from Ubuntu's `webkit2gtk-driver`. They are real browsers but not the Playwright
builds. `playwright.config.ts` still lists Playwright's `firefox` and `webkit` projects, and `docs/ci/github-actions-ci.yml`
runs them, but those two projects were **not run** here. Each of the two extra runs also loaded a ROM, booted the emulator
in a module worker, pressed ENTER (and ON in Firefox), zoomed, and reloaded. The WebKit script first checks that its error
recorder catches a deliberate `console.error`.

## F6. Network

```
no request left the site's own origin   (node scripts/network-log.mjs, all pages, ROM load, key press, reload)
requests were /index.html, /calculator.html, /privacy, /terms, own scripts, styles, images, manifest and sw.js
```

Every Playwright test also fails on any request outside the base origin. The CSP allows `'self'` and
`'wasm-unsafe-eval'` for scripts and nothing else, and it is sent as a header by the preview server and as a meta tag.

## F7. Forbidden content

```
scanned 133 repository files, 51 build files, 400 archive entries
checked for: ROM and OS files (.rom .8eu .8ek .h84statej .8xu .8cu), ROM-shaped binaries, TI artwork names, and references to the proprietary emulator hosts
clean: no ROM files, no OS images, no TI art, no references to TI or Pearson emulator hosts
```

The scan covers the working tree (including files `.gitignore` hides), `dist/`, and the entries of the served source
archive. It was shown to catch a planted ROM-shaped file and a `.rom` file, then removed them.

## F8. Languages

27 pages render: English at `/` and `/fr`, `/de`, `/ja`, `/it`, `/es`, `/pt`, `/sv`, `/ru`, each with `/privacy/` and `/terms/`
under it. Each sets `<html lang>`, carries hreflang links to all nine plus `x-default`, and points its dropdown at the nine
versions. For each of the nine home pages, the test requests all nine dropdown links and expects 200 and the right
`hreflang`. The iframe shows the ROM panel in the page's language. `copy.test.ts` checks that all nine have the same shape
and placeholders, that nothing is left in English, and that no string has an em dash, en dash, semicolon, spaced hyphen
or banned phrase. Pass. The translations were written by the agent and have not had a native review.

## F9. Layout targets (built page, Chromium, `node scripts/measure-targets.mjs`)

Desktop 1920x855: 28 of 32 match, 4 do not. Phone 390x844: 8 of 9 match. Re-run after the follow-up (R2b). Chromium 1194 on
Linux. The sandbox renders the body font stack in Liberation Sans (Arial metrics), so line wraps and heights follow that
font. The same commit measured 4227 for the whole page in the last report and 4200 here before this change, so compare
numbers only from one machine.

| Target                                    | Wanted                               | Measured           | Result            |
| ----------------------------------------- | ------------------------------------ | ------------------ | ----------------- |
| Top bar (no height set)                   | 80                                   | 80                 | match             |
| Language button width                     | 126                                  | 121.3              | **off by 4.7 px** |
| Language button height                    | 39                                   | 39                 | match             |
| H1 top, height, font                      | 120, 51.2, 32px bold #333            | same               | match             |
| Notice width, height, top                 | 680, about 70, 171                   | 680, 70.2, 171.2   | match             |
| Iframe width, height, top                 | 600, 754, about 261                  | 600, 754, 261.3    | match             |
| Zoom button height                        | 38                                   | 38                 | match             |
| Case size and position in the frame       | 258x604 at 171,78                    | same               | match             |
| LCD size and position in the case         | 232x174 at 13,29                     | same               | match             |
| About heading to Key Features heading     | 442                                  | 443.0 (was 469.9)  | **off by 1.0 px** |
| Preview block height                      | 136.6                                | 137.6              | **off by 1 px**   |
| Preview image box                         | 130x130                              | 130x130            | match             |
| Feature card width, gap                   | 260, 20                              | 260, 20            | match             |
| Footer width, background, border, padding | 900, #fafafa, 1px #e0e0e0, 30px 40px | same               | match             |
| Whole page height                         | 4037                                 | 4173 (was 4200)    | **off by 136 px** |
| Phone top bar                             | 70                                   | 70                 | match             |
| Phone H1 top, height (two lines)          | 110, 102.4                           | 110, 102.4         | match             |
| Phone iframe width                        | 350                                  | 350                | match             |
| Phone iframe height at 100%               | 700                                  | 754                | **off by 54 px**  |
| Phone case 258 wide, centred, unclipped   | yes                                  | x 46 to 304 of 350 | match             |
| Phone horizontal page scroll              | none                                 | none               | match             |

Why the five differ (none was padded or tuned to hide it):

- **Language button 121.3 wide.** The visible text is the page's own language name ("English") with a globe and a caret.
  "Language" is the accessible name only, so the width follows the language: 121.3 for English, 117.0 Japanese, 120.4 Italian,
  126.3 Spanish, 127.2 German, 127.8 Russian, 129.7 French and Swedish, 140.7 Portuguese. Padding stays at the reference's
  8px 16px. Height matches. The live label and width were not seen (the live site was not loaded, see F1).
- **About to Key Features 443.0, was 469.9.** The first About paragraph is shortened in all nine languages and now wraps to
  two lines at 1920 px, with the ROM paragraph at three. Every language measures 443.0. Two plus three lines is the closest
  fit, since a line is 26.9 px. The 1.0 px that is left is the preview block below.
- **Preview block 137.6.** It is 1 px over the 136.6 target and sits inside the About span, so it is the same 1 px. It
  compared identical to the repo's `index.html` last round, so it is probably line-box rounding from the live site's font
  metrics. Not verified against the live page.
- **Whole page 4173, was 4200 (4227 in the last report).** The About change took out 26.9 px. Hiding blocks one at a time
  in the built page shows what Vertex-only content costs: the independence notice 90 px (70.2 plus 20 margin), the Open
  Source footer line 38 px, the Privacy and Terms footer line 38 px. Together 166 px, which is more than the 136 left, so
  the live page must have height Vertex does not, such as a contact line (Vertex has none). The last report's split
  (notice, About, footer) is confirmed in size, but the live split could not be checked. None of the three is filler: the
  notice says Vertex is not affiliated with Texas Instruments, the Open Source line links the source of a GPLv3 emulator
  build, and privacy and terms stay. Nothing was cut.
- **Phone iframe 754. This is the owner's choice.** The 700 target conflicts with the rule that the frame is
  `calcHeight x zoom + 150`, which is 754 at 100%. The owner chose the formula (see `docs/DECISIONS.md`) and it was not
  changed. The CSS minimum of 700 applies at zoom levels below 100%.

## F10. Not checked

- Firefox and WebKit after the redesign (no binary here). The live site compared side by side in a real browser (it was not
  loaded: its page embeds TI's emulator). `compare-reference.mjs` against the MIT repo's `index.html` in this round (the file
  is not in this sandbox). The 16-item TI-OS checklist and every behaviour of TI-OS itself, because no ROM was or may be
  obtained.
- The ROM panel's wording, the nine About paragraphs and the artwork were not reviewed by a person. The legends are font
  dependent (see F11).

## F11. Legends, CATALOG and space (`docs/screenshots/legends-*.png`)

The 2nd legend (left) and the ALPHA legend (right) share one strip above a key. The gap is the distance between the glyph
boxes of the two legends, in case pixels (the same at every zoom, since the case is scaled as a whole). 37 keys have both.

| Font                        | Zoom | Gap before | Gap after `-0.02em` | Overlap after |
| --------------------------- | ---- | ---------- | ------------------- | ------------- |
| Default (Liberation Sans)   | 100% | -0.25 px   | +1.14 px            | none          |
| Default (Liberation Sans)   | 135% | -0.25 px   | +1.14 px            | none          |
| FreeSans                    | 100% | +0.09 px   | +1.48 px            | none          |
| DejaVu Sans (wide fallback) | 100% | -4.36 px   | -2.97 px            | CATALOG/space |
| DejaVu Sans (wide fallback) | 135% | -4.36 px   | -2.97 px            | CATALOG/space |

Before the change the screenshots (`legends-100-before.png`, `legends-135-before.png`) show G touching s, so the two read as
one word. In DejaVu Sans the s overprints the G (`legends-100-dejavu-before.png`). After it, `legends-100.png` and
`legends-135.png` show a visible gap. DejaVu Sans still overlaps by about 3 px (`legends-100-dejavu.png`). A pinned legend
font or a smaller legend would fix that and was not part of the allowed change. No other pair of the 37 overlaps in any of the four fonts tried.
