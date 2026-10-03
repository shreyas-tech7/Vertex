import { KEYS } from '../src/core/os/keys.ts';
import { LANGS } from '../src/site/i18n/types.ts';
import { KEYBOARD_SHORTCUTS } from '../src/calculator/keyboard.ts';
import { buildSyntheticRom } from '../src/test-support/syntheticRom.ts';
import {
  MATRIX_EMPTY,
  ROM_ARGS,
  expect,
  expectMatrix,
  keyPoint,
  loadSyntheticRom,
  matrixOnly,
  openCalculator,
  recordMatrix,
  syntheticRomBuffer,
  test,
} from './support.ts';

test.describe('ROM panel', () => {
  test('first visit shows the panel in the screen area, with a picker, a drop zone and one hint line', async ({
    page,
  }) => {
    await openCalculator(page);
    const panel = page.locator('.rom-panel');
    await expect(panel.getByRole('heading', { name: 'Load your TI-84 Plus CE ROM' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Choose ROM file' })).toBeVisible();
    await expect(panel.locator('.rom-drop')).toContainText('Drop your ROM file here');
    const link = panel.getByRole('link', { name: 'ROM dump wizard in CEmu' });
    await expect(link).toHaveAttribute('href', 'https://ce-programming.github.io/CEmu/');
    // The panel sits exactly over the LCD, which is 232 x 174 (the 320 x 240 screen at 0.725).
    const screen = (await page.locator('.screen').boundingBox())!;
    const box = (await panel.boundingBox())!;
    expect(Math.abs(box.width - screen.width)).toBeLessThan(1);
    expect(Math.abs(box.height - screen.height)).toBeLessThan(1);
    expect(screen.width).toBeCloseTo(232, 0);
    expect(screen.height).toBeCloseTo(174, 0);
    // The Change ROM link only appears once a ROM is loaded.
    await expect(page.getByRole('button', { name: 'Change ROM' })).toBeHidden();
  });

  test('rejects a file that is not a ROM with a plain message', async ({ page }) => {
    await openCalculator(page);
    await page
      .getByTestId('rom-input')
      .setInputFiles({ ...ROM_ARGS, name: 'notes.rom', buffer: Buffer.from('this is not a calculator ROM') });
    await expect(page.locator('.rom-error')).toHaveText('That file is not a TI-84 Plus CE ROM.');
    await expect(page.locator('.rom-panel')).toBeVisible();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'needRom');
  });

  test('rejects an empty file and a 4 MB file of zeros', async ({ page }) => {
    await openCalculator(page);
    await page.getByTestId('rom-input').setInputFiles({ ...ROM_ARGS, buffer: Buffer.alloc(0) });
    await expect(page.locator('.rom-error')).toHaveText('That file is empty.');
    await page.getByTestId('rom-input').setInputFiles({ ...ROM_ARGS, buffer: Buffer.alloc(0x400000) });
    await expect(page.locator('.rom-error')).toHaveText('That file is not a TI-84 Plus CE ROM.');
  });

  test('accepts a file CEmu validates, stores it in IndexedDB and shows the calculator', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await expect(page.getByRole('button', { name: 'Change ROM' })).toBeVisible();
    const stored = await page.evaluate(
      () =>
        new Promise<{ name: string; size: number } | null>((resolve) => {
          const open = indexedDB.open('vertex-calculator');
          open.onsuccess = () => {
            const get = open.result.transaction('kv').objectStore('kv').get('rom');
            get.onsuccess = () =>
              resolve(get.result ? { name: get.result.name, size: get.result.size } : null);
          };
        }),
    );
    expect(stored).toEqual({ name: 'synthetic.rom', size: 0x400000 });
  });

  test('accepts a ROM dropped on the panel', async ({ page }) => {
    await openCalculator(page);
    const dataTransfer = await romDataTransfer(page);
    await page.locator('.rom-drop').dispatchEvent('drop', { dataTransfer });
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
  });

  test('accepts a ROM dropped anywhere on the calculator, not only on the panel', async ({ page }) => {
    await openCalculator(page);
    const dataTransfer = await romDataTransfer(page);
    await page.locator('[data-key="ENTER"]').dispatchEvent('drop', { dataTransfer });
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    await expect(page.locator('.rom-panel')).toHaveCount(0);
  });

  test('a ROM dropped on the case while one is running replaces it', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    const dataTransfer = await romDataTransfer(page);
    await page.locator('.arrow-pad').dispatchEvent('drop', { dataTransfer });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise<string | null>((resolve) => {
              const open = indexedDB.open('vertex-calculator');
              open.onsuccess = () => {
                const get = open.result.transaction('kv').objectStore('kv').get('rom');
                get.onsuccess = () => resolve(get.result ? get.result.name : null);
              };
            }),
        ),
      )
      .toBe('dropped.rom');
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
  });

  test('a reload with a stored ROM never shows the panel and data-phase never says needRom', async ({
    page,
  }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    // Watch from the first moment of the next page load, so nothing can slip past between two polls.
    await page.addInitScript(() => {
      const record = window as unknown as { phases: string[]; panelSeen: boolean };
      record.phases = [];
      record.panelSeen = false;
      new MutationObserver(() => {
        const phase = document.querySelector('.calc-body')?.getAttribute('data-phase');
        if (phase && record.phases[record.phases.length - 1] !== phase) record.phases.push(phase);
        if (document.querySelector('.rom-panel')) record.panelSeen = true;
      }).observe(document, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['data-phase'],
      });
    });
    await page.reload();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    const seen = await page.evaluate(() => {
      const record = window as unknown as { phases: string[]; panelSeen: boolean };
      return { phases: record.phases, panelSeen: record.panelSeen };
    });
    expect(seen.phases).not.toContain('needRom');
    expect(seen.phases.length).toBeGreaterThan(0);
    expect(seen.panelSeen).toBe(false);
  });

  for (const lang of LANGS) {
    test(`${lang}: the ROM panel fits the 232 x 174 LCD without scrolling, with and without an error`, async ({
      page,
    }) => {
      await openCalculator(page, `?lang=${lang}`);
      const fits = () =>
        page.locator('.rom-panel').evaluate((el) => ({
          panelHeight: el.scrollHeight - el.clientHeight,
          panelWidth: el.scrollWidth - el.clientWidth,
          zoneHeight:
            (el.querySelector('.rom-drop') as HTMLElement).scrollHeight -
            (el.querySelector('.rom-drop') as HTMLElement).clientHeight,
        }));
      expect(await fits()).toEqual({ panelHeight: 0, panelWidth: 0, zoneHeight: 0 });
      await page
        .getByTestId('rom-input')
        .setInputFiles({ ...ROM_ARGS, name: 'notes.rom', buffer: Buffer.from('not a ROM') });
      await expect(page.locator('.rom-error')).not.toHaveText('');
      expect(await fits()).toEqual({ panelHeight: 0, panelWidth: 0, zoneHeight: 0 });
    });
  }

  test('a reload boots straight to the calculator from the stored ROM', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await page.reload();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    await expect(page.locator('.rom-panel')).toHaveCount(0);
  });

  test('saves the state when the tab hides and restores it on the next load', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-boot', 'rom');
    await hideTab(page);
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise<number>((resolve) => {
              const open = indexedDB.open('vertex-calculator');
              open.onsuccess = () => {
                const get = open.result.transaction('kv').objectStore('kv').get('state');
                get.onsuccess = () => resolve(get.result ? get.result.data.byteLength : 0);
              };
            }),
        ),
      )
      .toBeGreaterThan(1_000_000);
    await page.reload();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
    await expect(page.locator('.calc-body')).toHaveAttribute('data-boot', 'state');
  });

  test('Change ROM reopens the panel with Replace, Remove and Cancel', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await page.getByRole('button', { name: 'Change ROM' }).click();
    const panel = page.locator('.rom-panel');
    await expect(panel.getByRole('button', { name: 'Replace' })).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Remove' })).toBeVisible();
    await panel.getByRole('button', { name: 'Cancel' }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
  });

  test('a bad replacement leaves the running calculator alone', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await page.getByRole('button', { name: 'Change ROM' }).click();
    await page
      .getByTestId('rom-input')
      .setInputFiles({ ...ROM_ARGS, name: 'bad.rom', buffer: Buffer.from('nope') });
    await expect(page.locator('.rom-error')).toHaveText('That file is not a TI-84 Plus CE ROM.');
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page
      .locator('[data-key="ENTER"]')
      .dispatchEvent('pointerdown', { pointerId: 3, button: 0, pointerType: 'mouse' });
    await expectMatrix(page, matrixOnly(6, 0));
    await page
      .locator('[data-key="ENTER"]')
      .dispatchEvent('pointerup', { pointerId: 3, button: 0, pointerType: 'mouse' });
  });

  test('Remove deletes the ROM and the saved state, and the first-visit panel returns after a reload', async ({
    page,
  }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await page.getByRole('button', { name: 'Change ROM' }).click();
    await page.getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByRole('heading', { name: 'Load your TI-84 Plus CE ROM' })).toBeVisible();
    await page.reload();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'needRom');
    await expect(page.locator('.rom-panel')).toBeVisible();
  });

  test('Replace swaps in a new valid ROM', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await page.getByRole('button', { name: 'Change ROM' }).click();
    await page
      .getByTestId('rom-input')
      .setInputFiles({ ...ROM_ARGS, name: 'second.rom', buffer: syntheticRomBuffer() });
    await expect(page.locator('.rom-panel')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running');
  });
});

