import { expect, test as base, type Locator, type Page } from '@playwright/test';
import { buildSyntheticRom } from '../src/test-support/syntheticRom.ts';

/**
 * Every test gets a page that records console errors, page errors and requests. A test fails if the page logged an
 * error or asked for anything outside the site's own origin.
 */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page, baseURL }, use) => {
      const problems: string[] = [];
      const own = new URL(baseURL!).origin;
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
      });
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.protocol === 'data:' || url.protocol === 'blob:' || url.protocol === 'about:') return;
        if (url.origin !== own) problems.push(`third-party request: ${request.url()}`);
      });
      await use(problems);
      expect(problems, 'console errors, page errors and third-party requests').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const ROM_ARGS = { name: 'synthetic.rom', mimeType: 'application/octet-stream' } as const;

export const syntheticRomBuffer = (): Buffer => Buffer.from(buildSyntheticRom());

export async function openCalculator(page: Page, query = ''): Promise<void> {
  await page.goto(`/calculator.html${query}`);
  await expect(page.locator('.calc-body')).toBeVisible();
}

/** Picks the synthetic ROM in the panel and waits for the calculator to run. */
export async function loadSyntheticRom(page: Page): Promise<void> {
  await page.getByTestId('rom-input').setInputFiles({ ...ROM_ARGS, buffer: syntheticRomBuffer() });
  await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
  await expect(page.locator('.rom-panel')).toHaveCount(0);
}

/** The zoom the page is showing, in percent. A touch profile starts at 130% until the visitor picks a level. */
export const shownZoom = async (page: Page): Promise<number> =>
  Number.parseFloat((await page.locator('#zoom_level').textContent())!.replace('%', ''));

export const MATRIX_EMPTY = '0000000000000000';

/** The emulated keypad as 16 hex digits (eight rows of one byte), as the worker reports it. */
export function matrixOnly(row: number, col: number): string {
  const rows = [0, 0, 0, 0, 0, 0, 0, 0];
  rows[row] = 1 << col;
  return rows.map((r) => r.toString(16).padStart(2, '0')).join('');
}

export const expectMatrix = (page: Page, hex: string) =>
  expect(page.locator('.keypad')).toHaveAttribute('data-matrix', hex);

/** A point inside a key. Arrow wedges are cut from one disc, so each is aimed away from the hub. */
export async function keyPoint(key: Locator): Promise<{ x: number; y: number }> {
  await key.scrollIntoViewIfNeeded();
  const box = (await key.boundingBox())!;
  const id = await key.getAttribute('data-key');
  const aim: Record<string, [number, number]> = {
    UP: [0.5, 0.2],
    DOWN: [0.5, 0.8],
    LEFT: [0.2, 0.5],
    RIGHT: [0.8, 0.5],
  };
  const [fx, fy] = aim[id!] ?? [0.5, 0.5];
  return { x: box.x + box.width * fx, y: box.y + box.height * fy };
}

/**
 * Records every value the emulated keypad reports, in order. A tap on 2nd or ALPHA is held for about 50 ms, which a
 * polling assertion can miss on a busy machine. The recorder cannot.
 */
export async function recordMatrix(page: Page): Promise<() => string[]> {
  const seen: string[] = [];
  await page.exposeFunction('recordMatrix', (value: string) => void seen.push(value));
  await page.evaluate(() => {
    const keypad = document.querySelector('.keypad')!;
    const report = () =>
      (window as unknown as { recordMatrix(v: string): void }).recordMatrix(
        keypad.getAttribute('data-matrix')!,
      );
    new MutationObserver(report).observe(keypad, { attributes: true, attributeFilter: ['data-matrix'] });
  });
  return () => [...seen];
}

/**
 * Leaves a synthetic ROM in IndexedDB before the page's own script runs, exactly as a previous visit would have.
 * The bytes are built inside the page, so a 4 MB file never crosses the test protocol.
 */
export async function seedStoredRom(page: Page, name = 'stored.rom'): Promise<void> {
  const builder = buildSyntheticRom.toString();
  await page.addInitScript(`
    (() => {
      const build = ${builder};
      const rom = build();
      const open = indexedDB.open('vertex-calculator');
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv');
      };
      open.onsuccess = () => {
        const store = open.result.transaction('kv', 'readwrite').objectStore('kv');
        store.put(
          { name: ${JSON.stringify(name)}, size: rom.byteLength, data: rom.buffer, savedAt: Date.now() },
          'rom',
        );
      };
    })();
  `);
}

/**
 * Reads what the page left in IndexedDB, without dragging the bytes across the test protocol: a saved state is about
 * 5 MB, and serialising one on every poll would take longer than the wait. `bytes` is the size of the stored value.
 */
export async function readStored<T>(
  page: Page,
  key: string,
): Promise<(Omit<T, 'data'> & { bytes: number }) | null> {
  return page.evaluate(
    (name) =>
      new Promise<Record<string, unknown> | null>((resolve) => {
        const open = indexedDB.open('vertex-calculator');
        open.onsuccess = () => {
          const get = open.result.transaction('kv').objectStore('kv').get(name);
          get.onsuccess = () => {
            const value = get.result as Record<string, unknown> | undefined;
            if (!value) {
              resolve(null);
              return;
            }
            const { data, ...rest } = value as { data?: ArrayBuffer };
            resolve({ ...rest, bytes: data?.byteLength ?? 0 });
          };
        };
        open.onerror = () => resolve(null);
      }),
    key,
  ) as Promise<(Omit<T, 'data'> & { bytes: number }) | null>;
}
