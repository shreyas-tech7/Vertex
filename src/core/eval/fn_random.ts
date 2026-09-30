import { TIError } from '../errors';
import { D, fromNumber, type Real } from '../numbers/decimal';
import { code } from '../tokens/codes';
import { invNormal } from '../stats/distributions';
import { reg } from './registry';
import { ListV, MatV, asInt, asReal, type Value } from './values';
import type { Ctx } from './ctx';

/** rand(n): a list of n random numbers. */
reg(code('rand'), {
  name: 'rand(',
  min: 0,
  max: 1,
  eager: (c, args, pos) => {
    if (args.length === 0) return c.rng.next();
    const n = asInt(args[0], 1, 999, 'DOMAIN', pos);
    return new ListV(Array.from({ length: n }, () => c.rng.next()));
  },
});

function count(args: Value[], i: number, pos: number): number | null {
  return args.length > i ? asInt(args[i], 1, 999, 'DOMAIN', pos) : null;
}

function repeat(n: number | null, f: () => Real): Value {
  return n === null ? f() : new ListV(Array.from({ length: n }, f));
}

reg(code('randInt('), {
  name: 'randInt(',
  min: 2,
  max: 3,
  eager: (c, args, pos) => {
    const lo = asReal(args[0], pos);
    const hi = asReal(args[1], pos);
    if (!lo.isInteger() || !hi.isInteger()) throw new TIError('DOMAIN', pos);
    const [a, b] = lo.lte(hi) ? [lo, hi] : [hi, lo];
    const span = b.minus(a).plus(1);
    const n = count(args, 2, pos);
    return repeat(n, () => a.plus(span.times(c.rng.next()).floor()));
  },
});

reg(code('randNorm('), {
  name: 'randNorm(',
  min: 2,
  max: 3,
  eager: (c, args, pos) => {
    const mu = asReal(args[0], pos).toNumber();
    const sigma = asReal(args[1], pos).toNumber();
    if (sigma < 0) throw new TIError('DOMAIN', pos);
    const n = count(args, 2, pos);
    return repeat(n, () => {
      const r = c.rng.next();
      return fromNumber(invNormal(r.toNumber(), mu, sigma, new D(1).minus(r).toNumber()));
    });
  },
});

reg(code('randBin('), {
  name: 'randBin(',
  min: 2,
  max: 3,
  eager: (c, args, pos) => {
    const trials = asInt(args[0], 1, 1e9, 'DOMAIN', pos);
    const p = asReal(args[1], pos);
    if (p.isNeg() || p.gt(1)) throw new TIError('DOMAIN', pos);
    const n = count(args, 2, pos);
    return repeat(n, () => {
      let hits = 0;
      for (let i = 0; i < trials; i++) if (c.rng.next().lt(p)) hits++;
      return new D(hits);
    });
  },
});

reg(code('randIntNoRep('), {
  name: 'randIntNoRep(',
  min: 2,
  max: 3,
  eager: (c, args, pos) => {
    const lo = asInt(args[0], -1e9, 1e9, 'DOMAIN', pos);
    const hi = asInt(args[1], -1e9, 1e9, 'DOMAIN', pos);
    const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
    const total = b - a + 1;
    if (total > 999) throw new TIError('DOMAIN', pos);
    const n = args.length > 2 ? asInt(args[2], 1, total, 'DOMAIN', pos) : total;
    const pool = Array.from({ length: total }, (_, i) => a + i);
    // partial Fisher-Yates built on rand, so seeded sequences are reproducible
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor((total - i) * c.rng.next().toNumber());
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return new ListV(pool.slice(0, n).map((x) => new D(x)));
  },
});

/** randM( fills from the last element to the first, like the hardware routine. */
export function randMatrix(c: Ctx, rows: number, cols: number): MatV {
  const data = new Array<Real>(rows * cols);
  for (let i = rows * cols - 1; i >= 0; i--) {
    data[i] = new D(-9).plus(new D(19).times(c.rng.next()).floor());
  }
  return new MatV(rows, cols, data);
}
reg(code('randM('), {
  name: 'randM(',
  min: 2,
  max: 2,
  eager: (c, [r, k], pos) => randMatrix(c, asInt(r, 1, 99, 'DOMAIN', pos), asInt(k, 1, 99, 'DOMAIN', pos)),
});
