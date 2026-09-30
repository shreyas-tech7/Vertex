import { isNum, type Num } from '../numbers/complex';
import { H, isReal, toHi, fromHi, type Real } from '../numbers/decimal';
import { formatNum, formatReal, NEG, type ComplexStyle } from '../numbers/format';
import { fracText, mixedText } from '../numbers/frac';
import { T } from '../tokens/codes';
import { detokenize } from '../text/tokenize';
import type { Settings } from './ctx';
import { EqV, ListV, MatV, StrV, type Value } from './values';

/** Display options for one result: the MODE settings plus an optional ►conversion typed at the end of the line. */
export interface Display {
  settings: Settings;
  conv: number | null;
}

function dmsText(x: Real, s: Settings): string {
  const neg = x.isNeg() && !x.isZero();
  const a = toHi(x.abs());
  let d = a.floor();
  const rem = a.minus(d).times(60);
  let m = rem.floor();
  const sec = rem.minus(m).times(60);
  // carry when rounding the seconds to 10 significant digits reaches 60
  let secR = new H(sec.toSD(10));
  if (secR.gte(60)) {
    secR = new H(0);
    m = m.plus(1);
    if (m.gte(60)) {
      m = new H(0);
      d = d.plus(1);
    }
  }
  sec = secR;
  rem = sec;
  const secText = formatReal(
    fromHi(sec),
    s.format.mode === 'NORMAL' ? { mode: 'NORMAL', digits: -1 } : s.format,
  );
  return `${neg ? NEG : ''}${d.toFixed(0)}°${m.toFixed(0)}'${secText}"`;
}

export function scalarText(n: Num, d: Display): string {
  const { settings: s, conv } = d;
  if (isReal(n)) {
    if (conv === T.FRAC || conv === T.F_D) return fracText(n) ?? formatReal(n, s.format);
    if (conv === T.ND_UND) return mixedText(n) ?? fracText(n) ?? formatReal(n, s.format);
    if (conv === T.DMS) return dmsText(n, s);
    return formatReal(n, s.format);
  }
  let style: ComplexStyle = s.complex === 'POLAR' ? 'POLAR' : 'RECT';
  if (conv === T.POLAR) style = 'POLAR';
  if (conv === T.RECT) style = 'RECT';
  return formatNum(n, s.format, style);
}

export function listText(l: ListV, d: Display): string {
  return '{' + l.items.map((x) => scalarText(x, d)).join(' ') + '}';
}

/** Rows of a matrix as text cells (no brackets). */
export function matrixCells(m: MatV, d: Display): string[][] {
  return m.toRows().map((r) => r.map((x) => scalarText(x, d)));
}

/** One-line form, e.g. [[1 2][3 4]] (used by tests and Ans previews). */
export function matrixLinear(m: MatV, d: Display): string {
  return (
    '[' +
    matrixCells(m, d)
      .map((r) => '[' + r.join(' ') + ']')
      .join('') +
    ']'
  );
}

/** Display text of any value on one line. */
export function valueText(v: Value, d: Display): string {
  if (isNum(v)) return scalarText(v, d);
  if (v instanceof ListV) return listText(v, d);
  if (v instanceof MatV) return matrixLinear(v, d);
  if (v instanceof StrV || v instanceof EqV) return detokenize(v.toks);
  return '';
}
