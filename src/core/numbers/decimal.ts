import Decimal from 'decimal.js';

/** Real arithmetic: 14 significant decimal digits, magnitudes 1E-99 .. <1E100 (spec §7 "Numbers and display"). */
export const D = Decimal.clone({
  precision: 14,
  rounding: Decimal.ROUND_HALF_UP,
  minE: -99,
  maxE: 99,
  toExpNeg: -400,
  toExpPos: 400,
});
export type Real = Decimal;

/** High-precision scratch arithmetic for transcendental functions; results are rounded back to 14 digits. */
export const H = Decimal.clone({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  minE: -9e15,
  maxE: 9e15,
  toExpNeg: -400,
  toExpPos: 400,
});
export type Hi = Decimal;

export const ZERO: Real = new D(0);
export const ONE: Real = new D(1);
export const TWO: Real = new D(2);
export const TEN: Real = new D(10);

export const isReal = (v: unknown): v is Real =>
  v instanceof Decimal || (v as { toStringTag?: string })?.toStringTag === '[object Decimal]';

/** Round a high precision value to a 14-digit calculator real (underflow -> 0; overflow -> Infinity). */
export const fromHi = (h: Hi): Real => new D(h.toSD(14));

/** Exact conversion of a calculator real into the high-precision type. */
export const toHi = (r: Real): Hi => new H(r);

/** Round any decimal input (string, number, bigint) to a 14-digit real. */
export function num(v: string | number | bigint | Decimal): Real {
  return new D(typeof v === 'number' ? v.toPrecision(15) : v instanceof Decimal ? v : String(v)).toSD(14);
}

/** Convert a JS double (for example from a distribution routine) to a real without binary noise. */
export function fromNumber(x: number): Real {
  if (!Number.isFinite(x)) return new D(x);
  if (x === 0) return ZERO;
  return new D(x.toPrecision(15)).toSD(14);
}

export const PI_HI: Hi = new H(
  '3.14159265358979323846264338327950288419716939937510582097494459230781640628620899',
);
export const E_HI: Hi = new H(
  '2.71828182845904523536028747135266249775724709369995957496696762772407663035354759',
);
export const PI: Real = fromHi(PI_HI);
export const E: Real = fromHi(E_HI);
