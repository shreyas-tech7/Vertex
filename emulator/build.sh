#!/usr/bin/env bash
# Builds the Vertex emulator: CEmu's C core (pinned commit, unmodified) + vertex_adapter.c, compiled to WebAssembly.
#
#   emulator/build.sh            build dist/ and the source archive
#   CEMU_DIR=/path/to/CEmu ...   use an existing CEmu checkout (it must be at the commit in CEMU_COMMIT)
#   EMSDK=/path/to/emsdk ...     use an existing Emscripten SDK; otherwise one is installed under .cache/
#
# Outputs
#   emulator/dist/vertex-cemu.js       Emscripten glue (ES module)
#   emulator/dist/vertex-cemu.wasm     the emulator
#   emulator/dist/MANIFEST.json        commit, toolchain and checksums
#   public/source/vertex-emulator-source.tar.gz   corresponding source (GPLv3): CEmu at the pinned commit,
#                                                 the adapter, this script and the licenses
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
COMMIT="$(tr -d '[:space:]' < "$HERE/CEMU_COMMIT")"
EMSDK_VERSION="${EMSDK_VERSION:-4.0.10}"
CACHE="$HERE/.cache"
DIST="$HERE/dist"
mkdir -p "$CACHE" "$DIST"

# 1. CEmu at the pinned commit ----------------------------------------------------------------------------------
# When this script runs from the source archive, CEmu sits next to it (CEmu/) and there is no git repository.
FROM_ARCHIVE=0
if [ -z "${CEMU_DIR:-}" ] && [ -f "$ROOT/CEmu/core/emu.c" ] && [ ! -d "$ROOT/.git" ]; then
  CEMU_DIR="$ROOT/CEmu"
  FROM_ARCHIVE=1
fi
if [ -z "${CEMU_DIR:-}" ]; then
  CEMU_DIR="$CACHE/CEmu"
  if [ ! -d "$CEMU_DIR/.git" ]; then
    git init -q "$CEMU_DIR"
    git -C "$CEMU_DIR" remote add origin https://github.com/CE-Programming/CEmu.git
  fi
  if [ "$(git -C "$CEMU_DIR" rev-parse HEAD 2>/dev/null || true)" != "$COMMIT" ]; then
    git -C "$CEMU_DIR" fetch -q --depth 1 origin "$COMMIT"
    git -C "$CEMU_DIR" checkout -q --detach FETCH_HEAD
  fi
fi
if [ "$FROM_ARCHIVE" = 0 ]; then
  ACTUAL="$(git -C "$CEMU_DIR" rev-parse HEAD)"
  if [ "$ACTUAL" != "$COMMIT" ]; then
    echo "CEmu is at $ACTUAL but emulator/CEMU_COMMIT pins $COMMIT" >&2
    exit 1
  fi
fi

# 2. Emscripten --------------------------------------------------------------------------------------------------
if ! command -v emcc >/dev/null 2>&1; then
  EMSDK="${EMSDK:-$CACHE/emsdk}"
  if [ ! -d "$EMSDK" ]; then
    git clone -q --depth 1 https://github.com/emscripten-core/emsdk.git "$EMSDK"
  fi
  "$EMSDK/emsdk" install "$EMSDK_VERSION"
  "$EMSDK/emsdk" activate "$EMSDK_VERSION"
  # shellcheck disable=SC1091
  source "$EMSDK/emsdk_env.sh" >/dev/null
fi
EMCC_VERSION="$(emcc --version | head -n 1)"

# 3. Compile -----------------------------------------------------------------------------------------------------
# keypad.c is left out because vertex_adapter.c #includes it. os/ is left out because the adapter replaces it.
# physical_macos.c is the macOS-only USB passthrough (physical.c compiles to nothing without LIBUSB_SUPPORT).
# DEBUG_SUPPORT is off, so debug/debug.c compiles to nothing and is skipped too.
CORE="$CEMU_DIR/core"
SOURCES=()
for f in "$CORE"/*.c "$CORE"/usb/*.c; do
  case "$(basename "$f")" in keypad.c|physical_macos.c) continue ;; esac
  SOURCES+=("$f")
done

emcc "$HERE/src/vertex_adapter.c" "${SOURCES[@]}" \
  -I"$CORE" \
  -O3 -flto -DNDEBUG -W -Wall -Wno-unused-parameter -Wno-sign-compare -Wno-unused-but-set-variable \
  -o "$DIST/vertex-cemu.js" \
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sEXPORT_NAME=createVertexCemu \
  -sENVIRONMENT=web,worker,node \
  -sINITIAL_MEMORY=33554432 -sALLOW_MEMORY_GROWTH=1 -sSTACK_SIZE=524288 \
  -sFILESYSTEM=1 -sINVOKE_RUN=0 -sNO_EXIT_RUNTIME=1 --no-entry \
  -sDYNAMIC_EXECUTION=0 -sASSERTIONS=0 \
  -sEXPORTED_RUNTIME_METHODS=FS,HEAPU8,HEAPU32,UTF8ToString,stringToUTF8,lengthBytesUTF8 \
  -sEXPORTED_FUNCTIONS=_malloc,_free

# 4. Manifest ----------------------------------------------------------------------------------------------------
sha() { sha256sum "$1" | cut -d' ' -f1; }
cat > "$DIST/MANIFEST.json" <<EOF
{
  "cemuCommit": "$COMMIT",
  "emscripten": "$EMCC_VERSION",
  "files": {
    "vertex-cemu.js": "$(sha "$DIST/vertex-cemu.js")",
    "vertex-cemu.wasm": "$(sha "$DIST/vertex-cemu.wasm")"
  }
}
EOF

# 5. Corresponding-source archive -----------------------------------------------------------------------------------
# Same layout as the repository (emulator/ and CEmu/ side by side), so build.sh runs unchanged from the archive.
# Deterministic: sorted names, fixed owner, the CEmu commit time as the mtime, gzip without a name or timestamp.
if [ "$FROM_ARCHIVE" = 1 ]; then
  echo "built from the source archive: $(sha "$DIST/vertex-cemu.wasm")"
  exit 0
fi
OUT="$ROOT/public/source"
mkdir -p "$OUT"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT
TOP="vertex-emulator-source"
mkdir -p "$STAGE/$TOP/CEmu" "$STAGE/$TOP/emulator/src"
git -C "$CEMU_DIR" archive --format=tar "$COMMIT" | tar -x -C "$STAGE/$TOP/CEmu"
cp "$HERE/src/vertex_adapter.c" "$STAGE/$TOP/emulator/src/"
cp "$HERE/build.sh" "$HERE/CEMU_COMMIT" "$HERE/LICENSE" "$HERE/CEMU-LICENSE.txt" "$HERE/README.md" "$STAGE/$TOP/emulator/"
MTIME="$(git -C "$CEMU_DIR" show -s --format=%ct "$COMMIT")"
tar --sort=name --owner=0 --group=0 --numeric-owner --mtime="@$MTIME" -C "$STAGE" -cf - "$TOP" | gzip -9n > "$OUT/vertex-emulator-source.tar.gz"
echo "archive sha256 $(sha "$OUT/vertex-emulator-source.tar.gz")"
echo "built $DIST/vertex-cemu.wasm ($(wc -c < "$DIST/vertex-cemu.wasm") bytes) with $EMCC_VERSION"
