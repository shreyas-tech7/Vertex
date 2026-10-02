> **Superseded in part (branch `ti84-redesign`).** The calculator is no longer a from-scratch engine. Vertex now runs
> CEmu, an open source TI-84 Plus CE emulator, compiled to WebAssembly, with a ROM from the visitor's own calculator.
> Sections 3 to 8 below describe the original from-scratch plan and are kept for history. `docs/DECISIONS.md` (entries
> tagged R1), `docs/ARCHITECTURE.md` and `docs/STATUS.md` describe what is built now.

# Build Vertex: a free, TI-84 Plus compatible graphing calculator

You're an autonomous coding agent working in a git repository. Your job is to build a free web app that works like a TI-84 Plus graphing calculator. Someone who knows the real calculator should be able to press the same keys in the same order and get the same result: arithmetic, graphs, tables, statistics, matrices, and their own TI-BASIC programs. It runs in any modern browser, works offline, costs nothing, and has no ads, accounts, or tracking.

This document is long on purpose. It's your spec. Work through all of it.

## 0. How you work

1. **Don't ask questions.** Not me, not anyone. Don't stop to confirm a plan, choose between options, or ask permission to keep going. When something is unclear, do what a real TI-84 Plus running OS 2.55MP does. If you can't pin that down, do what a student would expect. Log the call as one line in `docs/DECISIONS.md` (what came up, what you chose, why) and keep going.
2. Before writing any code, save this entire prompt word for word as `docs/SPEC.md` and commit it. If it's already a file in the repo, move it there. Re-read it whenever your context gets long or compacted. It's the source of truth.
3. Track every milestone and feature from this spec in `docs/PLAN.md` as a checklist. Check an item off only after its tests pass.
4. Squash and merge each milestone into the repo's default branch (section 5), then start the next one right away. Don't end the session between milestones.
5. Commit and push work in progress often so nothing is lost if the session stops.
6. Be honest. Never say a test passed unless you ran it and watched it pass. Never invent output. Anything unfinished, or anything that behaves differently from the real calculator, goes in `docs/STATUS.md`.
7. Look at your own work. Before each merge, take Playwright screenshots at phone and desktop sizes and check them.
8. Don't delete or rewrite unrelated files. If the repo already has a start on this calculator, read it and build on it. If the repo has no commits yet, make an initial commit on `main` first. If a `CLAUDE.md` exists, update it instead of replacing it.
9. If your environment supports parallel subagents, you can hand them self-contained modules like the distributions library or the .8xp reader. You still own integration, tests, and every merge.

## 1. Legal ground rules

This is a clean-room reimplementation, not an emulator.

- Never download, bundle, load, or link to a TI ROM, OS file, or disassembly. Don't build Z80 emulation or a "bring your own ROM" feature.
- Never copy TI's code, text, images, icons, fonts, or manuals into the repo. You can read TI's public guidebook and community references like the TI-Basic Developer wiki to learn how things behave. Behavior is fair game. Their words and art aren't.
- Keep the functional parts identical, since keystroke compatibility is the whole point: key positions and labels, menu names, menu order and numbering, command and error names, screen resolution, and math behavior.
- Make the decorative parts original: app name, logo, icon, case shape, color palette, textures, and both pixel fonts. No TI logo, and no "Texas Instruments" or "TI-84 Plus" wordmark on the calculator face.
- Keep one convention students rely on: 2nd labels share the 2nd key's color, and ALPHA labels share the ALPHA key's color. Pick your own two colors.
- The working name is **Vertex**. Keep it in one constant so it's easy to rename.
- The README and the About screen say: "Vertex is an independent project. It is not affiliated with or endorsed by Texas Instruments. TI-84 Plus is a trademark of Texas Instruments." Calling it "TI-84 Plus compatible" is fine.
- License the code MIT. Only use dependencies with permissive licenses (MIT, BSD, ISC, Apache 2.0), and list them in `THIRD_PARTY_NOTICES.md`.

## 2. The target

Match a **TI-84 Plus (monochrome) running OS 2.55MP**, the last OS for that model.

