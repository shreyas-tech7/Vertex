# Architecture

Vertex is a headless calculator core (`src/core`, no DOM) plus a thin React shell (`src/ui`).

```
src/core/
  numbers/   14-digit decimal reals (decimal.js), complex values, range/overflow, number formatting
  tokens/    the TI token table: code (.8xp bytes), display text, categories
  text/      plain text <-> tokens
  editor/    entry model (tree of tokens + templates), flattening
  parser/    tokens -> AST
  eval/      evaluator, variable store, function library
  calculus/  nDeriv, fnInt, fMin, fMax, solve
  matrix/    matrix math
  stats/     regressions, tests, distributions
  finance/   TVM and cash flow
  graph/     window, plotting, zoom, trace, CALC, DRAW, stat plots
  lcd/       framebuffer, pixel fonts, text layout
  os/        the OS state machine (screens, menus, editors, modes, errors)
  basic/     TI-BASIC interpreter
  io/        saved state, backups, .8xp/.8xl/.8xm and text import/export
src/ui/      keypad, LCD canvas, keyboard mapping, settings, help, live region
```

## Principles

- **Deterministic OS.** `press(key)`, `tick(ms)` and `render(fb)` are the only ways the state changes; the clock and the
  random seed are injected.
- **Tokens, not characters.** A token is a 16-bit code equal to its `.8xp` bytes (`0xBB31` for a two-byte token).
- **The UI never does math.** It sends key presses to the core and paints the framebuffer.
- **No `eval`, no `new Function`.** Expressions are parsed to an AST and compiled to closures.

_This file is expanded as each milestone lands._
