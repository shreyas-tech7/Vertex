# Status

Honest state of the project. Anything unfinished, unverified, or different from a real TI-84 Plus CE is listed here.

## Current milestone

R1 (redesign). The site, the emulator build, the ROM panel, input, storage and the tests are done. **Nothing here has run
a real TI-OS ROM**, because no ROM was or may be obtained. See "Not verified" below.

## Not verified (needs a real ROM from the owner's own calculator)

- Booting TI-OS to the home screen, and every behaviour on it: MathPrint entry, graphing, tables, matrices, statistics,
  complex math, TI-BASIC, CATALOG, MODE.
- Brightness with 2nd plus the up and down arrows. The pixels come from CEmu's panel with gamma on, which applies the
  backlight level, but this was only checked in code.
- 2nd OFF and ON. The adapter reports the power state and the ON key reaches CEmu, but TI-OS was not running.
- That a restored state shows exactly the screen the user left. State save and restore work with the synthetic ROM.
- That a dropped `.8xp` reaches TI-OS and runs. The USB send starts and keeps the emulator running, but there is no OS to
  receive it.
- Real-time speed on a phone. In Node, CEmu's WebAssembly build runs the synthetic ROM at about 16 times real time.

## Known differences from hardware

- The calculator body, key shapes and colors are original, not a copy of the TI faceplate. Layout, legends and matrix are exact.
- Shift and Alt tapped alone are 2nd and ALPHA. Held with another key they act as plain PC modifiers.
- A key is held at least 3 frames, and not re-pressed for 2 frames, even for a very short click.
- At zoom levels wider than the viewport (200% on a phone) the page hides horizontal overflow, as the reference does.
- No sound (the calculator has none), no USB or link port beyond variable sending, no debugger.

## Verification limits

- **ti84calculator.io and the CEmu docs site were blocked** (403) from the build sandbox. The reference was the MIT
  repo's own HTML. Vertex's language menu, notice and legal links are not compared against the live site, and the live
  calculator box was not measured.
- **Firefox and WebKit:** Playwright cannot download them here. See the report for what was run instead.
- Translations were written by the agent. A native speaker should review them.

## Open items

- **CI workflow is not active on GitHub.** Pushing `.github/workflows/ci.yml` is rejected for the GitHub App token used
  here (missing `workflows` permission). The workflow is committed as `docs/ci/github-actions-ci.yml`. To activate it run
  `mkdir -p .github/workflows && cp docs/ci/github-actions-ci.yml .github/workflows/ci.yml` and push with a token that has
  the `workflow` scope.
- No preview deploy is configured for this branch. The existing `pages.yml` deploys `main` only.
