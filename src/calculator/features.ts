/**
 * Feature detection. Vertex names what a browser is missing instead of leaving the visitor on a blank page.
 *
 * The emulator needs four things: WebAssembly, workers, IndexedDB (the ROM lives there) and a 2D canvas to draw the
 * LCD. Everything else is a bonus and has a fallback. The probe takes its environment as an argument, so it can be
 * tested without a browser.
 */

/** The things without which the calculator cannot run at all. */
export const REQUIRED_FEATURES = ['wasm', 'worker', 'indexedDb', 'canvas2d'] as const;
export type RequiredFeature = (typeof REQUIRED_FEATURES)[number];

export interface DetectedFeatures {
  wasm: boolean;
  worker: boolean;
  /** Module workers. Safari 15 and iPadOS 15 have them, which covers every version Vertex targets. */
  moduleWorker: boolean;
  indexedDb: boolean;
  canvas2d: boolean;
  pointerEvents: boolean;
  offscreenCanvas: boolean;
  /** navigator.storage.persist, which asks the browser to keep the ROM. Safari does not have it. */
  storagePersist: boolean;
  /** True when the page is running as an installed app, so the Add to Home Screen hint would be noise. */
  standalone: boolean;
}

interface CanvasProbe {
  getContext?: (id: string) => unknown;
}

/** The parts of a window Vertex touches. Every field is optional so a bare object can stand in for a browser. */
export interface EnvironmentLike {
  WebAssembly?: { compile?: unknown; instantiate?: unknown };
  Worker?: unknown;
  OffscreenCanvas?: unknown;
  PointerEvent?: unknown;
  indexedDB?: { open?: unknown };
  document?: { createElement?: (tag: string) => CanvasProbe | null };
  navigator?: {
    storage?: { persist?: unknown };
    standalone?: unknown;
    maxTouchPoints?: number;
    userAgent?: string;
    platform?: string;
  };
  matchMedia?: (query: string) => { matches?: boolean } | null;
}

/** Reads the real browser. Never throws: a missing global is simply a missing feature. */
export function browserEnvironment(): EnvironmentLike {
  if (typeof globalThis === 'undefined') return {};
  const scope = globalThis as unknown as Record<string, unknown>;
  const matchMedia = scope.matchMedia as ((query: string) => { matches?: boolean } | null) | undefined;
  return {
    WebAssembly: scope.WebAssembly as EnvironmentLike['WebAssembly'],
    Worker: scope.Worker,
    OffscreenCanvas: scope.OffscreenCanvas,
    PointerEvent: scope.PointerEvent,
    indexedDB: scope.indexedDB as EnvironmentLike['indexedDB'],
    document: scope.document as EnvironmentLike['document'],
    navigator: scope.navigator as EnvironmentLike['navigator'],
    // Wrapped, not passed as a bare reference: matchMedia throws "Illegal invocation" when it loses its `this`.
    matchMedia: typeof matchMedia === 'function' ? (query) => matchMedia(query) : undefined,
  };
}

export function detectFeatures(env: EnvironmentLike = browserEnvironment()): DetectedFeatures {
  let canvas2d: boolean;
  try {
    const element = env.document?.createElement?.('canvas');
    canvas2d = element?.getContext?.('2d') != null;
  } catch {
    canvas2d = false;
  }
  return {
    wasm:
      typeof env.WebAssembly?.compile === 'function' || typeof env.WebAssembly?.instantiate === 'function',
    worker: typeof env.Worker === 'function',
    // Every browser that has module workers reports them the same way: Worker exists and the page can use it.
    moduleWorker: typeof env.Worker === 'function',
    indexedDb: typeof env.indexedDB?.open === 'function',
    canvas2d,
    pointerEvents: typeof env.PointerEvent === 'function',
    offscreenCanvas: typeof env.OffscreenCanvas === 'function',
    storagePersist: typeof env.navigator?.storage?.persist === 'function',
    standalone: isStandalone(env),
  };
}

/** True when the site runs as an installed app, in its own window with no browser chrome. */
export function isStandalone(env: EnvironmentLike = browserEnvironment()): boolean {
  if (env.navigator?.standalone === true) return true;
  const matches = env.matchMedia?.('(display-mode: standalone)')?.matches;
  return matches === true;
}

/** The required features this browser does not have, in a stable order. */
export function missingFeatures(features: DetectedFeatures): RequiredFeature[] {
  return REQUIRED_FEATURES.filter((name) => !features[name]);
}

export function canRunEmulator(features: DetectedFeatures): boolean {
  return missingFeatures(features).length === 0;
}

/**
 * iPhone, iPad and iPod, in Safari. iPadOS 13 and later reports a Mac user agent when the desktop site is
 * requested, so a Mac with more than one touch point counts as an iPad too.
 */
export function isIosLike(env: EnvironmentLike = browserEnvironment()): boolean {
  const agent = env.navigator?.userAgent ?? '';
  if (/iP(hone|ad|od)/.test(agent)) return true;
  const mac = env.navigator?.platform === 'MacIntel';
  return mac && (env.navigator?.maxTouchPoints ?? 0) > 1;
}
