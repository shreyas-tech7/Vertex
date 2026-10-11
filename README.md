# Vertex

An ad-free TI-84 Plus CE calculator that runs in your browser. Vertex runs the real TI-OS on
[CEmu](https://github.com/CE-Programming/CEmu), an open source emulator compiled to WebAssembly, and boots the ROM
**the site serves** without a click, a file or any setup. No ads, no accounts, no tracking.

> Vertex is an independent project. It is not affiliated with or endorsed by Texas Instruments. TI-84 Plus CE is a trademark of Texas Instruments.

**Live:** https://shreyas-tech7.github.io/Vertex/ (after the redesign merges to `main`)

## How it works

1. Open the page. The calculator boots on its own from the ROM the site serves. Nothing to click, no file to choose.
2. Vertex keeps that ROM in your browser (IndexedDB) and revalidates it, so the next visit does not download it again.
3. Use the on-screen keys, a touchscreen or your keyboard. Drop a `.8xp` (or any TI variable file) on the calculator to send it.
4. Close the tab and come back. The calculator boots straight into the screen you left.

Nothing in this repository is a calculator ROM or OS image, and nothing is downloaded from Texas Instruments.

## The ROM

The calculator needs a ROM: a copy of the operating system out of a real TI-84 Plus CE. **Vertex ships none.**

The site owner dumps one from a calculator they own with the ROM dump wizard in CEmu and puts it where the page looks
for it:

```bash
cp ~/Documents/TI-84-Plus-CE.rom public/rom/ti84ce.rom
npm run build            # the file is copied to dist/rom/ti84ce.rom
```

`public/rom/README.md` covers this in full, including `VITE_ROM_URL` for serving it from another path or host.

Texas Instruments owns that operating system. Its licence lets the owner of a calculator keep one archive copy, does
not allow use on an emulator the owner did not obtain from TI, and does not allow distribution. So a ROM is never
committed (`*.rom` is in `.gitignore`), never published, and never fetched from a ROM archive or from TI.

**A site with no ROM says so.** The screen shows one sentence, "This site has no ROM installed yet, so the calculator
cannot boot." There is no fake boot, no simulated screen and no file picker: visitors are never asked for a file.

## Running locally

```bash
npm install
cp your-own-dump.rom public/rom/ti84ce.rom   # optional: without it the screen says so
npm run dev          # http://localhost:5173
npm run check        # typecheck, lint, unit tests, build, forbidden-content scan
npm run test:e2e     # builds, then Playwright (Chromium, Firefox, WebKit desktop, iPad, iPhone, phone viewport)
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
