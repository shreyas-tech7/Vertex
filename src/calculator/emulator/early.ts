import { EmulatorClient } from './client.ts';

/**
 * The emulator worker, started before React paints.
 *
 * main.tsx calls this while the page is still parsing, so the worker boots and starts compiling the WebAssembly at
 * the same time as React renders the calculator and the page reads the stored ROM out of IndexedDB. One worker
 * serves the whole page, so it is never disposed.
 */
let shared: EmulatorClient | null = null;

export function startEmulatorEarly(): EmulatorClient {
  if (shared) return shared;
  try {
    shared = new EmulatorClient();
  } catch {
    // A browser that cannot start the worker at all. The page shows one honest message instead of a blank screen.
    shared = new EmulatorClient(null);
  }
  return shared;
}