test.describe('loading state', () => {
  test('shows a loading state in the screen area while the WebAssembly downloads', async ({
    page,
    context,
  }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await context.route('**/*.wasm', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });
    await page.reload();
    const loading = page.locator('.screen-loading');
    await expect(loading).toBeVisible();
    await expect(loading).toContainText('Loading the emulator');
    await expect(page.locator('.rom-panel')).toHaveCount(0);
    await expect(page.locator('.calc-body')).toHaveAttribute('data-phase', 'running', { timeout: 15_000 });
    await expect(loading).toHaveCount(0);
  });
});

test.describe('emulator failure', () => {
  test('says so plainly when the emulator cannot load', async ({ page, context, problems }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await context.route('**/*.wasm', (route) => route.abort());
    await page.reload();
    await expect(page.locator('.screen-failed')).toHaveText(
      'The emulator could not start. Reload the page and try again.',
    );
    problems.length = 0; // the failed download is the point of this test
  });
});

test.describe('program transfer', () => {
  test('a variable file dropped on the calculator is sent', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await dropFile(page, 'HELLO.8xp', 'program bytes');
    await expect(page.locator('.toast')).toContainText('HELLO.8xp');
  });

  test('a file the calculator cannot take is refused with a plain message', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    await dropFile(page, 'notes.txt', 'hello');
    await expect(page.locator('.toast')).toHaveText('notes.txt is not a file Vertex can send.');
  });

  test('says to load a ROM first when none is running', async ({ page }) => {
    await openCalculator(page);
    await dropFile(page, 'HELLO.8xp', 'program bytes');
    await expect(page.locator('.toast')).toHaveText('Load a ROM before you send files.');
  });
});

