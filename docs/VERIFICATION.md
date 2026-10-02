# Verification (branch `ti84-redesign`)

What was run, how to repeat it, and what came out. Nothing here ran a real TI-OS ROM. No ROM was or may be obtained.
See `docs/STATUS.md` for what that leaves unverified.

| Check                                                                        | Result                                                | Repeat with                                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- |
| Typecheck, lint, 345 unit tests, build, scan                                 | pass                                                  | `npm run check`                                                               |
| 144 browser tests (Chromium 72, phone 72)                                    | pass                                                  | `npm run test:e2e`                                                            |
| 29 checks in Firefox 157 (28 pages and the emulator)                         | pass                                                  | `scripts/browser-check.mjs firefox <binary>`                                  |
| 30 checks in WebKitGTK 2.52.6 (28 pages, the emulator, a recorder self-test) | pass                                                  | `scripts/browser-check.mjs webkit <MiniBrowser>`                              |
| Zero requests to any other origin                                            | pass                                                  | `node scripts/network-log.mjs`                                                |
| No ROM, OS image, TI art or TI host anywhere                                 | pass                                                  | `npm run scan`                                                                |
| Computed styles match the reference page                                     | 22 of 27 element pairs identical, 5 differ on purpose | `node scripts/compare-reference.mjs`                                          |
| Source archive rebuilds the same WebAssembly                                 | pass                                                  | unpack `public/source/vertex-emulator-source.tar.gz`, run `emulator/build.sh` |

## F1. Screenshots and comparison

- Vertex at 1440x900 and 390x844: `docs/screenshots/vertex-1440x900.png`, `docs/screenshots/vertex-390x844.png`.
- **The live ti84calculator.io could not be fetched** (the sandbox's egress policy answers 403, so nothing was routed around
  it). The reference was the MIT repo's own `index.html`, served locally with its iframe replaced by a blank page, so no
  request to TI or Pearson was made (`foreign requests: reference [], vertex []` in the script output).
- 27 element pairs, 28 computed properties each, plus x, width and (for one-line elements) height, at both viewports:

```
== desktop 1440x900 ==   22 identical, 5 differ
differs  top bar        display: block -> flex, gap: normal -> 16px            (room for the language menu)
differs  site name      display: inline -> block, text is "Vertex"             (flex item, shorter name)
differs  preview frame  box.height 137.6 -> 526.2                              (a calculator screenshot, not a 128 px icon)
differs  preview image  box.width 130 -> 240                                   (same reason)
differs  footer link    position and width                                     (different link text)
== phone 390x844 ==     22 identical, 5 differ   (the same five)
```

Identical, including height where text cannot change it: body, calculator band, band wrapper, H1, iframe, container,
content, About heading and paragraph, features grid, feature card and its title and text, usage steps and step,
perfect-for box and line, list, CTA section, CTA button (height too), footer, footer line. The top bar is 73 px tall at
desktop width and 59.1 px under 768 px, the same as the reference.

Not compared, because the reference repo does not have them and the live site was unreachable: the language menu,
the independent-site notice, the privacy and terms links. They use the fallback tokens from the task.

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
disable at the ends, `transform-origin` is the top centre (`170px 0px`), transition `transform 0.3s ease`, the box is 680 px
wide at 200% and 170 px at 50%, the level is in `localStorage` (`vertex_zoom_level`) and survives a reload. On the
landing page, the iframe's height follows: at 200% it is about 738 px taller than at 100%, at 50% about 369 px shorter. Messages go
to the page's own origin. The parent checks `event.origin` and `event.source`, and a message from the parent itself is
ignored. Pass.

## F4. ROM panel and storage

Browser tests: the panel shows over the LCD with the heading, a picker, a drop zone and the CEmu link. A text file, an empty
file and 4 MB of zeros get "That file is not a TI-84 Plus CE ROM." or "That file is empty." A file with the right certificate
is accepted, stored in IndexedDB (name and size read back), and the calculator runs. A reload boots from the stored ROM.
Hiding the tab writes a state of more than 1 MB, and the next load boots from it (`data-boot="state"`). Change ROM opens
Replace, Remove and Cancel. A bad replacement leaves the running calculator alone. Remove deletes both records. Dropping a
ROM on the panel works. With the WebAssembly download delayed, the loading state shows. With it blocked, the failure message
shows. Unit tests cover the storage layer with a memory backend (save, restore, wrong-ROM state refused, replace drops
state, remove clears both, damaged records ignored). The boot is real, using the synthetic ROM (4 MiB of 0xFF with only
the certificate CEmu checks, built in memory, no TI code). Pass.

`src/calculator/emulator/runner.test.ts` (real CEmu, fake clock): 60 frames per second of wall time, no catch-up after a
five-second stall, pause freezes the frame count and lifts held keys, resume restores 60 fps, a state saved from one runner
boots another. Pass.

## F5. Console errors, every page, three engines

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
259 requests while visiting 27 pages, loading a ROM, pressing a key and reloading with service workers on
  259  http://localhost:4173
no request left the site's own origin
```

Every Playwright test also fails on any request outside the base origin. The CSP allows `'self'` and
`'wasm-unsafe-eval'` for scripts and nothing else, and it is sent as a header by the preview server and as a meta tag.

## F7. Forbidden content

```
scanned 131 repository files, 50 build files, 400 archive entries
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
