# Status

Honest state of the project. Anything unfinished, unverified, or different from a real TI-84 Plus CE is listed here.

## Current milestone

R2 (redesign, round 2) on `ti84-redesign`, draft PR into `main`. Done: service worker takeover, Ad-Free wording in nine
languages, the new 258 x 604 original artwork with the 232 x 174 LCD, the capped zoom with the reference's height
formula, the smaller white ROM panel with drop anywhere, the licence notices. The follow-up (R2b) shortened the first
About paragraph in all nine languages and loosened the legend spacing. **Nothing here has run a real TI-OS ROM**,
because no ROM was or may be obtained. See "Not verified" below.

## Needs the owner (not faked here)

1. Dump the ROM from your own calculator with CEmu's ROM dump wizard only.
2. Run the 16-item TI-OS checklist with that ROM.
3. Compare with the live site at 1920x855 and 390x844 in a real browser (the live site was not fetched).

## Known layout gaps (see `docs/VERIFICATION.md` F9)

Measured in Chromium 1194 at 1920x855 and 390x844 with `node scripts/measure-targets.mjs`. The sandbox renders the body
stack in Liberation Sans (Arial metrics), so line wraps follow that font.

- **About to Key Features is 443.0 against 442** (was 469.9). The first About paragraph is shortened in all nine languages
  and wraps to two lines, the ROM paragraph stays at three. The 1.0 px left is the preview block (137.6 against 136.6),
  which sits inside that span.
- **Language button is 121.3 px against 126.** The visible text is the page's own language name ("English"), with the
  globe and a caret. "Language" is the accessible name only. Kept as is, no padding added. The live site was not viewed.
- **Whole page is 4173 against 4037** (was 4200 here for the same commit, 4227 in the last report: the difference is the
  font). The remaining 136 px is the independence notice (90 px with its margin) plus the Open Source line (38) and the
  Privacy and Terms line (38), less whatever the live page has that Vertex does not. None of these is filler, so none
  was cut.
- **Phone frame is 754 at 100% against 700. This is the owner's choice.** The frame height stays `calcHeight x zoom + 150`
  (754 at 100%). The CSS minimum of 700 still applies below 100%. The formula was not changed.
- **Legends:** CATALOG and space touched in the default font. A letter-spacing of `-0.02em` now leaves a gap of about
  1.1 px at 100% and 135%. In DejaVu Sans, a wide fallback font, the pair still overlaps by about 3 px.
- **Firefox and WebKit were not re-run.** No binary exists in this sandbox and the Playwright download is blocked.
- **`compare-reference.mjs` could not run.** It needs a local copy of the MIT reference repo's `index.html`, which is
  not in this sandbox. The F1 numbers are from the last round.

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
- Zoom is capped so the case never exceeds the frame (for example 135% at most in a 350 px frame). The requested level is kept.
- No sound (the calculator has none), no USB or link port beyond variable sending, no debugger.

## Verification limits

- **ti84calculator.io and the CEmu docs site were blocked** (403) from the build sandbox. The reference was the MIT
  repo's own HTML (the task also forbids fetching the live site). Vertex's language menu, notice and legal links are not compared against the live site, and the live
  calculator box was not measured.
- **Firefox and WebKit:** Playwright cannot download them here. See the report for what was run instead.
- Translations were written by the agent. A native speaker should review them.

## Open items

- **CI workflow is not active on GitHub.** Pushing `.github/workflows/ci.yml` is rejected for the GitHub App token used
  here (missing `workflows` permission). The workflow is committed as `docs/ci/github-actions-ci.yml`. To activate it run
  `mkdir -p .github/workflows && cp docs/ci/github-actions-ci.yml .github/workflows/ci.yml` and push with a token that has
  the `workflow` scope.
- No preview deploy is configured for this branch. The existing `pages.yml` deploys `main` only.