test.describe('input', () => {
  test('all 50 on-screen keys press their own key in the emulated keypad, and release it', async ({
    page,
  }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    const buttons = page.locator('.keypad [data-key]');
    await expect(buttons).toHaveCount(50);
    for (const key of KEYS) {
      const button = page.locator(`.keypad [data-key="${key.id}"]`);
      const point = await keyPoint(button);
      await page.mouse.move(point.x, point.y);
      await page.mouse.down();
      await expectMatrix(page, matrixOnly(key.row, key.col));
      await expect(button).toHaveClass(/is-down/);
      await page.mouse.up();
      await expectMatrix(page, MATRIX_EMPTY);
      await expect(button).not.toHaveClass(/is-down/);
    }
  });

  test('a key stays down while the pointer is held, so TI-OS can repeat it', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    const point = await keyPoint(page.locator('[data-key="RIGHT"]'));
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await page.waitForTimeout(800);
    await expectMatrix(page, matrixOnly(7, 2));
    await page.mouse.up();
    await expectMatrix(page, MATRIX_EMPTY);
  });

  test('several pointers hold several keys at once, for multi-touch', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    const press = (key: string, pointerId: number) =>
      page.locator(`[data-key="${key}"]`).dispatchEvent('pointerdown', {
        pointerId,
        button: 0,
        pointerType: 'touch',
        isPrimary: pointerId === 1,
      });
    const lift = (key: string, pointerId: number) =>
      page.locator(`[data-key="${key}"]`).dispatchEvent('pointerup', {
        pointerId,
        button: 0,
        pointerType: 'touch',
        isPrimary: pointerId === 1,
      });
    await press('LEFT', 1);
    await press('2ND', 2);
    await press('ENTER', 3);
    await expectMatrix(page, '0020000000000102');
    await lift('2ND', 2);
    await expectMatrix(page, '0000000000000102');
    await lift('LEFT', 1);
    await lift('ENTER', 3);
    await expectMatrix(page, MATRIX_EMPTY);
  });

  test('every keyboard shortcut presses the right key', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    const byId = new Map(KEYS.map((k) => [k.id, k]));
    for (const [key, id] of KEYBOARD_SHORTCUTS) {
      const info = byId.get(id)!;
      await page.keyboard.down(key === ' ' ? 'Space' : key);
      await expectMatrix(page, matrixOnly(info.row, info.col));
      await page.keyboard.up(key === ' ' ? 'Space' : key);
      await expectMatrix(page, MATRIX_EMPTY);
    }
  });

  test('Shift taps 2nd, Alt taps ALPHA, and Shift+9 types a parenthesis', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    const history = await recordMatrix(page);
    await page.keyboard.press('Shift');
    await expect.poll(() => history()).toEqual([matrixOnly(1, 5), MATRIX_EMPTY]);
    await page.keyboard.press('Alt');
    await expect
      .poll(() => history())
      .toEqual([matrixOnly(1, 5), MATRIX_EMPTY, matrixOnly(2, 7), MATRIX_EMPTY]);
    await page.keyboard.down('Shift');
    await page.keyboard.down('(');
    await expectMatrix(page, matrixOnly(4, 4));
    await page.keyboard.up('(');
    await page.keyboard.up('Shift');
    await expectMatrix(page, MATRIX_EMPTY);
    // Shift was a modifier here, so 2nd never went down: the only new states are the parenthesis and the release.
    expect(history().slice(4)).toEqual([matrixOnly(4, 4), MATRIX_EMPTY]);
  });

  test('V sends 2nd then x squared', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    const history = await recordMatrix(page);
    await page.keyboard.press('v');
    await expect.poll(() => history().length).toBeGreaterThanOrEqual(4);
    // 2nd goes down and up, then x squared goes down and up, and the two are never down together.
    expect(history()).toEqual([matrixOnly(1, 5), MATRIX_EMPTY, matrixOnly(2, 4), MATRIX_EMPTY]);
  });

  test('the keyboard is left alone while the ROM panel is open', async ({ page }) => {
    await openCalculator(page);
    await page.keyboard.press('Enter');
    await expectMatrix(page, MATRIX_EMPTY);
  });
});

