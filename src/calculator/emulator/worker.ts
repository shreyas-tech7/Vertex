/// <reference lib="webworker" />
/**
 * The emulator worker. CEmu runs here, so the page never waits on emulation. The worker steps the core at 60 frames
 * per second of emulated time (800,000 cycles of the 48 MHz CPU each), turns the LCD into RGBA and posts it to the page.
 */
import createVertexCemu from '../../../emulator/dist/vertex-cemu.js';
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

const scope = self as unknown as DedicatedWorkerGlobalScope;
const FRAME_MS = 1000 / 60;
const SEND_TIMEOUT_FRAMES = 60 * 30;

let core: EmulatorCore | null = null;
let probe: Promise<EmulatorCore> | null = null;
let scheduler: KeyScheduler | null = null;
let paused = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextFrameAt = 0;
let lastKeys = '';
let lastStatus = -1;
let forceFrame = true;

interface PendingSend {
  id: number;
  name: string;
  data: Uint8Array;
}
const sendQueue: PendingSend[] = [];
let activeSend: { id: number; frames: number } | null = null;

function post(message: FromWorker, transfer: Transferable[] = []): void {
  scope.postMessage(message, transfer);
}

async function ensureCore(): Promise<EmulatorCore> {
  if (!core) core = await EmulatorCore.create(createVertexCemu);
  return core;
}

function stopLoop(): void {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
}

function publishKeys(): void {
  if (!core) return;
  const rows = core.keyRows();
  const signature = rows.join(',');
  if (signature === lastKeys) return;
  lastKeys = signature;
  post({ type: 'keys', rows });
}

function publishFrame(): void {
  if (!core) return;
  const changed = core.captureFrame();
  if (!changed && !forceFrame) return;
  forceFrame = false;
  const rgba = new Uint8ClampedArray(FRAME_BYTES);
  core.writeRgba(rgba);
  post({ type: 'frame', pixels: rgba.buffer }, [rgba.buffer]);
}

function publishStatus(): void {
  if (!core) return;
  const flags = core.statusFlags();
  if (flags === lastStatus) return;
  lastStatus = flags;
  post({ type: 'status', flags });
}

function finishSend(result: SendResult): void {
  if (!activeSend) return;
  post({ type: 'sent', id: activeSend.id, ...result });
  activeSend = null;
}

function pumpSend(): void {
  if (!core) return;
  if (activeSend) {
    const state = core.transferState();
    activeSend.frames++;
    if (state === 2) finishSend({ ok: true });
    else if (state === -1) finishSend({ ok: false, reason: 'rejected' });
    else if (activeSend.frames > SEND_TIMEOUT_FRAMES) finishSend({ ok: false, reason: 'timeout' });
  }
  if (!activeSend) {
    const next = sendQueue.shift();
    if (next) {
      activeSend = { id: next.id, frames: 0 };
      if (!core.startSend(next.name, next.data)) finishSend({ ok: false, reason: 'rejected' });
    }
  }
}

function loop(): void {
  timer = undefined;
  if (!core?.isRunning || !scheduler || paused) return;
  try {
    const now = performance.now();
    if (nextFrameAt === 0 || now - nextFrameAt > 250) nextFrameAt = now;
    let ran = 0;
    while (nextFrameAt <= now && ran < 3) {
      scheduler.tick();
      core.runFrames(1);
      nextFrameAt += FRAME_MS;
      ran++;
    }
    // Running slow is better than racing to catch up. Drop whatever is more than two frames behind.
    if (nextFrameAt < now - 2 * FRAME_MS) nextFrameAt = now - FRAME_MS;
    if (ran > 0) {
      publishFrame();
      publishKeys();
      publishStatus();
      pumpSend();
    }
    timer = setTimeout(loop, Math.max(0, nextFrameAt - performance.now()));
  } catch (error) {
    post({ type: 'crashed', message: error instanceof Error ? error.message : String(error) });
  }
}

function startLoop(): void {
  stopLoop();
  nextFrameAt = 0;
  if (core?.isRunning && !paused) timer = setTimeout(loop, 0);
}

async function validate(id: number, rom: ArrayBuffer): Promise<void> {
  let result: RomCheck;
  try {
    // A separate instance, because loading a ROM tears down whatever the main instance is running.
    probe ??= EmulatorCore.create(createVertexCemu);
    const instance = await probe;
    result = instance.bootRom(new Uint8Array(rom));
    instance.shutdown();
  } catch {
    probe = null;
    result = { ok: false, reason: 'unavailable' };
  }
  post({ type: 'validated', id, result });
}

async function boot(id: number, rom?: ArrayBuffer, state?: ArrayBuffer): Promise<void> {
  stopLoop();
  let result: BootResult = { ok: false, reason: 'noSource' };
  try {
    const instance = await ensureCore();
    instance.shutdown();
    scheduler?.releaseAll();
    scheduler = new KeyScheduler({ set: (row, col, down) => instance.key(row, col, down) });
    lastKeys = '';
    lastStatus = -1;
    forceFrame = true;
    sendQueue.length = 0;
    activeSend = null;
    if (state && instance.bootState(new Uint8Array(state))) {
      result = { ok: true, from: 'state' };
    } else if (rom) {
      const check = instance.bootRom(new Uint8Array(rom));
      result = check.ok ? { ok: true, from: 'rom' } : { ok: false, reason: check.reason };
    }
  } catch {
    result = { ok: false, reason: 'unavailable' };
  }
  post({ type: 'booted', id, ...result });
  if (result.ok) startLoop();
}

function saveState(id: number): void {
  let data: ArrayBuffer | null = null;
  try {
    const image = core?.saveState();
    if (image) {
      // Copy into a buffer that is exactly the state, so it can be transferred without the emulator's heap.
      data = image.slice().buffer as ArrayBuffer;
    }
  } catch {
    data = null;
  }
  post({ type: 'state', id, data }, data ? [data] : []);
}

scope.onmessage = (event: MessageEvent<ToWorker>) => {
  const message = event.data;
  switch (message.type) {
    case 'init':
      ensureCore().then(
        () => post({ type: 'ready' }),
        (error: unknown) =>
          post({ type: 'initFailed', message: error instanceof Error ? error.message : String(error) }),
      );
      break;
    case 'validate':
      void validate(message.id, message.rom);
      break;
    case 'boot':
      void boot(message.id, message.rom, message.state);
      break;
    case 'pause':
      paused = true;
      stopLoop();
      scheduler?.releaseAll();
      publishKeys();
      break;
    case 'resume':
      paused = false;
      startLoop();
      break;
    case 'key':
      scheduler?.setKey(message.row, message.col, message.down);
      publishKeys();
      break;
    case 'tap':
      scheduler?.enqueueTap(message.row, message.col);
      break;
    case 'releaseAll':
      scheduler?.releaseAll();
      publishKeys();
      break;
    case 'saveState':
      saveState(message.id);
      break;
    case 'send':
      if (paused || !core?.isRunning) {
        post({ type: 'sent', id: message.id, ok: false, reason: 'notRunning' });
      } else {
        sendQueue.push({ id: message.id, name: message.name, data: new Uint8Array(message.data) });
      }
      break;
    case 'shutdown':
      stopLoop();
      core?.shutdown();
      scope.close();
      break;
  }
};
