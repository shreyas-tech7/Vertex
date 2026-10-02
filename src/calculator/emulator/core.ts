import { LCD_HEIGHT, LCD_WIDTH, type RomCheck } from './protocol.ts';

/** The parts of the Emscripten module that Vertex uses. */
export interface CemuModule {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
    unlink(path: string): void;
    analyzePath(path: string): { exists: boolean };
  };
  HEAPU8: Uint8Array;
  HEAPU32: Uint32Array;
  UTF8ToString(pointer: number): string;
  stringToUTF8(text: string, pointer: number, maxBytes: number): void;
  lengthBytesUTF8(text: string): number;
  _malloc(size: number): number;
  _free(pointer: number): void;
  _vertex_load_rom(path: number): number;
  _vertex_load_state(path: number): number;
  _vertex_save_state(path: number): number;
  _vertex_run_frames(frames: number): void;
  _vertex_frame(): number;
  _vertex_key(row: number, col: number, down: number): void;
  _vertex_key_state(row: number): number;
  _vertex_status(): number;
  _vertex_log(): number;
  _vertex_shutdown(): void;
  _vertex_send_file(path: number): number;
  _vertex_transfer_state(): number;
  _vertex_transfer_value(): number;
  _vertex_transfer_total(): number;
}

export type CemuFactory = () => Promise<CemuModule>;

/** CEmu's own limit for a flash image (SIZE_FLASH_MAX in core/mem.h). Anything bigger cannot be a calculator ROM. */
export const ROM_MAX_BYTES = 0x2000000;

const ROM_PATH = '/rom.bin';
const STATE_PATH = '/state.img';

/** `emu_state_t` values from core/emu.h. */
const EMU_STATE_VALID = 0;
const EMU_STATE_NOT_A_CE = 2;

/** A thin, typed layer over the compiled CEmu module. One instance runs one calculator. */
export class EmulatorCore {
  private readonly frameWords = new Uint32Array(LCD_WIDTH * LCD_HEIGHT);
  private running = false;
  private pendingSend: string | null = null;

  constructor(private readonly module: CemuModule) {}

  static async create(factory: CemuFactory): Promise<EmulatorCore> {
    return new EmulatorCore(await factory());
  }

  get isRunning(): boolean {
    return this.running;
  }

  private withString<T>(text: string, run: (pointer: number) => T): T {
    const m = this.module;
    const size = m.lengthBytesUTF8(text) + 1;
    const pointer = m._malloc(size);
    try {
      m.stringToUTF8(text, pointer, size);
      return run(pointer);
    } finally {
      m._free(pointer);
    }
  }

  private removeFile(path: string): void {
    try {
      this.module.FS.unlink(path);
    } catch {
      /* already gone */
    }
  }

  /** Loads a ROM with CEmu's own checks. On success the calculator is ready to run. */
  bootRom(rom: Uint8Array): RomCheck {
    if (rom.byteLength === 0) return { ok: false, reason: 'empty' };
    if (rom.byteLength > ROM_MAX_BYTES) return { ok: false, reason: 'tooLarge' };
    this.running = false;
    this.module.FS.writeFile(ROM_PATH, rom);
    const state = this.withString(ROM_PATH, (path) => this.module._vertex_load_rom(path));
    this.removeFile(ROM_PATH);
    if (state === EMU_STATE_VALID) {
      this.running = true;
      return { ok: true };
    }
    return { ok: false, reason: state === EMU_STATE_NOT_A_CE ? 'notCE' : 'invalid' };
  }

  /** Restores a saved image from `saveState()`. */
  bootState(image: Uint8Array): boolean {
    this.running = false;
    this.module.FS.writeFile(STATE_PATH, image);
    const state = this.withString(STATE_PATH, (path) => this.module._vertex_load_state(path));
    this.removeFile(STATE_PATH);
    this.running = state === EMU_STATE_VALID;
    return this.running;
  }

  /** The whole emulator state (about 5 MB), or null when nothing is running. */
  saveState(): Uint8Array | null {
    if (!this.running) return null;
    const ok = this.withString(STATE_PATH, (path) => this.module._vertex_save_state(path));
    if (!ok) return null;
    const image = this.module.FS.readFile(STATE_PATH);
    this.removeFile(STATE_PATH);
    return image;
  }

  /** Runs `frames` frames of 1/60 s each. */
  runFrames(frames: number): void {
    if (this.running) this.module._vertex_run_frames(frames);
  }

  /** Compares the LCD with the last frame this method saw, remembers it, and returns true if it changed. */
  captureFrame(): boolean {
    const m = this.module;
    const source = new Uint32Array(m.HEAPU8.buffer, m._vertex_frame(), this.frameWords.length);
    const previous = this.frameWords;
    for (let i = 0; i < source.length; i++) {
      if (source[i] !== previous[i]) {
        previous.set(source);
        return true;
      }
    }
    return false;
  }

  /**
   * Writes the frame from the last `captureFrame()` into `rgba` (320 x 240 x 4 bytes, R G B A). The panel's gamma and
   * the backlight level are already in the pixels, so 2nd plus the up and down arrows change the brightness.
   */
  writeRgba(rgba: Uint8ClampedArray): void {
    const out = new Uint32Array(rgba.buffer, rgba.byteOffset, this.frameWords.length);
    const words = this.frameWords;
    for (let i = 0; i < words.length; i++) {
      const p = words[i]!;
      // CEmu writes 0xAARRGGBB. A canvas wants the bytes R G B A, which is 0xAABBGGRR as a little-endian word.
      out[i] = 0xff000000 | ((p & 0xff) << 16) | (p & 0xff00) | ((p >>> 16) & 0xff);
    }
  }

  key(row: number, col: number, down: boolean): void {
    this.module._vertex_key(row, col, down ? 1 : 0);
  }

  /** The held keys of each of the eight matrix rows, read back from CEmu's keypad. */
  keyRows(): number[] {
    const rows: number[] = [];
    for (let row = 0; row < 8; row++) rows.push(this.module._vertex_key_state(row));
    return rows;
  }

  /** Bit 0 LCD controller on, bit 1 powered off with 2nd OFF. */
  statusFlags(): number {
    const raw = this.module._vertex_status();
    return (raw & 2 ? 1 : 0) | (raw & 4 ? 2 : 0);
  }

  /** CEmu's own messages from the last load. For diagnostics only. */
  loadLog(): string {
    return this.module.UTF8ToString(this.module._vertex_log());
  }

  /** Starts sending a variable file. Returns false if CEmu refused it. Keep running frames until `transferState`. */
  startSend(name: string, data: Uint8Array): boolean {
    if (!this.running) return false;
    const path = `/send-${Date.now()}-${name.replace(/[^A-Za-z0-9._-]/g, '_')}`;
    this.module.FS.writeFile(path, data);
    const result = this.withString(path, (pointer) => this.module._vertex_send_file(pointer));
    this.pendingSend = path;
    return result === 0;
  }

  /** 0 idle, 1 sending, 2 finished, -1 failed. Removes the temporary file once it is no longer needed. */
  transferState(): number {
    const state = this.module._vertex_transfer_state();
    if ((state === 2 || state === -1) && this.pendingSend) {
      this.removeFile(this.pendingSend);
      this.pendingSend = null;
    }
    return state;
  }

  shutdown(): void {
    this.running = false;
    this.module._vertex_shutdown();
  }
}
