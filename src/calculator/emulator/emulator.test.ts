import { describe, expect, it } from 'vitest';
import { KEYS, type KeyId } from '../../core/os/keys.ts';
import { createHarness, NO_KEYS, onlyKey } from '../../test-support/harness.ts';
import { buildSyntheticRom } from '../../test-support/syntheticRom.ts';
import { KEYBOARD_SHORTCUTS } from '../keyboard.ts';
import { ALL_KEY_IDS } from '../keypadLayout.ts';
import { EmulatorCore, type CemuFactory } from './core.ts';

describe('the emulated keypad (real CEmu build)', () => {
  it('lists exactly the 50 keys of the calculator', () => {
    expect(ALL_KEY_IDS).toHaveLength(50);
    expect(new Set(ALL_KEY_IDS)).toEqual(new Set(KEYS.map((k) => k.id)));
  });

  it.each(KEYS.map((k) => [k.id, k.row, k.col] as const))(
    'on-screen key %s sets exactly one bit, row %i column %i, and clears it again',
    async (id, row, col) => {
      const h = await createHarness();
      h.holders.press(id, 'pointer');
      expect(h.rows()).toEqual(onlyKey(row, col));
      h.frames(1);
      expect(h.rows()).toEqual(onlyKey(row, col));
      h.holders.release(id, 'pointer');
      h.frames(4);
      expect(h.rows()).toEqual(NO_KEYS);
    },
  );

  it('reports the ON key on row 2, column 0', async () => {
    const h = await createHarness();
    h.holders.press('ON', 'pointer');
    expect(h.rows()[2]).toBe(1);
    h.holders.release('ON', 'pointer');
    h.frames(4);
    expect(h.rows()[2]).toBe(0);
  });

  it('holds a key as long as the pointer is down, and ends it when the pointer lifts', async () => {
    const h = await createHarness();
    h.holders.press('LEFT', 'pointer');
    h.frames(120);
    expect(h.rows()).toEqual(onlyKey(7, 1));
    h.holders.release('LEFT', 'pointer');
    h.frames(3);
    expect(h.rows()).toEqual(NO_KEYS);
  });

  it('holds several keys at once, for multi-touch games', async () => {
    const h = await createHarness();
    h.holders.press('LEFT', 'finger-1');
    h.holders.press('2ND', 'finger-2');
    h.holders.press('ENTER', 'finger-3');
    const rows = h.rows();
    expect(rows[7]).toBe(1 << 1);
    expect(rows[1]).toBe(1 << 5);
    expect(rows[6]).toBe(1 << 0);
    h.holders.release('2ND', 'finger-2');
    h.frames(4);
    expect(h.rows()[1]).toBe(0);
    expect(h.rows()[7]).toBe(1 << 1);
  });

  it('keeps a key down until its last holder lets go', async () => {
    const h = await createHarness();
    h.holders.press('ENTER', 'mouse');
    h.holders.press('ENTER', 'keyboard');
    h.holders.release('ENTER', 'mouse');
    h.frames(10);
    expect(h.rows()).toEqual(onlyKey(6, 0));
    h.holders.release('ENTER', 'keyboard');
    h.frames(4);
    expect(h.rows()).toEqual(NO_KEYS);
  });

  it('keeps a very short tap down long enough for TI-OS to scan it', async () => {
    const h = await createHarness();
    h.holders.tap('SIN');
    expect(h.rows()).toEqual(onlyKey(3, 5));
    h.frames(2);
    expect(h.rows()).toEqual(onlyKey(3, 5));
    h.frames(2);
    expect(h.rows()).toEqual(NO_KEYS);
  });
});

