# Decisions log

One line per call that the spec left open: what came up, what was chosen, why.
Format: `- [Mx] topic — decision (reason)`.

- [M0] Session branch — this session is pinned to `arena/01a0efdb-vertex`, so the per-milestone `feat/m<N>-*` branches from spec §5 are not created. Each milestone is a PR from the session branch to `main`, squash-merged _without_ `--delete-branch`, after which `main` is merged back into the session branch (the platform tracks the session by that branch).
- [M0] TypeScript version — pinned to 6.0.x: the `typescript-eslint` peer range is `<6.1.0`, and TypeScript 7 (native port) has no JS API for it yet.
- [M0] Local browsers — Playwright's browser CDN is unreachable from the build sandbox, so `/home/user/tools/e2e.sh` runs Chromium from the `@sparticuz/chromium` npm package (kept outside the repo). WebKit can only run in CI.
- [M0] Token table licensing — `TI-Toolkit/tokens` ships no LICENSE file, so its XML is not copied into the repo; our table is typed by hand and only cross-checked against it (see THIRD_PARTY_NOTICES.md).
- [M0] CI workflow location — the GitHub App token used in this sandbox is refused when pushing `.github/workflows/*` (no `workflows` permission), so the workflow lives at `docs/ci/github-actions-ci.yml` and must be copied to `.github/workflows/ci.yml` by someone with permission (see STATUS.md). With no remote CI, local `npm run check` + `npm run test:e2e` are the gate (spec §5 step 5).
