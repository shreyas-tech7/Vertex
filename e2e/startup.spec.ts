import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildSyntheticRom } from '../src/test-support/syntheticRom.ts';
import {
  MATRIX_EMPTY,
  ROM_ARGS,
  expect,
  expectMatrix,
  keyPoint,
  matrixOnly,
  openCalculator,
  readStored,
  seedStoredRom,
  test,
} from './support.ts';

/**
 * The startup contract: a visitor who has already imported their own ROM opens Vertex and lands on a running
 * calculator with nothing to click. Every ROM here is the synthetic fixture, which is a test file, not a
 * calculator image. No real TI-OS or TI ROM is involved anywhere in this suite.
 */

test.describe('first run', () => {
  test('shows the calculator frame at once, with one ROM step and no other setup', async ({ page }) => {
    await openCalculator(page);
    // The case, the keypad and the LCD are on screen before anything is asked of the visitor.
    await expect(page.locator('.calc-body')).toBeVisible();
    await expect(page.locator('.keypad [data-key]')).toHaveCount(50);
    await expect(page.getByLabel('Calculator screen')).toBeVisible();
    // One step: a picker. The panel sits over the LCD and asks for nothing else.
    const chooser = page.getByRole('button', { name: 'Choose ROM file' });
    await expect(chooser).toBeVisible();
    await expect(page.locator('.rom-panel')).toBeVisible();
    // No multi-step wizard, no engine picker, no Next button.
    await expect(page.getByRole('button', { name: /next|continue|skip/i })).toHaveCount(0);
  });

  test('the file picker accepts any file, so iOS does not refuse the extension', async ({ page }) => {
    await openCalculator(page);
    // An accept attribute naming .rom would make iOS show the file greyed out. Vertex validates the contents itself.
    await expect(page.getByTestId('rom-input')).not.toHaveAttribute('accept', /rom|8xu|\./);
    await expect(page.getByTestId('rom-input')).toHaveJSProperty('type', 'file');
  });
});

test.describe('invalid ROM', () => {
  const cases = [
    { name: 'empty.rom', bytes: Buffer.alloc(0), text: /file is empty/i },
    { name: 'tiny.rom', bytes: Buffer.from('this is not a calculator ROM'), text: /too small/i },
    { name: 'zeroed.rom', bytes: Buffer.alloc(0x400000), text: /not a TI-84 Plus CE ROM/i },
    { name: 'huge.rom', bytes: Buffer.alloc(0x2000001), text: /too big/i },
  ];

  for (const item of cases) {
    test(`${item.name} is refused with one plain sentence and no dead screen`, async ({ page }) => {
      await openCalculator(page);
      await page.getByTestId('rom-input').setInputFiles({ ...ROM_ARGS, name: item.name, buffer: item.bytes });
      const message = page.locator('.rom-error');
      await expect(message).toHaveText(item.text);
      // The sentence tells the visitor what to do next, and the way back is still on screen.
      await expect(message).toContainText(/choose the rom|about 4 mb/i);
      await expect(page.locator('.rom-panel')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Choose ROM file' })).toBeEnabled();
      await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'needRom');
      // Nothing was stored, so the next load is a clean first run again.
      expect(await readStored<{ size: number }>(page, 'rom')).toBeNull();
    });
  }

  test('the synthetic fixture is accepted, so the checks reject bad files and not good ones', async ({
    page,
  }) => {
    await openCalculator(page);
    await page
      .getByTestId('rom-input')
      .setInputFiles({ ...ROM_ARGS, buffer: Buffer.from(buildSyntheticRom()) });
    await expect(page.locator('.rom-error')).toHaveText('');
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
  });
});

