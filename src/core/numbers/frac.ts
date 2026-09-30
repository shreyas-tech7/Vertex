import { D, type Real } from './decimal';
import { NEG } from './format';

/** Largest denominator ►Frac will produce before handing the decimal back (logged in DECISIONS.md). */
export const FRAC_MAX_DEN = 99999n;
/** Relative tolerance for accepting a continued-fraction convergent. */
const FRAC_TOL_EXP = 13n; // 1e-13

export interface Fraction {
  neg: boolean;
  num: bigint;
  den: bigint;
}

/** Exact decimal -> (N, 10^s). */
function exactParts(x: Real): { n: bigint; scale: bigint } {
  const s = x.abs().toFixed();
  const [i, f = ''] = s.split('.');
  return { n: BigInt(i + f), scale: 10n ** BigInt(f.length) };
}

/** Find the simplest fraction equal to x (to 14 digits) whose denominator is within the limit, or null. */
export function toFraction(x: Real, maxDen: bigint = FRAC_MAX_DEN): Fraction | null {
  if (!x.isFinite()) return null;
  const neg = x.isNeg() && !x.isZero();
  if (x.isZero()) return { neg: false, num: 0n, den: 1n };
  const { n: N, scale: S } = exactParts(x);
  // continued fraction of N/S using exact integer arithmetic
  let a = N,
    b = S;
  let h0 = 1n,
    h1 = 0n; // h_{-1}=1, h_{-2}=0
  let k0 = 0n,
    k1 = 1n;
  for (let guard = 0; guard < 64 && b !== 0n; guard++) {
    const q = a / b;
    const h = q * h0 + h1;
    const k = q * k0 + k1;
    if (k > maxDen) return null;
    h1 = h0;
    h0 = h;
    k1 = k0;
    k0 = k;
    const diff = h * S - N * k;
    const adiff = diff < 0n ? -diff : diff;
    // |x - h/k| <= 1e-13 |x|   <=>   |h*S - N*k| * 10^13 <= N * k
    if (adiff * 10n ** FRAC_TOL_EXP <= N * k) return { neg, num: h, den: k };
    const r = a % b;
    a = b;
    b = r;
  }
  return null;
}

export function fractionText(f: Fraction): string {
  return (f.neg ? NEG : '') + f.num.toString() + (f.den === 1n ? '' : '/' + f.den.toString());
}

/** ►Frac for display: "3/4", or null when no fraction fits (caller shows the decimal instead). */
export function fracText(x: Real): string | null {
  const f = toFraction(x);
  return f ? fractionText(f) : null;
}

/** Mixed-number form for the Un/d setting: "1 1/2" style (whole, then fraction). */
export function mixedText(x: Real): string | null {
  const f = toFraction(x);
  if (!f) return null;
  if (f.den === 1n || f.num < f.den) return fractionText(f);
  const whole = f.num / f.den;
  const rem = f.num % f.den;
  const sign = f.neg ? NEG : '';
  return rem === 0n ? sign + whole.toString() : `${sign}${whole}${'\u2009'}${rem}/${f.den}`;
}

export const isIntegerValue = (x: Real): boolean => x.isInteger();
export const decimalOf = (n: bigint, d: bigint): Real => new D(n.toString()).div(d.toString());
