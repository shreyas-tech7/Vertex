import { TIError, err } from '../errors';
import {
  Cx,
  absN,
  acosN,
  acoshN,
  argN,
  asinN,
  asinhN,
  atanN,
  atanhN,
  cbrtN,
  checkRange,
  conjN,
  div,
  expN,
  hypN,
  imOf,
  isNum,
  lnN,
  log10N,
  mk,
  mul,
  powN,
  reOf,
  sqrtN,
  trigN,
  type Num,
} from '../numbers/complex';
import { D, TEN, fromHi, isReal, toHi, type Real } from '../numbers/decimal';
import { T, code } from '../tokens/codes';
import { TOKEN_BY_CODE } from '../tokens/table';
import type { Ctx } from './ctx';
import { asRealNum, bool, mapValue, mapValueM, toBig, truth, zipList } from './ops';
import { reg } from './registry';
import { ListV, asInt } from './values';

const nameOf = (c: number): string => TOKEN_BY_CODE.get(c)?.text ?? '?';

/** Register a one-argument function that maps over scalars and lists. */
function unary(code: number, f: (c: Ctx, x: Num) => Num, matrices = false): void {
  reg(code, {
    name: nameOf(code),
    min: 1,
    max: 1,
    eager: (c, [a], pos) => (matrices ? mapValueM : mapValue)(a, (x) => f(c, x), pos),
  });
}

unary(T.SIN, (c, x) => trigN(c.nc, 'sin', x));
unary(T.COS, (c, x) => trigN(c.nc, 'cos', x));
unary(T.TAN, (c, x) => trigN(c.nc, 'tan', x));
unary(T.ASIN, (c, x) => asinN(c.nc, x));
unary(T.ACOS, (c, x) => acosN(c.nc, x));
unary(T.ATAN, (c, x) => atanN(c.nc, x));
unary(T.SINH, (c, x) => hypN(c.nc, 'sinh', x));
unary(T.COSH, (c, x) => hypN(c.nc, 'cosh', x));
unary(T.TANH, (c, x) => hypN(c.nc, 'tanh', x));
unary(T.ASINH, (c, x) => asinhN(c.nc, x));
unary(T.ACOSH, (c, x) => acoshN(c.nc, x));
unary(T.ATANH, (c, x) => atanhN(c.nc, x));
unary(T.LN, (c, x) => lnN(c.nc, x));
unary(T.LOG, (c, x) => log10N(c.nc, x));
unary(T.EXP, (c, x) => expN(c.nc, x));
unary(T.TENPOW, (c, x) => powN(c.nc, TEN, x));
unary(T.SQRT, (c, x) => sqrtN(c.nc, x));
unary(T.CBRT, (c, x) => cbrtN(c.nc, x));
unary(T.NOT, (_c, x) => bool(!truth(x)));

// abs( also accepts matrices and complex numbers
reg(T.ABS, {
  name: 'abs(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => mapValueM(a, (x) => absN(x), pos),
});

const partwise = (x: Num, f: (r: Real) => Real): Num => (isReal(x) ? f(x) : mk(f(x.re), f(x.im)));
const trunc = (r: Real): Real => r.trunc();
unary(T.INT, (_c, x) => partwise(x, (r) => r.floor()), true);
unary(T.IPART, (_c, x) => partwise(x, trunc), true);
unary(T.FPART, (_c, x) => partwise(x, (r) => r.sub(r.trunc())), true);

reg(T.ROUND, {
  name: 'round(',
  min: 1,
  max: 2,
  eager: (_c, args, pos) => {
    let digits = 9; // TI keeps 10 significant digits when no count is given
    let hasDigits = false;
    if (args.length === 2) {
      digits = asInt(args[1], 0, 9, 'DOMAIN', pos);
      hasDigits = true;
    }
    const rnd = (r: Real): Real =>
      hasDigits ? r.toDecimalPlaces(digits, D.ROUND_HALF_UP) : r.toSD(10, D.ROUND_HALF_UP);
    return mapValueM(args[0], (x) => partwise(x, rnd), pos);
  },
});

// ---------- two-argument scalar functions ----------

function binaryScalar(name: string, code: number, f: (c: Ctx, a: Num, b: Num) => Num): void {
  reg(code, {
    name,
    min: 2,
    max: 2,
    eager: (c, [a, b], pos) => {
      if (isNum(a) && isNum(b)) return f(c, a, b);
      if (a instanceof ListV && b instanceof ListV) return zipList(a, b, (x, y) => f(c, x, y));
      if (a instanceof ListV && isNum(b)) return new ListV(a.items.map((x) => f(c, x, b)));
      if (isNum(a) && b instanceof ListV) return new ListV(b.items.map((y) => f(c, a, y)));
      throw new TIError('DATA TYPE', pos);
    },
  });
}

