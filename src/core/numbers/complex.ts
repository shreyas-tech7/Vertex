import { err } from '../errors';
import { D, H, ONE, PI_HI, ZERO, fromHi, isReal, toHi, type Hi, type Real } from './decimal';

/** A complex value with a non-zero imaginary part (zero imaginary parts collapse to a plain Real). */
export class Cx {
  constructor(
    readonly re: Real,
    readonly im: Real,
  ) {}
}
export type Num = Real | Cx;

export const isCx = (v: unknown): v is Cx => v instanceof Cx;
export const isNum = (v: unknown): v is Num => isReal(v) || v instanceof Cx;

/** Build a number, collapsing x+0i to a Real. Range-checks both parts. */
export function mk(re: Real, im: Real): Num {
  checkRange(re);
  checkRange(im);
  return im.isZero() ? re : new Cx(re, im);
}

/** Overflow / NaN guard for results of arithmetic. */
export function checkRange(x: Real): Real {
  if (!x.isFinite()) {
    if (x.isNaN()) throw err('DOMAIN');
    throw err('OVERFLOW');
  }
  return x;
}

export const reOf = (n: Num): Real => (n instanceof Cx ? n.re : n);
export const imOf = (n: Num): Real => (n instanceof Cx ? n.im : ZERO);

export interface NumCtx {
  /** True in Real mode: real inputs may not produce non-real results. */
  realOnly: boolean;
  /** True in Degree mode. */
  degrees: boolean;
}

// ---------- basic arithmetic ----------

export function add(a: Num, b: Num): Num {
  if (isReal(a) && isReal(b)) return checkRange(a.plus(b));
  return mk(reOf(a).plus(reOf(b)), imOf(a).plus(imOf(b)));
}
export function sub(a: Num, b: Num): Num {
  if (isReal(a) && isReal(b)) return checkRange(a.minus(b));
  return mk(reOf(a).minus(reOf(b)), imOf(a).minus(imOf(b)));
}
export function mul(a: Num, b: Num): Num {
  if (isReal(a) && isReal(b)) return checkRange(a.times(b));
  const ar = reOf(a),
    ai = imOf(a),
    br = reOf(b),
    bi = imOf(b);
  return mk(ar.times(br).minus(ai.times(bi)), ar.times(bi).plus(ai.times(br)));
}
export function div(a: Num, b: Num): Num {
  if (isReal(a) && isReal(b)) {
    if (b.isZero()) throw err('DIVIDE BY 0');
    return checkRange(a.div(b));
  }
  const ar = reOf(a),
    ai = imOf(a),
    br = reOf(b),
    bi = imOf(b);
  const den = br.times(br).plus(bi.times(bi));
  if (den.isZero()) throw err('DIVIDE BY 0');
  return mk(ar.times(br).plus(ai.times(bi)).div(den), ai.times(br).minus(ar.times(bi)).div(den));
}
export function neg(a: Num): Num {
  return isReal(a) ? a.neg() : new Cx(a.re.neg(), a.im.neg());
}
export const eq = (a: Num, b: Num): boolean => reOf(a).eq(reOf(b)) && imOf(a).eq(imOf(b));
export const isZeroNum = (a: Num): boolean => reOf(a).isZero() && imOf(a).isZero();

// ---------- high-precision complex helpers ----------

type HC = [Hi, Hi];
const hc = (n: Num): HC => [toHi(reOf(n)), toHi(imOf(n))];
const fromHC = (z: HC): Num => mk(fromHi(z[0]), fromHi(z[1]));

