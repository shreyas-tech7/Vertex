import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { KEYS, KEY_BY_ID, KEY_MATRIX, type KeyId } from './keys.ts';

describe('key table', () => {
  it('has 50 unique keys', () => {
    expect(KEYS).toHaveLength(50);
    expect(new Set(KEYS.map((x) => x.id)).size).toBe(50);
  });
  it('uses the documented getKey codes', () => {
    expect(KEY_BY_ID.get('ENTER')?.code).toBe(105);
    expect(KEY_BY_ID.get('GRAPH')?.code).toBe(15);
    expect(KEY_BY_ID.get('CLEAR')?.code).toBe(45);
    expect(KEY_BY_ID.get('ON')?.code).toBe(0);
    expect(KEY_BY_ID.get('0')?.code).toBe(102);
  });
  it('gives every key its own spot in the 8x8 matrix', () => {
    const spots = new Set(KEYS.map((k) => `${k.row},${k.col}`));
    expect(spots.size).toBe(50);
    for (const k of KEYS) {
      expect(k.row).toBeGreaterThanOrEqual(1);
      expect(k.row).toBeLessThanOrEqual(7);
      expect(k.col).toBeGreaterThanOrEqual(0);
      expect(k.col).toBeLessThanOrEqual(7);
    }
  });
});

/** The legends from the task, key by key: [id, 2nd legend, alpha legend]. */
const SPEC: ReadonlyArray<readonly [KeyId, string, string]> = [
  ['YEQ', 'STAT PLOT', 'F1'],
  ['WINDOW', 'TBLSET', 'F2'],
  ['ZOOM', 'FORMAT', 'F3'],
  ['TRACE', 'CALC', 'F4'],
  ['GRAPH', 'TABLE', 'F5'],
  ['2ND', '', ''],
  ['MODE', 'QUIT', ''],
  ['DEL', 'INS', ''],
  ['ALPHA', 'A-LOCK', ''],
  ['XTTN', 'LINK', ''],
  ['STAT', 'LIST', ''],
  ['MATH', 'TEST', 'A'],
  ['APPS', 'ANGLE', 'B'],
  ['PRGM', 'DRAW', 'C'],
  ['VARS', 'DISTR', ''],
  ['CLEAR', '', ''],
  ['INV', 'MATRIX', 'D'],
  ['SIN', 'SIN⁻¹', 'E'],
  ['COS', 'COS⁻¹', 'F'],
  ['TAN', 'TAN⁻¹', 'G'],
  ['POW', 'π', 'H'],
  ['SQR', '√', 'I'],
  ['COMMA', 'EE', 'J'],
  ['LPAREN', '{', 'K'],
  ['RPAREN', '}', 'L'],
  ['DIV', 'e', 'M'],
  ['LOG', '10^x', 'N'],
  ['7', 'u', 'O'],
  ['8', 'v', 'P'],
  ['9', 'w', 'Q'],
  ['MUL', '[', 'R'],
  ['LN', 'e^x', 'S'],
  ['4', 'L4', 'T'],
  ['5', 'L5', 'U'],
  ['6', 'L6', 'V'],
  ['SUB', ']', 'W'],
  ['STO', 'RCL', 'X'],
  ['1', 'L1', 'Y'],
  ['2', 'L2', 'Z'],
  ['3', 'L3', 'θ'],
  ['ADD', 'MEM', '"'],
  ['ON', 'OFF', ''],
  ['0', 'CATALOG', 'space'],
  ['DOT', 'i', ':'],
  ['NEG', 'ANS', '?'],
  ['ENTER', 'ENTRY', 'SOLVE'],
];

describe('legends', () => {
  it.each(SPEC)('key %s has 2nd legend %j and alpha legend %j', (id, second, alpha) => {
    const key = KEY_BY_ID.get(id)!;
    expect(key.second).toBe(second);
    expect(key.alpha).toBe(alpha);
  });
});

