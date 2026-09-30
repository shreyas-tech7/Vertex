import { TIError, err } from '../errors';
import * as linalg from '../matrix/linalg';
import {
  add,
  checkRange,
  div,
  eq,
  isCx,
  isNum,
  isZeroNum,
  mul,
  neg,
  nthRootN,
  powN,
  sub,
  type Num,
} from '../numbers/complex';
import { D, H, ONE, PI_HI, ZERO, fromHi, isReal, toHi, type Real } from '../numbers/decimal';
import { T } from '../tokens/codes';
import type { Ctx } from './ctx';
import { ListV, MatV, StrV, type Value } from './values';

// ---------- small helpers ----------

export const bool = (b: boolean): Real => (b ? ONE : ZERO);
export const truth = (n: Num): boolean => !isZeroNum(n);

export function mapList(l: ListV, f: (x: Num) => Num): ListV {
  return new ListV(l.items.map(f));
}
export function zipList(a: ListV, b: ListV, f: (x: Num, y: Num) => Num): ListV {
  if (a.length !== b.length) throw err('DIM MISMATCH');
  return new ListV(a.items.map((x, i) => f(x, b.items[i])));
}

/** Apply a scalar function to a scalar or elementwise to a list. Matrices and others are a DATA TYPE error. */
export function mapValue(v: Value, f: (x: Num) => Num, pos = -1): Value {
  if (isNum(v)) return f(v);
  if (v instanceof ListV) return mapList(v, f);
  throw new TIError('DATA TYPE', pos);
}

/** Like mapValue but matrices are mapped elementwise too (real results only). */
export function mapValueM(v: Value, f: (x: Num) => Num, pos = -1): Value {
  if (v instanceof MatV) {
    return new MatV(
      v.rows,
      v.cols,
      v.data.map((x) => {
        const r = f(x);
        if (!isReal(r)) throw new TIError('DATA TYPE', pos);
        return r;
      }),
    );
  }
  return mapValue(v, f, pos);
}

// ---------- integer functions ----------

const bigToReal = (b: bigint): Real => new D(b.toString()).toSD(14);

export function toBig(x: Real): bigint {
  return BigInt(x.toFixed(0));
}

/** n! for integers 0..69 and half-integers -.5..68.5 (spec §7). */
export function factorial(x: Real): Real {
  if (!x.mul(2).isInteger()) throw err('DOMAIN');
  if (x.lt(-0.5)) throw err('DOMAIN');
  if (x.gt(69)) throw err(x.isInteger() ? 'OVERFLOW' : 'DOMAIN');
  if (x.isInteger()) {
    let f = 1n;
    for (let i = 2n; i <= BigInt(x.toFixed(0)); i++) f *= i;
    return bigToReal(f);
  }
  // x = k + 1/2: Γ(k + 3/2) = (2k+1)!! / 2^(k+1) · √π
  const k = x.sub(0.5).toNumber();
  let odd = 1n;
  for (let i = 1n; i <= BigInt(2 * k + 1); i += 2n) odd *= i;
  const h = new H(odd.toString()).div(new H(2).pow(k + 1)).times(PI_HI.sqrt());
  return fromHi(h);
}

function intArg(x: Real): bigint {
  if (!x.isInteger() || x.isNeg()) throw err('DOMAIN');
  return toBig(x);
}

export function nPr(n: Real, r: Real): Real {
  const nb = intArg(n);
  const rb = intArg(r);
  if (rb > nb) throw err('DOMAIN');
  let acc = new H(1);
  for (let i = 0n; i < rb; i++) {
    acc = acc.times(new H((nb - i).toString()));
    if (acc.gte('1e100')) throw err('OVERFLOW');
  }
  return checkRange(fromHi(acc));
}

export function nCr(n: Real, r: Real): Real {
  const nb = intArg(n);
  let rb = intArg(r);
  if (rb > nb) throw err('DOMAIN');
  if (rb > nb - rb) rb = nb - rb;
  let acc = new H(1);
  for (let i = 0n; i < rb; i++) {
    acc = acc.times(new H((nb - i).toString())).div(new H((i + 1n).toString()));
    if (acc.gte('1e100')) throw err('OVERFLOW');
  }
  return checkRange(fromHi(acc));
}

