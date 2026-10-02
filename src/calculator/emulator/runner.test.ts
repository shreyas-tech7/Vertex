import { describe, expect, it } from 'vitest';
import { buildProgramFile, buildSyntheticRom } from '../../test-support/syntheticRom.ts';
import { EmulatorCore, type CemuFactory } from './core.ts';
import type { FromWorker } from './protocol.ts';
import { FRAME_MS, EmulatorRunner, type RunnerHost } from './runner.ts';

/** A clock and timer queue the test controls. */
function fakeHost() {
  let time = 1000;
  let nextHandle = 1;
  const timers = new Map<number, { at: number; callback: () => void }>();
  const messages: FromWorker[] = [];
  const host: RunnerHost = {
    now: () => time,
    setTimer: (callback, delay) => {
      const handle = nextHandle++;
      timers.set(handle, { at: time + delay, callback });
      return handle;
    },
    clearTimer: (handle) => void timers.delete(handle as number),
    post: (message) => void messages.push(message),
    close: () => undefined,
  };
  /** Moves the clock forward in `step` ms slices, firing timers as they come due. */
  const advance = (ms: number, step = 1) => {
    const end = time + ms;
    while (time < end) {
      time = Math.min(end, time + step);
      for (const [handle, timer] of [...timers]) {
        if (timer.at <= time) {
          timers.delete(handle);
          timer.callback();
        }
      }
    }
  };
  return { host, advance, messages, timers, jumpClock: (ms: number) => (time += ms) };
}

async function bootedRunner() {
  const { default: create } = await import('../../../emulator/dist/vertex-cemu.js');
  const fake = fakeHost();
  const runner = new EmulatorRunner(fake.host, () => EmulatorCore.create(create as CemuFactory));
  runner.handle({ type: 'boot', id: 1, rom: buildSyntheticRom().buffer as ArrayBuffer });
  await expect.poll(() => fake.messages.some((m) => m.type === 'booted')).toBe(true);
  return { runner, ...fake };
}

describe('emulator runner (real CEmu build, fake clock)', () => {
  it('boots a ROM and posts the first frame', async () => {
    const { messages, advance } = await bootedRunner();
    expect(messages.find((m) => m.type === 'booted')).toMatchObject({ ok: true, from: 'rom' });
    advance(40);
    const frame = messages.find((m) => m.type === 'frame');
    expect(frame).toBeDefined();
    expect((frame as Extract<FromWorker, { type: 'frame' }>).pixels.byteLength).toBe(320 * 240 * 4);
  });

  it('runs 60 frames for every second of wall time', async () => {
    const { runner, advance } = await bootedRunner();
    advance(1000);
    expect(runner.framesRun).toBeGreaterThanOrEqual(59);
    expect(runner.framesRun).toBeLessThanOrEqual(61);
    advance(2000);
    expect(runner.framesRun).toBeGreaterThanOrEqual(179);
    expect(runner.framesRun).toBeLessThanOrEqual(181);
  });

  it('does not race to catch up after a stall', async () => {
    const { runner, advance, jumpClock } = await bootedRunner();
    advance(100);
    const before = runner.framesRun;
    jumpClock(5000); // the page was busy for five seconds
    advance(50);
    expect(runner.framesRun - before).toBeLessThan(10);
  });

  it('pauses while the tab is hidden, lifts held keys, and resumes without catching up', async () => {
    const { runner, advance, messages } = await bootedRunner();
    runner.handle({ type: 'key', row: 6, col: 0, down: true });
    advance(100);
    expect(messages.filter((m) => m.type === 'keys').pop()).toMatchObject({ rows: [0, 0, 0, 0, 0, 0, 1, 0] });

    runner.handle({ type: 'pause' });
    expect(runner.isPaused).toBe(true);
    expect(messages.filter((m) => m.type === 'keys').pop()).toMatchObject({ rows: [0, 0, 0, 0, 0, 0, 0, 0] });
    const frozen = runner.framesRun;
    advance(10_000);
    expect(runner.framesRun).toBe(frozen);
    expect(runner.isRunning).toBe(false);

    runner.handle({ type: 'resume' });
    advance(1000);
    expect(runner.framesRun - frozen).toBeGreaterThanOrEqual(58);
    expect(runner.framesRun - frozen).toBeLessThanOrEqual(62);
  });

  it('reports the emulated keypad and keeps a held key down across frames', async () => {
    const { runner, advance, messages } = await bootedRunner();
    runner.handle({ type: 'key', row: 7, col: 3, down: true });
    advance(500);
    expect(messages.filter((m) => m.type === 'keys').pop()).toMatchObject({ rows: [0, 0, 0, 0, 0, 0, 0, 8] });
    runner.handle({ type: 'key', row: 7, col: 3, down: false });
    advance(100);
    expect(messages.filter((m) => m.type === 'keys').pop()).toMatchObject({ rows: [0, 0, 0, 0, 0, 0, 0, 0] });
  });

  it('saves a state on request and restores it into a fresh runner', async () => {
    const first = await bootedRunner();
    first.advance(200);
    first.runner.handle({ type: 'saveState', id: 7 });
    const saved = first.messages.find((m) => m.type === 'state') as Extract<FromWorker, { type: 'state' }>;
    expect(saved.data!.byteLength).toBeGreaterThan(1_000_000);

    const { default: create } = await import('../../../emulator/dist/vertex-cemu.js');
    const fake = fakeHost();
    const second = new EmulatorRunner(fake.host, () => EmulatorCore.create(create as CemuFactory));
    second.handle({ type: 'boot', id: 2, state: saved.data! });
    await expect.poll(() => fake.messages.some((m) => m.type === 'booted')).toBe(true);
    expect(fake.messages.find((m) => m.type === 'booted')).toMatchObject({ ok: true, from: 'state' });
  });

  it('refuses to send a file while nothing is running', async () => {
    const fake = fakeHost();
    const { default: create } = await import('../../../emulator/dist/vertex-cemu.js');
    const runner = new EmulatorRunner(fake.host, () => EmulatorCore.create(create as CemuFactory));
    runner.handle({ type: 'send', id: 3, name: 'A.8xp', data: new ArrayBuffer(4) });
    expect(fake.messages).toContainEqual({ type: 'sent', id: 3, ok: false, reason: 'notRunning' });
  });

  it('answers a file transfer with a definite result, even with no OS to receive it', async () => {
    // The synthetic ROM runs no code, so the emulated calculator never answers the USB host. The runner must still
    // give up cleanly (not hang), keep running frames while it waits, and report failure rather than success.
    const { runner, advance, messages } = await bootedRunner();
    advance(50);
    const file = buildProgramFile('HELLO');
    runner.handle({ type: 'send', id: 9, name: 'HELLO.8xp', data: file.buffer as ArrayBuffer });
    const before = runner.framesRun;
    advance(35_000, 16);
    expect(runner.framesRun - before).toBeGreaterThan(1000);
    const sent = messages.find((m) => m.type === 'sent') as Extract<FromWorker, { type: 'sent' }>;
    expect(sent).toBeDefined();
    expect(sent.id).toBe(9);
    expect(sent.ok).toBe(false);
  });

  it('keeps the frame step at 1/60 s', () => {
    expect(FRAME_MS).toBeCloseTo(16.667, 2);
  });
});
