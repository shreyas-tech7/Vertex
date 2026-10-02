# Architecture

Vertex is a static site (Vite) with two kinds of page, and one emulator.

```
emulator/           CEmu (GPLv3) compiled to WebAssembly. Its own folder and license.
  src/vertex_adapter.c   small C API: load ROM or state, run frames, keys, LCD, variable transfer
  build.sh               fetch pinned CEmu, build with Emscripten, write dist/ and the source archive
  dist/                  vertex-cemu.js + vertex-cemu.wasm (committed) and MANIFEST.json
src/site/           the static pages
  i18n/                  en fr de ja it es pt sv ru: every string, one typed shape
  render.ts              landing, privacy and terms HTML for all languages
  site.css               the reference page's CSS plus the language menu, notice and legal pages
  landing.ts             iframe height messages (origin and source checked), CTA scroll, menu behaviour
  csp.ts, support.ts     the Content Security Policy, header files, robots.txt, sitemap.xml
src/calculator/     the calculator page (React): calculator.html
  emulator/              protocol, worker (thin), runner (60 fps loop, testable), client, EmulatorCore, KeyScheduler
  useCalculator.ts       storage, boot, pause, saving, drag and drop
  Keypad.tsx, keypadLayout.ts   the original keypad: 50 keys, legends, arrow pad
  keyboard.ts, keyHolders.ts    physical keyboard and pointer input, shared key ownership
  storage.ts, zoom.ts    IndexedDB for the ROM and state, zoom and iframe height messages
src/core/           brand name and the key table (ids, legends, getKey codes, CEmu matrix positions)
scripts/            generate-pages, make-assets, compare-reference, scan-forbidden
e2e/                Playwright: ROM panel, input, zoom, iframe, languages, console and network checks
```

## Runtime

```
 page (main thread)                       worker                      WebAssembly
 ───────────────────                      ──────                      ───────────
 pointer / keyboard ─► KeyHolders ─► EmulatorClient ──postMessage──► KeyScheduler ─► vertex_key
 canvas (putImageData) ◄── frame (RGBA) ◄───────────── 60 fps loop ◄── vertex_run_frames, vertex_frame
 data-matrix, pressed state ◄── keys ◄──── vertex_key_state (CEmu's own keypad)
 IndexedDB ◄── state image ◄───────────── saveState ◄─────────────── vertex_save_state
```

- The ROM is validated by CEmu itself (`emu_load`) in a second instance, stored in IndexedDB, then booted.
  It never leaves the browser.
- The worker steps one frame (1/60 s of emulated time, 800,000 cycles of the 48 MHz CPU) per tick and drops
  time it cannot make up. Frames are posted only when the picture changes. The panel gamma and backlight level are
  already in the pixels, so 2nd plus the arrows changes the brightness on the canvas.
- The tab hiding pauses the worker, lifts every key and saves the whole emulator state (about 5 MB).
  The next load restores it, so the calculator resumes where it was.
- Variable files go through CEmu's emulated USB link (`emu_send_variables`) while the frames keep running.

## Principles

- **CEmu stays unmodified.** The adapter is the only glue. To read the file-static key matrix, it includes `keypad.c`.
- **Original look, exact layout.** Key positions, legends and matrix codes follow the hardware and CEmu. Colors, shapes and
  the body are Vertex's own. No TI art, logo or wordmark.
- **Everything is self-hosted.** The CSP allows scripts from self and `'wasm-unsafe-eval'` only.
- **No ROM in the repository, ever.** `.gitignore` and `npm run scan` enforce it.
