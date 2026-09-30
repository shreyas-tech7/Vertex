import { TIError, err } from '../errors';
import { checkRange, imOf, isNum, mk, reOf, sub, type Num } from '../numbers/complex';
import { D, H, ONE, ZERO, fromHi, isReal, toHi, type Real } from '../numbers/decimal';
import { T, code, isLetter } from '../tokens/codes';
import type { Ctx } from './ctx';
import { asRealNum } from './ops';
import { reg, type Thunk } from './registry';
import { ListV, MatV, asInt, asReal, type Value } from './values';
import type { Node } from '../parser/ast';

// ---------- helpers ----------

function list(v: Value, pos: number): ListV {
  if (v instanceof ListV) return v;
  throw new TIError('DATA TYPE', pos);
}
function nonEmpty(l: ListV, pos: number): ListV {
  if (l.length === 0) throw new TIError('INVALID DIM', pos);
  return l;
}

/** Exact (28-digit) sum of numbers, rounded once to 14 digits. */
export function sumNums(items: readonly Num[]): Num {
  let re = new H(0);
  let im = new H(0);
  let complex = false;
  for (const x of items) {
    re = re.plus(toHi(reOf(x)));
    if (!isReal(x)) {
      complex = true;
      im = im.plus(toHi(imOf(x)));
    }
  }
  return complex ? mk(checkRange(fromHi(re)), checkRange(fromHi(im))) : checkRange(fromHi(re));
}

/** Optional frequency list argument: same length, non-negative integers? (reals >= 0 accepted). */
function freqOf(v: Value | undefined, n: number, pos: number): Real[] | null {
  if (v === undefined) return null;
  const f = list(v, pos);
  if (f.length !== n) throw new TIError('DIM MISMATCH', pos);
  return f.items.map((x) => {
    const r = asRealNum(x);
    if (r.isNeg()) throw new TIError('DOMAIN', pos);
    return r;
  });
}

function range(args: Value[], n: number, pos: number): [number, number] {
  const start = args.length > 1 ? asInt(args[1], 1, n, 'DOMAIN', pos) : 1;
  const end = args.length > 2 ? asInt(args[2], start, n, 'DOMAIN', pos) : n;
  return [start - 1, end];
}

reg(code('sum('), {
  name: 'sum(',
  min: 1,
  max: 3,
  eager: (_c, args, pos) => {
    const l = nonEmpty(list(args[0], pos), pos);
    const [s, e] = range(args, l.length, pos);
    return sumNums(l.items.slice(s, e));
  },
});

reg(code('prod('), {
  name: 'prod(',
  min: 1,
  max: 3,
  eager: (_c, args, pos) => {
    const l = nonEmpty(list(args[0], pos), pos);
    const [s, e] = range(args, l.length, pos);
    let acc = new H(1);
    for (const x of l.items.slice(s, e)) {
      acc = acc.times(toHi(asRealNum(x)));
      if (acc.abs().gte('1e100')) throw new TIError('OVERFLOW', pos);
    }
    return checkRange(fromHi(acc));
  },
});

/** Weighted statistics in 28-digit arithmetic. */
export interface Weighted {
  values: Real[];
  weights: Real[];
  n: Real;
}
export function weighted(l: ListV, freq: Real[] | null): Weighted {
  const values = l.items.map(asRealNum);
  const weights = freq ?? values.map(() => ONE);
  let n = new H(0);
  for (const w of weights) n = n.plus(toHi(w));
  return { values, weights, n: fromHi(n) };
}
export function meanOf(w: Weighted): Real {
  let s = new H(0);
  w.values.forEach((x, i) => {
    s = s.plus(toHi(x).times(toHi(w.weights[i])));
  });
  return fromHi(s.div(toHi(w.n)));
}
/** Sample variance (n-1) or population variance (n) in exact-ish arithmetic. */
export function varianceOf(w: Weighted, sample: boolean): Real {
  let s = new H(0);
  let t = new H(0);
  const n = toHi(w.n);
  w.values.forEach((x, i) => {
    const f = toHi(w.weights[i]);
    s = s.plus(toHi(x).times(f));
    t = t.plus(toHi(x).pow(2).times(f));
  });
  const mean = s.div(n);
  const ss = t.minus(mean.times(s)); // Σf(x-mean)² = Σfx² - mean·Σfx
  const denom = sample ? n.minus(1) : n;
  if (denom.lte(0)) throw err('DIVIDE BY 0');
  const v = ss.div(denom);
  return fromHi(v.isNeg() ? new H(0) : v);
}

