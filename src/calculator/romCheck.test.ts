import { describe, expect, it } from 'vitest';
import { ROM_MAX_BYTES, ROM_MIN_BYTES, preflightRom } from './romCheck.ts';

/**
 * These files are synthetic: erased flash, zeros, noise and the synthetic fixture. None of them holds anything from
 * a calculator, and no real ROM is involved anywhere in this suite.
 */
const erased = (size: number) => new Uint8Array(size).fill(0xff);
const withHeader = (bytes: number[], size = 0x400000) => {
  const rom = erased(size);
  rom.set(bytes, 0);
  return rom;
};

describe('ROM preflight', () => {
  it('accepts the synthetic fixture, which is what the browser tests boot', () => {
    expect(preflightRom(withHeader([0x00, 0x56, 0x45, 0x52, 0x54, 0x45, 0x58]))).toEqual({ ok: true });
  });

  it('rejects an empty file', () => {
    expect(preflightRom(new Uint8Array(0))).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects a file below the smallest plausible flash image', () => {
    expect(preflightRom(withHeader([0x4c], ROM_MIN_BYTES - 1))).toEqual({ ok: false, reason: 'tooSmall' });
    expect(preflightRom(Buffer.from('this is not a calculator ROM'))).toEqual({
      ok: false,
      reason: 'tooSmall',
    });
    // The smallest size that can hold an image passes on to CEmu, which is the one that really decides.
    expect(preflightRom(withHeader([0x4c], ROM_MIN_BYTES))).toEqual({ ok: true });
  });

  it('rejects a file above CEmu’s own limit', () => {
    expect(preflightRom(erased(ROM_MAX_BYTES + 1))).toEqual({ ok: false, reason: 'tooLarge' });
    expect(preflightRom(erased(ROM_MAX_BYTES))).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects an image whose first 4 KiB are one repeated byte', () => {
    // 4 MiB of erased flash, and 4 MiB of zeros: what a wiped or truncated dump looks like.
    expect(preflightRom(erased(0x400000))).toEqual({ ok: false, reason: 'invalid' });
    expect(preflightRom(new Uint8Array(0x400000))).toEqual({ ok: false, reason: 'invalid' });
  });

  it('accepts an image that differs anywhere in the first 4 KiB it reads', () => {
    const rom = erased(0x400000);
    rom[4095] = 0x00;
    expect(preflightRom(rom)).toEqual({ ok: true });
  });

  it('accepts a 4 MiB image of arbitrary data, because CEmu is the one that decides', () => {
    const rom = new Uint8Array(0x400000);
    for (let i = 0; i < rom.length; i++) rom[i] = i & 0xff;
    expect(preflightRom(rom)).toEqual({ ok: true });
  });

  it('never asks the emulator about a file it can refuse on its own', () => {
    // The point of the preflight: these never reach the worker.
    const refusals = [
      new Uint8Array(0),
      Buffer.from('nope'),
      erased(0x400000),
      erased(ROM_MAX_BYTES + 1),
    ].map((bytes) => preflightRom(bytes));
    expect(refusals.every((result) => result.ok === false)).toBe(true);
  });
});
