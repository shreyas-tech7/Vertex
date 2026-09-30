/**
 * The 50 physical keys: ids, printed labels (ours), and the getKey() code each one returns.
 * Layout order is row by row, top to bottom.
 */
export type KeyId =
  | 'YEQ'
  | 'WINDOW'
  | 'ZOOM'
  | 'TRACE'
  | 'GRAPH'
  | '2ND'
  | 'MODE'
  | 'DEL'
  | 'LEFT'
  | 'UP'
  | 'RIGHT'
  | 'ALPHA'
  | 'XTTN'
  | 'STAT'
  | 'DOWN'
  | 'MATH'
  | 'APPS'
  | 'PRGM'
  | 'VARS'
  | 'CLEAR'
  | 'INV'
  | 'SIN'
  | 'COS'
  | 'TAN'
  | 'POW'
  | 'SQR'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN'
  | 'DIV'
  | 'LOG'
  | '7'
  | '8'
  | '9'
  | 'MUL'
  | 'LN'
  | '4'
  | '5'
  | '6'
  | 'SUB'
  | 'STO'
  | '1'
  | '2'
  | '3'
  | 'ADD'
  | 'ON'
  | '0'
  | 'DOT'
  | 'NEG'
  | 'ENTER';

export interface KeyInfo {
  id: KeyId;
  /** Label printed on the key. */
  label: string;
  /** 2nd-function label (shown above the key in the 2nd colour). */
  second: string;
  /** ALPHA-function label (shown above the key in the ALPHA colour). */
  alpha: string;
  /** getKey code; 0 means the key has none (ON). */
  code: number;
  /** Screen-reader description of what the key does. */
  aria: string;
}

const k = (
  id: KeyId,
  label: string,
  second: string,
  alpha: string,
  code: number,
  aria?: string,
): KeyInfo => ({
  id,
  label,
  second,
  alpha,
  code,
  aria: aria ?? label,
});

export const KEYS: KeyInfo[] = [
  k('YEQ', 'Y=', 'STAT PLOT', 'F1', 11),
  k('WINDOW', 'WINDOW', 'TBLSET', 'F2', 12),
  k('ZOOM', 'ZOOM', 'FORMAT', 'F3', 13),
  k('TRACE', 'TRACE', 'CALC', 'F4', 14),
  k('GRAPH', 'GRAPH', 'TABLE', 'F5', 15),
  k('2ND', '2nd', '', '', 21, 'Second function modifier'),
  k('MODE', 'MODE', 'QUIT', '', 22),
  k('DEL', 'DEL', 'INS', '', 23, 'Delete'),
  k('LEFT', '◄', '', '', 24, 'Left arrow'),
  k('UP', '▲', '', '', 25, 'Up arrow'),
  k('RIGHT', '►', '', '', 26, 'Right arrow'),
  k('ALPHA', 'ALPHA', 'A-LOCK', '', 31, 'Alpha modifier'),
  k('XTTN', 'X,T,θ,n', 'LINK', '', 32, 'X, T, theta, n'),
  k('STAT', 'STAT', 'LIST', '', 33),
  k('DOWN', '▼', '', '', 34, 'Down arrow'),
  k('MATH', 'MATH', 'TEST', 'A', 41),
  k('APPS', 'APPS', 'ANGLE', 'B', 42),
  k('PRGM', 'PRGM', 'DRAW', 'C', 43, 'Program'),
  k('VARS', 'VARS', 'DISTR', '', 44, 'Variables'),
  k('CLEAR', 'CLEAR', '', '', 45),
  k('INV', 'x⁻¹', 'MATRIX', 'D', 51, 'Inverse, x to the minus one'),
  k('SIN', 'SIN', 'SIN⁻¹', 'E', 52, 'Sine'),
  k('COS', 'COS', 'COS⁻¹', 'F', 53, 'Cosine'),
  k('TAN', 'TAN', 'TAN⁻¹', 'G', 54, 'Tangent'),
  k('POW', '^', 'π', 'H', 55, 'Power'),
  k('SQR', 'x²', '√', 'I', 61, 'Square'),
  k('COMMA', ',', 'EE', 'J', 62, 'Comma'),
  k('LPAREN', '(', '{', 'K', 63, 'Left parenthesis'),
  k('RPAREN', ')', '}', 'L', 64, 'Right parenthesis'),
  k('DIV', '÷', 'e', 'M', 65, 'Divide'),
  k('LOG', 'LOG', '10^x', 'N', 71),
  k('7', '7', 'u', 'O', 72),
  k('8', '8', 'v', 'P', 73),
  k('9', '9', 'w', 'Q', 74),
  k('MUL', '×', '[', 'R', 75, 'Multiply'),
  k('LN', 'LN', 'e^x', 'S', 81, 'Natural log'),
  k('4', '4', 'L4', 'T', 82),
  k('5', '5', 'L5', 'U', 83),
  k('6', '6', 'L6', 'V', 84),
  k('SUB', '−', ']', 'W', 85, 'Subtract'),
  k('STO', 'STO→', 'RCL', 'X', 91, 'Store'),
  k('1', '1', 'L1', 'Y', 92),
  k('2', '2', 'L2', 'Z', 93),
  k('3', '3', 'L3', 'θ', 94),
  k('ADD', '+', 'MEM', '"', 95, 'Add'),
  k('ON', 'ON', 'OFF', '', 0, 'On'),
  k('0', '0', 'CATALOG', 'space', 102),
  k('DOT', '.', 'i', ':', 103, 'Decimal point'),
  k('NEG', '(−)', 'ANS', '?', 104, 'Negative sign'),
  k('ENTER', 'ENTER', 'ENTRY', 'SOLVE', 105),
];

export const KEY_BY_ID: ReadonlyMap<KeyId, KeyInfo> = new Map(KEYS.map((x) => [x.id, x]));
export const isKeyId = (s: string): s is KeyId => KEY_BY_ID.has(s as KeyId);
