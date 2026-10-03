# Third-party notices

Vertex's own code is MIT licensed (see `LICENSE`). The emulator in `emulator/` is a work based on CEmu and is
licensed under the **GPLv3** (see `emulator/LICENSE`). Because the compiled emulator is served together with the
site, the corresponding source is served too: `source/vertex-emulator-source.tar.gz`, linked in every page footer.

## Emulator (shipped to the browser)

| Project                                                                                            | License    | What Vertex uses                                                                                                                                              |
| -------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CEmu](https://github.com/CE-Programming/CEmu) (commit `54f4a9a4eb9e1c89a7c405705b1a1fc1ab428da2`) | GPLv3      | The C core (`core/`), compiled unmodified to WebAssembly with Emscripten. Its keypad table (`gui/qt/keypad/keymap.cpp`) is the source of Vertex's key matrix. |
| [Emscripten](https://emscripten.org)                                                               | MIT / UIUC | Toolchain, and the small JavaScript glue it generates (`emulator/dist/vertex-cemu.js`).                                                                       |

CEmu copyright: (C) 2015-2019 CEmu contributors and later years. The adapter `emulator/src/vertex_adapter.c` is GPLv3 as well.

## Layout, ideas and reference code

| Project                                                                 | License | What Vertex took                                                                                                                                                                                                                   |
| ----------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [bifdu9898/TI84Calculator](https://github.com/bifdu9898/TI84Calculator) | MIT     | The page layout and CSS of the landing page and the calculator page shell (zoom controls, iframe sizing and height messages). `src/site/site.css` and `src/calculator/calculator.css` follow it. Its emulator wiring is not used.  |
| [hunterchen7/ti84ce](https://github.com/hunterchen7/ti84ce)             | MIT     | The keyboard table in its README (`src/calculator/keyboard.ts`), and the approach to holding keys for a few frames and to building CEmu with Emscripten. No file was copied, and none of its images or prebuilt binaries are used. |

### bifdu9898/TI84Calculator, the full MIT notice

Each file adapted from it starts with this comment: "adapted from github.com/bifdu9898/TI84Calculator (MIT), see
THIRD_PARTY_NOTICES.md". The files are `src/site/site.css`, `src/site/render.ts`, `src/site/landing.ts`,
`src/calculator/calculator.css`, `src/calculator/zoom.ts`, `src/calculator/CalculatorApp.tsx` and
`src/calculator/ZoomControls.tsx`.

This notice covers the HTML, CSS and JavaScript wrapper code of that project only. It does not cover, and Vertex does not
use, any Texas Instruments or Pearson material. Vertex does not load, copy, mirror or link TI's emulator, Pearson's test delivery platform, its
scripts or styles, the TI-84 Plus CE artwork, or any saved state. The artwork of the calculator body is Vertex's own drawing.

```
MIT License

Copyright (c) 2025 TI 84 Calculator

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The MIT notice of `hunterchen7/ti84ce` is the usual MIT text under its own copyright line.

## Runtime dependencies (shipped to the browser)

| Package                                                                        | License    | Notes              |
| ------------------------------------------------------------------------------ | ---------- | ------------------ |
| [react](https://github.com/facebook/react), react-dom                          | MIT        | Calculator page UI |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval)                      | Apache-2.0 | IndexedDB storage  |
| [workbox](https://github.com/GoogleChrome/workbox) (service worker, generated) | MIT        | Offline cache      |

## Build, test and lint tooling (not shipped)

| Package                                                                   | License    |
| ------------------------------------------------------------------------- | ---------- |
| vite, @vitejs/plugin-react, vite-plugin-pwa                               | MIT        |
| typescript                                                                | Apache-2.0 |
| vitest                                                                    | MIT        |
| @playwright/test                                                          | Apache-2.0 |
| eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, globals | MIT        |
| prettier                                                                  | MIT        |
| @types/react, @types/react-dom, @types/node                               | MIT        |

## What is not here

- **No calculator ROM, OS image or Texas Instruments software.** Visitors load a ROM from their own calculator. It stays
  in their browser. `.gitignore` blocks `*.rom`, `*.8eu`, `*.8ek` and state files, and `npm run scan` checks the repository,
  the build and the source archive for them.
- **No Texas Instruments artwork, logo or wordmark.** The calculator drawn in `src/calculator` (key layout and legends
  aside, which TI-OS requires) and every icon and image in `public/` are original. The preview image is a screenshot of
  Vertex itself.
- **Fonts.** Vertex loads no web fonts. It uses the visitor's system font stack.
