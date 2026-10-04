/// <reference lib="webworker" />
/**
 * The emulator worker. CEmu runs here, so the page never waits on emulation. The loop and message handling live in
 * EmulatorRunner. This file only connects it to the worker's real timers and message port.
 *
 * The page normally hands over the compiled WebAssembly, because it can start downloading it from the `<link
 * rel="preload">` in the HTML before this worker has even loaded. When the page could not, this worker compiles it
 * itself, so a browser that cannot hand a compiled module to a worker still starts.
 */
import createVertexCemu from '../../../emulator/dist/vertex-cemu.js';
import wasmUrl from '../../../emulator/dist/vertex-cemu.wasm?url';
import { EmulatorCore, type CemuModule } from './core.ts';
import type { FromWorker, ToWorker } from './protocol.ts';
import { EmulatorRunner } from './runner.ts';
import { compileWasm } from './wasm.ts';

const scope = self as unknown as DedicatedWorkerGlobalScope;

let compiled: Promise<WebAssembly.Module> | null = null;
/** One compile, shared by every core this worker creates (the running one and the ROM probe). */
function wasmModule(provided?: WebAssembly.Module): Promise<WebAssembly.Module> {
  if (provided) return Promise.resolve(provided);
  return (compiled ??= compileWasm(wasmUrl));
}

/** Starts CEmu from an already compiled module, so no second download or compile is needed. */
function startCemu(module: WebAssembly.Module): Promise<CemuModule> {
  return createVertexCemu({
    instantiateWasm(
      imports: WebAssembly.Imports,
      receive: (instance: WebAssembly.Instance, compiled: WebAssembly.Module) => void,
    ) {
      WebAssembly.instantiate(module, imports).then(
        (instance) => receive(instance, module),
        (error: unknown) => {
          console.error(`vertex: could not start the emulator (${String(error)})`);
        },
      );
    },
  });
}

const runner = new EmulatorRunner(
  {
    now: () => performance.now(),
    setTimer: (callback, delay) => setTimeout(callback, delay),
    clearTimer: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
    post: (message: FromWorker, transfer = []) => scope.postMessage(message, transfer),
    close: () => scope.close(),
  },
  (module) => EmulatorCore.create(() => wasmModule(module).then(startCemu)),
);

scope.onmessage = (event: MessageEvent<ToWorker>) => runner.handle(event.data);