describe('keyboard shortcuts drive the emulated keypad (real CEmu build)', () => {
  const byId = new Map(KEYS.map((k) => [k.id, k]));

  it.each(KEYBOARD_SHORTCUTS.map(([key, id]) => [key, id] as const))(
    'pressing %j presses calculator key %s',
    async (key, id: KeyId) => {
      const h = await createHarness();
      const info = byId.get(id)!;
      const code = key.length === 1 ? `Key${key.toUpperCase()}` : key;
      expect(h.keyboard.keyDown({ key, code })).toBe(true);
      expect(h.rows()).toEqual(onlyKey(info.row, info.col));
      h.frames(2);
      expect(h.rows()).toEqual(onlyKey(info.row, info.col));
      h.keyboard.keyUp({ key, code });
      h.frames(4);
      expect(h.rows()).toEqual(NO_KEYS);
    },
  );

  it('maps Shift to 2nd and Alt to ALPHA when each is tapped alone', async () => {
    const h = await createHarness();
    for (const [modifier, id] of [
      ['Shift', '2ND'],
      ['Alt', 'ALPHA'],
    ] as const) {
      const info = byId.get(id)!;
      h.keyboard.keyDown({ key: modifier, code: `${modifier}Left` });
      expect(h.rows()).toEqual(NO_KEYS); // nothing yet: it might be a real modifier
      h.keyboard.keyUp({ key: modifier, code: `${modifier}Left` });
      expect(h.rows()).toEqual(onlyKey(info.row, info.col));
      h.frames(4);
      expect(h.rows()).toEqual(NO_KEYS);
      h.frames(3);
    }
  });

  it('does not press 2nd when Shift is only a modifier, as in Shift+9 for "("', async () => {
    const h = await createHarness();
    h.keyboard.keyDown({ key: 'Shift', code: 'ShiftLeft' });
    h.keyboard.keyDown({ key: '(', code: 'Digit9' });
    expect(h.rows()).toEqual(onlyKey(4, 4));
    h.keyboard.keyUp({ key: '(', code: 'Digit9' });
    h.keyboard.keyUp({ key: 'Shift', code: 'ShiftLeft' });
    h.frames(6);
    expect(h.rows()).toEqual(NO_KEYS);
  });

  it('sends 2nd then x² for V, one key after the other', async () => {
    const h = await createHarness();
    h.keyboard.keyDown({ key: 'v', code: 'KeyV' });
    h.keyboard.keyUp({ key: 'v', code: 'KeyV' });
    const seen: number[][] = [];
    for (let i = 0; i < 30; i++) {
      h.frame();
      const rows = h.rows();
      if (rows.some((r) => r !== 0)) seen.push(rows);
    }
    const second = onlyKey(1, 5);
    const square = onlyKey(2, 4);
    const sequence = seen.map((rows) =>
      JSON.stringify(rows) === JSON.stringify(second)
        ? '2nd'
        : JSON.stringify(rows) === JSON.stringify(square)
          ? 'x²'
          : 'chord',
    );
    expect(sequence).toContain('2nd');
    expect(sequence).toContain('x²');
    expect(sequence).not.toContain('chord'); // never both at once
    expect(sequence.indexOf('2nd')).toBeLessThan(sequence.indexOf('x²'));
  });

  it('ignores repeated key events, so TI-OS does its own key repeat', async () => {
    const h = await createHarness();
    h.keyboard.keyDown({ key: 'ArrowDown', code: 'ArrowDown' });
    h.keyboard.keyDown({ key: 'ArrowDown', code: 'ArrowDown', repeat: true });
    h.frames(5);
    expect(h.rows()).toEqual(onlyKey(7, 0));
    h.keyboard.keyUp({ key: 'ArrowDown', code: 'ArrowDown' });
    h.frames(4);
    expect(h.rows()).toEqual(NO_KEYS);
  });

  it('leaves browser shortcuts alone', async () => {
    const h = await createHarness();
    expect(h.keyboard.keyDown({ key: 'r', code: 'KeyR', ctrlKey: true })).toBe(false);
    expect(h.keyboard.keyDown({ key: 'c', code: 'KeyC', metaKey: true })).toBe(false);
    expect(h.rows()).toEqual(NO_KEYS);
  });
});

describe('ROM checks and saved state (real CEmu build)', () => {
  async function fresh(): Promise<EmulatorCore> {
    const { default: create } = await import('../../../emulator/dist/vertex-cemu.js');
    return EmulatorCore.create(create as CemuFactory);
  }

  it('accepts a file that has the certificate of a TI-84 Plus CE ROM', async () => {
    const core = await fresh();
    expect(core.bootRom(buildSyntheticRom())).toEqual({ ok: true });
    expect(core.isRunning).toBe(true);
  });

  it.each([
    ['an empty file', new Uint8Array(0), 'empty'],
    ['random text', new TextEncoder().encode('this is not a calculator ROM'), 'notCE'],
    ['4 MB of zeros', new Uint8Array(0x400000), 'notCE'],
    ['a file over CEmu’s size limit', new Uint8Array(0x2000001), 'tooLarge'],
  ] as const)('refuses %s', async (_name, bytes, reason) => {
    const core = await fresh();
    expect(core.bootRom(bytes)).toEqual({ ok: false, reason });
    expect(core.isRunning).toBe(false);
  });

  it('runs frames at 60 per emulated second, far faster than real time', async () => {
    const h = await createHarness();
    const start = performance.now();
    h.frames(120); // two emulated seconds
    expect(performance.now() - start).toBeLessThan(2000);
  });

  it('draws a 320 x 240 frame with an opaque alpha channel', async () => {
    const h = await createHarness();
    h.frames(2);
    h.core.captureFrame();
    const rgba = new Uint8ClampedArray(320 * 240 * 4);
    h.core.writeRgba(rgba);
    expect(rgba.length).toBe(307200);
    for (let i = 3; i < rgba.length; i += 4 * 997) expect(rgba[i]).toBe(255);
  });

  it('saves the whole state and restores it in a new instance, including a held key', async () => {
    const h = await createHarness();
    h.frames(30);
    const image = h.core.saveState();
    expect(image).not.toBeNull();
    expect(image!.byteLength).toBeGreaterThan(1_000_000);

    const other = await fresh();
    expect(other.bootState(image!)).toBe(true);
    expect(other.isRunning).toBe(true);
    other.runFrames(30);
    other.key(6, 0, true);
    expect(other.keyRows()[6]).toBe(1);
  });

  it('refuses a state image that is not one', async () => {
    const core = await fresh();
    expect(core.bootState(new Uint8Array(1000))).toBe(false);
    expect(core.isRunning).toBe(false);
  });
});