const hMul = (a: HC, b: HC): HC => [
  a[0].times(b[0]).minus(a[1].times(b[1])),
  a[0].times(b[1]).plus(a[1].times(b[0])),
];
const hDiv = (a: HC, b: HC): HC => {
  const den = b[0].times(b[0]).plus(b[1].times(b[1]));
  return [
    a[0].times(b[0]).plus(a[1].times(b[1])).div(den),
    a[1].times(b[0]).minus(a[0].times(b[1])).div(den),
  ];
};
const hAbs = (a: HC): Hi => a[0].times(a[0]).plus(a[1].times(a[1])).sqrt();
const hExp = (a: HC): HC => {
  const m = a[0].exp();
  return [m.times(a[1].cos()), m.times(a[1].sin())];
};
const hLn = (a: HC): HC => [hAbs(a).ln(), H.atan2(a[1], a[0])];
const hSqrt = (a: HC): HC => {
  if (a[1].isZero()) return a[0].isNeg() ? [new H(0), a[0].neg().sqrt()] : [a[0].sqrt(), new H(0)];
  const r = hAbs(a);
  const re = r.plus(a[0]).div(2).sqrt();
  const im = r.minus(a[0]).div(2).sqrt();
  return [re, a[1].isNeg() ? im.neg() : im];
};
const HI: HC = [new H(0), new H(1)];
const hAddR = (a: HC, r: number | Hi): HC => [a[0].plus(r), a[1]];
const hAdd = (a: HC, b: HC): HC => [a[0].plus(b[0]), a[1].plus(b[1])];
const hSub = (a: HC, b: HC): HC => [a[0].minus(b[0]), a[1].minus(b[1])];

// ---------- exp / ln / roots / powers ----------

export function expN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    const h = toHi(a).exp();
    return fromHiChecked(h);
  }
  void ctx;
  return fromHC(hExp(hc(a)));
}

function fromHiChecked(h: Hi): Real {
  if (!h.isFinite()) throw err('OVERFLOW');
  if (h.abs().gte('1e100')) throw err('OVERFLOW');
  return checkRange(fromHi(h));
}

export function lnN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    if (a.isZero()) throw err('DOMAIN');
    if (a.isPos()) return fromHi(toHi(a).ln());
    if (ctx.realOnly) throw err('NONREAL ANS');
    return mk(fromHi(toHi(a.neg()).ln()), fromHi(PI_HI));
  }
  return fromHC(hLn(hc(a)));
}

export function log10N(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    if (a.isZero()) throw err('DOMAIN');
    if (a.isPos()) return fromHi(toHi(a).log(10));
    if (ctx.realOnly) throw err('NONREAL ANS');
  }
  const l = hLn(hc(a));
  const ln10 = new H(10).ln();
  return fromHC([l[0].div(ln10), l[1].div(ln10)]);
}

export function sqrtN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    if (!a.isNeg()) return fromHi(toHi(a).sqrt());
    if (ctx.realOnly) throw err('NONREAL ANS');
    return mk(ZERO, fromHi(toHi(a.neg()).sqrt()));
  }
  return fromHC(hSqrt(hc(a)));
}

const isInt = (x: Real): boolean => x.isInteger();

/** Find p/q (q <= maxDen) that reproduces y exactly at 14 digits; returns q or 0. */
function denominatorOf(y: Real, maxDen = 99): number {
  for (let q = 1; q <= maxDen; q++) {
    const p = y.times(q).toDecimalPlaces(0);
    if (new D(p).div(q).eq(y)) return q;
  }
  return 0;
}

export function powN(ctx: NumCtx, a: Num, b: Num): Num {
  if (isReal(a) && isReal(b)) {
    if (a.isZero()) {
      if (b.isZero()) throw err('DOMAIN');
      if (b.isNeg()) throw err('DIVIDE BY 0');
      return ZERO;
    }
    if (isInt(b)) {
      if (b.abs().lte(1e9)) return fromHiChecked(toHi(a).pow(b));
    }
    if (!a.isNeg()) return fromHiChecked(toHi(a).pow(toHi(b)));
    // negative base, non-integer exponent: real if the exponent is a fraction with an odd denominator
    const q = denominatorOf(b);
    if (q > 0 && q % 2 === 1) {
      const p = b.times(q).toDecimalPlaces(0);
      const mag = toHi(a.neg()).pow(toHi(b));
      const odd = p.abs().mod(2).eq(1);
      return fromHiChecked(odd ? mag.neg() : mag);
    }
    if (ctx.realOnly) throw err('NONREAL ANS');
  }
  // complex power
  const ca = hc(a);
  const cb = hc(b);
  if (isReal(b) && isInt(b) && b.abs().lte(64)) {
    let n = b.abs().toNumber();
    let base: Num = a;
    let result: Num = ONE;
    while (n > 0) {
      if (n & 1) result = mul(result, base);
      n >>= 1;
      if (n) base = mul(base, base);
    }
    return b.isNeg() ? div(ONE, result) : result;
  }
  if (isZeroNum(a)) {
    if (isZeroNum(b)) throw err('DOMAIN');
    return ZERO;
  }
  return fromHC(hExp(hMul(cb, hLn(ca))));
}

