import { err } from '../errors';
import { isNum, reOf, type Num } from '../numbers/complex';
import { ZERO, isReal, type Real } from '../numbers/decimal';

/** A list of reals or complex numbers. */
export class ListV {
  constructor(readonly items: readonly Num[]) {}
  get length(): number {
    return this.items.length;
  }
}

/** A real matrix stored row-major. */
export class MatV {
  constructor(
    readonly rows: number,
    readonly cols: number,
    readonly data: readonly Real[],
  ) {
    if (data.length !== rows * cols) throw new Error('matrix data length mismatch');
  }
  at(r: number, c: number): Real {
    return this.data[r * this.cols + c];
  }
  static from(rows: Real[][]): MatV {
    const r = rows.length;
    const c = r === 0 ? 0 : rows[0].length;
    return new MatV(r, c, rows.flat());
  }
  toRows(): Real[][] {
    const out: Real[][] = [];
    for (let r = 0; r < this.rows; r++)
      out.push(this.data.slice(r * this.cols, (r + 1) * this.cols) as Real[]);
    return out;
  }
}

/** A string as a list of token codes. */
export class StrV {
  constructor(readonly toks: readonly number[]) {}
}

/** An equation (Y1, X1T, r1, u ...): a token list. */
export class EqV {
  constructor(readonly toks: readonly number[]) {}
}

export type Value = Num | ListV | MatV | StrV | EqV;

export const isList = (v: Value): v is ListV => v instanceof ListV;
export const isMat = (v: Value): v is MatV => v instanceof MatV;
export const isStr = (v: Value): v is StrV => v instanceof StrV;
export const isEq = (v: Value): v is EqV => v instanceof EqV;
export const isScalar = (v: Value): v is Num => isNum(v);

export function asNum(v: Value, pos = -1): Num {
  if (isNum(v)) return v;
  throw err('DATA TYPE', pos);
}
export function asReal(v: Value, pos = -1): Real {
  if (isReal(v)) return v;
  if (isNum(v)) throw err('DATA TYPE', pos); // complex where a real is needed
  throw err('DATA TYPE', pos);
}
export function asList(v: Value, pos = -1): ListV {
  if (v instanceof ListV) return v;
  throw err('DATA TYPE', pos);
}
export function asMat(v: Value, pos = -1): MatV {
  if (v instanceof MatV) return v;
  throw err('DATA TYPE', pos);
}
export function asStr(v: Value, pos = -1): StrV {
  if (v instanceof StrV) return v;
  throw err('DATA TYPE', pos);
}

/** A real that must be an integer within [lo, hi]; else the given error. */
export function asInt(
  v: Value,
  lo: number,
  hi: number,
  name: 'DOMAIN' | 'INVALID DIM' | 'ARGUMENT' | 'DATA TYPE' = 'DOMAIN',
  pos = -1,
): number {
  const r = asReal(v, pos);
  if (!r.isInteger() || r.lt(lo) || r.gt(hi)) throw err(name, pos);
  return r.toNumber();
}

export const listOfReals = (xs: readonly Real[]): ListV => new ListV(xs);
export const realsOf = (l: ListV, pos = -1): Real[] => l.items.map((x) => asReal(x, pos));
export const truthy = (v: Num): boolean =>
  !reOf(v).isZero() || !(isReal(v) ? ZERO : (v as { im: Real }).im).isZero();
