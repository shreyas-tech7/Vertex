/// <reference lib="webworker" />
/**
 * The emulator worker. CEmu runs here, so the page never waits on emulation. The loop and message handling live in
 * EmulatorRunner. This file only connects it to the worker's real timers and message port.
 */
import createVertexCemu from '../../../emulator/dist/vertex-cemu.js';
import { EmulatorCore } from './core.ts';
import type { FromWorker, ToWorker } from './protocol.ts';
import { EmulatorRunner } from './runner.ts';

const scope = self as unknown as DedicatedWorkerGlobalScope;

const runner = new EmulatorRunner(
  {
    now: () => performance.now(),
    setTimer: (callback, delay) => setTimeout(callback, delay),
    clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    post: (message: FromWorker, transfer = []) => scope.postMessage(message, transfer),
    close: () => scope.close(),
  },
  () => EmulatorCore.create(createVertexCemu),
);

scope.onmessage = (event: MessageEvent<ToWorker>) => runner.handle(event.data);
