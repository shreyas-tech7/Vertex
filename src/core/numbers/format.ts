import { absN, argN, type Num, type NumCtx } from './complex';
import { isReal, type Real } from './decimal';
import { imOf, reOf } from './complex';

/** Number-format mode settings from the MODE screen. */
export interface NumFormat {
  mode: 'NORMAL' | 'SCI' | 'ENG';
  /** -1 = Float, 0..9 = that many decimals (Fix in Normal mode, mantissa decimals in Sci / Eng). */
  digits: number;
}
export const FLOAT_FORMAT: NumFormat = { mode: 'NORMAL', digits: -1 };

/** How complex results are shown: rectangular a+bi or polar re^θi. */
export type ComplexStyle = 'RECT' | 'POLAR';

/** The glyphs used in displayed numbers (see src/core/lcd/font for how they are drawn). */
export const NEG = '⁻';
export const EXP = 'ᴇ';
export const EULER = 'ℯ';
export const IMAG = 'ⅈ';

interface Parts {
  digits: string; // exactly `sig` digits
  exp: number; // decimal exponent of the first digit
}

function decompose(x: Real, sig: number): Parts {
  const s = x.abs().toExponential(sig - 1); // d.ddde+n
  const m = /^(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(s);
  if (!m) return { digits: '0'.repeat(sig), exp: 0 };
  return { digits: m[1] + (m[2] ?? ''), exp: parseInt(m[3], 10) };
}

const stripZeros = (d: string): string => {
  const t = d.replace(/0+$/, '');
  return t === '' ? '0' : t;
};

function layoutPlain(digits: string, exp: number): string {
  if (exp >= 0) {
    const int = digits.slice(0, exp + 1).padEnd(exp + 1, '0');
    const frac = digits.slice(exp + 1);
    return frac ? `${int}.${frac}` : int;
  }
  return '.' + '0'.repeat(-exp - 1) + digits;
}

function expText(e: number): string {
  return EXP + (e < 0 ? NEG : '') + Math.abs(e);
}

function sci(x: Real, decimals: number): string {
  const p = decompose(x, (decimals < 0 ? 9 : decimals) + 1);
  const d = decimals < 0 ? stripZeros(p.digits) : p.digits;
  return d[0] + (d.length > 1 ? '.' + d.slice(1) : '') + expText(p.exp);
}

function eng(x: Real, decimals: number): string {
  const sig = decimals < 0 ? 10 : decimals + 1;
  const p = decompose(x, sig);
  const e3 = Math.floor(p.exp / 3) * 3;
  const shift = p.exp - e3;
  let digits = p.digits.padEnd(shift + 1, '0');
  const int = digits.slice(0, shift + 1);
  let frac = digits.slice(shift + 1);
  if (decimals < 0) frac = frac.replace(/0+$/, '');
  digits = int + (frac ? '.' + frac : '');
  return digits + expText(e3);
}

/** Format a real for the home screen / lists / tables according to the MODE settings. */
export function formatReal(x: Real, f: NumFormat = FLOAT_FORMAT): string {
  const neg = x.isNeg() && !x.isZero();
  const sign = neg ? NEG : '';
  if (x.isZero()) {
    if (f.mode === 'NORMAL' && f.digits > 0) return '0.' + '0'.repeat(f.digits);
    if (f.mode === 'NORMAL' && f.digits === 0) return '0';
    if (f.mode === 'NORMAL') return '0';
    const dec = f.digits < 0 ? 0 : f.digits;
    return '0' + (dec > 0 ? '.' + '0'.repeat(dec) : '') + EXP + '0';
  }
  if (f.mode === 'SCI') return sign + sci(x, f.digits);
  if (f.mode === 'ENG') return sign + eng(x, f.digits);
  if (f.digits < 0) {
    const p = decompose(x, 10);
    if (p.exp >= 10 || p.exp <= -4) return sign + sci(x, -1);
    return sign + layoutPlain(stripZeros(p.digits), p.exp);
  }
  // Fix n
  const n = f.digits;
  const p = decompose(x, 14);
  const intDigits = p.exp >= 0 ? p.exp + 1 : 0;
  if (intDigits + n > 14) return sign + sci(x, -1);
  let s = x.abs().toFixed(n);
  if (s.startsWith('0.')) s = s.slice(1);
  else if (s === '0') s = '0';
  if (n === 0 && s !== '0') s += '.';
  if (/^\.?0*\.?0*$/.test(s) && n > 0) {
    // rounds to zero: TI shows 0.00 style without sign
    return '0.' + '0'.repeat(n);
  }
  return sign + s;
}

/** A plain-English style significant-digit format used by graph readouts (X=.21276596). */
export function formatSig(x: Real, sig = 8): string {
  if (x.isZero()) return '0';
  const sign = x.isNeg() ? NEG : '';
  const p = decompose(x, sig);
  const d = stripZeros(p.digits);
  if (p.exp >= sig || p.exp <= -4)
    return sign + d[0] + (d.length > 1 ? '.' + d.slice(1) : '') + expText(p.exp);
  return sign + layoutPlain(d, p.exp);
}

/** Format a real or complex number. Complex numbers follow the a+bi / re^θi display style. */
export function formatNum(
  n: Num,
  f: NumFormat = FLOAT_FORMAT,
  style: ComplexStyle = 'RECT',
  ctx?: NumCtx,
): string {
  if (isReal(n)) return formatReal(n, f);
  if (style === 'POLAR') {
    const r = absN(n);
    const theta = argN(ctx ?? { realOnly: false, degrees: false }, n);
    return `${formatReal(r, f)}${EULER}^(${formatReal(theta, f)}${IMAG})`;
  }
  const re = reOf(n);
  const im = imOf(n);
  const imAbs = im.abs();
  const imText = (imAbs.eq(1) ? '' : formatReal(imAbs, f)) + IMAG;
  if (re.isZero()) return (im.isNeg() ? NEG : '') + imText;
  return formatReal(re, f) + (im.isNeg() ? '-' : '+') + imText;
}

/** Text as shown by screenText(): special glyph stand-ins mapped to the characters used in the spec. */
export function toPlain(s: string): string {
  return s
    .replace(/ᴇ/g, 'E')
    .replace(/ⅈ/g, 'i')
    .replace(/ℯ/g, 'e')
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (c) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)));
}
