import { describe, expect, it } from 'vitest';
import {
  canRunEmulator,
  detectFeatures,
  isIosLike,
  isStandalone,
  missingFeatures,
  type EnvironmentLike,
} from './features.ts';

const everything: EnvironmentLike = {
  WebAssembly: { compile: () => {}, instantiate: () => {} },
  Worker: class {},
  OffscreenCanvas: class {},
  PointerEvent: class {},
  indexedDB: { open: () => {} },
  document: { createElement: () => ({ getContext: () => ({}) }) },
  navigator: { storage: { persist: () => Promise.resolve(true) }, standalone: false },
  matchMedia: () => ({ matches: false }),
};

describe('feature detection', () => {
  it('says yes to a browser that has everything', () => {
    const features = detectFeatures(everything);
    expect(features).toEqual({
      wasm: true,
      worker: true,
      moduleWorker: true,
      indexedDb: true,
      canvas2d: true,
      pointerEvents: true,
      offscreenCanvas: true,
      storagePersist: true,
      standalone: false,
    });
    expect(canRunEmulator(features)).toBe(true);
    expect(missingFeatures(features)).toEqual([]);
  });

  it('names every required feature a browser is missing', () => {
    const features = detectFeatures({});
    expect(features.wasm).toBe(false);
    expect(features.canvas2d).toBe(false);
    expect(canRunEmulator(features)).toBe(false);
    expect(missingFeatures(features)).toEqual(['wasm', 'worker', 'indexedDb', 'canvas2d']);
  });

  it('treats a browser without IndexedDB as unusable, because the ROM lives there', () => {
    const features = detectFeatures({ ...everything, indexedDB: undefined });
    expect(missingFeatures(features)).toEqual(['indexedDb']);
    expect(canRunEmulator(features)).toBe(false);
  });

  it('treats OffscreenCanvas and storage.persist as optional', () => {
    const features = detectFeatures({ ...everything, OffscreenCanvas: undefined, navigator: {} });
    expect(features.offscreenCanvas).toBe(false);
    expect(features.storagePersist).toBe(false);
    expect(canRunEmulator(features)).toBe(true);
  });

  it('survives a canvas that throws instead of returning a context', () => {
    const features = detectFeatures({
      ...everything,
      document: {
        createElement: () => {
          throw new Error('canvas is blocked');
        },
      },
    });
    expect(features.canvas2d).toBe(false);
  });

  it('reads standalone from navigator.standalone and from display-mode', () => {
    expect(isStandalone({ navigator: { standalone: true } })).toBe(true);
    expect(isStandalone({ matchMedia: () => ({ matches: true }) })).toBe(true);
    expect(isStandalone({ matchMedia: () => ({ matches: false }) })).toBe(false);
    expect(isStandalone({})).toBe(false);
  });

  it('recognises iPhone, iPad and an iPad that reports a Mac user agent', () => {
    expect(isIosLike({ navigator: { userAgent: 'iPhone OS 17_0 Safari' } })).toBe(true);
    expect(isIosLike({ navigator: { userAgent: 'iPad; CPU OS 17_0 like Mac OS X' } })).toBe(true);
    expect(
      isIosLike({ navigator: { userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 5 } }),
    ).toBe(true);
    expect(
      isIosLike({ navigator: { userAgent: 'Macintosh', platform: 'MacIntel', maxTouchPoints: 0 } }),
    ).toBe(false);
    expect(isIosLike({ navigator: { userAgent: 'X11; Linux' } })).toBe(false);
  });

  it('never throws on the real environment, whatever it is', () => {
    expect(() => detectFeatures()).not.toThrow();
  });
});
