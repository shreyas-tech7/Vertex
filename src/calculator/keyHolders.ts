import { KEY_BY_ID, type KeyId } from '../core/os/keys.ts';

/** Where key presses go: the emulator client in the page, or a stand-in in tests. */
export interface KeyOutput {
  setKey(row: number, col: number, down: boolean): void;
  tapKey(row: number, col: number): void;
}

/**
 * Tracks who is holding each calculator key. A finger, a mouse button and a keyboard key can all hold the same key.
 * The emulated key goes down when the first holder arrives and comes up when the last one leaves, so several
 * pointers at once (multi-touch for games) behave and nothing sticks.
 */
export class KeyHolders {
  private readonly holders = new Map<KeyId, Set<string>>();
  /** Called with the ids of the keys that are held at this moment. */
  onChange: ((held: ReadonlySet<KeyId>) => void) | undefined;

  constructor(private readonly output: KeyOutput) {}

  press(id: KeyId, holder: string): void {
    let set = this.holders.get(id);
    if (!set) {
      set = new Set();
      this.holders.set(id, set);
    }
    if (set.has(holder)) return;
    set.add(holder);
    if (set.size === 1) {
      const key = KEY_BY_ID.get(id)!;
      this.output.setKey(key.row, key.col, true);
      this.emit();
    }
  }

  release(id: KeyId, holder: string): void {
    const set = this.holders.get(id);
    if (!set || !set.delete(holder)) return;
    if (set.size === 0) {
      this.holders.delete(id);
      const key = KEY_BY_ID.get(id)!;
      this.output.setKey(key.row, key.col, false);
      this.emit();
    }
  }

  /** Press and release in one go. The emulator side keeps the key down long enough for TI-OS to see it. */
  tap(id: KeyId): void {
    const holder = `tap-${id}`;
    this.press(id, holder);
    this.release(id, holder);
  }

  /** Press keys one after another, each released before the next goes down (the 2nd then x² of the V shortcut). */
  tapSequence(ids: readonly KeyId[]): void {
    for (const id of ids) {
      const key = KEY_BY_ID.get(id)!;
      this.output.tapKey(key.row, key.col);
    }
  }

  releaseAll(): void {
    for (const [id, set] of [...this.holders]) {
      for (const holder of [...set]) this.release(id, holder);
    }
  }

  isHeld(id: KeyId): boolean {
    return this.holders.has(id);
  }

  private emit(): void {
    this.onChange?.(new Set(this.holders.keys()));
  }
}