test.describe('stored ROM', () => {
  test('boots on its own from a ROM already in IndexedDB, with no click and no ROM screen', async ({
    page,
  }) => {
    await seedStoredRom(page);
    // Watch the page from its first script, so a panel that came and went cannot hide.
    await page.addInitScript(() => {
      const record = window as unknown as { phases: string[]; panels: number };
      record.phases = [];
      record.panels = 0;
      new MutationObserver(() => {
        const phase = document.querySelector('.calc-body')?.getAttribute('data-phase');
        if (phase && record.phases.at(-1) !== phase) record.phases.push(phase);
        record.panels = Math.max(record.panels, document.querySelectorAll('.rom-panel').length);
      }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-phase'],
      });
    });
    await page.goto('/calculator.html');
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running', { timeout: 30_000 });
    const seen = await page.evaluate(() => {
      const record = window as unknown as { phases: string[]; panels: number };
      return { phases: record.phases, panels: record.panels };
    });
    expect(seen.phases).not.toContain('needRom');
    expect(seen.panels).toBe(0);
    await expect(page.locator('.rom-panel')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Change ROM' })).toBeVisible();
    // Usable right away: a key press reaches the emulated keypad without any further setup.
    const point = await keyPoint(page.locator('[data-key="ENTER"]'));
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await expectMatrix(page, matrixOnly(6, 0));
    await page.mouse.up();
    await expectMatrix(page, MATRIX_EMPTY);
  });

  test('restores the saved state as well, and says the ROM came from this browser', async ({ page }) => {
    await seedStoredRom(page);
    await openCalculator(page);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    await expect(page.locator('.calc-body')).toHaveAttribute('data-boot', 'rom');
    await expect(page.locator('.toast')).toContainText('Restored your ROM from this browser');
    // Hiding the tab saves the whole state. The next load comes back from it, not from the ROM again.
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect
      .poll(async () => (await readStored(page, 'state'))?.bytes ?? 0, { timeout: 25_000 })
      .toBeGreaterThan(1_000_000);
    await page.reload();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    await expect(page.locator('.calc-body')).toHaveAttribute('data-boot', 'state');
  });

  test('keeps the ROM in IndexedDB as an ArrayBuffer, and survives a reload and a new tab', async ({
    page,
    context,
  }) => {
    await openCalculator(page);
    await page
      .getByTestId('rom-input')
      .setInputFiles({ ...ROM_ARGS, name: 'mine.rom', buffer: Buffer.from(buildSyntheticRom()) });
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    const stored = await readStored<{ name: string; size: number }>(page, 'rom');
    expect(stored?.name).toBe('mine.rom');
    expect(stored?.size).toBe(0x400000);
    expect(stored?.bytes).toBe(0x400000);
    // A Blob would not survive as bytes. IndexedDB hands back an ArrayBuffer, which is what CEmu needs.
    expect(
      await page.evaluate(() => {
        const open = indexedDB.open('vertex-calculator');
        return new Promise<string>((resolve) => {
          open.onsuccess = () => {
            const get = open.result.transaction('kv').objectStore('kv').get('rom');
            get.onsuccess = () => resolve(Object.prototype.toString.call(get.result.data));
          };
        });
      }),
    ).toBe('[object ArrayBuffer]');

    await page.reload();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    // A new tab in the same browser profile is what a browser restart looks like to a web app.
    const second = await context.newPage();
    await second.goto('/calculator.html');
    await expect(second.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    expect(await readStored<{ name: string }>(second, 'rom')).toMatchObject({ name: 'mine.rom' });
  });

  test('asks the browser to keep the storage after a successful import', async ({ page }) => {
    await page.addInitScript(() => {
      const scope = window as unknown as { persistCalls: number; persistResult: unknown };
      scope.persistCalls = 0;
      const storage = navigator.storage as { persist?: () => Promise<boolean> } | undefined;
      if (!storage?.persist) return;
      const original = storage.persist.bind(storage);
      storage.persist = () => {
        scope.persistCalls++;
        return original();
      };
    });
    await openCalculator(page);
    await page
      .getByTestId('rom-input')
      .setInputFiles({ ...ROM_ARGS, buffer: Buffer.from(buildSyntheticRom()) });
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    // Safari has no navigator.storage.persist. Where it exists, Vertex asks.
    const has = await page.evaluate(() => typeof navigator.storage?.persist === 'function');
    if (has) {
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { persistCalls: number }).persistCalls))
        .toBeGreaterThan(0);
    } else {
      test.info().annotations.push({ type: 'note', description: 'navigator.storage.persist is absent here' });
    }
  });

  test('a stored ROM that cannot be one is reported instead of hanging on a blank screen', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const open = indexedDB.open('vertex-calculator');
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains('kv')) open.result.createObjectStore('kv');
      };
      open.onsuccess = () => {
        open.result
          .transaction('kv', 'readwrite')
          .objectStore('kv')
          .put(
            { name: 'broken.rom', size: 5, data: new Uint8Array([1, 2, 3, 4, 5]).buffer, savedAt: 0 },
            'rom',
          );
      };
    });
    await page.goto('/calculator.html');
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'needRom');
    await expect(page.locator('.rom-error')).toContainText(/too small/i);
    await expect(page.getByRole('button', { name: 'Choose ROM file' })).toBeVisible();
  });
});

