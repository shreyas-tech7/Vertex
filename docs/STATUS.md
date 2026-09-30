# Status

Honest state of the project. Anything unfinished, or different from a real TI-84 Plus, is listed here.

## Current milestone

M0 (scaffold). Nothing of the calculator exists yet beyond a placeholder face.

## Known differences from hardware

_None recorded yet._

## Open items

- **CI workflow is not active on GitHub.** Pushing `.github/workflows/ci.yml` is rejected for the GitHub App token used here (missing `workflows` permission). The workflow is committed as `docs/ci/github-actions-ci.yml`; to activate it run `mkdir -p .github/workflows && cp docs/ci/github-actions-ci.yml .github/workflows/ci.yml` and push with a token that has the `workflow` scope. Until then every gate is run locally.
- **WebKit e2e has not been run locally** (no WebKit binary is obtainable in the build sandbox); the Playwright config includes it for CI.
