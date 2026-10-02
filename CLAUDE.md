# CLAUDE.md — notes for future agent sessions

**Read `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (entries tagged R1), `docs/STATUS.md` and `docs/PLAN.md` first.**
Vertex is a free TI-84 Plus CE calculator for the browser. It runs CEmu (GPLv3) compiled to WebAssembly with a ROM from the
visitor's own calculator. `docs/SPEC.md` describes the older from-scratch engine plan, which was replaced by this design.

## Commands

| Command                  | What it does                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `npm run dev`            | Vite dev server on 0.0.0.0:5173                                                              |
| `npm run check`          | typecheck + lint + unit tests + build + forbidden-content scan (before every merge)          |
| `npm test`               | Vitest unit tests (`src/**/*.test.ts`), including the real CEmu WebAssembly build            |
| `npm run test:e2e`       | builds, then Playwright (Chromium, Firefox, WebKit, phone viewport) on `vite preview`        |
| `npm run gen:pages`      | regenerates the 27 HTML pages, `_headers`, `vercel.json`, robots and sitemap from `src/site` |
| `npm run build:emulator` | rebuilds `emulator/dist` and the source archive from the pinned CEmu commit                  |
| `npm run scan`           | fails if the repo, the build or the source archive holds a ROM, OS image, TI art or TI host  |
| `npm run format`         | Prettier                                                                                     |

Sandbox note: Playwright's browser downloads are blocked there. Set `VERTEX_CHROMIUM_PATH` to a Chromium binary and
`VERTEX_SKIP_FIREFOX=1 VERTEX_SKIP_WEBKIT=1` to run the suite. Never download, search for or commit a calculator ROM.

## Architecture map

See `docs/ARCHITECTURE.md`. Short version: `emulator/` is CEmu plus a C adapter (GPLv3, own folder), `src/calculator` is the
React calculator page (worker, keypad, ROM panel, zoom), `src/site` generates the nine-language static pages, and
`src/core` holds only the brand name and the key table (headless, ESLint enforces no DOM there).

## Conventions

- TypeScript strict; **no `any` in `src/core`**; no `eval` / `new Function` anywhere.
- The calculator is CEmu. Never hand-roll calculator math. Never download, search for, bundle or commit a ROM or OS image.
- Key positions come from CEmu's `keymap.cpp` (`KEY_MATRIX` in `src/core/os/keys.ts`). Where anything disagrees, CEmu wins.
- Everything is self-hosted. No request to any third-party origin, none to TI or Pearson. Strict CSP (`src/site/csp.ts`).
- Copy rules, in every language: active voice, simple words, no em dashes, no semicolons, no filler. `copy.test.ts` checks it.
- The product name comes from `src/core/brand.ts` only.
- Clean-room rule: no TI ROM, code, text, art, icons, logo or fonts. Functional names (menus, commands, errors) must match hardware; decoration must be original.
- Log every judgement call as one line in `docs/DECISIONS.md`; log every known difference from hardware in `docs/STATUS.md`.
- Branching: the redesign lives on `ti84-redesign`. Never push to `main`. See the first R1 entry of `docs/DECISIONS.md`.
- Key tests drive the real CEmu keypad through `src/test-support/harness.ts`. A synthetic fake ROM (`syntheticRom.ts`, no TI code) stands in for a real one.
