import { TOKENS } from './table';

/** text -> code; single-byte tokens win over two-byte look-alikes (tokens are sorted by code). */
const BY_TEXT = new Map<string, number>();
for (const t of TOKENS) if (!BY_TEXT.has(t.text)) BY_TEXT.set(t.text, t.code);

/** Look a token up by its display text. Throws at import time if the table has no such token. */
export function code(text: string): number {
  const c = BY_TEXT.get(text);
  if (c === undefined) throw new Error(`token table has no entry for ${JSON.stringify(text)}`);
  return c;
}

/** Named token codes used by the parser, evaluator and OS. */
export const T = {
  // conversions & postfix
  DMS: code('►DMS'),
  DEC: code('►Dec'),
  FRAC: code('►Frac'),
  RECT: code('►Rect'),
  POLAR: code('►Polar'),
  F_D: code('►F◄►D'),
  ND_UND: code('►n/d◄►Un/d'),
  STO: code('→'),
  RAD_POST: code('ʳ'),
  DEG_POST: code('°'),
  INV: code('⁻¹'),
  SQR: code('²'),
  CUBE: code('³'),
  TRANSP: code('ᵀ'),
  FACT: code('!'),
  PRIME: code("'"),
  // brackets & punctuation
  LBRACKET: code('['),
  RBRACKET: code(']'),
  LBRACE: code('{'),
  RBRACE: code('}'),
  LPAREN: code('('),
  RPAREN: code(')'),
  COMMA: code(','),
  QUOTE: code('"'),
  COLON: code(':'),
  NEWLINE: code('\n'),
  SPACE: code(' '),
  QMARK: code('?'),
  // operators
  PLUS: code('+'),
  MINUS: code('-'),
  MUL: code('*'),
  DIV: code('/'),
  POW: code('^'),
  XROOT: code('ˣ√'),
  NEG: code('⁻'),
  NPR: code(' nPr '),
  NCR: code(' nCr '),
  EQ: code('='),
  LT: code('<'),
  GT: code('>'),
  LE: code('≤'),
  GE: code('≥'),
  NE: code('≠'),
  AND: code(' and '),
  OR: code(' or '),
  XOR: code(' xor '),
  // literals
  D0: code('0'),
  D9: code('9'),
  DOT: code('.'),
  EE: code('ᴇ'),
  I: code('ⅈ'),
  PI: code('π'),
  E: code('ℯ'),
  THETA: code('θ'),
  ANS: code('Ans'),
  RAND: code('rand'),
  GETKEY: code('getKey'),
  VA: code('A'),
  VZ: code('Z'),
  // functions with their paren
  SIN: code('sin('),
  COS: code('cos('),
  TAN: code('tan('),
  ASIN: code('sin⁻¹('),
  ACOS: code('cos⁻¹('),
  ATAN: code('tan⁻¹('),
  SINH: code('sinh('),
  COSH: code('cosh('),
  TANH: code('tanh('),
  ASINH: code('sinh⁻¹('),
  ACOSH: code('cosh⁻¹('),
  ATANH: code('tanh⁻¹('),
  LN: code('ln('),
  LOG: code('log('),
  EXP: code('ℯ^('),
  TENPOW: code('10^('),
  SQRT: code('√('),
  CBRT: code('³√('),
  ABS: code('abs('),
  INT: code('int('),
  IPART: code('iPart('),
  FPART: code('fPart('),
  ROUND: code('round('),
  NOT: code('not('),
  SEQ: code('seq('),
  SUMMATION: code('Σ('),
  SOLVE: code('solve('),
  FNINT: code('fnInt('),
  NDERIV: code('nDeriv('),
  FMIN: code('fMin('),
  FMAX: code('fMax('),
  DIM: code('dim('),
  // lists
  LIST_L: code('∟'),
  L1: code('L₁'),
  L6: code('L₆'),
  // strings / equations
  STR1: code('Str1'),
  STR0: code('Str0'),
  Y1: code('Y₁'),
  Y0: code('Y₀'),
  // matrices
  MATA: code('[A]'),
  MATJ: code('[J]'),
  // modes
  RADIAN: code('Radian'),
  DEGREE: code('Degree'),
} as const;

/** Convenience predicates over token codes. */
export const isDigit = (c: number): boolean => c >= 0x30 && c <= 0x39;
export const isLetter = (c: number): boolean => c >= 0x41 && c <= 0x5a;
export const isRealVarCode = (c: number): boolean => isLetter(c) || c === T.THETA;
export const isListVarCode = (c: number): boolean => c >= 0x5d00 && c <= 0x5d05;
export const isMatrixCode = (c: number): boolean => c >= 0x5c00 && c <= 0x5c09;
export const isStrCode = (c: number): boolean => c >= 0xaa00 && c <= 0xaa09;
export const isYCode = (c: number): boolean => c >= 0x5e10 && c <= 0x5e19;
export const isParamCode = (c: number): boolean => c >= 0x5e20 && c <= 0x5e2b;
export const isPolarEqCode = (c: number): boolean => c >= 0x5e40 && c <= 0x5e45;
export const isSeqEqCode = (c: number): boolean => c >= 0x5e80 && c <= 0x5e82;
export const isPicCode = (c: number): boolean => c >= 0x6000 && c <= 0x6009;
export const isGdbCode = (c: number): boolean => c >= 0x6100 && c <= 0x6109;
export const isStatVarCode = (c: number): boolean => c >= 0x6201 && c <= 0x623c;
export const isWindowVarCode = (c: number): boolean => c >= 0x6300 && c <= 0x6337;
