/** Zoom for the calculator page: 50% to 200% in 10% steps, remembered in localStorage. */
export const ZOOM_STORAGE_KEY = 'vertex_zoom_level';
export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 2;
export const ZOOM_STEP = 0.1;
export const ZOOM_DEFAULT = 1;

/** Round to whole percent so repeated steps never drift (1.1 + 0.1 is 1.2000000000000002 in floating point). */
const tidy = (value: number): number => Math.round(value * 100) / 100;

export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) return ZOOM_DEFAULT;
  return tidy(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value)));
}

export function stepZoom(value: number, direction: 1 | -1): number {
  return clampZoom(value + direction * ZOOM_STEP);
}

export const zoomLabel = (value: number): string => `${Math.round(value * 100)}%`;

interface TextStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readZoom(storage: TextStorage | null): number {
  try {
    const raw = storage?.getItem(ZOOM_STORAGE_KEY);
    return raw ? clampZoom(parseFloat(raw)) : ZOOM_DEFAULT;
  } catch {
    return ZOOM_DEFAULT;
  }
}

export function saveZoom(storage: TextStorage | null, value: number): void {
  try {
    storage?.setItem(ZOOM_STORAGE_KEY, String(value));
  } catch {
    /* storage blocked: zoom still works, it just is not remembered */
  }
}

/** The message the calculator page sends its parent so the iframe can grow and shrink. */
export interface HeightMessage {
  type: 'updateHeight';
  height: number;
}

/**
 * Posts the new height to the parent page. The message goes to this page's own origin only, never to `*`.
 * The page does nothing when it is opened directly, or from a file where the origin is opaque.
 */
export function notifyParentHeight(height: number, win: Window = window): void {
  if (win.parent === win) return;
  const origin = win.location.origin;
  if (!origin || origin === 'null') return;
  const message: HeightMessage = { type: 'updateHeight', height };
  win.parent.postMessage(message, origin);
}

/** Parent-side check: only our own iframe, from our own origin, with a sane number, may resize it. */
export function acceptHeightMessage(
  event: { origin: string; source: unknown; data: unknown },
  options: { origin: string; frame: Window | null },
): number | null {
  if (event.origin !== options.origin) return null;
  if (!options.frame || event.source !== options.frame) return null;
  const data = event.data as Partial<HeightMessage> | null;
  if (!data || typeof data !== 'object' || data.type !== 'updateHeight') return null;
  const height = data.height;
  if (typeof height !== 'number' || !Number.isFinite(height)) return null;
  return Math.min(4000, Math.max(200, Math.round(height)));
}