export function cbrtN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) return fromHi(toHi(a).cbrt());
  return powN(ctx, a, new D(1).div(3));
}

/** xˣ√y : the x-th root of y (x root y). */
export function nthRootN(ctx: NumCtx, x: Num, y: Num): Num {
  if (isReal(x) && x.isZero()) throw err('DOMAIN');
  return powN(ctx, y, div(ONE, x));
}

export function absN(a: Num): Real {
  if (isReal(a)) return a.abs();
  return fromHi(hAbs(hc(a)));
}
export function argN(ctx: NumCtx, a: Num): Real {
  const re = reOf(a),
    im = imOf(a);
  const h = H.atan2(toHi(im), toHi(re));
  return ctx.degrees ? fromHi(h.times(180).div(PI_HI)) : fromHi(h);
}
export const conjN = (a: Num): Num => (isReal(a) ? a : new Cx(a.re, a.im.neg()));

// ---------- trigonometry (real with angle modes, complex in radians) ----------

function piMultipleOfHalf(x: Real): number | null {
  // x exactly equals the 14-digit rounding of k*pi/2 for small integer k
  if (x.isZero()) return 0;
  const hx = toHi(x);
  const k = hx.div(PI_HI.div(2)).toDecimalPlaces(0);
  if (k.abs().gt(1e6)) return null;
  const cand = fromHi(PI_HI.times(k).div(2));
  return cand.eq(x) ? k.toNumber() : null;
}

type Trig = 'sin' | 'cos' | 'tan';

function trigReal(ctx: NumCtx, kind: Trig, x: Real): Real {
  if (ctx.degrees) {
    const period = kind === 'tan' ? 180 : 360;
    const r = x.mod(period); // exact for 14-digit decimals
    const rr = r.isNeg() ? r.plus(period) : r;
    if (rr.mod(90).isZero()) {
      const q = rr.div(90).toNumber(); // quadrant multiple
      if (kind === 'sin') return new D([0, 1, 0, -1][q % 4]);
      if (kind === 'cos') return new D([1, 0, -1, 0][q % 4]);
      if (q % 2 === 1) throw err('DOMAIN');
      return ZERO;
    }
    const rad = toHi(rr).times(PI_HI).div(180);
    return fromHi(rad[kind]());
  }
  const hx = toHi(x);
  const res = hx[kind]();
  const mag = res.abs();
  if (mag.lt('1e-11') || mag.gt('1e11')) {
    const k = piMultipleOfHalf(x);
    if (k !== null) {
      const m = ((k % 4) + 4) % 4;
      if (kind === 'sin') return new D([0, 1, 0, -1][m]);
      if (kind === 'cos') return new D([1, 0, -1, 0][m]);
      if (m % 2 === 1) throw err('DOMAIN');
      return ZERO;
    }
  }
  return fromHiChecked(res);
}

export function trigN(ctx: NumCtx, kind: Trig, a: Num): Num {
  if (isReal(a)) return trigReal(ctx, kind, a);
  // complex arguments: degrees are converted to radians first
  const [re, im] = hc(ctx.degrees ? mul(a, fromHi(PI_HI.div(180))) : a);
  const sin: HC = [re.sin().times(im.cosh()), re.cos().times(im.sinh())];
  const cos: HC = [re.cos().times(im.cosh()), re.sin().times(im.sinh()).neg()];
  if (kind === 'sin') return fromHC(sin);
  if (kind === 'cos') return fromHC(cos);
  if (isZeroHC(cos)) throw err('DOMAIN');
  return fromHC(hDiv(sin, cos));
}
const isZeroHC = (z: HC): boolean => z[0].isZero() && z[1].isZero();

