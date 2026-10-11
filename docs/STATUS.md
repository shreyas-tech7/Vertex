# Status

Honest state of the project. Anything unfinished, unverified, or different from a real TI-84 Plus CE is listed here.

## Current milestone

R4 (the site serves the ROM) on `arena/68c73bc5-vertex`, a PR into `main`, branched from `main` at `285aac7`.

**Nothing in this repository has ever run a real TI-OS ROM**, and this round did not change that: no ROM was
downloaded, and none may be. The operating system in a TI-84 Plus CE is Texas Instruments' copyrighted software. Its
licence gives the owner of a calculator one archive copy, forbids use on an emulator the owner did not obtain from TI,
and forbids distribution. No site that offers a CE ROM has that permission, so nothing was fetched from one, and no
ROM is committed, embedded, generated or linked to. See "Not verified" below.

### What R4 changed

The calculator boots the ROM the site serves, at `rom/ti84ce.rom`, with no click, no file and no setup. Visitors are
never asked for anything: the file input, the drop zone, the ROM panel, the Change ROM button and the CEmu dump wizard
link are gone from the page, and the tests assert there is no `input[type=file]` in it at all.

| Area             | What it does now                                                                                         |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| ROM source       | One file the site serves (`src/calculator/romSource.ts`), overridable with `VITE_ROM_URL`                |
| Boot             | Served ROM first, the copy in IndexedDB second, one sentence in the screen last. All without a click      |
| Caching          | Stored with the server's `etag` and `last-modified`, revalidated with `If-None-Match`, 304 keeps it      |
| Failures         | 404, a lost connection, or a file that is not a ROM each end in one plain sentence inside the LCD         |
| Owner's back door| Dropping a `.rom` file on the calculator still replaces the served ROM. The interface never mentions it   |
| Look             | Moulded key caps in the hardware's own colours, a charcoal case lit from above, the LCD in a recessed bezel |
| Owner docs       | `public/rom/README.md`: how to put your own dump in place, and what the licence allows                    |

**No ROM means no boot, and the page says so.** With no file at that path and nothing in the browser, the screen shows
"This site has no ROM installed yet, so the calculator cannot boot." It is a status message, not a simulation: the
emulator is not running, no keys reach anything, and nothing in the page claims the calculator works.

## Previous rounds

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
   than 5.5. Put it at `public/rom/ti84ce.rom` (or serve it elsewhere and build with `VITE_ROM_URL`) and rebuild.
   Until then the site shows the no-ROM sentence and the calculator does not run. This cannot be done from here.
2. With that ROM in place, run the 16-item TI-OS checklist against the live site.
3. Open the live site in real Safari (desktop, iPad, iPhone) and walk the startup checklist, since WebKit cannot be
   downloaded into this sandbox (see "Verification limits").
4. Check that the ROM survives a reload and a browser restart on a real device.
5. Measure cold and warm load on the live site. The numbers in `docs/VERIFICATION.md` come from localhost.

## Verified this round (R4)

- `npm run check` (typecheck, lint, 438 unit tests, build, ROM scan): pass.
- `npm run test:e2e` in Chromium and the phone profile: 242 pass, 10 skipped on purpose, 0 fail, 3.6 minutes. Firefox
  and WebKit have no binary in this sandbox and are NOT CHECKED here.
- Every e2e test runs against a page whose ROM route answers with the synthetic fixture, so the whole suite exercises
  the real boot path: fetch, preflight, CEmu, IndexedDB, and the 304 revalidation.
- `node scripts/scan-forbidden.mjs`: clean, no ROM, no OS image, no TI art, no TI or Pearson host.
- Screenshots in `docs/screenshots/auto-rom-boot-*.png`: the calculator running, the no-ROM sentence, and the phone
  layout, taken from the built site under `vite preview`.

**The ROM in every one of those runs is the synthetic fixture** (`src/test-support/syntheticRom.ts`), which is a test
file, not a calculator image. It proves the pipeline; it does not prove TI-OS. No real ROM was involved.

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
