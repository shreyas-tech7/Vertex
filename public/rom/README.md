# The ROM the calculator boots

The calculator page boots the ROM it finds at `rom/ti84ce.rom`, next to the built `calculator.html`. It asks the
visitor for nothing.

Put your own dump here as `ti84ce.rom` and rebuild:

```bash
cp ~/Documents/TI-84-Plus-CE.rom public/rom/ti84ce.rom
npm run build          # the file is copied to dist/rom/ti84ce.rom
```

That file is a copy of the operating system out of a TI-84 Plus CE you own, made with the ROM dump wizard in
[CEmu](https://github.com/CE-Programming/CEmu). About 4 MB.

## Nothing here is committed

- `*.rom` is in `.gitignore`, so the file never enters git.
- `npm run scan` fails on purpose while a ROM file sits in the repository or in `dist/`. It is a guard against
  shipping or committing firmware, not a bug. Move the file out to make the scan clean again.
- No ROM, no OS image and no TI asset is part of this repository, and nothing is fetched from Texas Instruments.

## Rules of the licence

Texas Instruments owns the operating system in the calculator. Its licence lets the owner of a calculator keep one
archive copy, does not allow use on an emulator the owner did not obtain from TI, and does not allow distribution.
So:

- Dump it from a calculator you own, with CEmu.
- Keep the copy on the machine and the host that serves your site.
- Do not commit it, do not publish it, and do not serve it from a public repository.

## Without a ROM

With no file at that path, and nothing in the visitor's browser, the calculator shows one sentence inside the screen
instead of booting. It never shows a file picker, a drop zone or a dump wizard link.

## Another path or host

Point `VITE_ROM_URL` at a different location at build time:

```bash
VITE_ROM_URL=https://cdn.example.com/ti84ce.rom npm run build
```

The page then fetches it from that origin. `rom/ti84ce.rom`, relative to the page, stays the default, so one build
works at a domain root and under a GitHub Pages project path.
