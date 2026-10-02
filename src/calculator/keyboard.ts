import type { KeyId } from '../core/os/keys.ts';
import type { KeyHolders } from './keyHolders.ts';

/**
 * The physical keyboard. It follows the table in hunterchen7/ti84ce's README, fills the gaps with a few mnemonics,
 * and presses the same calculator keys the on-screen keypad does.
 *
 * Single keys, matched on `event.key` (letters ignore case):
 */
export const KEYBOARD_SHORTCUTS: ReadonlyArray<readonly [key: string, id: KeyId, note: string]> = [
  ...(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] as const).map((d) => [d, d, 'digit'] as const),
  ['+', 'ADD', 'README'],
  ['-', 'SUB', 'README'],
  ['*', 'MUL', 'README'],
  ['/', 'DIV', 'README'],
  ['(', 'LPAREN', 'README'],
  [')', 'RPAREN', 'README'],
  ['^', 'POW', 'README'],
  ['.', 'DOT', 'README'],
  [',', 'COMMA', 'README'],
  ['_', 'NEG', 'README'],
  ['Enter', 'ENTER', 'README'],
  ['Backspace', 'DEL', 'README'],
  ['Delete', 'DEL', 'README'],
  ['ArrowUp', 'UP', 'README'],
  ['ArrowDown', 'DOWN', 'README'],
  ['ArrowLeft', 'LEFT', 'README'],
  ['ArrowRight', 'RIGHT', 'README'],
  ['Escape', 'CLEAR', 'README'],
  ['o', 'ON', 'README'],
  ['s', 'SIN', 'README'],
  ['c', 'COS', 'README'],
  ['t', 'TAN', 'README'],
  ['l', 'LN', 'README'],
  ['g', 'LOG', 'README'],
  ['m', 'MATH', 'README'],
  ['r', 'INV', 'README'],
  ['x', 'XTTN', 'README'],
  ['p', 'PRGM', 'README'],
  ['Insert', 'STO', 'README'],
  ['Home', 'APPS', 'README'],
  ['PageDown', 'PRGM', 'README'],
  ['PageUp', 'VARS', 'README'],
  ['End', 'STAT', 'README'],
  ['F1', 'YEQ', 'README'],
  ['F2', 'WINDOW', 'README'],
  ['F3', 'ZOOM', 'README'],
  ['F4', 'TRACE', 'README'],
  ['F5', 'GRAPH', 'README'],
  // Gaps in the README table, filled with mnemonics (log in docs/DECISIONS.md).
  ['d', 'MODE', 'Vertex: moDe'],
  ['q', 'SQR', 'Vertex: sQuare'],
  // CEmu's own mapping for the space bar. The README uses it to pause, but Vertex has no pause button.
  [' ', '0', 'CEmu'],
];

/** The V key sends 2nd then x², which is the square root. */
export const SQUARE_ROOT_SEQUENCE: readonly KeyId[] = ['2ND', 'SQR'];

/** Shift and Alt are modifiers on a PC keyboard. Tapped on their own they press 2nd and ALPHA. */
export const MODIFIER_TAPS: Readonly<Record<string, KeyId>> = { Shift: '2ND', Alt: 'ALPHA' };

const SHORTCUT_MAP = new Map<string, KeyId>(KEYBOARD_SHORTCUTS.map(([key, id]) => [key, id]));

export interface KeyEventLike {
  key: string;
  code?: string;
  repeat?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  preventDefault?(): void;
}

/** The calculator key a keyboard key stands for, or null. */
export function resolveKey(key: string): KeyId | null {
  const exact = SHORTCUT_MAP.get(key);
  if (exact) return exact;
  if (key.length === 1) return SHORTCUT_MAP.get(key.toLowerCase()) ?? null;
  return null;
}

export class KeyboardController {
  private readonly down = new Map<string, KeyId>();
  private modifierTap: string | null = null;

  constructor(private readonly keys: KeyHolders) {}

  /** Returns true if Vertex used the event (the caller then stops the browser acting on it). */
  keyDown(event: KeyEventLike): boolean {
    if (event.ctrlKey || event.metaKey) return false;
    const physical = event.code || event.key;

    if (event.key in MODIFIER_TAPS) {
      if (!event.repeat) this.modifierTap = event.key;
      event.preventDefault?.();
      return true;
    }
    // Any other key while Shift or Alt is down means it was a real modifier, not a 2nd or ALPHA tap.
    this.modifierTap = null;

    if (event.key === 'v' || event.key === 'V') {
      event.preventDefault?.();
      if (!event.repeat) this.keys.tapSequence(SQUARE_ROOT_SEQUENCE);
      return true;
    }

    const id = resolveKey(event.key);
    if (!id) return false;
    event.preventDefault?.();
    // The operating system repeats held keys. TI-OS repeats them too, so one press is all the calculator needs.
    if (event.repeat || this.down.has(physical)) return true;
    this.down.set(physical, id);
    this.keys.press(id, `kbd:${physical}`);
    return true;
  }

  keyUp(event: KeyEventLike): boolean {
    if (event.ctrlKey || event.metaKey) {
      this.releaseAll();
      return false;
    }
    const tap = MODIFIER_TAPS[event.key];
    if (tap) {
      const wasTap = this.modifierTap === event.key;
      this.modifierTap = null;
      event.preventDefault?.();
      if (wasTap) this.keys.tap(tap);
      return true;
    }
    const physical = event.code || event.key;
    const id = this.down.get(physical);
    if (!id) return resolveKey(event.key) !== null || event.key.toLowerCase() === 'v';
    this.down.delete(physical);
    this.keys.release(id, `kbd:${physical}`);
    event.preventDefault?.();
    return true;
  }

  /** Let go of everything, for when the window loses focus or the tab hides. */
  releaseAll(): void {
    for (const [physical, id] of this.down) this.keys.release(id, `kbd:${physical}`);
    this.down.clear();
    this.modifierTap = null;
  }
}
