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
