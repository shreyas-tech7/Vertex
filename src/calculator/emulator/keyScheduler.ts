/**
 * Decides when key presses and releases reach the emulated keypad.
 *
 * TI-OS scans the keypad about once per frame, so a press that lasts less than a couple of frames can be missed.
 * A real finger never taps that fast. Mouse clicks and key strokes from a PC can. The scheduler therefore keeps
 * every key down for at least `minHoldFrames` and leaves it up for at least `minGapFrames` before the next press.
 * While a key is really held, nothing is delayed, so TI-OS key repeat works as on hardware.
 */
export interface KeySink {
  set(row: number, col: number, down: boolean): void;
}

export interface KeySchedulerOptions {
  minHoldFrames?: number;
  minGapFrames?: number;
  /** Frames between the keys of a tap sequence (such as the 2nd then x² behind the V shortcut). */
  sequenceGapFrames?: number;
}

interface KeyState {
  desired: boolean;
  actual: boolean;
  changedAt: number;
}

export class KeyScheduler {
  private readonly keys = new Map<number, KeyState>();
  private readonly minHold: number;
  private readonly minGap: number;
  private readonly sequenceGap: number;
  private frame = 0;
  private readonly sequence: number[] = [];
  private sequenceKey: number | null = null;
  private sequenceWait = 0;

  constructor(
    private readonly sink: KeySink,
    options: KeySchedulerOptions = {},
  ) {
    this.minHold = options.minHoldFrames ?? 3;
    this.minGap = options.minGapFrames ?? 2;
    this.sequenceGap = options.sequenceGapFrames ?? 4;
  }

  private static index(row: number, col: number): number {
    return row * 8 + col;
  }

  private state(index: number): KeyState {
    let state = this.keys.get(index);
    if (!state) {
      state = { desired: false, actual: false, changedAt: Number.NEGATIVE_INFINITY };
      this.keys.set(index, state);
    }
    return state;
  }

  private apply(index: number, state: KeyState, down: boolean): void {
    state.actual = down;
    state.changedAt = this.frame;
    this.sink.set(index >> 3, index & 7, down);
  }

  private reconcile(index: number, state: KeyState): void {
    if (state.desired === state.actual) return;
    const wait = state.actual ? this.minHold : this.minGap;
    if (this.frame - state.changedAt >= wait) this.apply(index, state, state.desired);
  }

  /** The user pressed or released a key. A press goes through at once unless the key only just came up. */
  setKey(row: number, col: number, down: boolean): void {
    const index = KeyScheduler.index(row, col);
    const state = this.state(index);
    state.desired = down;
    this.reconcile(index, state);
  }

  /** Press and release one key after the current sequence has finished. */
  enqueueTap(row: number, col: number): void {
    this.sequence.push(KeyScheduler.index(row, col));
  }

  /** Call once per emulated frame, before running it. */
  tick(): void {
    this.frame++;
    for (const [index, state] of this.keys) this.reconcile(index, state);
    this.advanceSequence();
  }

  private advanceSequence(): void {
    if (this.sequenceWait > 0) {
      this.sequenceWait--;
      return;
    }
    if (this.sequenceKey !== null) {
      const index = this.sequenceKey;
      const state = this.state(index);
      state.desired = false;
      this.reconcile(index, state);
      if (!state.actual) {
        this.sequenceKey = null;
        this.sequenceWait = this.sequenceGap;
      }
      return;
    }
    const next = this.sequence.shift();
    if (next === undefined) return;
    const state = this.state(next);
    state.desired = true;
    this.reconcile(next, state);
    this.sequenceKey = next;
  }

  /** Lift every key now, ignoring the hold time. Used when the tab hides or loses focus, so no key sticks. */
  releaseAll(): void {
    this.sequence.length = 0;
    this.sequenceKey = null;
    this.sequenceWait = 0;
    for (const [index, state] of this.keys) {
      state.desired = false;
      if (state.actual) this.apply(index, state, false);
    }
  }

  /** True while any key is held or waiting to change. */
  get busy(): boolean {
    if (this.sequence.length > 0 || this.sequenceKey !== null || this.sequenceWait > 0) return true;
    for (const state of this.keys.values()) if (state.desired !== state.actual) return true;
    return false;
  }
}