// ---------- scalar binary operators ----------

function realOnly(a: Num, b: Num): [Real, Real] {
  if (isCx(a) || isCx(b)) throw err('DATA TYPE');
  return [a, b];
}

export function scalarBin(c: Ctx, op: number, a: Num, b: Num): Num {
  switch (op) {
    case T.PLUS:
      return add(a, b);
    case T.MINUS:
      return sub(a, b);
    case T.MUL:
      return mul(a, b);
    case T.DIV:
      return div(a, b);
    case T.POW:
      return powN(c.nc, a, b);
    case T.XROOT:
      return nthRootN(c.nc, a, b);
    case T.NPR: {
      const [x, y] = realOnly(a, b);
      return nPr(x, y);
    }
    case T.NCR: {
      const [x, y] = realOnly(a, b);
      return nCr(x, y);
    }
    case T.EQ:
      return bool(eq(a, b));
    case T.NE:
      return bool(!eq(a, b));
    case T.LT:
    case T.GT:
    case T.LE:
    case T.GE: {
      const [x, y] = realOnly(a, b);
      if (op === T.LT) return bool(x.lt(y));
      if (op === T.GT) return bool(x.gt(y));
      if (op === T.LE) return bool(x.lte(y));
      return bool(x.gte(y));
    }
    case T.AND:
      return bool(truth(a) && truth(b));
    case T.OR:
      return bool(truth(a) || truth(b));
    case T.XOR:
      return bool(truth(a) !== truth(b));
    default:
      throw err('SYNTAX');
  }
}

// ---------- matrices ----------

function matMul(a: MatV, b: MatV): MatV {
  if (a.cols !== b.rows) throw err('DIM MISMATCH');
  const out: Real[] = [];
  for (let i = 0; i < a.rows; i++) {
    for (let j = 0; j < b.cols; j++) {
      let acc = new H(0);
      for (let k = 0; k < a.cols; k++) acc = acc.plus(toHi(a.at(i, k)).times(toHi(b.at(k, j))));
      out.push(checkRange(fromHi(acc)));
    }
  }
  return new MatV(a.rows, b.cols, out);
}

export function matFromRows(rows: Real[][]): MatV {
  return MatV.from(rows);
}

export function matInverse(m: MatV): MatV {
  if (m.rows !== m.cols) throw err('INVALID DIM');
  return MatV.from(linalg.inverse(m.toRows()));
}

function matPow(m: MatV, p: Real): MatV {
  if (m.rows !== m.cols) throw err('INVALID DIM');
  if (!p.isInteger()) throw err('DOMAIN');
  let n = Math.abs(p.toNumber());
  if (n > 255) throw err('DOMAIN');
  let base = p.isNeg() ? matInverse(m) : m;
  let result = MatV.from(linalg.identity(m.rows));
  while (n > 0) {
    if (n & 1) result = matMul(result, base);
    n >>= 1;
    if (n) base = matMul(base, base);
  }
  return result;
}

function matBin(c: Ctx, op: number, a: Value, b: Value): Value {
  const elementwise = (m: MatV, f: (x: Real) => Real): MatV => new MatV(m.rows, m.cols, m.data.map(f));
  if (a instanceof MatV && b instanceof MatV) {
    switch (op) {
      case T.PLUS:
      case T.MINUS: {
        if (a.rows !== b.rows || a.cols !== b.cols) throw err('DIM MISMATCH');
        return new MatV(
          a.rows,
          a.cols,
          a.data.map((x, i) => (op === T.PLUS ? add(x, b.data[i]) : sub(x, b.data[i])) as Real),
        );
      }
      case T.MUL:
        return matMul(a, b);
      case T.EQ:
        return bool(a.rows === b.rows && a.cols === b.cols && a.data.every((x, i) => x.eq(b.data[i])));
      case T.NE:
        return bool(!(a.rows === b.rows && a.cols === b.cols && a.data.every((x, i) => x.eq(b.data[i]))));
      default:
        throw err('DATA TYPE');
    }
  }
  if (a instanceof MatV && isNum(b)) {
    const s = b;
    if (!isReal(s)) throw err('DATA TYPE');
    switch (op) {
      case T.MUL:
        return elementwise(a, (x) => mul(x, s) as Real);
      case T.DIV:
        return elementwise(a, (x) => div(x, s) as Real);
      case T.POW:
        return matPow(a, s);
      default:
        throw err('DATA TYPE');
    }
  }
  if (isNum(a) && b instanceof MatV) {
    if (op !== T.MUL || !isReal(a)) throw err('DATA TYPE');
    return elementwise(b, (x) => mul(a, x) as Real);
  }
  void c;
  throw err('DATA TYPE');
}

