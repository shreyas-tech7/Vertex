import { EmulatorCore } from './core.ts';
import { KeyScheduler } from './keyScheduler.ts';
import {
  FRAME_BYTES,
  type BootResult,
  type FromWorker,
  type RomCheck,
  type SendResult,
  type ToWorker,
} from './protocol.ts';

/** What the runner needs from its surroundings. The worker supplies the real ones, tests supply a fake clock. */
export interface RunnerHost {
  now(): number;
  setTimer(callback: () => void, delayMs: number): unknown;
  clearTimer(handle: unknown): void;
  post(message: FromWorker, transfer?: Transferable[]): void;
  /** Called when the worker should close itself. */
  close(): void;
}

export const FRAME_MS = 1000 / 60;
/** Never run more than this many frames per timer tick. Running slow beats racing to catch up. */
const MAX_FRAMES_PER_TICK = 3;
const SEND_TIMEOUT_FRAMES = 60 * 30;

interface PendingSend {
  id: number;
  name: string;
  data: Uint8Array;
}

/**
 * The emulator's main loop and message handling, free of worker globals so it can be tested.
 * It steps CEmu one frame (1/60 s, 800,000 cycles of the 48 MHz CPU) per 1/60 s of wall time, posts the LCD when it
 * changes, and reports the emulated keypad.
 */
export class EmulatorRunner {
  private core: EmulatorCore | null = null;
  private probe: Promise<EmulatorCore> | null = null;
  private scheduler: KeyScheduler | null = null;
  private paused = false;
  private timer: unknown;
  private nextFrameAt = 0;
  private lastKeys = '';
  private lastStatus = -1;
  private forceFrame = true;
  private readonly sendQueue: PendingSend[] = [];
  private activeSend: { id: number; frames: number } | null = null;
  /** Frames of emulated time that have run since the last boot. */
  framesRun = 0;

  constructor(
    private readonly host: RunnerHost,
    private readonly createCore: () => Promise<EmulatorCore>,
  ) {}

  get isPaused(): boolean {
    return this.paused;
  }

  get isRunning(): boolean {
    return this.timer !== undefined;
  }

  private post(message: FromWorker, transfer: Transferable[] = []): void {
    this.host.post(message, transfer);
  }

  private async ensureCore(): Promise<EmulatorCore> {
    this.core ??= await this.createCore();
    return this.core;
  }

  private stopLoop(): void {
    if (this.timer !== undefined) this.host.clearTimer(this.timer);
    this.timer = undefined;
  }

  private publishKeys(): void {
    if (!this.core) return;
    const rows = this.core.keyRows();
    const signature = rows.join(',');
    if (signature === this.lastKeys) return;
    this.lastKeys = signature;
    this.post({ type: 'keys', rows });
  }

  private publishFrame(): void {
    if (!this.core) return;
    const changed = this.core.captureFrame();
    if (!changed && !this.forceFrame) return;
    this.forceFrame = false;
    const rgba = new Uint8ClampedArray(FRAME_BYTES);
    this.core.writeRgba(rgba);
    this.post({ type: 'frame', pixels: rgba.buffer }, [rgba.buffer]);
  }

  private publishStatus(): void {
    if (!this.core) return;
    const flags = this.core.statusFlags();
    if (flags === this.lastStatus) return;
    this.lastStatus = flags;
    this.post({ type: 'status', flags });
  }

  private finishSend(result: SendResult): void {
    if (!this.activeSend) return;
    this.post({ type: 'sent', id: this.activeSend.id, ...result });
    this.activeSend = null;
  }

  private pumpSend(): void {
    const core = this.core;
    if (!core) return;
    if (this.activeSend) {
      const state = core.transferState();
      this.activeSend.frames++;
      if (state === 2) this.finishSend({ ok: true });
      else if (state === -1) this.finishSend({ ok: false, reason: 'rejected' });
      else if (this.activeSend.frames > SEND_TIMEOUT_FRAMES)
        this.finishSend({ ok: false, reason: 'timeout' });
    }
    if (!this.activeSend) {
      const next = this.sendQueue.shift();
      if (next) {
        this.activeSend = { id: next.id, frames: 0 };
        if (!core.startSend(next.name, next.data)) this.finishSend({ ok: false, reason: 'rejected' });
      }
    }
  }

