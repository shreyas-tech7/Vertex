/** Messages between the page and the emulator worker. Everything is structured-clone friendly. */

export const LCD_WIDTH = 320;
export const LCD_HEIGHT = 240;
export const FRAME_BYTES = LCD_WIDTH * LCD_HEIGHT * 4;

/** Why a ROM was refused. `unavailable` means the emulator itself could not run. */
export type RomRejection = 'empty' | 'tooLarge' | 'invalid' | 'notCE' | 'unavailable';
export type RomCheck = { ok: true } | { ok: false; reason: RomRejection };

export type BootSource = 'state' | 'rom';
export type BootResult = { ok: true; from: BootSource } | { ok: false; reason: RomRejection | 'noSource' };

export type SendResult = { ok: true } | { ok: false; reason: 'notRunning' | 'rejected' | 'timeout' };

/** Bits of the status report. */
export const STATUS_LCD_ON = 1;
export const STATUS_POWERED_OFF = 2;

export type ToWorker =
  | { type: 'init' }
  | { type: 'validate'; id: number; rom: ArrayBuffer }
  | { type: 'boot'; id: number; rom?: ArrayBuffer; state?: ArrayBuffer }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'key'; row: number; col: number; down: boolean }
  | { type: 'tap'; row: number; col: number }
  | { type: 'releaseAll' }
  | { type: 'saveState'; id: number }
  | { type: 'send'; id: number; name: string; data: ArrayBuffer }
  | { type: 'shutdown' };

export type FromWorker =
  | { type: 'ready' }
  | { type: 'initFailed'; message: string }
  | { type: 'validated'; id: number; result: RomCheck }
  | ({ type: 'booted'; id: number } & BootResult)
  | { type: 'frame'; pixels: ArrayBuffer }
  /** The eight rows of the emulated key matrix, one bit per held key. Sent whenever it changes. */
  | { type: 'keys'; rows: number[] }
  | { type: 'status'; flags: number }
  | { type: 'state'; id: number; data: ArrayBuffer | null }
  | ({ type: 'sent'; id: number } & SendResult)
  | { type: 'crashed'; message: string };
