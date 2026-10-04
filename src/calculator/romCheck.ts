import type { RomCheck } from './emulator/protocol.ts';

/**
 * A fast first look at a file the visitor picked, run on bytes already in memory.
 *
 * It catches the obvious mistakes in microseconds, so a 4 MB text file never reaches the emulator. It is
 * deliberately loose: anything that could be a real ROM goes on to CEmu's own checks in the worker, which are the
 * ones that decide.
 */

/** CEmu's own limit for a flash image (SIZE_FLASH_MAX in core/mem.h). */
export const ROM_MAX_BYTES = 0x2000000;
/** Nothing smaller than this can hold a TI-84 Plus CE flash image. The real ones are about 4 MB. */
export const ROM_MIN_BYTES = 64 * 1024;
/** How much of the start of the file is read to tell a real image from erased or zeroed flash. */
const HEADER_SAMPLE = 4096;

/**
 * Looks at the size and the start of a file before the emulator sees it.
 *
 * The header check only asks one question: does the image hold anything at all? A real dump starts with boot code,
 * so the first 4 KiB are never one repeated byte. No TI data is used here, and no signature is matched against.
 */
export function preflightRom(bytes: Uint8Array): RomCheck {
  if (bytes.byteLength === 0) return { ok: false, reason: 'empty' };
  if (bytes.byteLength > ROM_MAX_BYTES) return { ok: false, reason: 'tooLarge' };
  if (bytes.byteLength < ROM_MIN_BYTES) return { ok: false, reason: 'tooSmall' };
  const sample = Math.min(bytes.byteLength, HEADER_SAMPLE);
  const first = bytes[0]!;
  if (first !== 0x00 && first !== 0xff) return { ok: true };
  for (let i = 1; i < sample; i++) {
    if (bytes[i] !== first) return { ok: true };
  }
  // Erased flash is 0xFF everywhere and a wiped file is 0x00 everywhere. Neither is a calculator.
  return { ok: false, reason: 'invalid' };
}