  private tick = (): void => {
    this.timer = undefined;
    const core = this.core;
    const scheduler = this.scheduler;
    if (!core?.isRunning || !scheduler || this.paused) return;
    try {
      const now = this.host.now();
      if (this.nextFrameAt === 0 || now - this.nextFrameAt > 250) this.nextFrameAt = now;
      let ran = 0;
      while (this.nextFrameAt <= now && ran < MAX_FRAMES_PER_TICK) {
        scheduler.tick();
        core.runFrames(1);
        this.nextFrameAt += FRAME_MS;
        this.framesRun++;
        ran++;
      }
      // Drop whatever is more than two frames behind instead of fast-forwarding.
      if (this.nextFrameAt < now - 2 * FRAME_MS) this.nextFrameAt = now - FRAME_MS;
      if (ran > 0) {
        this.publishFrame();
        this.publishKeys();
        this.publishStatus();
        this.pumpSend();
      }
      this.timer = this.host.setTimer(this.tick, Math.max(0, this.nextFrameAt - this.host.now()));
    } catch (error) {
      this.post({ type: 'crashed', message: error instanceof Error ? error.message : String(error) });
    }
  };

  private startLoop(): void {
    this.stopLoop();
    this.nextFrameAt = 0;
    if (this.core?.isRunning && !this.paused) this.timer = this.host.setTimer(this.tick, 0);
  }

  private async validate(id: number, rom: ArrayBuffer): Promise<void> {
    let result: RomCheck;
    try {
      // A separate instance, because loading a ROM tears down whatever the main instance is running.
      this.probe ??= this.createCore();
      const instance = await this.probe;
      result = instance.bootRom(new Uint8Array(rom));
      instance.shutdown();
    } catch {
      this.probe = null;
      result = { ok: false, reason: 'unavailable' };
    }
    this.post({ type: 'validated', id, result });
  }

  private async boot(id: number, rom?: ArrayBuffer, state?: ArrayBuffer): Promise<void> {
    this.stopLoop();
    let result: BootResult = { ok: false, reason: 'noSource' };
    try {
      const instance = await this.ensureCore();
      instance.shutdown();
      this.scheduler?.releaseAll();
      this.scheduler = new KeyScheduler({ set: (row, col, down) => instance.key(row, col, down) });
      this.lastKeys = '';
      this.lastStatus = -1;
      this.forceFrame = true;
      this.framesRun = 0;
      this.sendQueue.length = 0;
      this.activeSend = null;
      if (state && instance.bootState(new Uint8Array(state))) {
        result = { ok: true, from: 'state' };
      } else if (rom) {
        const check = instance.bootRom(new Uint8Array(rom));
        result = check.ok ? { ok: true, from: 'rom' } : { ok: false, reason: check.reason };
      }
    } catch {
      result = { ok: false, reason: 'unavailable' };
    }
    this.post({ type: 'booted', id, ...result });
    if (result.ok) this.startLoop();
  }

  private saveState(id: number): void {
    let data: ArrayBuffer | null = null;
    try {
      const image = this.core?.saveState();
      // Copy into a buffer that is exactly the state, so it can be transferred without the emulator's heap.
      if (image) data = image.slice().buffer as ArrayBuffer;
    } catch {
      data = null;
    }
    this.post({ type: 'state', id, data }, data ? [data] : []);
  }

  /** Handles one message from the page. */
  handle(message: ToWorker): void {
    switch (message.type) {
      case 'init':
        this.ensureCore().then(
          () => this.post({ type: 'ready' }),
          (error: unknown) =>
            this.post({
              type: 'initFailed',
              message: error instanceof Error ? error.message : String(error),
            }),
        );
        break;
      case 'validate':
        void this.validate(message.id, message.rom);
        break;
      case 'boot':
        void this.boot(message.id, message.rom, message.state);
        break;
      case 'pause':
        this.paused = true;
        this.stopLoop();
        this.scheduler?.releaseAll();
        this.publishKeys();
        break;
      case 'resume':
        this.paused = false;
        this.startLoop();
        break;
      case 'key':
        this.scheduler?.setKey(message.row, message.col, message.down);
        this.publishKeys();
        break;
      case 'tap':
        this.scheduler?.enqueueTap(message.row, message.col);
        break;
      case 'releaseAll':
        this.scheduler?.releaseAll();
        this.publishKeys();
        break;
      case 'saveState':
        this.saveState(message.id);
        break;
      case 'send':
        if (this.paused || !this.core?.isRunning) {
          this.post({ type: 'sent', id: message.id, ok: false, reason: 'notRunning' });
        } else {
          this.sendQueue.push({ id: message.id, name: message.name, data: new Uint8Array(message.data) });
        }
        break;
      case 'shutdown':
        this.stopLoop();
        this.core?.shutdown();
        this.host.close();
        break;
    }
  }
}