function statArgs(args: Value[], pos: number): Weighted {
  const l = nonEmpty(list(args[0], pos), pos);
  const f = freqOf(args[1], l.length, pos);
  const w = weighted(l, f);
  if (w.n.isZero()) throw new TIError('DOMAIN', pos);
  return w;
}

reg(code('mean('), {
  name: 'mean(',
  min: 1,
  max: 2,
  eager: (_c, args, pos) => {
    const l = nonEmpty(list(args[0], pos), pos);
    if (args.length === 1) {
      // complex means allowed without a frequency list
      const s = sumNums(l.items);
      return isReal(s)
        ? fromHi(toHi(s).div(l.length))
        : mk(fromHi(toHi(s.re).div(l.length)), fromHi(toHi(s.im).div(l.length)));
    }
    return meanOf(statArgs(args, pos));
  },
});

reg(code('median('), {
  name: 'median(',
  min: 1,
  max: 2,
  eager: (_c, args, pos) => {
    const w = statArgs(args, pos);
    const pairs = w.values.map((v, i) => ({ v, f: w.weights[i] })).filter((p) => !p.f.isZero());
    pairs.sort((a, b) => a.v.cmp(b.v));
    return medianSorted(pairs);
  },
});

/** Median of weighted, sorted (value, frequency) pairs. */
export function medianSorted(pairs: { v: Real; f: Real }[]): Real {
  let total = ZERO;
  for (const p of pairs) total = total.plus(p.f);
  const half = total.div(2);
  let cum = ZERO;
  for (let i = 0; i < pairs.length; i++) {
    cum = cum.plus(pairs[i].f);
    if (cum.gt(half)) return pairs[i].v;
    if (cum.eq(half)) {
      // exactly half: average with the next value
      const next = pairs[i + 1];
      return next ? fromHi(toHi(pairs[i].v).plus(toHi(next.v)).div(2)) : pairs[i].v;
    }
  }
  return pairs[pairs.length - 1].v;
}

reg(code('stdDev('), {
  name: 'stdDev(',
  min: 1,
  max: 2,
  eager: (_c, args, pos) => {
    const v = varianceOf(statArgs(args, pos), true);
    return fromHi(toHi(v).sqrt());
  },
});
reg(code('variance('), {
  name: 'variance(',
  min: 1,
  max: 2,
  eager: (_c, args, pos) => varianceOf(statArgs(args, pos), true),
});

reg(code('cumSum('), {
  name: 'cumSum(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => {
    if (a instanceof ListV) {
      let acc = new H(0);
      let accI = new H(0);
      return new ListV(
        a.items.map((x) => {
          acc = acc.plus(toHi(reOf(x)));
          accI = accI.plus(toHi(imOf(x)));
          return accI.isZero()
            ? checkRange(fromHi(acc))
            : mk(checkRange(fromHi(acc)), checkRange(fromHi(accI)));
        }),
      );
    }
    if (a instanceof MatV) {
      const out: Real[] = [];
      for (let j = 0; j < a.cols; j++) {
        let acc = new H(0);
        for (let i = 0; i < a.rows; i++) {
          acc = acc.plus(toHi(a.at(i, j)));
          out[i * a.cols + j] = checkRange(fromHi(acc));
        }
      }
      return new MatV(a.rows, a.cols, out);
    }
    throw new TIError('DATA TYPE', pos);
  },
});

reg(code('ΔList('), {
  name: 'ΔList(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => {
    const l = list(a, pos);
    if (l.length < 2) throw new TIError('INVALID DIM', pos);
    return new ListV(l.items.slice(1).map((x, i) => sub(x, l.items[i])));
  },
});

