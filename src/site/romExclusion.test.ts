import { spawnSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * The rule this test guards: Vertex never contains, ships or links to a calculator ROM or OS image. The visitor
 * supplies their own, and it stays in their browser.
 *
 * It runs the same scan the build runs, so a stray file fails the test suite even before `npm run check`.
 */
const root = resolve(import.meta.dirname, '..', '..');
/** Runs the scan and returns its output. On a hit it throws with the output, so the test can match the reason. */
const scan = (): string => {
  const result = spawnSync('node', ['scripts/scan-forbidden.mjs'], { cwd: root, encoding: 'utf8' });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status !== 0) throw new Error(`scan failed with status ${result.status}\n${output}`);
  return output;
};

describe('ROM exclusion', () => {
  it('finds nothing forbidden in the repository or the build output', () => {
    const output = scan();
    expect(output).toContain('clean: no ROM files');
    expect(output).toContain('scanned');
  });

  it('fails on a ROM-shaped binary planted in the build output', () => {
    if (!existsSync(resolve(root, 'dist'))) mkdirSync(resolve(root, 'dist'), { recursive: true });
    // A synthetic 4 MiB image, not real calculator data. The scan recognises it by its shape, not its contents.
    const planted = resolve(root, 'dist', 'planted-test-image.rom');
    const bytes = Buffer.alloc(0x400000, 0xff);
    bytes[0x20000] = 0x80;
    bytes[0x20001] = 0x0f;
    writeFileSync(planted, bytes);
    try {
      expect(() => scan()).toThrow();
      expect(() => scan()).toThrow(/forbidden file type \.rom|looks like a calculator ROM/);
    } finally {
      rmSync(planted, { force: true });
    }
    expect(scan()).toContain('clean: no ROM files');
  });

  it('fails on a file that names TI artwork', () => {
    const planted = resolve(root, 'dist', 'ti-84-plus-ce-faceplate.png');
    writeFileSync(planted, Buffer.from('not artwork'));
    try {
      expect(() => scan()).toThrow(/calculator artwork/);
    } finally {
      rmSync(planted, { force: true });
    }
  });

  afterAll(() => {
    // The scan must be clean again once the planted files are gone.
    expect(scan()).toContain('clean: no ROM files');
  });
});
