# Third-party notices

Vertex itself is MIT licensed (see `LICENSE`). It depends only on permissively licensed packages.

## Runtime dependencies (shipped to the browser)

| Package                                                                        | License    | Notes                       |
| ------------------------------------------------------------------------------ | ---------- | --------------------------- |
| [react](https://github.com/facebook/react), react-dom                          | MIT        | UI shell                    |
| [decimal.js](https://github.com/MikeMcl/decimal.js)                            | MIT        | 14-digit decimal arithmetic |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval)                      | Apache-2.0 | IndexedDB saved state       |
| [workbox](https://github.com/GoogleChrome/workbox) (service worker, generated) | MIT        | offline cache               |

## Build, test and lint tooling (not shipped)

| Package                                                                   | License    |
| ------------------------------------------------------------------------- | ---------- |
| vite, @vitejs/plugin-react, vite-plugin-pwa                               | MIT        |
| tailwindcss, @tailwindcss/vite                                            | MIT        |
| typescript                                                                | Apache-2.0 |
| vitest                                                                    | MIT        |
| @playwright/test                                                          | Apache-2.0 |
| eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, globals | MIT        |
| prettier                                                                  | MIT        |
| @types/react, @types/react-dom, @types/node                               | MIT        |

## Data sources

- **Token table.** The table of TI-83/84 token byte values in `src/core/tokens` was assembled by hand from public
  documentation (the TI-Basic Developer wiki and the behaviour of files in the wild) and cross-checked against
  the community sheet in `TI-Toolkit/tokens`. That repository carries no explicit license, so **nothing was copied
  from it**; it was used only to double-check byte values (facts), and only on the developer's machine.
- **Fonts.** Both pixel fonts (the 5 × 7 large font and the variable-width small font) were drawn for this
  project. No TI font data is used.
- **Algorithms.** Distribution functions follow textbook algorithms (Lanczos gamma, series/continued-fraction
  incomplete gamma and beta from standard numerical references, Wichura's AS241 inverse normal). The random
  number generator is L'Ecuyer's published combined generator.
