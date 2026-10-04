# Status

Honest state of the project. Anything unfinished, unverified, or different from a real TI-84 Plus CE is listed here.

## Current milestone

R3 (startup) on `arena/01a10503-vertex`, a PR into `main`. Round 2 (PR #4) is merged, so this branch was cut from
`main` at `1990d65`. **Nothing in this repository has ever run a real TI-OS ROM**, because no ROM was or may be
obtained. See "Not verified" below.

### What R3 changed

The calculator page now boots itself. A visitor who has imported a ROM before lands on a running calculator with no
click, no picker and no wizard. The ROM is read from their own browser storage.

The site is built to **feel** like the ROM is already loaded. It is not faked. The ROM still comes exclusively from
the visitor's own import and from the copy their browser kept, and every test and measurement in this repository uses
a synthetic fixture built in memory. No ROM is bundled, committed, hosted, fetched, linked to or embedded anywhere in
Vertex, not in the repository, not in `public/`, not in `dist/`, not in the source archive and not in the git history.

New in this round:

| Area                | What it does now                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Boot                | The worker starts before React renders, so the WebAssembly compile overlaps with the first paint          |
| Restore             | The stored ROM and saved state are read in one go and booted without a click                             |
| Storage             | ROM and state in IndexedDB as `ArrayBuffer`, with `navigator.storage.persist()` after every import        |
| Loading             | The case and keypad paint at once. Only the LCD shows a spinner, and only while the ROM boots             |
| Failure             | A broken stored record, a refused ROM or a missing worker all end in one plain sentence, never a blank LCD |
| Preload             | The built page preloads the WebAssembly and the worker                                                   |
| Compile             | `WebAssembly.compileStreaming` with an `ArrayBuffer` fallback, on the page and in the worker              |
| Touch               | Pointer events, no stuck keys, no double-tap zoom, 44 px targets, 130% default zoom on a coarse pointer   |
| iPad and iPhone     | `100dvh`, safe-area insets, Apple meta tags, a one-time Add to Home Screen hint                           |
| Validation          | A size and header preflight runs in microseconds before the emulator sees the file                        |
| Scans               | `scan-forbidden.mjs` and `network-log.mjs` hardened, and a unit test runs the ROM scan                    |
| Tests               | `e2e/startup.spec.ts` (16 areas), four new unit suites, `scripts/measure-startup.mjs`                    |

## Needs the owner (not faked here)

1. Dump the ROM from your own calculator with CEmu's ROM dump wizard only, and use arTIfiCE first if the OS is newer
   than 5.5.
2. Import that ROM on the live site and run the 16-item TI-OS checklist with it.
3. Open the live site in real Safari (desktop, iPad, iPhone) and walk the startup checklist, since WebKit cannot be
   downloaded into this sandbox (see "Verification limits").
4. Check that the ROM survives a reload and a browser restart on a real device.
5. Measure cold and warm load on the live site. The numbers in `docs/VERIFICATION.md` come from localhost.

## Verified this round

- `npm run check` (typecheck, lint, 429 unit tests, build, ROM scan): pass.
- `npm run test:e2e` in Chromium and the phone profile: 250 pass, 10 skipped on purpose, 0 fail, 2.9 minutes.
- `node scripts/measure-startup.mjs` against `vite preview`: cold median 218 ms to a usable calculator, warm 156 ms.
- `node scripts/network-log.mjs`: no request left the site's own origin, and no request reached a TI or Pearson host.
- `node scripts/scan-forbidden.mjs`: 146 repository files, 51 build files and 400 archive entries, clean.

The numbers above are real and were produced on this branch. Run the commands to reproduce them.

## Not verified (needs a real ROM from the owner's own calculator)

- Booting TI-OS to the home screen, and every behaviour on it: MathPrint entry, graphing, tables, matrices,
  statistics, complex math, TI-BASIC, CATALOG, MODE.
- That a restored state shows exactly the screen the user left. State save and restore work with the synthetic ROM.
- Brightness with 2nd plus the up and down arrows. The pixels come from CEmu's panel with gamma on, but this was only
  checked in code.
- 2nd OFF and ON. The adapter reports the power state and the ON key reaches CEmu, but TI-OS was not running.
- That a dropped `.8xp` reaches TI-OS and runs.
- Real-time speed on a phone, and cold and warm load times over a real network.

## Not verified (needs a real device or a WebKit build)

- Safari on macOS, iPadOS and iOS. No WebKit binary exists in this sandbox and the Playwright download is blocked, so
  the `webkit`, `webkit-ipad` and `webkit-iphone` projects skip themselves with a warning. Their rows in
  `docs/VERIFICATION.md` say NOT CHECKED.
- Firefox. No binary here either.
- Add to Home Screen on a real iPhone or iPad, and whether Safari keeps the IndexedDB copy of a ROM across a browser
  restart. The code asks for persistent storage and remembers the dismissal, but no device was available.
- iPad Split View and Slide Over. The layout is covered by Chromium tests at 507x810 and 320x810, which are the right
  sizes but not the real thing.
- Whether GitHub Pages serves `application/wasm` for the emulator. The `ArrayBuffer` fallback covers it either way.

## Known gaps

- **The clean-room engine does not exist.** The task's "Switch to the real TI-OS" option for first-time visitors has
  nothing to switch from, so a first visit asks for a ROM in one step instead.
- **Cold and warm load were measured on localhost**, not over a network, and with the synthetic ROM. A real 4 MB ROM
  and a real connection will be slower.
- **The preload links made no measurable difference on localhost** (231 ms without them, 229 ms with them in the
  first run). They were kept for real networks.
- **The install hint only appears on iPhone and iPad Safari**, detected from the user agent and touch points. Another
  browser that could install the site gets no hint.
- **`navigator.storage.persist()` is a request, not a promise.** Safari has no such call, and a refusal is reported,
  never worked around. A browser that evicts the storage loses the ROM and the visitor is asked again.
- **Translations were written by the agent.** A native speaker should review them. This round rewrote the ROM
  rejection sentences to be shorter, so the LCD panel fits in all nine languages, and those nine sentences have had no
  human review at all.

## Known differences from hardware

- The calculator body, key shapes and colors are original, not a copy of the TI faceplate. Layout, legends and matrix
  are exact.
- Shift and Alt tapped alone are 2nd and ALPHA. Held with another key they act as plain PC modifiers.
- A key is held at least 3 frames, and not re-pressed for 2 frames, even for a very short click.
- Zoom is capped so the case never exceeds the frame. The requested level is kept.
- No sound (the calculator has none), no USB or link port beyond variable sending, no debugger.

## Verification limits

- **ti84calculator.io and the CEmu docs site were blocked** (403) from this sandbox. Vertex's language menu, notice
  and legal links are not compared against the live site, and the live calculator box was not measured.
- **No WebKit or Firefox binary can be installed here.** Playwright's CDN, the Debian and Ubuntu mirrors, and every
  other browser host tried are unreachable. The npm registry works, and it carries a Chromium build, which is what the
  tests run on.
- **Layout numbers are machine dependent.** The sandbox renders the body stack in Liberation Sans (Arial metrics), so
  line wraps and heights follow that font. Compare numbers only from one machine.

## Open items

- **CI workflow is not active on GitHub.** Pushing `.github/workflows/ci.yml` is rejected for the GitHub App token
  used here (missing `workflows` permission). The workflow is committed as `docs/ci/github-actions-ci.yml`. To
  activate it run `mkdir -p .github/workflows && cp docs/ci/github-actions-ci.yml .github/workflows/ci.yml` and push
  with a token that has the `workflow` scope.
- No preview deploy is configured for this branch. The existing `pages.yml` deploys `main` only.
