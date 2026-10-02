/**
 * A tiny fake "ROM" for tests. It is NOT a calculator ROM and contains no TI code: 4 MiB of erased flash (0xFF)
 * with just enough certificate structure for CEmu's validation to accept it as a TI-84 Plus CE image. The CPU
 * runs nothing useful from it, so the LCD stays blank, but the whole ROM -> emulator pipeline can be exercised
 * without a real ROM. It is built in memory and never written to the repository.
 */
export const SYNTHETIC_ROM_SIZE = 0x400000;

export function buildSyntheticRom(): Uint8Array {
  const rom = new Uint8Array(SYNTHETIC_ROM_SIZE).fill(0xff);
  // Certificate fields CEmu looks for at 0x20000 (see emu_load in core/emu.c): an outer 0x800F field that holds
  // 0x8012 (model 0x13 = 83/84 CE), 0x8021, 0x8032, 0x80A1 and 0x80C2 (device 0x00 = 84 Plus CE).
  const inner = [
    0x80, 0x12, 0x13, 0x00, 0x80, 0x21, 0x00, 0x80, 0x32, 0x00, 0x00, 0x80, 0xa1, 0x00, 0x80, 0xc2, 0x00,
    0x00,
  ];
  // CEmu's parser subtracts each skipped field twice from the remaining length, so the field needs trailing padding.
  const padding = 1024;
  const length = inner.length + padding;
  const header = [
    0x80,
    0x0f,
    (length >>> 24) & 0xff,
    (length >>> 16) & 0xff,
    (length >>> 8) & 0xff,
    length & 0xff,
  ];
  rom.set(header, 0x20000);
  rom.set(inner, 0x20000 + header.length);
  rom.fill(0, 0x20000 + header.length + inner.length, 0x20000 + header.length + length);
  return rom;
}