// ---------- generic binary / unary over Values ----------

export function binary(c: Ctx, op: number, a: Value, b: Value, pos = -1): Value {
  try {
    if (isNum(a) && isNum(b)) return scalarBin(c, op, a, b);
    if (a instanceof ListV || b instanceof ListV) {
      const l = a instanceof ListV ? a : undefined;
      const r = b instanceof ListV ? b : undefined;
      if (l && r) return zipList(l, r, (x, y) => scalarBin(c, op, x, y));
      if (l && isNum(b)) return mapList(l, (x) => scalarBin(c, op, x, b));
      if (r && isNum(a)) return mapList(r, (y) => scalarBin(c, op, a, y));
      throw err('DATA TYPE');
    }
    if (a instanceof MatV || b instanceof MatV) return matBin(c, op, a, b);
    if (a instanceof StrV && b instanceof StrV) {
      if (op === T.PLUS) return new StrV([...a.toks, ...b.toks]);
      if (op === T.EQ)
        return bool(a.toks.length === b.toks.length && a.toks.every((t, i) => t === b.toks[i]));
      if (op === T.NE)
        return bool(!(a.toks.length === b.toks.length && a.toks.every((t, i) => t === b.toks[i])));
    }
    throw err('DATA TYPE');
  } catch (e) {
    throw e instanceof TIError && e.pos < 0 ? new TIError(e.tiName, pos) : e;
  }
}

export function negate(v: Value, pos = -1): Value {
  if (v instanceof MatV)
    return new MatV(
      v.rows,
      v.cols,
      v.data.map((x) => x.neg()),
    );
  return mapValue(v, neg, pos);
}

const PI_OVER_180 = (): Real => fromHi(PI_HI.div(180));

function withPos<T>(pos: number, f: () => T): T {
  try {
    return f();
  } catch (e) {
    throw e instanceof TIError && e.pos < 0 ? new TIError(e.tiName, pos) : e;
  }
}

/** Convert an angle typed with ° into the current angle unit. */
export function degToAngle(c: Ctx, x: Num): Num {
  return c.settings.angle === 'DEGREE' ? x : mul(x, PI_OVER_180());
}
/** Convert an angle typed with ʳ into the current angle unit. */
export function radToAngle(c: Ctx, x: Num): Num {
  return c.settings.angle === 'RADIAN' ? x : mul(x, fromHi(new H(180).div(PI_HI)));
}

export function postfix(c: Ctx, op: number, v: Value, pos = -1): Value {
  return withPos(pos, () => {
    switch (op) {
      case T.SQR:
        if (v instanceof MatV) return matMul(v, v);
        return mapValue(v, (x) => mul(x, x), pos);
      case T.CUBE:
        if (v instanceof MatV) return matMul(matMul(v, v), v);
        return mapValue(v, (x) => powN(c.nc, x, new D(3)), pos);
      case T.INV:
        if (v instanceof MatV) return matInverse(v);
        return mapValue(v, (x) => div(ONE, x), pos);
      case T.FACT:
        return mapValue(v, (x) => factorial(asRealNum(x)), pos);
      case T.DEG_POST:
        return mapValue(v, (x) => degToAngle(c, x), pos);
      case T.RAD_POST:
        return mapValue(v, (x) => radToAngle(c, x), pos);
      case T.PRIME:
        return mapValue(v, (x) => degToAngle(c, div(x, new D(60))), pos);
      case T.TRANSP:
        if (v instanceof MatV) return MatV.from(linalg.transpose(v.toRows()));
        throw err('DATA TYPE');
      default:
        throw err('SYNTAX');
    }
  });
}

export function asRealNum(x: Num): Real {
  if (isReal(x)) return x;
  throw err('DATA TYPE');
}
