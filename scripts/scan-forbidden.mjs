// Searches the repository, the build output and the served source archive for things Vertex must never contain:
// calculator ROMs and OS images, TI artwork, and any reference to the proprietary emulator hosts.
// Exits with 1 and lists every hit if it finds one. Run: node scripts/scan-forbidden.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

// Patterns are assembled from pieces so this file does not match itself.
const hostPatterns = [
  new RegExp(['test', 'nav'].join(''), 'i'),
  new RegExp(['ELG', '-min'].join(''), 'i'),
  new RegExp(['\\.h84', 'statej'].join(''), 'i'),
  new RegExp(['TI84CE', '_touch'].join(''), 'i'),
  new RegExp(['(^|[^a-z])education\\.', 'ti\\.com'].join(''), 'i'),
  new RegExp(['https?://[^\\s"\'<>]*\\b', 'ti\\.com'].join(''), 'i'),
  new RegExp(['pear', 'son(?:\\.com|education|assessments)'].join(''), 'i'),
];
const forbiddenExtensions = new Set(['.rom', '.8eu', '.8ek', ['.h84', 'statej'].join(''), '.8xu', '.8cu']);
const artName =
  /(faceplate|ti-?84-?(plus-?)?ce-?(touch|photo|render)|texas-?instruments.*\.(png|jpe?g|svg|webp)|\bti-?logo)/i;

/** Files that state the rules on purpose: tests that assert the hosts never appear, and .gitignore, which blocks the types. */
const ALLOWED_TO_NAME_PATTERNS = new Set(['src/site/pages.test.ts', 'e2e/site.spec.ts', '.gitignore']);

const hits = [];
const note = (where, what) => hits.push(`${where}: ${what}`);

function walk(directory, visit) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      ['node_modules', '.git', '.cache', 'test-results', 'playwright-report', 'screenshots'].includes(
        entry.name,
      )
    )
      continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path, visit);
    else visit(path);
  }
}

function looksLikeText(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4000));
  return !sample.includes(0);
}

function inspectFile(path, label) {
  const size = statSync(path).size;
  const extension = path.slice(path.lastIndexOf('.')).toLowerCase();
  if (forbiddenExtensions.has(extension)) note(label, `forbidden file type ${extension}`);
  if (artName.test(path)) note(label, 'file name looks like calculator artwork');
  if (size >= 3 * 1024 * 1024 && size <= 0x2000000) {
    // A TI-84 Plus CE ROM has its certificate field (0x800F) at offset 0x20000 of a 4 MB image.
    const fd = readFileSync(path).subarray(0x20000, 0x20002);
    if (fd.length === 2 && fd[0] === 0x80 && fd[1] === 0x0f)
      note(label, 'looks like a calculator ROM (certificate field at 0x20000)');
  }
  if (size < 4 * 1024 * 1024) {
    const buffer = readFileSync(path);
    if (looksLikeText(buffer) && !ALLOWED_TO_NAME_PATTERNS.has(label)) {
      const text = buffer.toString('utf8');
      for (const pattern of hostPatterns) if (pattern.test(text)) note(label, `matches ${pattern}`);
    }
  }
}

// 1. Every file in the working tree, including ones .gitignore hides (a stray .rom would be ignored by git).
let scanned = 0;
walk(root, (path) => {
  const label = relative(root, path);
  if (label.startsWith('dist/') || label.startsWith('emulator/.cache/')) return;
  inspectFile(path, label);
  scanned++;
});

// 2. The production build, if there is one.
let built = 0;
if (existsSync(dist)) {
  walk(dist, (path) => {
    inspectFile(path, relative(root, path));
    built++;
  });
}

// 3. The corresponding-source archive that the site serves: list its entries.
let archiveEntries = 0;
const archive = resolve(root, 'public/source/vertex-emulator-source.tar.gz');
if (existsSync(archive)) {
  const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean);
  archiveEntries = entries.length;
  for (const entry of entries) {
    const extension = entry.slice(entry.lastIndexOf('.')).toLowerCase();
    if (forbiddenExtensions.has(extension)) note(`archive:${entry}`, `forbidden file type ${extension}`);
    if (artName.test(entry)) note(`archive:${entry}`, 'entry looks like calculator artwork');
    for (const pattern of hostPatterns)
      if (pattern.test(entry)) note(`archive:${entry}`, `matches ${pattern}`);
  }
}

console.log(`scanned ${scanned} repository files, ${built} build files, ${archiveEntries} archive entries`);
console.log(
  `checked for: ROM and OS files (${[...forbiddenExtensions].join(' ')}), ROM-shaped binaries, TI artwork names, and references to the proprietary emulator hosts`,
);
if (hits.length > 0) {
  console.log(`\nFOUND ${hits.length} problem(s):`);
  for (const hit of hits) console.log(`  ${hit}`);
  process.exit(1);
}
console.log('clean: no ROM files, no OS images, no TI art, no references to TI or Pearson emulator hosts');
