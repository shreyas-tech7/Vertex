# Vertex

A free TI-84 Plus CE calculator that runs in your browser. Vertex runs the real TI-OS on
[CEmu](https://github.com/CE-Programming/CEmu), an open source emulator compiled to WebAssembly, with a ROM from
**your own calculator**. No ads, no accounts, no tracking.

> Vertex is an independent project. It is not affiliated with or endorsed by Texas Instruments. TI-84 Plus CE is a trademark of Texas Instruments.

**Live:** https://shreyas-tech7.github.io/Vertex/ (after the redesign merges to `main`)

## How it works

1. Open the page. The calculator's screen asks for a ROM.
2. Dump a ROM from your own TI-84 Plus CE with the ROM dump wizard in CEmu, then choose the file or drop it on the screen.
3. Vertex checks it with CEmu, stores it in your browser (IndexedDB) and boots. The ROM never leaves your browser.
4. Use the on-screen keys, a touchscreen or your keyboard. Drop a `.8xp` (or any TI variable file) on the calculator to send it.
5. Close the tab and come back. The calculator resumes where you left it.

Nothing in this repository is a calculator ROM or OS image, and nothing is downloaded from Texas Instruments.

## Running locally

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # typecheck, lint, unit tests, build, forbidden-content scan
npm run test:e2e     # builds, then Playwright (Chromium, Firefox, WebKit, phone viewport)
npm run scan         # no ROMs, OS images, TI art or TI hosts in the repo, the build or the source archive
```

Needs Node 22.18 or newer. In a sandbox without Playwright's browser downloads, point `VERTEX_CHROMIUM_PATH` at any
Chromium and set `VERTEX_SKIP_FIREFOX=1 VERTEX_SKIP_WEBKIT=1`.

The emulator is committed pre-built (`emulator/dist`). To rebuild it from the pinned CEmu commit:

```bash
npm run build:emulator   # needs git, bash, tar and either emcc or network access (it installs emsdk 4.0.10)
```

After editing anything in `src/site`, run `npm run gen:pages` (the dev server and the build do it for you).

## Layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). In short: `emulator/` is CEmu plus a small adapter (GPLv3),
`src/calculator` is the calculator page (React), `src/site` generates the nine-language landing, privacy and terms pages.

## Deploying

Every push to `main` runs `.github/workflows/pages.yml`, which builds the app and publishes `dist/` to the `gh-pages`
branch. The build uses relative asset paths, so it works on any static host. `public/_headers` (Netlify, Cloudflare Pages)
and `vercel.json` carry the Content Security Policy and security headers for hosts that can send them. Set `SITE_URL`
at build time if the site lives somewhere other than the default, so hreflang and sitemap links are right.

## Licenses

Vertex's own code is MIT, see [LICENSE](LICENSE). The emulator in [`emulator/`](emulator) is a work based on CEmu and is
GPLv3. The corresponding source is served with the site at `source/vertex-emulator-source.tar.gz`.
Layout and CSS follow [bifdu9898/TI84Calculator](https://github.com/bifdu9898/TI84Calculator) (MIT).
Details: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