/** CEmu's KEYMAP macro (gui/qt/keypad/keymap.cpp, pinned commit): row 0 is unused, then rows 1 to 7 of eight columns. */
const CEMU_ROWS: ReadonlyArray<readonly string[]> = [
  ['graph', 'trace', 'zoom', 'wind', 'yequ', '2nd', 'mode', 'del'],
  ['on', 'sto', 'ln', 'log', 'sq', 'inv', 'math', 'alpha'],
  ['0', '1', '4', '7', 'comma', 'sin', 'apps', 'xton'],
  ['dot', '2', '5', '8', 'lpar', 'cos', 'prgm', 'stat'],
  ['neg', '3', '6', '9', 'rpar', 'tan', 'vars', ''],
  ['enter', 'add', 'sub', 'mul', 'div', 'pow', 'clr', ''],
  ['down', 'left', 'right', 'up', '', '', '', ''],
];

const CEMU_NAME_TO_ID: Readonly<Record<string, KeyId>> = {
  graph: 'GRAPH',
  trace: 'TRACE',
  zoom: 'ZOOM',
  wind: 'WINDOW',
  yequ: 'YEQ',
  '2nd': '2ND',
  mode: 'MODE',
  del: 'DEL',
  on: 'ON',
  sto: 'STO',
  ln: 'LN',
  log: 'LOG',
  sq: 'SQR',
  inv: 'INV',
  math: 'MATH',
  alpha: 'ALPHA',
  '0': '0',
  '1': '1',
  '4': '4',
  '7': '7',
  comma: 'COMMA',
  sin: 'SIN',
  apps: 'APPS',
  xton: 'XTTN',
  dot: 'DOT',
  '2': '2',
  '5': '5',
  '8': '8',
  lpar: 'LPAREN',
  cos: 'COS',
  prgm: 'PRGM',
  stat: 'STAT',
  neg: 'NEG',
  '3': '3',
  '6': '6',
  '9': '9',
  rpar: 'RPAREN',
  tan: 'TAN',
  vars: 'VARS',
  enter: 'ENTER',
  add: 'ADD',
  sub: 'SUB',
  mul: 'MUL',
  div: 'DIV',
  pow: 'POW',
  clr: 'CLEAR',
  down: 'DOWN',
  left: 'LEFT',
  right: 'RIGHT',
  up: 'UP',
};

describe('key matrix against CEmu', () => {
  it('matches the KEYMAP table copied from CEmu', () => {
    CEMU_ROWS.forEach((names, index) => {
      names.forEach((name, col) => {
        if (!name) return;
        const id = CEMU_NAME_TO_ID[name]!;
        expect(id, name).toBeDefined();
        expect(KEY_MATRIX[id], `${name} -> ${id}`).toEqual([index + 1, col]);
      });
    });
  });

  // When a CEmu checkout is around (the emulator build keeps one in emulator/.cache), compare against its real source.
  const candidates = [
    process.env.CEMU_DIR,
    resolve(import.meta.dirname, '../../../emulator/.cache/CEmu'),
    resolve(import.meta.dirname, '../../../../ce-programming/cemu'),
  ].filter((p): p is string => !!p);
  const source = candidates
    .map((dir) => resolve(dir, 'gui/qt/keypad/keymap.cpp'))
    .find((file) => existsSync(file));

  it.skipIf(!source)('matches gui/qt/keypad/keymap.cpp of the CEmu checkout', () => {
    const text = readFileSync(source!, 'utf8');
    const macro = /#define KEYMAP\(suffix\)[\s\S]*?\n {4}\}/.exec(text)![0];
    const rows = [...macro.matchAll(/^\s*((?:KEY\(\w+\)|&none)(?:, (?:KEY\(\w+\)|&none))*),?\s*\\?$/gm)].map(
      (m) => m[1]!.split(', ').map((cell) => /KEY\((\w+)\)/.exec(cell)?.[1] ?? ''),
    );
    expect(rows).toHaveLength(8);
    rows.slice(1).forEach((names, index) => {
      names.forEach((name, col) => {
        if (!name) return;
        expect(KEY_MATRIX[CEMU_NAME_TO_ID[name]!], name).toEqual([index + 1, col]);
      });
    });
  });
});