binaryScalar('logBASE(', code('logBASE('), (c, x, b) => {
  if (isReal(x) && isReal(b) && x.gt(0) && b.gt(0)) {
    if (b.eq(1)) throw err('DOMAIN');
    return fromHi(toHi(x).ln().div(toHi(b).ln()));
  }
  return div(lnN(c.nc, x), lnN(c.nc, b));
});

binaryScalar('remainder(', code('remainder('), (_c, a, b) => {
  const x = asRealNum(a);
  const y = asRealNum(b);
  if (y.isZero()) throw err('DOMAIN');
  return x.sub(y.mul(x.div(y).trunc()));
});

function gcdBig(a: bigint, b: bigint): bigint {
  while (b) [a, b] = [b, a % b];
  return a;
}
const lcmBig = (x: bigint, y: bigint): bigint => (x === 0n || y === 0n ? 0n : (x / gcdBig(x, y)) * y);
function natural(x: Num): bigint {
  const r = asRealNum(x);
  if (!r.isInteger() || r.isNeg()) throw err('DOMAIN');
  return toBig(r);
}
const bigReal = (b: bigint): Real => checkRange(new D(b.toString()).toSD(14));

/** gcd( and lcm( take two numbers (or lists, elementwise) or one list (folded). */
function gcdLike(name: string, fold: (x: bigint, y: bigint) => bigint): void {
  const pair = (a: Num, b: Num): Num => bigReal(fold(natural(a), natural(b)));
  reg(code(name), {
    name,
    min: 1,
    max: 2,
    eager: (_c, args, pos) => {
      if (args.length === 1) {
        const l = args[0];
        if (!(l instanceof ListV) || l.length === 0) throw new TIError('DATA TYPE', pos);
        return bigReal(l.items.map(natural).reduce(fold));
      }
      const [a, b] = args;
      if (isNum(a) && isNum(b)) return pair(a, b);
      if (a instanceof ListV && b instanceof ListV) return zipList(a, b, pair);
      if (a instanceof ListV && isNum(b)) return new ListV(a.items.map((x) => pair(x, b)));
      if (isNum(a) && b instanceof ListV) return new ListV(b.items.map((y) => pair(a, y)));
      throw new TIError('DATA TYPE', pos);
    },
  });
}
gcdLike('gcd(', gcdBig);
gcdLike('lcm(', lcmBig);

// ---------- min( and max( ----------

function minmax(codeNum: number, pick: (a: Real, b: Real) => Real, name: string): void {
  reg(codeNum, {
    name,
    min: 1,
    max: 2,
    eager: (_c, args, pos) => {
      const real = asRealNum;
      if (args.length === 1) {
        const l = args[0];
        if (!(l instanceof ListV) || l.length === 0) throw new TIError('DATA TYPE', pos);
        return l.items.map(real).reduce((acc, x) => pick(acc, x));
      }
      const [a, b] = args;
      if (isNum(a) && isNum(b)) return pick(real(a), real(b));
      if (a instanceof ListV && b instanceof ListV) return zipList(a, b, (x, y) => pick(real(x), real(y)));
      if (a instanceof ListV && isNum(b)) return new ListV(a.items.map((x) => pick(real(x), real(b))));
      if (isNum(a) && b instanceof ListV) return new ListV(b.items.map((y) => pick(real(a), real(y))));
      throw new TIError('DATA TYPE', pos);
    },
  });
}
minmax(code('min('), (a, b) => (b.lt(a) ? b : a), 'min(');
minmax(code('max('), (a, b) => (b.gt(a) ? b : a), 'max(');

// ---------- complex helpers ----------

unary(code('conj('), (_c, x) => conjN(x));
unary(code('real('), (_c, x) => reOf(x));
unary(code('imag('), (_c, x) => imOf(x));
unary(code('angle('), (c, x) => argN(c.nc, x));

// ---------- polar / rectangular conversion ----------

function coord(name: string, f: (c: Ctx, a: Real, b: Real) => Real): void {
  const c0 = code(name);
  reg(c0, {
    name,
    min: 2,
    max: 2,
    eager: (c, [a, b], pos) => {
      const g = (x: Num, y: Num): Num => f(c, asRealNum(x), asRealNum(y));
      if (isNum(a) && isNum(b)) return g(a, b);
      if (a instanceof ListV && b instanceof ListV) return zipList(a, b, g);
      if (a instanceof ListV && isNum(b)) return new ListV(a.items.map((x) => g(x, b)));
      if (isNum(a) && b instanceof ListV) return new ListV(b.items.map((y) => g(a, y)));
      throw new TIError('DATA TYPE', pos);
    },
  });
}
coord('R►Pr(', (_c, x, y) => fromHi(toHi(x).pow(2).plus(toHi(y).pow(2)).sqrt()));
coord('R►Pθ(', (c, x, y) => asRealNum(argN(c.nc, new Cx(x, y))));
coord('P►Rx(', (c, r, th) => asRealNum(mul(r, trigN(c.nc, 'cos', th))));
coord('P►Ry(', (c, r, th) => asRealNum(mul(r, trigN(c.nc, 'sin', th))));