test.describe('screen', () => {
  test('is a 320 x 240 canvas drawn at 232 x 174 with smooth scaling', async ({ page }) => {
    await openCalculator(page);
    const canvas = page.getByLabel('Calculator screen');
    await expect(canvas).toHaveJSProperty('width', 320);
    await expect(canvas).toHaveJSProperty('height', 240);
    const box = (await canvas.boundingBox())!;
    expect(box.width).toBeCloseTo(232, 0);
    expect(box.height).toBeCloseTo(174, 0);
    expect(box.width / 320).toBeCloseTo(0.725, 3);
    // Smooth scaling: never the nearest-neighbour keywords.
    expect(await canvas.evaluate((el) => getComputedStyle(el).imageRendering)).toBe('auto');
  });

  test('paints frames from the worker', async ({ page }) => {
    await openCalculator(page);
    await loadSyntheticRom(page);
    // The synthetic ROM draws nothing, so the frame is opaque black. A frame arrived if alpha is 255 everywhere we look.
    await expect
      .poll(() =>
        page.getByLabel('Calculator screen').evaluate((el) => {
          const context = (el as HTMLCanvasElement).getContext('2d')!;
          const data = context.getImageData(0, 0, 320, 240).data;
          return data[3] === 255 && data[data.length - 1] === 255;
        }),
      )
      .toBe(true);
  });
});

