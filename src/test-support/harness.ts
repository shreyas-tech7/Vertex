import { EmulatorCore, type CemuFactory } from '../calculator/emulator/core.ts';
import { KeyScheduler } from '../calculator/emulator/keyScheduler.ts';
import { KeyHolders } from '../calculator/keyHolders.ts';
import { KeyboardController } from '../calculator/keyboard.ts';
import { buildSyntheticRom } from './syntheticRom.ts';

/** The real CEmu WebAssembly build, booted with the synthetic ROM, wired to the same input classes the page uses. */
export async function createHarness() {
  const { default: create } = await import('../../emulator/dist/vertex-cemu.js');
  const core = await EmulatorCore.create(create as CemuFactory);
  const boot = core.bootRom(buildSyntheticRom());
  if (!boot.ok) throw new Error(`synthetic ROM was refused: ${boot.reason}`);

  const scheduler = new KeyScheduler({ set: (row, col, down) => core.key(row, col, down) });
  const holders = new KeyHolders({
    setKey: (row, col, down) => scheduler.setKey(row, col, down),
    tapKey: (row, col) => scheduler.enqueueTap(row, col),
  });
  const keyboard = new KeyboardController(holders);

  /** One emulated frame, in the order the worker does it. */
  const frame = () => {
    scheduler.tick();
    core.runFrames(1);
  };
  const frames = (count: number) => {
    for (let i = 0; i < count; i++) frame();
  };
  return { core, scheduler, holders, keyboard, frame, frames, rows: () => core.keyRows() };
}

/** The matrix with exactly one key held: rows[row] has only bit `col` set and every other row is zero. */
export function onlyKey(row: number, col: number): number[] {
  const rows = [0, 0, 0, 0, 0, 0, 0, 0];
  rows[row] = 1 << col;
  return rows;
}

export const NO_KEYS = [0, 0, 0, 0, 0, 0, 0, 0];