test.describe('service worker', () => {
  test.use({ serviceWorkers: 'allow' });

  test('takes over, and the second load works with the network switched off', async ({ page, context }) => {
    await seedStoredRom(page);
    await openCalculator(page);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    // The worker registers on load. Give it the time to take control, then reload into its hands.
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null), { timeout: 20_000 })
      .toBe(true);

    await context.setOffline(true);
    const offline = await context.newPage();
    const errors: string[] = [];
    offline.on('pageerror', (error) => errors.push(error.message));
    await offline.goto('/calculator.html');
    await expect(offline.locator('.calc-body')).toHaveAttribute('data-phase', 'running', { timeout: 30_000 });
    await expect(offline.getByLabel('Calculator screen')).toBeVisible();
    expect(errors).toEqual([]);
    await context.setOffline(false);
  });
});

test.describe('layout', () => {
  const viewports = [
    { name: 'iPad portrait', width: 810, height: 1080 },
    { name: 'iPad landscape', width: 1080, height: 810 },
    { name: 'iPad Split View', width: 507, height: 810 },
    { name: 'iPad Slide Over', width: 320, height: 810 },
    { name: 'phone width', width: 390, height: 844 },
  ];

  for (const viewport of viewports) {
    test(`${viewport.name} (${viewport.width} x ${viewport.height}) keeps the case whole inside the frame`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openCalculator(page, '?lang=en');
      const case_ = (await page.locator('#calculatorDiv').boundingBox())!;
      // The case is never squashed: it keeps its 258 x 604 shape and is scaled down instead.
      expect(case_.width / case_.height).toBeCloseTo(258 / 604, 2);
      expect(case_.width).toBeLessThanOrEqual(viewport.width + 1);
      // Every key is still on screen and inside the case.
      const keys = page.locator('.keypad [data-key]');
      await expect(keys).toHaveCount(50);
      const body = (await page.locator('.calc-body').boundingBox())!;
      for (let i = 0; i < 50; i += 7) {
        const key = (await keys.nth(i).boundingBox())!;
        expect(key.x, `key ${i} left of the case`).toBeGreaterThanOrEqual(body.x - 1);
        expect(key.x + key.width, `key ${i} right of the case`).toBeLessThanOrEqual(body.x + body.width + 1);
      }
      // No horizontal scrolling, whatever the width.
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        viewport.width + 1,
      );
    });
  }

  test('the page never claims more height than the viewport with dvh', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openCalculator(page);
    const height = await page.evaluate(() => getComputedStyle(document.body).minHeight);
    // 100dvh is supported, so the declaration wins over the 100vh fallback that comes before it.
    expect(await page.evaluate(() => CSS.supports('min-height', '100dvh'))).toBe(true);
    expect(height).toBe(`${await page.evaluate(() => window.innerHeight)}px`);
  });
});

