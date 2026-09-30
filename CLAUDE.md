# CLAUDE.md — notes for future agent sessions

**Read `docs/SPEC.md` first.** It is the source of truth for the whole project (a free, TI-84 Plus compatible
graphing calculator for the browser). Then read `docs/PLAN.md` (checklist), `docs/DECISIONS.md`, `docs/STATUS.md`
and `docs/ARCHITECTURE.md`.

## Commands

| Command            | What it does                                                                      |
| ------------------ | --------------------------------------------------------------------------------- |
| `npm run dev`      | Vite dev server on 0.0.0.0:5173                                                   |
| `npm run check`    | typecheck + lint + unit tests + build (must pass before every merge)              |
| `npm test`         | Vitest unit tests (`src/**/*.test.ts`)                                            |
| `npm run test:e2e` | builds, then Playwright (Chromium, WebKit, phone viewport) against `vite preview` |
| `npm run format`   | Prettier                                                                          |

Sandbox note: Playwright's browser downloads are blocked there. `/home/user/tools/e2e.sh` (not in the repo) runs the
e2e suite with a Chromium from npm and skips WebKit; it is recreated by the snippet in `docs/DECISIONS.md` if lost.

## Architecture map

See `docs/ARCHITECTURE.md`. Short version: `src/core` is headless (no DOM, no browser globals — ESLint enforces it),
`src/ui` is a thin React shell that forwards key presses to the core and paints a 96×64 framebuffer.

## Conventions

- TypeScript strict; **no `any` in `src/core`**; no `eval` / `new Function` anywhere.
- Reals are `decimal.js` values at 14 significant digits (`src/core/numbers`). Never use binary floats for user-visible math.
- Tokens are 16-bit codes that equal the `.8xp` bytes. Input is tokens, never characters.
- The product name comes from `src/core/brand.ts` only.
- Clean-room rule: no TI ROM, code, text, art, icons or fonts. Functional names (menus, commands, errors) must match hardware; decoration must be original.
- Log every judgement call as one line in `docs/DECISIONS.md`; log every known difference from hardware in `docs/STATUS.md`.
- Branching: work happens on the session branch; see the first entry of `docs/DECISIONS.md`.
- Acceptance tests use the key-id helper (`2ND SQR 2 ENTER`) against `Calculator.press()` and `screenText()`.
