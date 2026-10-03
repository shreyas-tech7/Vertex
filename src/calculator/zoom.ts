// Zoom controls adapted from github.com/bifdu9898/TI84Calculator (MIT), see THIRD_PARTY_NOTICES.md.

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

/** Smallest scale a frame can force. A frame narrower than half the case is clipped, nothing can help that. */
const CAP_FLOOR = 0.1;

/**
 * The largest zoom, in whole percent, at which the case still fits a frame of this width. On a desktop frame (600 px)
 * it is above the 200% limit and does nothing. On a phone the frame is the viewport minus 40 px, so 200% is capped.
 */
export function zoomCap(frameWidth: number, bodyWidth: number): number {
  if (!Number.isFinite(frameWidth) || frameWidth <= 0) return ZOOM_MAX;
  return Math.min(ZOOM_MAX, Math.max(CAP_FLOOR, Math.floor((frameWidth / bodyWidth) * 100) / 100));
}

/** The zoom actually applied: what the visitor asked for, held at the cap. */
export function effectiveZoom(requested: number, frameWidth: number, bodyWidth: number): number {
  return tidy(Math.min(clampZoom(requested), zoomCap(frameWidth, bodyWidth)));
}

/**
 * One press of plus or minus, taken from the zoom the visitor sees. When the shown zoom is a cap (108%, say) and not a
 * multiple of 10, minus goes to the 10% step below it (100%) rather than to 98%.
 */
export function stepFromShown(shown: number, direction: 1 | -1): number {
  const percent = Math.round(shown * 100);
  const offset = percent % 10;
  const next = direction === 1 ? percent + (10 - offset) : percent - (offset === 0 ? 10 : offset);
  return clampZoom(next / 100);
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

/** Zoom controls (78 px) plus the Change ROM line and notice under the case (72 px), as the reference's fixed +150. */
export const FRAME_OVERHEAD = 150;

/** The iframe height the parent should use: the case at this zoom plus the controls and the lines below it. */
export const frameHeight = (bodyHeight: number, zoom: number): number => Math.ceil(bodyHeight * zoom + FRAME_OVERHEAD);

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
