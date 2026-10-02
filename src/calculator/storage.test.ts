import { describe, expect, it } from 'vitest';
import { CalculatorStorage, memoryBackend } from './storage.ts';

const bytes = (n: number, fill = 1) => new Uint8Array(n).fill(fill).buffer;

describe('calculator storage', () => {
  it('saves a ROM and reads it back', async () => {
    const storage = new CalculatorStorage(memoryBackend());
    expect(await storage.getRom()).toBeUndefined();
    await storage.putRom('mine.rom', bytes(100, 7));
    const rom = await storage.getRom();
    expect(rom?.name).toBe('mine.rom');
    expect(rom?.size).toBe(100);
    expect(new Uint8Array(rom!.data)[0]).toBe(7);
  });

  it('saves a state next to its ROM and restores it', async () => {
    const storage = new CalculatorStorage(memoryBackend());
    await storage.putRom('a.rom', bytes(100));
    await storage.putState(bytes(500, 9), 100);
    const state = await storage.getState(100);
    expect(state?.data.byteLength).toBe(500);
    expect(new Uint8Array(state!.data)[0]).toBe(9);
  });

  it('does not restore a state that belongs to a different ROM', async () => {
    const storage = new CalculatorStorage(memoryBackend());
    await storage.putState(bytes(500), 100);
    expect(await storage.getState(200)).toBeUndefined();
  });

  it('drops the old state when the ROM is replaced', async () => {
    const storage = new CalculatorStorage(memoryBackend());
    await storage.putRom('a.rom', bytes(100));
    await storage.putState(bytes(500), 100);
    await storage.putRom('b.rom', bytes(100));
    expect(await storage.getState()).toBeUndefined();
  });

  it('removes the ROM and the state together', async () => {
    const backend = memoryBackend();
    const storage = new CalculatorStorage(backend);
    await storage.putRom('a.rom', bytes(100));
    await storage.putState(bytes(500), 100);
    await storage.clear();
    expect(backend.entries.size).toBe(0);
    expect(await storage.getRom()).toBeUndefined();
  });

  it('ignores damaged records', async () => {
    const backend = memoryBackend();
    await backend.set('rom', { name: 'x', size: 0, data: 'not a buffer', savedAt: 0 });
    await backend.set('state', { version: 2, data: bytes(10), romSize: 1, savedAt: 0 });
    const storage = new CalculatorStorage(backend);
    expect(await storage.getRom()).toBeUndefined();
    expect(await storage.getState()).toBeUndefined();
  });
});
