import { describe, expect, it, vi } from 'vitest';
import {
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_STORAGE_KEY,
  acceptHeightMessage,
  clampZoom,
  effectiveZoom,
  frameHeight,
  notifyParentHeight,
  readZoom,
  saveZoom,
  stepFromShown,
  stepZoom,
  zoomCap,
  zoomLabel,
} from './zoom.ts';

const BODY = 258;

describe('zoom cap', () => {
  it('does nothing on the 600 px desktop frame, where even 200% fits', () => {
    expect(zoomCap(600, BODY)).toBe(2);
    expect(effectiveZoom(2, 600, BODY)).toBe(2);
  });

  it('holds the zoom to the widest whole percent that still fits a phone frame (viewport minus 40 px)', () => {
    // frame width -> cap: floor(frame / 258 * 100) / 100
    expect(zoomCap(280, BODY)).toBe(1.08); // 320 px phone
    expect(zoomCap(320, BODY)).toBe(1.24); // 360 px phone
    expect(zoomCap(350, BODY)).toBe(1.35); // 390 px phone
    expect(zoomCap(390, BODY)).toBe(1.51); // 430 px phone
    for (const frame of [280, 320, 350, 390]) {
      expect(BODY * zoomCap(frame, BODY)).toBeLessThanOrEqual(frame);
      expect(BODY * (zoomCap(frame, BODY) + 0.01)).toBeGreaterThan(frame);
    }
  });

  it('shows the capped percentage and keeps 50% and 100% as asked when they fit', () => {
    expect(zoomLabel(effectiveZoom(2, 280, BODY))).toBe('108%');
    expect(effectiveZoom(1, 280, BODY)).toBe(1);
    expect(effectiveZoom(0.5, 280, BODY)).toBe(0.5);
  });

  it('keeps 100% inside a frame narrower than the case, by capping below 100%', () => {
    expect(zoomCap(250, BODY)).toBe(0.96);
    expect(effectiveZoom(1, 250, BODY)).toBe(0.96);
  });

  it('survives nonsense widths', () => {
    expect(zoomCap(0, BODY)).toBe(2);
    expect(zoomCap(Number.NaN, BODY)).toBe(2);
  });

  it('steps from the zoom that is shown: minus from a cap goes to the 10% step below it', () => {
    expect(stepFromShown(1, 1)).toBe(1.1);
    expect(stepFromShown(1, -1)).toBe(0.9);
    expect(stepFromShown(1.08, -1)).toBe(1);
    expect(stepFromShown(1.08, 1)).toBe(1.1);
    expect(stepFromShown(0.5, -1)).toBe(0.5);
    expect(stepFromShown(2, 1)).toBe(2);
  });
});

describe('iframe height', () => {
  it('is the case at this zoom plus 150 px', () => {
    expect(frameHeight(604, 1)).toBe(754);
    expect(frameHeight(604, 2)).toBe(1358);
    expect(frameHeight(604, 0.5)).toBe(452);
    expect(frameHeight(604, 1.08)).toBe(803);
  });
});

describe('zoom', () => {
  it('runs from 50% to 200% in 10% steps without drifting', () => {
    let z = 1;
    const seen: string[] = [];
    for (let i = 0; i < 15; i++) {
      z = stepZoom(z, 1);
      seen.push(zoomLabel(z));
    }
    expect(seen.slice(0, 10)).toEqual([
      '110%',
      '120%',
      '130%',
      '140%',
      '150%',
      '160%',
      '170%',
      '180%',
      '190%',
      '200%',
    ]);
    expect(z).toBe(ZOOM_MAX);
    for (let i = 0; i < 20; i++) z = stepZoom(z, -1);
    expect(z).toBe(ZOOM_MIN);
    expect(zoomLabel(z)).toBe('50%');
  });

  it('clamps and repairs bad values', () => {
    expect(clampZoom(5)).toBe(2);
    expect(clampZoom(0.1)).toBe(0.5);
    expect(clampZoom(Number.NaN)).toBe(1);
  });

  it('saves the level in localStorage and reads it back', () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
    saveZoom(storage, 1.5);
    expect(store.get(ZOOM_STORAGE_KEY)).toBe('1.5');
    expect(readZoom(storage)).toBe(1.5);
    store.set(ZOOM_STORAGE_KEY, '9');
    expect(readZoom(storage)).toBe(2);
    expect(readZoom(null)).toBe(1);
  });

  it('survives blocked storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readZoom(blocked)).toBe(1);
    expect(() => saveZoom(blocked, 1.2)).not.toThrow();
  });
});

describe('height messages', () => {
  const parent = { postMessage: vi.fn() };
  const win = (origin: string) => ({ parent, location: { origin } }) as unknown as Window;

  it('goes to the page’s own origin, never to *', () => {
    parent.postMessage.mockClear();
    notifyParentHeight(812, win('https://vertex.example'));
    expect(parent.postMessage).toHaveBeenCalledWith(
      { type: 'updateHeight', height: 812 },
      'https://vertex.example',
    );
  });

  it('sends nothing from a file URL, where the origin is opaque', () => {
    parent.postMessage.mockClear();
    notifyParentHeight(812, win('null'));
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it('sends nothing when the page is not in a frame', () => {
    const top = { location: { origin: 'https://vertex.example' } } as {
      parent?: unknown;
      location: { origin: string };
    };
    top.parent = top;
    parent.postMessage.mockClear();
    notifyParentHeight(812, top as unknown as Window);
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it('accepts a message only from our origin, our iframe, with a sane height', () => {
    const frame = {} as Window;
    const options = { origin: 'https://vertex.example', frame };
    const good = {
      origin: 'https://vertex.example',
      source: frame,
      data: { type: 'updateHeight', height: 900.4 },
    };
    expect(acceptHeightMessage(good, options)).toBe(900);
    expect(acceptHeightMessage({ ...good, origin: 'https://evil.example' }, options)).toBeNull();
    expect(acceptHeightMessage({ ...good, source: {} }, options)).toBeNull();
    expect(acceptHeightMessage({ ...good, data: { type: 'other', height: 900 } }, options)).toBeNull();
    expect(
      acceptHeightMessage({ ...good, data: { type: 'updateHeight', height: 'tall' } }, options),
    ).toBeNull();
    expect(acceptHeightMessage({ ...good, data: null }, options)).toBeNull();
    expect(acceptHeightMessage({ ...good, data: { type: 'updateHeight', height: 99999 } }, options)).toBe(
      4000,
    );
    expect(acceptHeightMessage({ ...good, data: { type: 'updateHeight', height: 5 } }, options)).toBe(200);
    expect(acceptHeightMessage(good, { origin: 'https://vertex.example', frame: null })).toBeNull();
  });
});
