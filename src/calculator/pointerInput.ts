import type { KeyId } from '../core/os/keys.ts';
import type { KeyHolders } from './keyHolders.ts';

/**
 * Pressing a key with a pointer.
 *
 * Pointer events are the normal path: one set of handlers covers a mouse, a finger and a pen, and pointer capture
 * keeps the release coming back to the key even when a finger slides off it. A browser without PointerEvent gets
 * mouse and touch handlers instead, which do the same job with a holder per input.
 */

export interface PressTarget {
  setPointerCapture?(id: number): void;
}

export interface PressEvent {
  pointerId: number;
  pointerType?: string;
  button?: number;
  preventDefault(): void;
  currentTarget: PressTarget;
}

/** Right click and middle click are not key presses. */
const isPrimary = (event: PressEvent): boolean =>
  event.pointerType !== 'mouse' || event.button === undefined || event.button === 0;

export function beginPress(event: PressEvent, holders: KeyHolders, id: KeyId): void {
  if (!isPrimary(event)) return;
  event.preventDefault();
  try {
    event.currentTarget.setPointerCapture?.(event.pointerId);
  } catch {
    /* the pointer is already gone */
  }
  holders.press(id, `ptr:${event.pointerId}`);
}

export function endPress(event: { pointerId: number }, holders: KeyHolders, id: KeyId): void {
  holders.release(id, `ptr:${event.pointerId}`);
}

/** Touch and mouse identifiers both start at 0, so a touch needs its own prefix to stay separate. */
export const touchHolder = (identifier: number): number => 1_000_000 + identifier;
export const mouseHolder = 0;

export function beginLegacyPress(holders: KeyHolders, id: KeyId, holder: number): void {
  holders.press(id, `ptr:${holder}`);
}

export function endLegacyPress(holders: KeyHolders, id: KeyId, holder: number): void {
  holders.release(id, `ptr:${holder}`);
}

/** Which set of handlers the keypad should use. Decided once, from what the browser actually has. */
export type InputMode = 'pointer' | 'legacy';

export function inputMode(hasPointerEvents: boolean): InputMode {
  return hasPointerEvents ? 'pointer' : 'legacy';
}