reg(T.DIM, {
  name: 'dim(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => {
    if (a instanceof ListV) return new D(a.length);
    if (a instanceof MatV) return new ListV([new D(a.rows), new D(a.cols)]);
    throw new TIError('DATA TYPE', pos);
  },
});

reg(code('augment('), {
  name: 'augment(',
  min: 2,
  max: 2,
  eager: (_c, [a, b], pos) => {
    if (a instanceof ListV && b instanceof ListV) {
      if (a.length + b.length > 999) throw new TIError('DIM MISMATCH', pos);
      return new ListV([...a.items, ...b.items]);
    }
    if (a instanceof MatV && b instanceof MatV) {
      if (a.rows !== b.rows) throw new TIError('DIM MISMATCH', pos);
      const out: Real[] = [];
      for (let i = 0; i < a.rows; i++) {
        for (let j = 0; j < a.cols; j++) out.push(a.at(i, j));
        for (let j = 0; j < b.cols; j++) out.push(b.at(i, j));
      }
      return new MatV(a.rows, a.cols + b.cols, out);
    }
    throw new TIError('DATA TYPE', pos);
  },
});

// ---------- seq( and Σ( (loop over an expression) ----------

/** Evaluate `body` with the real variable of `nameNode` bound to successive values; always restores the old value. */
export function withBinding<R>(c: Ctx, nameNode: Node, pos: number, run: (set: (x: Num) => void) => R): R {
  if (nameNode.k !== 'var' || !(isLetter(nameNode.c) || nameNode.c === T.THETA))
    throw new TIError('SYNTAX', pos);
  const codeV = nameNode.c;
  const had = c.mem.hasRealSlot(codeV);
  const old = c.mem.getVar(codeV);
  try {
    return run((x) => c.mem.setVar(codeV, x));
  } finally {
    if (had) c.mem.setVar(codeV, old);
    else c.mem.deleteVar(codeV);
  }
}

function numResult(v: Value, pos: number): Num {
  if (isNum(v)) return v;
  throw new TIError('DATA TYPE', pos);
}

reg(code('seq('), {
  name: 'seq(',
  min: 4,
  max: 5,
  lazy: (c: Ctx, args: Thunk[], nodes: Node[], pos: number) => {
    const begin = asReal(args[2](c), pos);
    const end = asReal(args[3](c), pos);
    const step = args.length > 4 ? asReal(args[4](c), pos) : ONE;
    if (step.isZero()) throw new TIError('DOMAIN', pos);
    const items: Num[] = [];
    withBinding(c, nodes[1], pos, (set) => {
      for (let k = 0; ; k++) {
        const x = begin.plus(step.times(k));
        if (step.isPos() ? x.gt(end) : x.lt(end)) break;
        if (items.length >= 999) throw new TIError('INVALID DIM', pos);
        set(x);
        items.push(numResult(args[0](c), pos));
        if (k % 64 === 63) c.checkBreak();
      }
    });
    if (items.length === 0) throw new TIError('INVALID DIM', pos);
    return new ListV(items);
  },
});

reg(T.SUMMATION, {
  name: 'Σ(',
  min: 4,
  max: 4,
  lazy: (c, args, nodes, pos) => {
    const lo = asReal(args[2](c), pos);
    const hi = asReal(args[3](c), pos);
    if (!lo.isInteger() || !hi.isInteger()) throw new TIError('DOMAIN', pos);
    let re = new H(0);
    let im = new H(0);
    let complex = false;
    withBinding(c, nodes[1], pos, (set) => {
      let n = 0;
      for (let k = lo; k.lte(hi); k = k.plus(1)) {
        set(k);
        const v = numResult(args[0](c), pos);
        re = re.plus(toHi(reOf(v)));
        if (!isReal(v)) {
          complex = true;
          im = im.plus(toHi(imOf(v)));
        }
        if (++n % 64 === 0) c.checkBreak();
      }
    });
    return complex ? mk(checkRange(fromHi(re)), checkRange(fromHi(im))) : checkRange(fromHi(re));
  },
});