- LCD: 96 × 64 pixels, 1 bit. The home screen is 16 columns by 8 rows of large-font text (5 × 7 glyphs in 6 × 8 cells). A small variable-width font handles Text(, graph readouts, and prompts on the graph screen.
- Graph area: pixel columns 0 to 94 and rows 0 to 62. ΔX = (Xmax − Xmin)/94 and ΔY = (Ymax − Ymin)/62, so ZDecimal gives ΔX = ΔY = .1 exactly.
- Pxl-On( and the other pixel commands take row 0 to 62 and column 0 to 94. Output( takes row 1 to 8 and column 1 to 16.
- MathPrint is the default mode. Classic mode has to work too.

Out of scope: TI-84 Plus CE features (color, Python), TI Flash apps other than Finance (Cabri Jr, CellSheet, Conics, and the rest), assembly programs (make Asm( and AsmPrgm raise ERR:INVALID), Press-to-Test, and real link cables.

## 3. Stack (already decided)

- TypeScript in strict mode. No `any` in `src/core`.
- Vite, React, and Tailwind CSS, current stable versions. There's no server, so this is a static Vite app rather than Next.js. It deploys to Vercel's free tier as a static site.
- decimal.js for real arithmetic at 14 significant digits.
- Vitest for unit tests. Playwright for end-to-end tests in Chromium and WebKit, plus one phone viewport.
- vite-plugin-pwa for the manifest and service worker.
- IndexedDB for saved state (idb-keyval is fine).
- npm on the current Node LTS. ESLint and Prettier (keep any config the repo already has).
- No backend, analytics, cookies, or third-party requests after load. No `eval` or `new Function` anywhere. You're writing an interpreter, so interpret.

## 4. Architecture

A headless core plus a thin UI shell. The core has zero DOM imports, so every feature runs in Node tests.

```
src/core/
  numbers/   14-digit decimal reals, complex values, range and overflow, formatting for every mode
  tokens/    one table for every TI-84 Plus token: id, display text, source key or menu, .8xp bytes
  text/      tokenizer from plain text (like sin(30)→A) to tokens, and back
  editor/    the entry model (a tree, see below)
  parser/    tokens to AST with TI precedence and quirks (section 7)
  eval/      evaluator, variable store, function library, expression compiler
  calculus/  nDeriv, fnInt, fMin, fMax, summation, solve
  matrix/    matrix math
  stats/     regressions, tests, intervals, distributions
  finance/   TVM and cash flow functions
  graph/     window math, all four graph modes, zoom, trace, CALC, DRAW, stat plots
  lcd/       96 × 64 framebuffer, both fonts, text layout, MathPrint 2D layout
  os/        the calculator OS as a state machine: screens, menus, editors, modes, errors
  basic/     the TI-BASIC interpreter
  io/        saved state, JSON backup, .8xp/.8xl/.8xm and plain-text import and export
src/ui/      React shell: keypad, LCD canvas, keyboard mapping, settings, help, live region
```

Rules:
- The OS is a deterministic state machine. `press(key)` updates state, `render(fb)` draws the current screen into the framebuffer, and `tick(ms)` drives the cursor blink and running programs. Inject the clock and the random seed so tests repeat exactly.
- Expose `screenText()`, which returns the home screen as 8 strings of 16 characters (linearized in MathPrint mode). It uses the same characters as this spec: ⁻ for negation, E for the exponent marker, → for STO, ► for conversions. Tests and the screen reader output use it.
- Input is tokens, not characters. "sin(" is one token. The cursor moves by whole tokens and DEL removes a whole token.
- Build the entry model as a tree from day one: a row of tokens where some items are templates holding child rows (fraction, mixed number, exponent, √, x√, abs, logBASE, summation, nDeriv, fnInt). Classic mode never creates templates. Everything serializes to flat tokens for storage, programs, and file export.
- Token byte values can come from an openly licensed community token table. Record its license. Otherwise build the table from public documentation.
- The UI never does math. It sends key presses to the core and paints the framebuffer.
- Paint the LCD to a canvas at an integer scale with crisp pixels (`image-rendering: pixelated`), accounting for devicePixelRatio. Use your own LCD colors and support contrast levels.
- Compile parsed expressions to cached closures. Graphs, tables, and stats evaluate the same expression thousands of times.
- Programs run as a resumable step machine on the main thread. Run in slices of about 8 ms, then yield so input and painting keep working. That covers getKey, Pause, Input, Menu(, and the ON key without a Web Worker.

## 5. Git: branch, PR, squash and merge

Find the default branch first (`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`, or `git symbolic-ref refs/remotes/origin/HEAD`). Then for each milestone:

1. Branch from the latest default branch: `feat/m<N>-<short-name>`.
2. Commit in small steps with conventional messages (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
3. Run `npm run check` (typecheck, lint, unit tests, build) and `npm run test:e2e`. Both must pass.
4. Push and open a PR: `gh pr create --fill --base <default>`.
5. Wait for CI with `gh pr checks --watch` and fix anything red. If the remote has no CI checks, your local runs from step 3 count.
6. Squash and merge: `gh pr merge --squash --delete-branch`, with a squash title like `feat: M3 graphing (func mode, zoom, trace, calc, table)`.
7. Pull the default branch and start the next milestone.

Fallbacks. Use them without asking:
- No `gh` or no GitHub auth: `git checkout <default> && git merge --squash feat/m<N>-<short-name> && git commit`, then `git push`.
- No remote at all: squash merge locally and keep going.
- Branch protection blocks the merge: turn on auto-merge with `gh pr merge --squash --auto` if the repo allows it. Keep the remaining work on that one branch and PR, and note it in `docs/STATUS.md`.
- Never bypass protection rules, never force-push the default branch, and never commit secrets.

If the repo deploys on merge (Vercel or similar), every merge ships. The default branch must always build.

## 6. Milestones

Do them in order. Each one ends with passing tests, updated docs and PLAN.md, and a squash merge.

**M0: Scaffold.** Vite, React, TypeScript, Tailwind, ESLint, Prettier, Vitest, Playwright, vite-plugin-pwa. Scripts: `dev`, `build`, `preview`, `check`, `test`, `test:e2e`. A GitHub Actions workflow that runs `check` and `test:e2e` on PRs and on pushes to the default branch. LICENSE (MIT), a README with the disclaimer, THIRD_PARTY_NOTICES.md, a `CLAUDE.md` for future agent sessions (commands, architecture map, conventions, and "read docs/SPEC.md first"), and `docs/` with SPEC, PLAN, DECISIONS, STATUS, and ARCHITECTURE. A placeholder calculator face with a blank LCD.

**M1: Engine, no UI.** The number type and formatting for every mode setting, the token table, the text tokenizer, the editor tree, the parser, and evaluation of reals, complex numbers, lists, matrices, and strings. Every function in the MATH, TEST, ANGLE, LIST, and MATRIX menus, the string functions (sub(, length(, inString(, expr(, Equ►String(, String►Equ(, and + for joining), nDeriv(, fnInt(, fMin(, fMax(, summation Σ(, solve(, and the rand family. Variables A to Z and θ, Ans, STO→, L1 to L6 and named lists, [A] to [J], Str0 to Str9, and Y1 to Y0 as callable functions (Y1(2)). Errors are typed values with a name and a token position. Every engine test in section 8 passes.

**M2: OS shell and home screen.** All 50 keys with 2nd, ALPHA, and A-LOCK, the cursor shapes, insert and overwrite, and auto-repeat on arrows and DEL. The full home screen (section 7). The menu system with the MATH, TEST, ANGLE, LIST, VARS, CATALOG, and MEM menus. The MODE screen with every setting. Error screens with Quit and Goto. Physical keyboard mapping and a help panel. Saved state that survives reloads. Give the calculator face real craft: depth, crisp readable labels, a clear pressed state, and proportions that feel like a calculator in your hand. If a frontend design skill is available, use it. Every keystroke test in section 8 passes.

**M3: Graphing.** The Y= editor (Y1 to Y9 and Y0, selection, all seven styles, and the Plot1 Plot2 Plot3 row), WINDOW, FORMAT, every ZOOM item and the ZOOM MEMORY menu, the free-moving cursor, TRACE, all seven CALC items, TABLE and TBLSET (Auto and Ask), Horiz and G-T split screens, the DRAW menus (from the home screen and interactively from the graph screen), Pic0 to Pic9 and GDB0 to GDB9, Y-VARS, and the graph-related VARS menus. Then Par, Pol, and Seq modes with their editors and window variables, plus the Seq formats Time, Web, uv, vw, and uw. Connected and Dot. Sequential and Simul. Every graphing test in section 8 passes.

**M4: Lists and statistics.** The STAT EDIT list editor (inserting and naming lists, formulas attached in quotes, SetUpEditor, ClrList, and SortA( and SortD( with dependent lists). All 14 STAT CALC commands with frequency lists, RegEQ, RESID, storing to a Y= variable, and diagnostics. STAT PLOT (Plot1 to Plot3, six types, three marks), ZoomStat, and tracing plots. All 18 STAT TESTS with their input screens and both Calculate and Draw. All 16 DISTR functions and the 4 DISTR DRAW commands. Stat wizards when STAT WIZARDS is ON, and plain pasting when it's OFF. The VARS Statistics menu (XY, Σ, EQ, TEST, PTS). Every stats test in section 8 passes.

**M5: Editors, solvers, apps.** The MATRIX editor (up to 99 × 99). The equation Solver screen (bound, left-rt, and ALPHA SOLVE). The APPS menu with 1:Finance (the TVM Solver plus every Finance function and variable) and 2:PolySys, your own original app: a polynomial root finder (degree 1 to 10, real and complex roots) and a linear system solver (up to 10 × 10, reporting one solution, none, or infinitely many in parametric form). Every app test in section 8 passes.

**M6: TI-BASIC.** PRGM EXEC, EDIT, and NEW. The program editor (":" line prefixes, pasting from menus, inserting and deleting lines, scrolling, and names up to 8 characters typed with automatic A-LOCK). The interpreter with every CTL and I/O command, all DRAW, mode, and format commands, subprograms, getKey, Menu(, and ERR:BREAK on ON, where Goto opens the editor at that line. A program speed setting: Hardware-like (the default, approximating real 84 Plus pacing so games stay playable) and Max. Log your calibration in DECISIONS.md. Tests run programs at Max. Every program test in section 8 passes.

**M7: MathPrint.** 2D editing with every template, cursor movement between slots, and templates opened by the same keys as on hardware (^ opens an exponent slot and ► leaves it). 2D rendering of entries and answers, with horizontal scrolling for wide expressions. The ALPHA F1 shortcut menu (FRAC: n/d, Un/d, ►F◄►D, ►n/d◄►Un/d) and ALPHA F2 (FUNC: summation Σ(, nDeriv(, fnInt(, logBASE(). Match OS 2.55MP for F3 to F5 if you know it, otherwise make them do nothing and log it. The n/d and Un/d modes, ANSWERS AUTO, DEC, and FRAC, and switching between MathPrint and Classic.

**M8: Files, memory, offline, polish.**
- Import and export .8xp programs with correct checksums. Unchanged programs round-trip byte for byte. Also .8xl lists and .8xm matrices. Tokens that only show up in imported programs (lowercase letters, for example) display correctly. Import TI-BASIC from plain text, like code copied from a website, and export programs as text. Treat every file as untrusted: cap sizes, check bounds, and reject garbage cleanly.
- LINK (2nd X,T,θ,n) maps to files: SEND exports chosen variables and RECEIVE opens a file picker. Dragging files onto the page works too.
- Whole-calculator backup and restore as a JSON file.
- MEM: About (Vertex name, version, disclaimer), Mem Mgmt/Del with sizes computed the TI way (9 bytes per real, 18 per complex, 2 + 9n per list, 2 + 9rc per matrix, token bytes per program), Clear Entries, ClrAllLists, Archive and UnArchive (archived items can't be edited or run: ERR:ARCHIVED), Reset (All RAM and Defaults) with confirmation screens like hardware, and Group… (bundles chosen variables into one export file).
- Clock: SET CLOCK, getTime, getDate, getDtStr(, getTmStr(, startTmr, checkTmr(, dayOfWk(, timeCnv(, isClockOn, ClockOn, ClockOff, setDate(, and setTime(. Use the device clock plus a stored offset.
- 2nd ON blanks the screen and ON brings it back. 2nd ▲ and 2nd ▼ change contrast.
- PWA: installable and fully offline after the first load, with original icons.
- Accessibility: every key is a real button with an aria-label that names its 2nd and ALPHA functions. A polite live region announces new results, errors, and the highlighted menu item. Visible focus, WCAG AA contrast outside the LCD, and respect for prefers-reduced-motion.
- A settings panel outside the calculator: program speed, contrast, haptics on phones, key click sound (off by default), page theme, backup and restore, file import, and reset.
- Extras: Ctrl+V pastes plain-text expressions as tokens, and there are buttons to copy the last answer, save the LCD as a PNG, and copy the screen as text.
- Responsive layout for phones, tablets, and desktop. Keys fire on pointerdown, touch targets are comfortable, and keys never trigger double-tap zoom, text selection, or long-press menus.
- A page title, meta description, and an original social preview image.
- A finished README: features, keyboard shortcuts, running locally, deploying, the disclaimer, and the license.

**M9: Final QA.**
- Run everything. Add a parser fuzz test: thousands of random token sequences each produce a value or a proper TI error, never a crash or a hang.
- Hit these budgets: key press to repaint under 16 ms, full graph redraw under 50 ms, Lighthouse mobile scores of 90 or more for performance and 95 or more for accessibility, and JavaScript under 400 KB gzipped.
- Walk PLAN.md line by line. Anything unchecked gets an honest entry in STATUS.md.
- Final squash merge.

## 7. Behavior reference

Notation: key ids are in `CODE`. In expressions and results, ⁻ is the negation sign from the (−) key and - is subtraction. If a detail here conflicts with something you're certain OS 2.55MP does, follow the OS and log it.

### Keys

The five top-row keys are smaller. The next two rows hold 2ND, MODE, DEL and ALPHA, XTTN, STAT on the left, with the four arrows in a diamond on the right. Every row below that has five keys. ON sits bottom left and ENTER bottom right.

| id | key | 2nd | ALPHA | getKey |
|---|---|---|---|---|
| YEQ | Y= | STAT PLOT | F1 | 11 |
| WINDOW | WINDOW | TBLSET | F2 | 12 |
| ZOOM | ZOOM | FORMAT | F3 | 13 |
| TRACE | TRACE | CALC | F4 | 14 |
| GRAPH | GRAPH | TABLE | F5 | 15 |
| 2ND | 2nd | | | 21 |
| MODE | MODE | QUIT | | 22 |
| DEL | DEL | INS | | 23 |
| LEFT | ◄ | | | 24 |
| UP | ▲ | contrast + | | 25 |
| RIGHT | ► | | | 26 |
| ALPHA | ALPHA | A-LOCK | | 31 |
| XTTN | X,T,θ,n | LINK | | 32 |
| STAT | STAT | LIST | | 33 |
| DOWN | ▼ | contrast − | | 34 |
| MATH | MATH | TEST | A | 41 |
| APPS | APPS | ANGLE | B | 42 |
| PRGM | PRGM | DRAW | C | 43 |
| VARS | VARS | DISTR | | 44 |
| CLEAR | CLEAR | | | 45 |
| INV | x⁻¹ | MATRIX | D | 51 |
| SIN | SIN | SIN⁻¹ | E | 52 |
| COS | COS | COS⁻¹ | F | 53 |
| TAN | TAN | TAN⁻¹ | G | 54 |
| POW | ^ | π | H | 55 |
| SQR | x² | √ | I | 61 |
| COMMA | , | EE | J | 62 |
| LPAREN | ( | { | K | 63 |
| RPAREN | ) | } | L | 64 |
| DIV | ÷ | e | M | 65 |
| LOG | LOG | 10^x | N | 71 |
| 7 | 7 | u | O | 72 |
| 8 | 8 | v | P | 73 |
| 9 | 9 | w | Q | 74 |
| MUL | × | [ | R | 75 |
| LN | LN | e^x | S | 81 |
| 4 | 4 | L4 | T | 82 |
| 5 | 5 | L5 | U | 83 |
| 6 | 6 | L6 | V | 84 |
| SUB | − | ] | W | 85 |
| STO | STO→ | RCL | X | 91 |
| 1 | 1 | L1 | Y | 92 |
| 2 | 2 | L2 | Z | 93 |
| 3 | 3 | L3 | θ | 94 |
| ADD | + | MEM | " | 95 |
| ON | ON | OFF | | none (breaks programs) |
| 0 | 0 | CATALOG | space | 102 |
| DOT | . | i | : | 103 |
| NEG | (−) | ANS | ? | 104 |
| ENTER | ENTER | ENTRY | SOLVE | 105 |

### Modifiers and cursor

- 2nd and ALPHA each apply to the next key only. Pressing the same modifier again cancels it. 2nd then ALPHA sets A-LOCK, which stays on until ALPHA is pressed.
- Cursor shapes: a blinking solid block (overwrite), an underline (insert), a block with ↑ (2nd pending), and a block with A (ALPHA or A-LOCK).
- Overwrite is the default. 2nd INS switches to insert.
- Naming a program turns on A-LOCK automatically. In CATALOG, a letter key jumps straight to that letter.
- Arrows and DEL repeat while held.

### Parsing and order of operations

From tightest to loosest:
1. Parentheses, and function tokens that include their open paren, like sin(, √(, log(
2. Postfix operators: ², ³, ⁻¹, !, °, ', r, ᵀ
3. ^ and x√, left to right, so 2^3^2 = 64
4. Negation, so ⁻3² = ⁻9 and ⁻2^2 = ⁻4. Negation can still start an operand: 2^⁻2 = .25
5. nPr and nCr
6. ×, ÷, and implied multiplication on one level, left to right, so 6/2(1+2) = 9
7. + and -
8. =, ≠, >, ≥, <, ≤, which return 1 or 0
9. and
10. or and xor
11. STO→, which stores the value of everything to its left

More rules:
- Display conversions (►Frac, ►Dec, ►DMS, ►Rect, ►Polar, ►F◄►D, ►n/d◄►Un/d) apply to the whole expression and only go at the end.
- Implied multiplication applies between a number and a variable, constant, function, or paren, between parens, between two variables (AB means A×B), and after a postfix operator.
- Using (−) where subtraction belongs, like `3 NEG 2`, is ERR:SYNTAX. It's the most common student mistake, so it has to behave exactly like hardware.
- Missing close parens are fine at the end of an expression and right before STO→. A missing closing quote is fine at the end of a line.
- Starting a home screen entry with a binary operator or a postfix function inserts Ans first (SUB gives "Ans-"). Starting with NEG doesn't.
- EE writes powers of ten: 2E3 = 2000, and E3 alone = 1000.
- ° and r override the angle mode: sin(30°) = .5 in Radian mode.
- ! takes integers and multiples of .5 from ⁻.5 to 69.
- In Real mode, a negative base raised to a fraction with an odd denominator stays real: (⁻8)^(1/3) = ⁻2.
- Program-only commands (If, For(, Lbl, and the rest of CTL) give ERR:INVALID on the home screen.

### Numbers and display

- Arithmetic uses 14 significant decimal digits, never binary floats, so repeating decimals round the way hardware does.
- Range: magnitudes from 1E⁻99 up to just under 1E100. Anything at or above 1E100 is ERR:OVERFLOW. Anything smaller than 1E⁻99 becomes 0.
- Float shows up to 10 significant digits, drops trailing zeros, and drops the leading zero (.5 and ⁻.25). It switches to scientific notation when |x| ≥ 1E10 or 0 < |x| < .001.
- Fix 0 to 9 shows that many decimals and switches to scientific when a number won't fit.
- Sci always shows d.dddE±n. Eng keeps the exponent a multiple of 3.
- The E in results is its own small glyph. Negative results use the ⁻ glyph, never the - glyph.
- Classic mode shows × as * and ÷ as /.
- In Real mode a non-real result is ERR:NONREAL ANS, unless the input itself contains i. Then the answer shows as complex. The a+bi and re^θi modes show complex results in their own form.
- ►Frac hands back the decimal when no fraction within the OS denominator limit matches. Log the limit you use.
- Lists show as {1 2 3}. Matrices show as bracketed rows over several lines. Strings show as plain text.

### Errors

- An error takes over the screen: ERR:NAME on the top line, then 1:Quit, plus 2:Goto when there's a location. Goto puts the cursor at the error on the home screen or in the program editor.
- Use these names, which all fit in 16 columns: ERR:SYNTAX, ERR:DOMAIN, ERR:DIVIDE BY 0, ERR:OVERFLOW, ERR:NONREAL ANS, ERR:DATA TYPE, ERR:ARGUMENT, ERR:DIM MISMATCH, ERR:INVALID DIM, ERR:UNDEFINED, ERR:INVALID, ERR:WINDOW RANGE, ERR:INCREMENT, ERR:NO SIGN CHNG, ERR:BAD GUESS, ERR:BOUND, ERR:TOL NOT MET, ERR:ITERATIONS, ERR:SINGULAR MAT, ERR:SINGULARITY, ERR:STAT, ERR:STAT PLOT, ERR:BREAK, ERR:LABEL, ERR:ILLEGAL NEST, ERR:MEMORY, ERR:ARCHIVED, ERR:MODE, ERR:RESERVED.

### Home screen

- Entries print on the left and results print on the right of the next line. Eight lines, scrolling up when full. Classic mode wraps long entries. Results too wide for the screen end in … and scroll sideways when highlighted.
- ENTER on an empty line runs the last entry again.
- ▲ walks up through past entries and answers, and ENTER pastes the highlighted one into the current line.
- 2nd ENTRY cycles back through past entries. Keep at least 16.
- CLEAR empties the current line. CLEAR on an empty line blanks the screen.
- Commands that return nothing show Done.
- A small busy indicator animates in the top right while computing or running a program, and shows as dots while paused.
- 2nd QUIT returns to the home screen from anywhere.

### Menus

Menu titles run across the top line with the active one inverted. ◄ and ► switch tabs and wrap. ▲ and ▼ move and wrap. A digit, or ALPHA plus a letter, picks an item directly. When more items are hidden below, the colon on the last visible item becomes ↓, and when items are hidden above, the first visible colon becomes ↑. CLEAR or 2nd QUIT backs out. Items ending in … open a screen instead of pasting. In the program editor, everything pastes without running.

Exact contents, with tabs separated by |:
- MATH: MATH 1:►Frac 2:►Dec 3:³ 4:³√( 5:x√ 6:fMin( 7:fMax( 8:nDeriv( 9:fnInt( 0:summation Σ( A:logBASE( B:Solver… | NUM 1:abs( 2:round( 3:iPart( 4:fPart( 5:int( 6:min( 7:max( 8:lcm( 9:gcd( 0:remainder( A:►n/d◄►Un/d B:►F◄►D C:Un/d D:n/d | CPX 1:conj( 2:real( 3:imag( 4:angle( 5:abs( 6:►Rect 7:►Polar | PRB 1:rand 2:nPr 3:nCr 4:! 5:randInt( 6:randNorm( 7:randBin( 8:randIntNoRep(
- TEST: TEST 1:= 2:≠ 3:> 4:≥ 5:< 6:≤ | LOGIC 1:and 2:or 3:xor 4:not(
- ANGLE: 1:° 2:' 3:r 4:►DMS 5:R►Pr( 6:R►Pθ( 7:P►Rx( 8:P►Ry(
- STAT: EDIT 1:Edit… 2:SortA( 3:SortD( 4:ClrList 5:SetUpEditor | CALC 1:1-Var Stats 2:2-Var Stats 3:Med-Med 4:LinReg(ax+b) 5:QuadReg 6:CubicReg 7:QuartReg 8:LinReg(a+bx) 9:LnReg 0:ExpReg A:PwrReg B:Logistic C:SinReg D:Manual-Fit | TESTS 1:Z-Test… 2:T-Test… 3:2-SampZTest… 4:2-SampTTest… 5:1-PropZTest… 6:2-PropZTest… 7:ZInterval… 8:TInterval… 9:2-SampZInt… 0:2-SampTInt… A:1-PropZInt… B:2-PropZInt… C:χ²-Test… D:χ²GOF-Test… E:2-SampFTest… F:LinRegTTest… G:LinRegTInt… H:ANOVA(
- LIST: NAMES | OPS 1:SortA( 2:SortD( 3:dim( 4:Fill( 5:seq( 6:cumSum( 7:ΔList( 8:Select( 9:augment( 0:List►matr( A:Matr►list( B:∟ | MATH 1:min( 2:max( 3:mean( 4:median( 5:sum( 6:prod( 7:stdDev( 8:variance(
- DISTR: DISTR 1:normalpdf( 2:normalcdf( 3:invNorm( 4:invT( 5:tpdf( 6:tcdf( 7:χ²pdf( 8:χ²cdf( 9:Fpdf( 0:Fcdf( A:binompdf( B:binomcdf( C:poissonpdf( D:poissoncdf( E:geometpdf( F:geometcdf( | DRAW 1:ShadeNorm( 2:Shade_t( 3:Shadeχ²( 4:ShadeF(
- MATRIX: NAMES [A] to [J] | MATH 1:det( 2:ᵀ 3:dim( 4:Fill( 5:identity( 6:randM( 7:augment( 8:Matr►list( 9:List►matr( 0:cumSum( A:ref( B:rref( C:rowSwap( D:row+( E:*row( F:*row+( | EDIT
- PRGM from the home screen: EXEC | EDIT | NEW 1:Create New. Inside the program editor: CTL 1:If 2:Then 3:Else 4:For( 5:While 6:Repeat 7:End 8:Pause 9:Lbl 0:Goto A:IS>( B:DS<( C:Menu( D:prgm E:Return F:Stop G:DelVar H:GraphStyle( I:OpenLib( J:ExecLib | I/O 1:Input 2:Prompt 3:Disp 4:DispGraph 5:DispTable 6:Output( 7:getKey 8:ClrHome 9:ClrTable 0:GetCalc( A:Get( B:Send( | EXEC
- DRAW: DRAW 1:ClrDraw 2:Line( 3:Horizontal 4:Vertical 5:Tangent( 6:DrawF 7:Shade( 8:DrawInv 9:Circle( 0:Text( A:Pen | POINTS 1:Pt-On( 2:Pt-Off( 3:Pt-Change( 4:Pxl-On( 5:Pxl-Off( 6:Pxl-Change( 7:pxl-Test( | STO 1:StorePic 2:RecallPic 3:StoreGDB 4:RecallGDB
- VARS: VARS 1:Window… 2:Zoom… 3:GDB… 4:Picture… 5:Statistics… 6:Table… 7:String… | Y-VARS 1:Function… 2:Parametric… 3:Polar… 4:On/Off…
- ZOOM: ZOOM 1:ZBox 2:Zoom In 3:Zoom Out 4:ZDecimal 5:ZSquare 6:ZStandard 7:ZTrig 8:ZInteger 9:ZoomStat 0:ZoomFit A:ZQuadrant1 B:ZFrac1/2 C:ZFrac1/3 D:ZFrac1/4 E:ZFrac1/8 F:ZFrac1/10 | MEMORY 1:ZPrevious 2:ZoomSto 3:ZoomRcl 4:SetFactors…
- CALC: 1:value 2:zero 3:minimum 4:maximum 5:intersect 6:dy/dx 7:∫f(x)dx
- STAT PLOT: 1:Plot1… 2:Plot2… 3:Plot3… 4:PlotsOff 5:PlotsOn
- MEM: 1:About 2:Mem Mgmt/Del… 3:Clear Entries 4:ClrAllLists 5:Archive 6:UnArchive 7:Reset… 8:Group…
- APPS: 1:Finance… 2:PolySys
- Finance: CALC 1:TVM Solver… 2:tvm_Pmt 3:tvm_I% 4:tvm_PV 5:tvm_N 6:tvm_FV 7:npv( 8:irr( 9:bal( 0:ΣPrn( A:ΣInt( B:►Nom( C:►Eff( D:dbd( E:Pmt_End F:Pmt_Bgn | VARS 1:N 2:I% 3:PV 4:PMT 5:FV 6:P/Y 7:C/Y
- CATALOG: every command in alphabetical order, including catalog-only ones like AxesOff, DiagnosticOn, Func, and a+bi. A CATALOG help screen that shows each command's arguments is a nice bonus once everything else passes.

### MODE, FORMAT, TBLSET, WINDOW, ZOOM

MODE rows, default first:

```
NORMAL  SCI  ENG
FLOAT  0 1 2 3 4 5 6 7 8 9
RADIAN  DEGREE
FUNC  PAR  POL  SEQ
CONNECTED  DOT
SEQUENTIAL  SIMUL
REAL  a+bi  re^θi
FULL  HORIZ  G-T
MATHPRINT  CLASSIC
n/d  Un/d
ANSWERS: AUTO  DEC  FRAC
GO TO 2ND FORMAT GRAPH: NO  YES    (YES jumps to the FORMAT screen)
STAT DIAGNOSTICS: OFF  ON
STAT WIZARDS: ON  OFF
SET CLOCK                          (opens the clock screen)
```

Arrows move, ENTER selects, and the current choice shows inverted. Opening MODE from the program editor pastes mode commands (Radian, Fix 2, and so on) instead.

FORMAT, default first: RectGC PolarGC, CoordOn CoordOff, GridOff GridOn, AxesOn AxesOff, LabelOff LabelOn, ExprOn ExprOff. Seq mode adds Time Web uv vw uw at the top.

TBLSET: TblStart 0, ΔTbl 1, Indpnt Auto or Ask, Depend Auto or Ask.

WINDOW defaults: Xmin ⁻10, Xmax 10, Xscl 1, Ymin ⁻10, Ymax 10, Yscl 1, Xres 1. Par adds Tmin 0, Tmax 2π, Tstep π/24. Pol adds θmin 0, θmax 2π, θstep π/24. In Degree mode, ZStandard sets those to 360 and 7.5. Seq adds nMin 1, nMax 10, PlotStart 1, PlotStep 1.

Zooms:
- ZStandard: X and Y from ⁻10 to 10, scales 1.
- ZDecimal: X from ⁻4.7 to 4.7, Y from ⁻3.1 to 3.1, scales 1.
- ZTrig: X from ⁻47π/24 to 47π/24 (⁻352.5 to 352.5 in Degree), Xscl π/2 (90 in Degree), Y from ⁻4 to 4, Yscl 1.
- ZInteger: ΔX = ΔY = 1 centered where you press ENTER, scales 10.
- ZSquare: square pixels around the current center.
- Zoom In and Zoom Out: XFact = YFact = 4 by default, centered where you press ENTER.
- ZBox: pick two corners.
- ZoomStat: fit the active stat plots.
- ZoomFit: keep X and fit Y to the selected functions.
- ZQuadrant1 and the ZFrac presets: match OS 2.55MP.

### Graphing

- Axes with ticks every Xscl and Yscl. Grid dots with GridOn. Axis labels with LabelOn.
- Connected mode joins consecutive points, even across asymptotes (tan(X) gets near-vertical lines, like hardware). Undefined or non-real points leave gaps.
- Xres 1 to 8 sets how many pixel columns get evaluated.
- The seven styles: line, thick, shade above, shade below, path, animate, dot. Multiple shaded functions cycle through four patterns (vertical, horizontal, negative slope, positive slope).
- Free-moving cursor: a + that moves one pixel per arrow press, with X= and Y= at the bottom when CoordOn.
- TRACE starts at the middle column. ◄ and ► step by ΔX, ▲ and ▼ switch between functions and stat plots, typing a number starts X= entry, and walking off the edge pans the window. ExprOn shows the function at the top left.
- Graph readouts show up to 8 significant digits (X=.21276596).
- CALC prompts: "Left Bound?", "Right Bound?", "Guess?" for zero, minimum, and maximum, with ► and ◄ bound markers. "First curve?", "Second curve?", "Guess?" for intersect. "Lower Limit?", "Upper Limit?" for ∫f(x)dx, which also shades the area.
- Numerics like hardware: nDeriv( and dy/dx use the symmetric difference with ε = .001. fnInt( and ∫f(x)dx use adaptive Gauss-Kronrod with tolerance 1E⁻5. fMin(, fMax(, minimum, and maximum use a bounded search with tolerance 1E⁻5. zero and intersect use bracketed root finding and raise ERR:NO SIGN CHNG, ERR:BOUND, and ERR:BAD GUESS where hardware does.
- TABLE: an X column plus one column per selected function. Arrows scroll, and the bottom line shows the full value of the highlighted cell. Indpnt Ask lets the user type X values.
- Horiz shows the graph on top with the home screen below. G-T shows the graph on the left and the table on the right.
- DRAW commands take arguments from the home screen or a program. Picked from the graph screen, they're interactive: choose points with the cursor, and type Text( right at the cursor. ClrDraw erases drawings, and so does any change to Y=, WINDOW, FORMAT, or MODE.
- StorePic and RecallPic save the drawing layer. StoreGDB and RecallGDB save Y= contents, styles, selection, window, format, and graph mode.
- Shade( supports its pattern and pattern resolution arguments.

### Statistics

- Quartiles use TI's method: split around the median, leave the median out when n is odd, and take the median of each half. {1,2,3,4,5} gives Q1 = 1.5 and Q3 = 4.5.
- Regressions store their equation to RegEQ and residuals to the RESID list, can store to a Y= variable (LinReg(ax+b) L1,L2,Y1), and show r and r² (or R²) when diagnostics are on.
- Plot types: scatter, xyLine, histogram, modified box plot, box plot, normal probability plot. Marks: box, cross, dot.
- Distributions and tests must be right to all 10 displayed digits across their whole domain, tails included (normalcdf(5,1E99), tcdf with huge df). Use proven algorithms: series and continued fractions for incomplete gamma and beta, and Wichura AS241 or Acklam refined with Newton steps for inverses. If TI's printed output differs from the true value in the last digits, the true value wins. Log those cases.

### TI-BASIC

- A program is a token list split into lines by newlines and colons. Names are 1 to 8 characters and start with a letter or θ.
- Match TI's runtime model: a block stack, with a forward scan at runtime for the matching End or Else. Real programs depend on how Goto behaves when it jumps into and out of blocks.
- If without Then runs only the next line. For( loops while the variable is ≤ the end value (≥ with a negative step). While checks first. Repeat checks after the body.
- getKey returns 0 when no key is waiting, otherwise the code from the key table. It never waits.
- Disp prints text on the left and numbers on the right, scrolling the home screen. Output( writes at a fixed spot without scrolling. Text( draws on the graph screen in the small font, and Text(⁻1,…) uses the large font.
- Input with no arguments shows the graph with a free cursor and stores the point to X and Y. Input and Prompt accept strings and variables.
- Pause waits for ENTER. Pause with a value shows it first.
- Menu( takes a title and up to 7 option and label pairs. Lbl names are one or two characters from A to Z, 0 to 9, and θ.
- prgmNAME runs a subprogram. Return goes back one level. Stop ends everything.
- When a program ends, show Done, following the hardware rules for when a final expression's value shows instead.
- GetCalc(, Get(, and Send( act as if no calculator is connected. OpenLib( and ExecLib do nothing.
- In the editor, 2nd INS then ENTER inserts a blank line, like hardware.

### Random numbers

- Use the hardware's generator (L'Ecuyer's combined generator) so seeded sequences match what classmates see on real calculators.
- 0→rand sets seed1 = 12345 and seed2 = 67890. A nonzero seed n sets seed1 = (40014 × n) mod 2147483563 and seed2 = n mod 2147483399. Check a published reference for how n gets truncated and how negative seeds work.
- Each rand: seed1 = (40014 × seed1) mod 2147483563, seed2 = (40692 × seed2) mod 2147483399, and the result is (seed1 − seed2)/2147483563, plus 1 if that's negative.
- After 0→rand, rand returns .9435974025. randInt(, randNorm(, randBin(, randIntNoRep(, and randM( build on rand the way hardware does.

### Saved state

- Everything in calculator memory survives reloads, like a real calculator that keeps its memory when turned off: variables, lists, matrices, strings, programs, Y= and graph settings, zoom memory, table settings, modes, format, stat plots, Pics, GDBs, home screen history, past entries, the rand seed, and the current screen.
- Save to IndexedDB on every change (debounced) and on pagehide. Version the schema and write migrations.

### Physical keyboard

Use this mapping and show it in the help panel:
- Digits, `.`, `+`, `-` (subtraction), `*`, `/`, `^`, `(`, `)`, and `,` press their keys.
- `~` is (−). Letters A to Z type ALPHA letters. Space, `"`, `:`, and `?` type their ALPHA characters.
- Enter is ENTER. Backspace and Delete are DEL. Insert is INS.
- Arrow keys are arrows. Escape is CLEAR. Shift+Escape is ON.
- F1 to F5 are Y=, WINDOW, ZOOM, TRACE, and GRAPH.
- Tapping Shift by itself is 2nd, and tapping Control by itself is ALPHA (only when no other key was pressed in between).
- Leave Tab alone so keyboard focus works, and don't block browser shortcuts.

## 8. Acceptance tests

Build a helper that takes key ids (`2ND SQR 2 ENTER`), presses them, and returns `screenText()` and the framebuffer. Use it against the core in Vitest and against the real page in Playwright. Each test starts from a fresh reset in Classic mode unless noted, since results match in both modes. These are the floor. Add your own for every menu item and command.

**Keystrokes**

| # | Keys | Expect |
|---|---|---|
| K1 | `2 ADD 3 MUL 4 ENTER` | `2+3*4`, then `14` right-aligned |
| K2 | after K1: `SUB 2 ENTER` | `Ans-2`, then `12` |
| K3 | after K1: `ENTER` on the empty line | `2+3*4` runs again, `14` |
| K4 | after K1: `2ND ENTER` | `2+3*4` back on the entry line |
| K5 | `3 NEG 2 ENTER` | ERR:SYNTAX with 1:Quit and 2:Goto. Pressing `2` returns to the entry with the cursor at the error |
| K6 | `2ND SQR 2 ENTER` | `√(2`, then `1.414213562` |
| K7 | `5 STO ALPHA MATH ENTER ALPHA MATH SQR ENTER` | `5`, then `25` |
| K8 | `2ND ALPHA MATH APPS PRGM ALPHA` | `ABC` typed and A-LOCK off |
| K9 | `MODE DOWN DOWN RIGHT ENTER 2ND MODE SIN 3 0 RPAREN ENTER` | `.5` |
| K10 | `DOT 7 5 MATH 1 ENTER` | `.75►Frac`, then `3/4` |
| K11 | `1 DIV 0 ENTER` | ERR:DIVIDE BY 0 |
| K12 | after K1: `1 ADD 1 CLEAR` | empty entry line with K1 still on screen. Another `CLEAR` blanks the screen |
| K13 | `ZOOM 2ND MODE` | back on the home screen |

**Engine** (Float, Radian, Real unless noted)

| Input | Result |
|---|---|
| `⁻3²` | `⁻9` |
| `⁻2^2` | `⁻4` |
| `2^3^2` | `64` |
| `6/2(1+2)` | `9` |
| `1/3` | `.3333333333` |
| `2/3` | `.6666666667` |
| `π` | `3.141592654` |
| `10^10` | `1E10` |
| `9999999999` | `9999999999` |
| `.001` | `.001` |
| `.0001` | `1E⁻4` |
| `123456.78912345` | `123456.7891` |
| `2E3` | `2000` |
| `69!` | `1.711224524E98` |
| `70!` | ERR:OVERFLOW |
| `.5!` | `.8862269255` |
| `1/0` | ERR:DIVIDE BY 0 |
| `√(⁻1)` | ERR:NONREAL ANS |
| `√(⁻1)` in a+bi | `i` |
| `(1+2i)(3+4i)` | `⁻5+10i` |
| `abs(3+4i)` | `5` |
| `(⁻8)^(1/3)` | `⁻2` |
| `sin(30°)` | `.5` |
| `sin⁻¹(1)` | `1.570796327` (and `90` in Degree) |
| `ln(e)`, `log(100)`, `e^(1)` | `1`, `2`, `2.718281828` |
| `5 nCr 2`, `5 nPr 2` | `10`, `20` |
| `round(π,4)` | `3.1416` |
| `int(⁻2.5)`, `iPart(⁻2.5)`, `fPart(⁻2.5)` | `⁻3`, `⁻2`, `⁻.5` |
| `remainder(17,5)`, `gcd(12,18)`, `lcm(4,6)` | `2`, `6`, `12` |
| `.75►Frac`, `1/3+1/6►Frac` | `3/4`, `1/2` |
| `2>1`, `2=3`, `1 and 0` | `1`, `0`, `0` |
| `{1,2,3}+{4,5,6}` | `{5 7 9}` |
| `{1,2}+{1,2,3}` | ERR:DIM MISMATCH |
| `sum(seq(X²,X,1,10))` | `385` |
| `mean({1,2,3,4})` | `2.5` |
| `stdDev({2,4,4,4,5,5,7,9})` | `2.138089935` |
| `det([[1,2][3,4]])` | `⁻2` |
| `[[1,2][3,4]]⁻¹` | `[[⁻2 1][1.5 ⁻.5]]` |
| `rref([[1,2,3][4,5,6]])` | `[[1 0 ⁻1][0 1 2]]` |
| `"HELLO"→Str1`, then `sub(Str1,2,3)` | `ELL` |
| `X²→Y1`, then `Y1(3)` | `9` |
| `nDeriv(X³,X,2)` | `12.000001` |
| `fnInt(X²,X,0,3)` | `9` |
| `binompdf(10,.5,5)` | `.24609375` |
| `poissonpdf(2,3)` | `.1804470443` |
| `normalcdf(⁻1E99,0)` | `.5` |
| `0→rand`, then `rand` | `.9435974025` |

**Stats and apps**
- `1-Var Stats {1,2,3,4,5}` gives x̄=3, Σx=15, Σx²=55, Sx=1.58113883, σx=1.414213562, n=5, minX=1, Q1=1.5, Med=3, Q3=4.5, maxX=5.
- With {1,2,3,4,5} in L1, {2,4,5,4,5} in L2, and diagnostics on, `LinReg(ax+b) L1,L2` gives a=.6, b=2.2, r²=.6, r=.7745966692.
- TVM Solver with N=360, I%=6, PV=200000, FV=0, P/Y=12, C/Y=12, solving for PMT gives ⁻1199.10 to the cent.
- The Solver with 0=X²-2 and a guess of 1 gives X=1.414213562.
- PolySys finds roots 2 and 3 for X²-5X+6, and solves X+Y=3, X-Y=1 as X=2, Y=1.

**Graphing** (Y1=X² entered with `YEQ XTTN SQR`)
- `GRAPH` in ZStandard draws the axes on column 47 and row 31, and the vertex pixel (47, 31) is on.
- `ZOOM 4 TRACE` shows X=0 and Y=0. Then `RIGHT` shows X=.1 and Y=.01.
- `ZOOM 6 TRACE RIGHT` shows X=.21276596.
- With Y1=X²-2 in ZDecimal, CALC zero with bounds around 1.4 finds X=1.4142136.
- `2ND GRAPH` shows X = 0, 1, 2, 3 beside Y1 = 0, 1, 4, 9.

**Programs** (typed in the editor, run with prgm from the home screen)

QUAD, answering the prompts with `1 ENTER NEG 3 ENTER 2 ENTER`, displays 2 then 1, then Done:
```
:Prompt A,B,C
:B²-4AC→D
:If D<0
:Then
:Disp "NO REAL ROOTS"
:Else
:Disp (⁻B+√(D))/(2A),(⁻B-√(D))/(2A)
:End
```

SUM displays 5050:
```
:0→S
:For(I,1,100)
:S+I→S
:End
:Disp S
```

KEYS, with `5` and then `CLEAR` pressed while it runs, displays 83 then 45, then Done:
```
:0→K
:Repeat K=45
:getKey→K
:If K
:Disp K
:End
```

PICK, pressing `2` at the menu, displays 2, then Done:
```
:Menu("PICK","ONE",A,"TWO",B)
:Lbl A
:Disp 1
:Stop
:Lbl B
:Disp 2
```

Also:
- A program that runs `ClrHome` then `Output(4,5,"HI")` leaves HI at row 4, column 5 of `screenText()`.
- A program with `While 1` and `End` stops on `ON` with ERR:BREAK, and Goto opens the editor on the right line.
- `Pxl-On(0,0)` lights the top-left pixel of the graph screen.

## 9. Done means

- Every milestone is squash-merged into the default branch, and CI is green there.
- Every test in section 8 passes, along with your own tests for every menu item and command.
- `npm run build` produces a static site that works offline after the first load.
- README, CLAUDE.md, docs/ARCHITECTURE.md, docs/DECISIONS.md, and an honest docs/STATUS.md are in the repo.
- There's no TI ROM, code, text, art, or font anywhere in the repo or its history.

When everything's merged, end with a short report: what merged, test counts, and anything still open, pointing to STATUS.md. Don't ask what to do next. If something is still open and fixable, go fix it first.
