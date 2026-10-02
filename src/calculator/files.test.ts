import { describe, expect, it } from 'vitest';
import { classifyDroppedFile } from './files.ts';

describe('dropped files', () => {
  it.each([
    'a.8xp',
    'a.8xv',
    'a.8xg',
    'a.8xl',
    'a.8xm',
    'a.8xs',
    'a.8xn',
    'a.8xc',
    'A.8XP',
    'PROGRAM.8ek',
    'pic.8ci',
  ])('sends %s to the calculator', (name) => expect(classifyDroppedFile(name, 3000)).toBe('variable'));
  it('treats .rom as a ROM', () => expect(classifyDroppedFile('TI84CE.rom', 4 * 1024 * 1024)).toBe('rom'));
  it('treats a big unknown file as a ROM', () =>
    expect(classifyDroppedFile('dump', 4 * 1024 * 1024)).toBe('rom'));
  it('refuses OS upgrade files and small unknown files', () => {
    expect(classifyDroppedFile('os.8eu', 3_000_000)).toBe('unsupported');
    expect(classifyDroppedFile('notes.txt', 100)).toBe('unsupported');
  });
});
