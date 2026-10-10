import { createStore, del, get, set, type UseStore } from 'idb-keyval';

/**
 * Everything Vertex remembers lives in this browser's IndexedDB: the visitor's ROM and the saved state of the
 * calculator. Nothing is uploaded. Removing the ROM also removes the state, because a state belongs to its ROM.
 */
export interface StoredRom {
  name: string;
  size: number;
  data: ArrayBuffer;
  savedAt: number;
}

export interface StoredState {
  data: ArrayBuffer;
  savedAt: number;
  /** Size of the ROM this state was saved with, so a stale state is not restored under a different ROM. */
  romSize: number;
  version: 1;
}

/** The three calls the storage layer needs. IndexedDB provides them in the browser, a Map does in tests. */
export interface KeyValueBackend {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

export function indexedDbBackend(database = 'vertex-calculator', table = 'kv'): KeyValueBackend {
  let store: UseStore | undefined;
  const open = (): UseStore => (store ??= createStore(database, table));
  return {
    get: (key) => get(key, open()),
    set: (key, value) => set(key, value, open()),
    del: (key) => del(key, open()),
  };
}

export function memoryBackend(): KeyValueBackend & { entries: Map<string, unknown> } {
  const entries = new Map<string, unknown>();
  return {
    entries,
    get: <T>(key: string) => Promise.resolve(entries.get(key) as T | undefined),
    set: (key, value) => {
      entries.set(key, value);
      return Promise.resolve();
    },
    del: (key) => {
      entries.delete(key);
      return Promise.resolve();
    },
  };
}

const ROM_KEY = 'rom';
const STATE_KEY = 'state';

/**
 * Asks the browser to keep this site's storage. Chrome grants it silently, Firefox prompts, Safari does not have the
 * call at all. Losing it is not fatal, so a false return is reported, never thrown.
 */
export async function persistBrowserStorage(
  nav: { storage?: { persist?: () => Promise<boolean>; persisted?: () => Promise<boolean> } } = navigator,
): Promise<boolean> {
  try {
    const storage = nav.storage;
    if (typeof storage?.persist !== 'function') return false;
    if (typeof storage.persisted === 'function' && (await storage.persisted())) return true;
    return await storage.persist();
  } catch {
    return false;
  }
}

export class CalculatorStorage {
  constructor(private readonly backend: KeyValueBackend = indexedDbBackend()) {}

  async getRom(): Promise<StoredRom | undefined> {
    const rom = await this.backend.get<StoredRom>(ROM_KEY);
    return rom && rom.data instanceof ArrayBuffer && rom.data.byteLength > 0 ? rom : undefined;
  }

  /** Saves a new ROM and drops the state that belonged to the old one. */
  async putRom(name: string, data: ArrayBuffer): Promise<void> {
    await this.backend.del(STATE_KEY);
    await this.backend.set(ROM_KEY, {
      name,
      size: data.byteLength,
      data,
      savedAt: Date.now(),
    } satisfies StoredRom);
  }

  async getState(romSize?: number): Promise<StoredState | undefined> {
    const state = await this.backend.get<StoredState>(STATE_KEY);
    if (
      !state ||
      state.version !== 1 ||
      !(state.data instanceof ArrayBuffer) ||
      state.data.byteLength === 0
    ) {
      return undefined;
    }
    if (romSize !== undefined && state.romSize !== romSize) return undefined;
    return state;
  }

  async putState(data: ArrayBuffer, romSize: number): Promise<void> {
    await this.backend.set(STATE_KEY, {
      data,
      savedAt: Date.now(),
      romSize,
      version: 1,
    } satisfies StoredState);
  }

  /** Removes the ROM and the saved state. */
  async clear(): Promise<void> {
    await this.backend.del(ROM_KEY);
    await this.backend.del(STATE_KEY);
  }
}