test.describe('touch input', () => {
  test.use({ hasTouch: true });

  test('a tap presses a key and lifts it', async ({ page }) => {
    await seedStoredRom(page);
    await openCalculator(page);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    const point = await keyPoint(page.locator('[data-key="7"]'));
    await page.touchscreen.tap(point.x, point.y);
    await expectMatrix(page, MATRIX_EMPTY);
    // A real touch also reaches the emulated keypad while it is held.
    await page.locator('[data-key="7"]').dispatchEvent('pointerdown', {
      pointerId: 7,
      pointerType: 'touch',
      isPrimary: true,
      button: 0,
    });
    await expectMatrix(page, matrixOnly(3, 3));
    await page
      .locator('[data-key="7"]')
      .dispatchEvent('pointercancel', { pointerId: 7, pointerType: 'touch' });
    await expectMatrix(page, MATRIX_EMPTY);
  });

  test('a press that slides off the key and lifts elsewhere does not stick', async ({ page }) => {
    await seedStoredRom(page);
    await openCalculator(page);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    const point = await keyPoint(page.locator('[data-key="7"]'));
    // Pointer capture keeps the release coming back to the key, wherever the finger or mouse ends up.
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await expectMatrix(page, matrixOnly(3, 3));
    await page.mouse.move(point.x, point.y + 400);
    await expectMatrix(page, matrixOnly(3, 3));
    await page.mouse.up();
    await expectMatrix(page, MATRIX_EMPTY);
    await page.mouse.move(point.x, point.y);
    await expectMatrix(page, MATRIX_EMPTY);
  });

  test('losing the page focus lifts every key', async ({ page }) => {
    await seedStoredRom(page);
    await openCalculator(page);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    const point = await keyPoint(page.locator('[data-key="RIGHT"]'));
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await expectMatrix(page, matrixOnly(7, 2));
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expectMatrix(page, MATRIX_EMPTY);
    await page.mouse.up();
  });

  test('key targets are at least 44 px on a touch screen', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The touch default zoom only applies to a touch profile');
    await page.setViewportSize({ width: 810, height: 1080 });
    await openCalculator(page);
    // A first visit on a touch screen starts at 130%, which makes the smallest target 44 px.
    await expect(page.locator('#zoom_level')).toHaveText('130%');
    const boxes = await page.locator('.keypad [data-key]').evaluateAll((nodes) =>
      nodes.map((node) => {
        const element = node as HTMLElement;
        const box = element.getBoundingClientRect();
        const padX = Number.parseFloat(getComputedStyle(element).getPropertyValue('--pad-x')) || 0;
        const padY = Number.parseFloat(getComputedStyle(element).getPropertyValue('--pad-y')) || 0;
        const zoom = Number.parseFloat(
          getComputedStyle(element.closest('.calc-body')!).getPropertyValue('--zoom'),
        );
        return {
          w: (box.width + 2 * padX) * zoom,
          h: (box.height + 2 * padY) * zoom,
          arrow: node.classList.contains('arrow'),
        };
      }),
    );
    const smallest = boxes.reduce((min, b) => Math.min(min, Math.min(b.w, b.h)), Infinity);
    expect(smallest, 'smallest key target in CSS pixels').toBeGreaterThanOrEqual(44);
  });
});

test.describe('ROM exclusion', () => {
  test('the served build holds no ROM, OS image or TI asset', async ({ page }) => {
    const dist = resolve(import.meta.dirname, '..', 'dist');
    test.skip(!existsSync(dist), 'run npm run build first');
    const names = execFileSync('node', ['scripts/scan-forbidden.mjs'], { encoding: 'utf8' });
    expect(names).toContain('clean: no ROM files');
    // The page itself asks for nothing outside its own origin, and no file it serves looks like an image.
    const urls: string[] = [];
    page.on('request', (request) => urls.push(request.url()));
    await openCalculator(page);
    await page.waitForLoadState('networkidle');
    expect(urls.filter((url) => !url.startsWith('http://localhost:4173/'))).toEqual([]);
  });
});
