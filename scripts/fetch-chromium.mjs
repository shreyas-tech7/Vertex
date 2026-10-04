/**
 * Gives the end-to-end tests a Chromium when Playwright's own download host is unreachable.
 *
 * `npx playwright install chromium` fetches from cdn.playwright.dev. Networks that only allow the npm registry
 * cannot reach it, so this script pulls the browser out of an npm package that ships the binary instead
 * (@sparticuz/chromium, MIT, ~70 MB packed) and writes a wrapper next to it that sets up its shared libraries.
 *
 *   node scripts/fetch-chromium.mjs           download into .cache/chromium and print the wrapper path
 *   node scripts/fetch-chromium.mjs --check   print the path if it is already there, without downloading
 *
 * The result is a cache directory, never part of the repository. CI uses `npx playwright install` instead.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, chmodSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { brotliDecompressSync } from 'node:zlib';
import { join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const root = resolve(import.meta.dirname, '..');
const cache = join(root, '.cache', 'chromium');
const binary = join(cache, 'chromium');
const libs = join(cache, 'lib');
const wrapper = join(cache, 'chromium.sh');
const PACKAGE = '@sparticuz/chromium';

function prepared() {
  return existsSync(wrapper) && existsSync(binary) && existsSync(libs);
}

if (process.argv.includes('--check')) {
  console.log(prepared() ? wrapper : '');
  process.exit(prepared() ? 0 : 1);
}

if (prepared()) {
  console.log(wrapper);
  process.exit(0);
}

const stage = join(root, '.cache', 'chromium-stage');
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
mkdirSync(cache, { recursive: true });

console.log(`fetching ${PACKAGE} from the npm registry (about 70 MB)…`);
const tarball = execFileSync('npm', ['pack', PACKAGE, '--pack-destination', stage], {
  cwd: stage,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .pop()
  .trim();
execFileSync('tar', ['xzf', join(stage, tarball), '-C', stage]);

const bin = join(stage, 'package', 'bin');
const untar = (name, into) => {
  execFileSync('tar', ['xf', join(stage, name), '-C', into]);
};

console.log('decompressing the browser…');
writeFileSync(binary, brotliDecompressSync(readFileSync(join(bin, 'chromium.br'))), { mode: 0o755 });
chmodSync(binary, 0o755);

console.log('decompressing its shared libraries…');
// The archive holds a single top level `lib/` directory, so it is unpacked next to the binary, not into it.
writeFileSync(join(stage, 'libs.tar'), brotliDecompressSync(readFileSync(join(bin, 'al2023.tar.br'))));
untar('libs.tar', cache);

// Chromium needs LD_LIBRARY_PATH to find its own libraries, so the wrapper sets it and stands in for the binary.
writeFileSync(
  wrapper,
  `#!/bin/sh\nexport LD_LIBRARY_PATH="${libs}\${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"\nexec "${binary}" "$@"\n`,
  { mode: 0o755 },
);
chmodSync(wrapper, 0o755);
rmSync(stage, { recursive: true, force: true });

console.log(wrapper);
console.log(`version ${execFileSync(wrapper, ['--version'], { encoding: 'utf8' }).trim()}`);
console.log(`note: this is ${PACKAGE}'s build, not Playwright's. Set VERTEX_CHROMIUM_PATH to use it.`);
void require;
