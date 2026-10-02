import {
  LCD_HEIGHT,
  LCD_WIDTH,
  type BootResult,
  type FromWorker,
  type RomCheck,
  type SendResult,
  type ToWorker,
} from './protocol.ts';

export interface EmulatorEvents {
  /** A new LCD frame, as 320 x 240 RGBA. Only sent when the picture changed. */
  frame?: (pixels: Uint8ClampedArray) => void;
  /** The held keys of the eight matrix rows, as CEmu's keypad reports them. */
  keys?: (rows: number[]) => void;
  /** Bit 0 LCD on, bit 1 powered off. */
  status?: (flags: number) => void;
  crashed?: (message: string) => void;
}

type Resolver = (value: never) => void;

/** The page's handle on the emulator worker. */
export class EmulatorClient {
  private readonly worker: Worker;
  private nextId = 1;
  private readonly pending = new Map<number, Resolver>();
  private readonly ready: Promise<boolean>;
  events: EmulatorEvents = {};

  constructor(worker?: Worker) {
    this.worker = worker ?? new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    this.ready = new Promise<boolean>((resolve) => {
      this.onReady = resolve;
    });
    this.worker.onmessage = (event: MessageEvent<FromWorker>) => this.handle(event.data);
    this.worker.onerror = () => this.onReady?.(false);
    this.post({ type: 'init' });
  }

  private onReady: ((ok: boolean) => void) | undefined;

  private post(message: ToWorker, transfer: Transferable[] = []): void {
    this.worker.postMessage(message, transfer);
  }

  private handle(message: FromWorker): void {
    switch (message.type) {
      case 'ready':
        this.onReady?.(true);
        break;
      case 'initFailed':
        this.onReady?.(false);
        break;
      case 'frame':
        this.events.frame?.(new Uint8ClampedArray(message.pixels));
        break;
      case 'keys':
        this.events.keys?.(message.rows);
        break;
      case 'status':
        this.events.status?.(message.flags);
        break;
      case 'crashed':
        this.events.crashed?.(message.message);
        break;
      case 'validated':
      case 'booted':
      case 'state':
      case 'sent': {
        const resolve = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (resolve) {
          if (message.type === 'validated') (resolve as (v: RomCheck) => void)(message.result);
          else if (message.type === 'state') (resolve as (v: ArrayBuffer | null) => void)(message.data);
          else {
            const { type: _type, id: _id, ...result } = message;
            (resolve as (v: BootResult | SendResult) => void)(result as BootResult | SendResult);
          }
        }
        break;
      }
    }
  }

  private request<T>(build: (id: number) => ToWorker, transfer: Transferable[] = []): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve) => {
      this.pending.set(id, resolve as Resolver);
      this.post(build(id), transfer);
    });
  }

  /** Resolves true when the WebAssembly module has loaded, false if it could not. */
  whenReady(): Promise<boolean> {
    return this.ready;
  }

  /** Runs CEmu's own ROM checks on a copy of the file. The running calculator is not disturbed. */
  validateRom(rom: ArrayBuffer): Promise<RomCheck> {
    const copy = rom.slice(0);
    return this.request((id) => ({ type: 'validate', id, rom: copy }), [copy]);
  }

  /** Starts the calculator from a saved state, falling back to the ROM when the state does not load. */
  boot(sources: { rom?: ArrayBuffer; state?: ArrayBuffer }): Promise<BootResult> {
    const rom = sources.rom?.slice(0);
    const state = sources.state?.slice(0);
    const transfer = [rom, state].filter((buffer): buffer is ArrayBuffer => buffer !== undefined);
    return this.request((id) => ({ type: 'boot', id, rom, state }), transfer);
  }

  saveState(): Promise<ArrayBuffer | null> {
    return this.request((id) => ({ type: 'saveState', id }));
  }

  send(name: string, data: ArrayBuffer): Promise<SendResult> {
    return this.request((id) => ({ type: 'send', id, name, data }), [data]);
  }

  setKey(row: number, col: number, down: boolean): void {
    this.post({ type: 'key', row, col, down });
  }

  /** Press and release one key in order, with the gaps TI-OS needs. */
  tapKey(row: number, col: number): void {
    this.post({ type: 'tap', row, col });
  }

  releaseAll(): void {
    this.post({ type: 'releaseAll' });
  }

  pause(): void {
    this.post({ type: 'pause' });
  }

  resume(): void {
    this.post({ type: 'resume' });
  }

  dispose(): void {
    this.post({ type: 'shutdown' });
    this.worker.terminate();
  }
}

export { LCD_HEIGHT, LCD_WIDTH };
