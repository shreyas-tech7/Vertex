import { KEY_BY_ID, type KeyId } from '../core/os/keys.ts';
import { LCD_HEIGHT, LCD_WIDTH } from './emulator/protocol.ts';

/**
 * Geometry of Vertex's original keypad, in CSS pixels at 100% zoom. The key positions follow the TI-84 Plus CE
 * layout exactly: five function keys, then 2nd / MODE / DEL and ALPHA / X,T,θ,n / STAT beside the four-way arrow pad,
 * then seven rows of five. The look is our own.
 *
 * The case size is this one constant. Everything below, and the zoom and iframe height maths, derive from it.
 */
export const BODY_SIZE = { width: 258, height: 604 } as const;
export const BODY_WIDTH: number = BODY_SIZE.width;
export const BODY_HEIGHT: number = BODY_SIZE.height;

/** The 320 x 240 LCD is drawn at 0.725, so it is 232 x 174, inset 13 px from the sides and 29 px from the top. */
export const SCREEN_SCALE = 0.725;
export const SCREEN = {
  x: 13,
  y: 29,
  width: Math.round(LCD_WIDTH * SCREEN_SCALE),
  height: Math.round(LCD_HEIGHT * SCREEN_SCALE),
} as const;

const PAD_X = SCREEN.x;
const COLUMN_PITCH = SCREEN.width / 5;
const KEY_WIDTH = 38;
const LEGEND_HEIGHT = 10;
const LEGEND_INSET = 1.2;
const FIRST_ROW_Y = 211;
const FIRST_ROW_PITCH = 34;
const FIRST_ROW_KEY_HEIGHT = 20;
const ROW_PITCH = 38;
const KEY_HEIGHT = 25;

export type KeyKind = 'fn' | 'second' | 'alpha' | 'dark' | 'op' | 'num' | 'enter' | 'arrow';

export interface KeyBox {
  id: KeyId;
  kind: KeyKind;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Where the 2nd (left) and ALPHA (right) legends sit: the strip right above the key. */
  legendY: number;
  legendX: number;
  legendWidth: number;
}

/** Each row of the keypad, top to bottom, as in the spec. Arrow keys are placed separately. */
const ROWS: ReadonlyArray<ReadonlyArray<readonly [KeyId, KeyKind]>> = [
  [
    ['YEQ', 'fn'],
    ['WINDOW', 'fn'],
    ['ZOOM', 'fn'],
    ['TRACE', 'fn'],
    ['GRAPH', 'fn'],
  ],
  [
    ['2ND', 'second'],
    ['MODE', 'dark'],
    ['DEL', 'dark'],
  ],
  [
    ['ALPHA', 'alpha'],
    ['XTTN', 'dark'],
    ['STAT', 'dark'],
  ],
  [
    ['MATH', 'dark'],
    ['APPS', 'dark'],
    ['PRGM', 'dark'],
    ['VARS', 'dark'],
    ['CLEAR', 'dark'],
  ],
  [
    ['INV', 'dark'],
    ['SIN', 'dark'],
    ['COS', 'dark'],
    ['TAN', 'dark'],
    ['POW', 'dark'],
  ],
  [
    ['SQR', 'dark'],
    ['COMMA', 'dark'],
    ['LPAREN', 'dark'],
    ['RPAREN', 'dark'],
    ['DIV', 'op'],
  ],
  [
    ['LOG', 'dark'],
    ['7', 'num'],
    ['8', 'num'],
    ['9', 'num'],
    ['MUL', 'op'],
  ],
  [
    ['LN', 'dark'],
    ['4', 'num'],
    ['5', 'num'],
    ['6', 'num'],
    ['SUB', 'op'],
  ],
  [
    ['STO', 'dark'],
    ['1', 'num'],
    ['2', 'num'],
    ['3', 'num'],
    ['ADD', 'op'],
  ],
  [
    ['ON', 'dark'],
    ['0', 'num'],
    ['DOT', 'num'],
    ['NEG', 'num'],
    ['ENTER', 'enter'],
  ],
];

function rowBase(row: number): number {
  return row === 0 ? FIRST_ROW_Y : FIRST_ROW_Y + FIRST_ROW_PITCH + (row - 1) * ROW_PITCH;
}

export const KEY_BOXES: readonly KeyBox[] = ROWS.flatMap((keys, row) =>
  keys.map(([id, kind], column) => {
    const base = rowBase(row);
    const x = PAD_X + column * COLUMN_PITCH + (COLUMN_PITCH - KEY_WIDTH) / 2;
    return {
      id,
      kind,
      x,
      y: base + LEGEND_HEIGHT,
      width: KEY_WIDTH,
      height: row === 0 ? FIRST_ROW_KEY_HEIGHT : KEY_HEIGHT,
      legendY: base,
      // The legends use the whole column, so a long 2nd legend and an ALPHA legend share one strip.
      legendX: PAD_X + column * COLUMN_PITCH + LEGEND_INSET,
      legendWidth: COLUMN_PITCH - 2 * LEGEND_INSET,
    } satisfies KeyBox;
  }),
);

/** The round arrow pad sits beside rows 2 and 3, over columns 4 and 5. */
export const ARROW_PAD = (() => {
  const top = rowBase(1);
  const size = 72;
  const centerX = PAD_X + 4 * COLUMN_PITCH;
  return { x: Math.round(centerX - size / 2), y: top + 2, size };
})();

export const ARROWS: ReadonlyArray<{ id: KeyId; clip: string; glyph: { x: number; y: number } }> = [
  { id: 'UP', clip: 'polygon(50% 50%, 0 0, 100% 0)', glyph: { x: 50, y: 16 } },
  { id: 'RIGHT', clip: 'polygon(50% 50%, 100% 0, 100% 100%)', glyph: { x: 84, y: 50 } },
  { id: 'DOWN', clip: 'polygon(50% 50%, 100% 100%, 0 100%)', glyph: { x: 50, y: 84 } },
  { id: 'LEFT', clip: 'polygon(50% 50%, 0 100%, 0 0)', glyph: { x: 16, y: 50 } },
];

/** Every one of the 50 keys, for tests and for the pad. */
export const ALL_KEY_IDS: readonly KeyId[] = [...KEY_BOXES.map((box) => box.id), ...ARROWS.map((a) => a.id)];

export function keyInfo(id: KeyId) {
  return KEY_BY_ID.get(id)!;
}
