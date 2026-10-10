# Plan

The original from-scratch plan (milestones M1 to M8 in `docs/SPEC.md`) is replaced by the redesign below.
`[x]` done and tested, `[~]` partly done (see STATUS.md), `[ ]` open.

## M0 Scaffold (done)

- [x] Vite, React, TypeScript strict, Vitest, Playwright, ESLint, Prettier, PWA, docs

## R1 Redesign: ti84calculator.io look, CEmu inside

### Part A: site shell

- [x] Landing page from the reference CSS: top bar, H1, notice, iframe, About, preview, six cards, How to Use, Perfect For, Supported Functions, System Requirements, CTA, footer
- [x] Computed styles match the reference repo's page on 27 element pairs at 1440x900 and 390x844 (`npm run compare`)
- [~] Match against the live ti84calculator.io (blocked here, see STATUS.md)
- [x] Standalone calculator page with zoom controls (50 to 200%, 10% steps, top-centre scaling, localStorage)
- [x] Height messages to the parent: own origin only, origin and source checked

### Part B: emulator

- [x] CEmu pinned and compiled to WebAssembly, adapter, build script, source archive
- [x] Web Worker at 60 fps, nearest-neighbour canvas, backlight in the pixels
- [x] Bring your own ROM: panel, picker, drag and drop, CEmu validation, plain errors, IndexedDB, Change ROM (Replace, Remove)
- [x] Saved state on hide, pause while hidden, restore on load
- [x] Pointer, touch, multi-touch, key hold; physical keyboard
- [x] Program transfer through CEmu's USB link
- [ ] Real TI-OS behaviour (needs a ROM: see the handoff prompt in the report)

### Part C: keypad

- [x] 50 keys, legends and positions as specified, 2nd blue and ALPHA green, original look
- [x] Matrix codes checked against CEmu's `keymap.cpp`

### Part D and E

- [x] Nine languages, hreflang, privacy and terms in each
- [x] Footer: CEmu (GPLv3) and source archive, trademark notice, no Contact line
- [x] THIRD_PARTY_NOTICES, strict CSP

### Part F: verification

- [x] 50 keys and every shortcut against the real CEmu keypad (unit and browser)
- [x] Zoom, reload, iframe resize; ROM panel; storage
- [~] Zero console errors in Chromium, Firefox and WebKit (see STATUS.md)
- [x] No third-party requests; scan for ROMs, OS images, TI art and TI hosts

## R3 Startup: the calculator is already there

- [x] The visitor's ROM is restored from IndexedDB and booted with no click, and the ROM panel never opens on that path
- [x] ROM and state stored as `ArrayBuffer`, `navigator.storage.persist()` after every import, one plain sentence on failure
- [x] The worker starts before React renders, the wasm is preloaded, and it compiles with streaming plus an ArrayBuffer fallback
- [x] A fast size and header preflight before CEmu sees the file
- [x] One-time Add to Home Screen hint on iPhone and iPad Safari, with the dismissal remembered
- [x] Touch and iPad work: pointer events, no stuck keys, 100dvh, safe-area insets, Apple meta tags, 44 px targets
- [x] Playwright projects for Chromium, the phone profile, WebKit desktop, WebKit iPad and WebKit iPhone
- [x] Cold and warm load measured, and the ROM and network scans hardened
- [~] Cold and warm load measured on localhost only, with the synthetic ROM (see STATUS.md)
- [ ] Safari, iPad Safari, iPhone Safari and Firefox (no binary in this sandbox, see STATUS.md)
- [ ] Real TI-OS behaviour (needs a ROM from the owner's own calculator, see the handoff prompt in the report)