test.describe('zoom', () => {
  // A wide window, so the cap for narrow screens never binds here. The cap has its own tests.
  test.use({ viewport: { width: 1280, height: 900 } });

  test('runs 50% to 200% in 10% steps, scales from the top centre with a 0.3s ease, and remembers the level', async ({
    page,
  }) => {
    await openCalculator(page);
    const level = page.locator('#zoom_level');
    await expect(level).toHaveText('100%');
    const calculator = page.locator('#calculatorDiv');
    const style = await calculator.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        origin: s.transformOrigin,
        transition: s.transitionProperty + ' ' + s.transitionDuration + ' ' + s.transitionTimingFunction,
      };
    });
    expect(style.origin).toBe('129px 0px');
    expect(style.transition).toBe('transform 0.3s ease');

    const plus = page.getByRole('button', { name: 'Zoom in' });
    const minus = page.getByRole('button', { name: 'Zoom out' });
    for (let i = 1; i <= 10; i++) {
      await plus.click();
      await expect(level).toHaveText(`${100 + i * 10}%`);
    }
    await expect(plus).toBeDisabled();
    await expect.poll(async () => (await calculator.boundingBox())!.width).toBeCloseTo(516, 0);
    await page.reload();
    await expect(level).toHaveText('200%');
    expect(await page.evaluate(() => localStorage.getItem('vertex_zoom_level'))).toBe('2');

    for (let i = 1; i <= 15; i++) await minus.click();
    await expect(level).toHaveText('50%');
    await expect(minus).toBeDisabled();
    await expect.poll(async () => (await calculator.boundingBox())!.width).toBeCloseTo(129, 0);
    await page.reload();
    await expect(level).toHaveText('50%');
  });

  test('the controls look like the reference: 8px 16px padding, 14px text, grey fill, 4px corners', async ({
    page,
  }) => {
    await openCalculator(page);
    const style = await page.getByRole('button', { name: 'Zoom in' }).evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        padding: s.padding,
        size: s.fontSize,
        bg: s.backgroundColor,
        border: s.border,
        radius: s.borderRadius,
      };
    });
    expect(style).toEqual({
      padding: '8px 16px',
      size: '14px',
      bg: 'rgb(240, 240, 240)',
      border: '1px solid rgb(204, 204, 204)',
      radius: '4px',
    });
  });
});

/** A DataTransfer holding the synthetic ROM, built inside the page so the 4 MB never crosses the protocol. */
async function romDataTransfer(page: import('@playwright/test').Page) {
  const bytes = await page.evaluateHandle(`(${buildSyntheticRom.toString()})()`);
  return page.evaluateHandle((data) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([data as BlobPart], 'dropped.rom'));
    return transfer;
  }, bytes);
}

async function hideTab(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

async function dropFile(page: import('@playwright/test').Page, name: string, content: string): Promise<void> {
  const dataTransfer = await page.evaluateHandle(
    ([fileName, text]) => {
      const transfer = new DataTransfer();
      transfer.items.add(new File([text!], fileName!));
      return transfer;
    },
    [name, content],
  );
  await page.locator('.calc-body').dispatchEvent('drop', { dataTransfer });
}

test.describe('zoom cap on narrow screens', () => {
  // On the landing page the frame is the viewport minus 40. The calculator page measures its own width, so these
  // tests open it at the frame widths 280, 320, 350 and 390 (the 320, 360, 390 and 430 px phones).
  const CAPS: Record<number, number> = { 280: 1.08, 320: 1.24, 350: 1.35, 390: 1.51 };
  for (const [width, cap] of Object.entries(CAPS)) {
    for (const requested of [0.5, 1, 2]) {
      test(`frame ${width}px wide, ${requested * 100}% requested`, async ({ page }) => {
        await page.setViewportSize({ width: Number(width), height: 844 });
        await page.addInitScript(
          (value) => localStorage.setItem('vertex_zoom_level', value),
          String(requested),
        );
        await openCalculator(page);
        const effective = Math.min(requested, cap);
        await expect(page.locator('#zoom_level')).toHaveText(`${Math.round(effective * 100)}%`);
        await expect
          .poll(async () => (await page.locator('#calculatorDiv').boundingBox())!.width)
          .toBeCloseTo(258 * effective, 0);
        expect(258 * effective).toBeLessThanOrEqual(Number(width));
        const plus = page.getByRole('button', { name: 'Zoom in' });
        if (requested > cap) await expect(plus).toBeDisabled();
        else await expect(plus).toBeEnabled();
      });
    }
  }
});