export function hypN(ctx: NumCtx, kind: 'sinh' | 'cosh' | 'tanh', a: Num): Num {
  void ctx;
  if (isReal(a)) return fromHiChecked(toHi(a)[kind]());
  const [re, im] = hc(a);
  const sinh: HC = [re.sinh().times(im.cos()), re.cosh().times(im.sin())];
  const cosh: HC = [re.cosh().times(im.cos()), re.sinh().times(im.sin())];
  if (kind === 'sinh') return fromHC(sinh);
  if (kind === 'cosh') return fromHC(cosh);
  if (isZeroHC(cosh)) throw err('DOMAIN');
  return fromHC(hDiv(sinh, cosh));
}

function fromRadians(ctx: NumCtx, h: Hi): Real {
  return fromHi(ctx.degrees ? h.times(180).div(PI_HI) : h);
}

export function asinN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    if (a.abs().lte(1)) return fromRadians(ctx, toHi(a).asin());
    if (ctx.realOnly) throw err('DOMAIN');
  }
  // asin z = -i ln(iz + sqrt(1 - z^2))
  const z = hc(a);
  const iz: HC = [z[1].neg(), z[0]];
  const root = hSqrt(hSub([new H(1), new H(0)], hMul(z, z)));
  const l = hLn(hAdd(iz, root));
  return radiansOut(ctx, [l[1], l[0].neg()]);
}
export function acosN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    if (a.abs().lte(1)) return fromRadians(ctx, toHi(a).acos());
    if (ctx.realOnly) throw err('DOMAIN');
  }
  const z = hc(a);
  const iz: HC = [z[1].neg(), z[0]];
  const root = hSqrt(hSub([new H(1), new H(0)], hMul(z, z)));
  const l = hLn(hAdd(iz, root));
  const asin: HC = [l[1], l[0].neg()];
  return radiansOut(ctx, [PI_HI.div(2).minus(asin[0]), asin[1].neg()]);
}
export function atanN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) return fromRadians(ctx, toHi(a).atan());
  // atan z = (i/2) ln((i+z)/(i-z))   (principal value)
  const z = hc(a);
  const l = hLn(hDiv(hAdd(HI, z), hSub(HI, z)));
  return radiansOut(ctx, [l[1].neg().div(2).neg(), l[0].div(2)]);
}
function radiansOut(ctx: NumCtx, z: HC): Num {
  if (!ctx.degrees) return fromHC(z);
  return fromHC([z[0].times(180).div(PI_HI), z[1].times(180).div(PI_HI)]);
}

export function asinhN(ctx: NumCtx, a: Num): Num {
  void ctx;
  if (isReal(a)) return fromHi(toHi(a).asinh());
  const z = hc(a);
  return fromHC(hLn(hAdd(z, hSqrt(hAddR(hMul(z, z), 1)))));
}
export function acoshN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    if (a.gte(1)) return fromHi(toHi(a).acosh());
    if (ctx.realOnly) throw err('DOMAIN');
  }
  const z = hc(a);
  const r1 = hSqrt(hAddR(z, 1));
  const r2 = hSqrt(hAddR(z, -1));
  return fromHC(hLn(hAdd(z, hMul(r1, r2))));
}
export function atanhN(ctx: NumCtx, a: Num): Num {
  if (isReal(a)) {
    if (a.abs().lt(1)) return fromHi(toHi(a).atanh());
    if (ctx.realOnly) throw err('DOMAIN');
  }
  const z = hc(a);
  const l = hLn(hDiv(hAddR(z, 1), hSub([new H(1), new H(0)], z)));
  return fromHC([l[0].div(2), l[1].div(2)]);
}
