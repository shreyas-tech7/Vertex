# Vertex emulator

This folder holds the engine behind Vertex's calculator: [CEmu](https://github.com/CE-Programming/CEmu), the open
source TI-84 Plus CE emulator, compiled to WebAssembly. CEmu runs the real TI-OS on emulated hardware. It needs a ROM
image from the visitor's own calculator. Vertex never ships, downloads or stores a ROM on any server.

**License.** Everything in this folder, and the compiled `dist/` output, is a work based on CEmu and is licensed under
the **GNU General Public License, version 3 or later**. The full text is in [`LICENSE`](LICENSE). CEmu's own notice is in
[`CEMU-LICENSE.txt`](CEMU-LICENSE.txt). The rest of the Vertex repository is MIT, see the root `LICENSE` and
`THIRD_PARTY_NOTICES.md`.

## What is here

| Path                   | What it is                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `CEMU_COMMIT`          | The exact CEmu commit this build uses. CEmu itself is compiled unmodified.                                        |
| `src/vertex_adapter.c` | Our adapter. It replaces CEmu's own Emscripten front end with a small C API for the web worker.                   |
| `build.sh`             | Fetches the pinned commit, installs Emscripten if it is missing, compiles, writes `dist/` and the source archive. |
| `dist/`                | The built `vertex-cemu.js` and `vertex-cemu.wasm`, plus `MANIFEST.json` with checksums.                           |

The corresponding source is served with the site at `source/vertex-emulator-source.tar.gz`. It contains the CEmu tree at
the pinned commit, the adapter, this build script and both licenses. Running `build.sh` regenerates it.

## Build

```bash
emulator/build.sh
```

You need `git`, `bash`, `tar`, `gzip` and either Emscripten (`emcc` on the PATH) or network access, so the script can
install emsdk 4.0.10 under `emulator/.cache/`. To use a checkout you already have:
`CEMU_DIR=/path/to/CEmu emulator/build.sh` (it must be at the commit in `CEMU_COMMIT`).

## The adapter API

All functions are exported from the module and take plain integers or C strings in the module's memory.

| Function                                              | What it does                                                                           |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `vertex_load_rom(path)`                               | Loads a ROM with CEmu's own checks. Returns 0 valid, 1 invalid, 2 not a CE ROM.        |
| `vertex_load_state(path)` / `vertex_save_state(path)` | Restores or writes a whole-emulator image (about 5 MB).                                |
| `vertex_run_frames(n)`                                | Runs `n` frames of 1/60 s each. TI-OS runs its CPU at 48 MHz.                          |
| `vertex_frame()`                                      | Pointer to the 320x240 frame. The panel gamma and backlight level are already applied. |
| `vertex_key(row, col, down)`                          | Presses or releases a key of the 8x8 matrix. Row 2, column 0 is ON.                    |
| `vertex_key_state(row)`                               | The held keys of one row, read back from CEmu's keypad. Tests use this.                |
| `vertex_send_file(path)`                              | Sends a variable file (`.8xp` and the rest) through CEmu's emulated USB link.          |
| `vertex_status()`, `vertex_log()`                     | Running / LCD on / powered off flags, and CEmu's load messages.                        |
