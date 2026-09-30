# Plan

Checklist of every milestone and feature in `docs/SPEC.md`. An item is checked only after its tests pass.
Legend: `[x]` done and tested · `[ ]` open · `[~]` partly done (see STATUS.md).

## M0 Scaffold

- [x] Vite + React + TypeScript (strict) + Tailwind + ESLint + Prettier + Vitest + Playwright + vite-plugin-pwa
- [x] Scripts: dev, build, preview, check, test, test:e2e
- [~] GitHub Actions workflow (check + e2e on PRs and pushes to main) — written, but the push token cannot create `.github/workflows` (see STATUS.md)
- [x] LICENSE, README with disclaimer, THIRD_PARTY_NOTICES, CLAUDE.md
- [x] docs: SPEC, PLAN, DECISIONS, STATUS, ARCHITECTURE
- [x] Placeholder calculator face with blank LCD

## M1 Engine (no UI)

- [ ] numbers: 14-digit reals, range/overflow/underflow, complex, formatting (Float, Fix 0-9, Sci, Eng, a+bi, re^θi)
- [ ] tokens: table with ids, display text, source key/menu, .8xp bytes
- [ ] text: tokenizer (plain text -> tokens) and detokenizer
- [ ] editor: entry tree model with flat serialisation
- [ ] parser: TI precedence, implied multiplication, Ans insertion, syntax errors with positions
- [ ] eval: reals, complex, lists, matrices, strings; variables A-Z θ, Ans, STO, L1-L6 + named lists, [A]-[J], Str0-Str9, Y1-Y0
- [ ] MATH menu functions (MATH, NUM, CPX, PRB)
- [ ] TEST menu (relations, logic)
- [ ] ANGLE menu
- [ ] LIST menu functions (OPS, MATH)
- [ ] MATRIX menu functions
- [ ] string functions (sub, length, inString, expr, Equ►String, String►Equ, +)
- [ ] nDeriv, fnInt, fMin, fMax, summation Σ(, solve(
- [ ] rand family with L'Ecuyer generator (rand, randInt, randNorm, randBin, randIntNoRep, randM)
- [ ] typed errors with names and token positions
- [ ] every §8 engine test passes

## M2 OS shell and home screen

- [ ] 96×64 framebuffer, large 5×7 font (original), small variable-width font (original)
- [ ] 50 keys with 2nd / ALPHA / A-LOCK, cursor shapes, insert/overwrite, auto-repeat on arrows and DEL
- [ ] home screen: entries, results, scrolling, ENTER re-run, ▲ history + paste, 2nd ENTRY, CLEAR, Done, busy indicator, 2nd QUIT
- [ ] Ans insertion for leading binary operators / postfix
- [ ] menu system: MATH, TEST, ANGLE, LIST, VARS, CATALOG, MEM (exact contents/numbering, ↑/↓ markers, digit and ALPHA selection)
- [ ] MODE screen, all rows
- [ ] error screens with Quit / Goto
- [ ] physical keyboard mapping + help panel
- [ ] saved state across reloads (IndexedDB, versioned schema)
- [ ] calculator face with craft (2nd / ALPHA colours, pressed state, aria labels)
- [ ] every §8 keystroke test (K1-K13) passes

## M3 Graphing

- [ ] Y= editor (Y1-Y9, Y0, selection, 7 styles, Plot1-3 row)
- [ ] WINDOW, FORMAT
- [ ] ZOOM (all items) and ZOOM MEMORY
- [ ] graph screen: axes, ticks, grid, labels, connected/dot, Xres, styles, shading patterns
- [ ] free-moving cursor, TRACE (panning, X= entry, ExprOn)
- [ ] CALC: value, zero, minimum, maximum, intersect, dy/dx, ∫f(x)dx
- [ ] TABLE + TBLSET (Auto/Ask)
- [ ] Horiz and G-T split screens
- [ ] DRAW menus (home screen + interactive), Pic0-9, GDB0-9
- [ ] Y-VARS and graph-related VARS menus
- [ ] Par, Pol, Seq modes (editors, window variables, Seq formats Time/Web/uv/vw/uw)
- [ ] Sequential vs Simul
- [ ] every §8 graphing test passes

## M4 Lists and statistics

- [ ] STAT EDIT list editor (insert/name lists, formulas in quotes, SetUpEditor, ClrList, SortA/SortD with dependents)
- [ ] 14 STAT CALC commands (freq lists, RegEQ, RESID, store to Y=, diagnostics)
- [ ] STAT PLOT (3 plots, 6 types, 3 marks), ZoomStat, trace plots
- [ ] 18 STAT TESTS (input screens, Calculate and Draw)
- [ ] 16 DISTR functions + 4 DISTR DRAW commands
- [ ] stat wizards ON/OFF
- [ ] VARS Statistics menu (XY, Σ, EQ, TEST, PTS)
- [ ] every §8 stats test passes

## M5 Editors, solvers, apps

- [ ] MATRIX editor (up to 99×99)
- [ ] equation Solver screen (bound, left-rt, ALPHA SOLVE)
- [ ] APPS menu
- [ ] Finance app (TVM Solver + every Finance function and variable)
- [ ] PolySys (polynomial roots degree 1-10, linear systems up to 10×10)
- [ ] every §8 app test passes

## M6 TI-BASIC

- [ ] PRGM EXEC / EDIT / NEW, program editor (":" prefixes, paste from menus, insert/delete lines, scrolling, names with auto A-LOCK)
- [ ] interpreter: every CTL and I/O command, DRAW / mode / format commands, subprograms, getKey, Menu(, ERR:BREAK on ON (Goto opens editor)
- [ ] block stack + forward scan runtime model, Goto into/out of blocks
- [ ] program speed setting (Hardware-like / Max), calibration logged
- [ ] every §8 program test passes

## M7 MathPrint

- [ ] 2D editing with every template (n/d, Un/d, ^, √, x√, abs, logBASE, Σ, nDeriv, fnInt), cursor movement
- [ ] 2D rendering of entries and answers, horizontal scrolling
- [ ] ALPHA F1 (FRAC) and ALPHA F2 (FUNC) menus
- [ ] n/d vs Un/d, ANSWERS AUTO/DEC/FRAC, MathPrint ↔ Classic

## M8 Files, memory, offline, polish

- [ ] .8xp import/export with checksums, byte-exact round trip; .8xl, .8xm; plain-text import/export; untrusted-file hardening
- [ ] LINK screen (SEND / RECEIVE) and drag-and-drop
- [ ] JSON backup and restore
- [ ] MEM: About, Mem Mgmt/Del, Clear Entries, ClrAllLists, Archive/UnArchive, Reset, Group…
- [ ] Clock functions and SET CLOCK
- [ ] 2nd ON / ON, contrast via 2nd ▲/▼
- [ ] PWA (installable, offline, original icons)
- [ ] accessibility (aria-labels, live region, focus, contrast, reduced motion)
- [ ] settings panel (speed, contrast, haptics, key click, theme, backup/restore, import, reset)
- [ ] extras: Ctrl+V paste, copy answer, save PNG, copy screen text
- [ ] responsive layout, pointerdown keys, no double-tap zoom / selection / long-press menus
- [ ] page title, meta description, social preview image
- [ ] finished README

## M9 Final QA

- [ ] parser fuzz test
- [ ] budgets: key→repaint < 16 ms, graph redraw < 50 ms, Lighthouse ≥ 90 perf / ≥ 95 a11y, JS < 400 KB gzipped
- [ ] walk PLAN.md line by line, STATUS.md honest
- [ ] final merge
