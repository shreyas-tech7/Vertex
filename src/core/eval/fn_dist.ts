import { TIError } from '../errors';
import { D, ONE, fromNumber, type Real } from '../numbers/decimal';
import {
  between,
  binomCdf,
  binomPmf,
  chi2Pdf,
  chi2Tails,
  fPdf,
  fTails,
  geometCdf,
  geometPmf,
  invNormal,
  invT,
  normalPdf,
  normalTails,
  poissonCdf,
  poissonPmf,
  studentTails,
  tPdf,
} from '../stats/distributions';
import { code } from '../tokens/codes';
import { reg } from './registry';
import { ListV, asReal, type Value } from './values';

const num = (v: Value, pos: number): number => asReal(v, pos).toNumber();
const out = (x: number, pos: number): Real => {
  if (!Number.isFinite(x)) throw new TIError('DOMAIN', pos);
  return fromNumber(x);
};

/** Evaluate f at a scalar or over every element of a list. */
function overList(v: Value, f: (x: Real) => Real, pos: number): Value {
  if (v instanceof ListV) return new ListV(v.items.map((x) => f(asReal(x, pos))));
  return f(asReal(v, pos));
}

function positive(x: number, pos: number): number {
  if (!(x > 0)) throw new TIError('DOMAIN', pos);
  return x;
}
function probability(x: number, pos: number): number {
  if (!(x >= 0 && x <= 1)) throw new TIError('DOMAIN', pos);
  return x;
}
function integerArg(x: Real, pos: number): number {
  if (!x.isInteger()) throw new TIError('DOMAIN', pos);
  return x.toNumber();
}

// ---------- normal ----------
reg(code('normalpdf('), {
  name: 'normalpdf(',
  min: 1,
  max: 3,
  eager: (_c, args, pos) => {
    const mu = args.length > 1 ? num(args[1], pos) : 0;
    const sigma = positive(args.length > 2 ? num(args[2], pos) : 1, pos);
    return overList(args[0], (x) => out(normalPdf(x.toNumber(), mu, sigma), pos), pos);
  },
});

function cdfOver(
  args: Value[],
  muIdx: number,
  tails: (args: Value[], pos: number) => ReturnType<typeof normalTails>,
  pos: number,
): Value {
  void muIdx;
  const d = tails(args, pos);
  const lo = args[0];
  const hi = args[1];
  const one = (a: Real, b: Real): Real => {
    if (a.gt(b)) throw new TIError('DOMAIN', pos);
    return out(between(d, a.toNumber(), b.toNumber()), pos);
  };
  if (lo instanceof ListV || hi instanceof ListV) {
    const l = lo instanceof ListV ? lo : undefined;
    const h = hi instanceof ListV ? hi : undefined;
    const n = (l ?? h)?.length ?? 0;
    if (l && h && l.length !== h.length) throw new TIError('DIM MISMATCH', pos);
    return new ListV(
      Array.from({ length: n }, (_, i) =>
        one(asReal(l ? l.items[i] : lo, pos), asReal(h ? h.items[i] : hi, pos)),
      ),
    );
  }
  return one(asReal(lo, pos), asReal(hi, pos));
}

reg(code('normalcdf('), {
  name: 'normalcdf(',
  min: 2,
  max: 4,
  eager: (_c, args, pos) =>
    cdfOver(
      args,
      2,
      (a, p) => normalTails(a.length > 2 ? num(a[2], p) : 0, positive(a.length > 3 ? num(a[3], p) : 1, p)),
      pos,
    ),
});

reg(code('invNorm('), {
  name: 'invNorm(',
  min: 1,
  max: 3,
  eager: (_c, args, pos) => {
    const mu = args.length > 1 ? num(args[1], pos) : 0;
    const sigma = positive(args.length > 2 ? num(args[2], pos) : 1, pos);
    return overList(
      args[0],
      (a) => {
        if (a.lte(0) || a.gte(1)) throw new TIError('DOMAIN', pos);
        return out(invNormal(a.toNumber(), mu, sigma, ONE.minus(a).toNumber()), pos);
      },
      pos,
    );
  },
});

// ---------- Student t ----------
reg(code('tpdf('), {
  name: 'tpdf(',
  min: 2,
  max: 2,
  eager: (_c, args, pos) => {
    const df = positive(num(args[1], pos), pos);
    return overList(args[0], (x) => out(tPdf(x.toNumber(), df), pos), pos);
  },
});
reg(code('tcdf('), {
  name: 'tcdf(',
  min: 3,
  max: 3,
  eager: (_c, args, pos) => cdfOver(args, 2, (a, p) => studentTails(positive(num(a[2], p), p)), pos),
});
reg(code('invT('), {
  name: 'invT(',
  min: 2,
  max: 2,
  eager: (_c, args, pos) => {
    const df = positive(num(args[1], pos), pos);
    return overList(
      args[0],
      (a) => {
        if (a.lte(0) || a.gte(1)) throw new TIError('DOMAIN', pos);
        return out(invT(a.toNumber(), df, ONE.minus(a).toNumber()), pos);
      },
      pos,
    );
  },
});

// ---------- chi-square and F ----------
reg(code('χ²pdf('), {
  name: 'χ²pdf(',
  min: 2,
  max: 2,
  eager: (_c, args, pos) => {
    const df = positive(num(args[1], pos), pos);
    return overList(args[0], (x) => out(chi2Pdf(x.toNumber(), df), pos), pos);
  },
});
reg(code('χ²cdf('), {
  name: 'χ²cdf(',
  min: 3,
  max: 3,
  eager: (_c, args, pos) => cdfOver(args, 2, (a, p) => chi2Tails(positive(num(a[2], p), p)), pos),
});
reg(code('Fpdf('), {
  name: 'Fpdf(',
  min: 3,
  max: 3,
  eager: (_c, args, pos) => {
    const d1 = positive(num(args[1], pos), pos);
    const d2 = positive(num(args[2], pos), pos);
    return overList(args[0], (x) => out(fPdf(x.toNumber(), d1, d2), pos), pos);
  },
});
reg(code('Fcdf('), {
  name: 'Fcdf(',
  min: 4,
  max: 4,
  eager: (_c, args, pos) =>
    cdfOver(args, 2, (a, p) => fTails(positive(num(a[2], p), p), positive(num(a[3], p), p)), pos),
});

// ---------- discrete ----------
function binomArgs(args: Value[], pos: number): { n: number; p: number } {
  const n = integerArg(asReal(args[0], pos), pos);
  if (n < 1) throw new TIError('DOMAIN', pos);
  return { n, p: probability(num(args[1], pos), pos) };
}

reg(code('binompdf('), {
  name: 'binompdf(',
  min: 2,
  max: 3,
  eager: (_c, args, pos) => {
    const { n, p } = binomArgs(args, pos);
    const f = (x: Real): Real => {
      const k = integerArg(x, pos);
      if (k < 0 || k > n) throw new TIError('DOMAIN', pos);
      return out(binomPmf(n, p, k), pos);
    };
    if (args.length === 2) return new ListV(Array.from({ length: n + 1 }, (_, k) => f(new D(k))));
    return overList(args[2], f, pos);
  },
});
reg(code('binomcdf('), {
  name: 'binomcdf(',
  min: 2,
  max: 3,
  eager: (_c, args, pos) => {
    const { n, p } = binomArgs(args, pos);
    const f = (x: Real): Real => {
      const k = integerArg(x, pos);
      if (k < 0 || k > n) throw new TIError('DOMAIN', pos);
      return out(binomCdf(n, p, k), pos);
    };
    if (args.length === 2) return new ListV(Array.from({ length: n + 1 }, (_, k) => f(new D(k))));
    return overList(args[2], f, pos);
  },
});

reg(code('poissonpdf('), {
  name: 'poissonpdf(',
  min: 2,
  max: 2,
  eager: (_c, args, pos) => {
    const lambda = positive(num(args[0], pos), pos);
    return overList(
      args[1],
      (x) => {
        const k = integerArg(x, pos);
        if (k < 0) throw new TIError('DOMAIN', pos);
        return out(poissonPmf(lambda, k), pos);
      },
      pos,
    );
  },
});
reg(code('poissoncdf('), {
  name: 'poissoncdf(',
  min: 2,
  max: 2,
  eager: (_c, args, pos) => {
    const lambda = positive(num(args[0], pos), pos);
    return overList(
      args[1],
      (x) => {
        const k = integerArg(x, pos);
        if (k < 0) throw new TIError('DOMAIN', pos);
        return out(poissonCdf(lambda, k), pos);
      },
      pos,
    );
  },
});

reg(code('geometpdf('), {
  name: 'geometpdf(',
  min: 2,
  max: 2,
  eager: (_c, args, pos) => {
    const p = probability(num(args[0], pos), pos);
    if (p === 0) throw new TIError('DOMAIN', pos);
    return overList(
      args[1],
      (x) => {
        const k = integerArg(x, pos);
        if (k < 1) throw new TIError('DOMAIN', pos);
        return out(geometPmf(p, k), pos);
      },
      pos,
    );
  },
});
reg(code('geometcdf('), {
  name: 'geometcdf(',
  min: 2,
  max: 2,
  eager: (_c, args, pos) => {
    const p = probability(num(args[0], pos), pos);
    if (p === 0) throw new TIError('DOMAIN', pos);
    return overList(
      args[1],
      (x) => {
        const k = integerArg(x, pos);
        if (k < 1) throw new TIError('DOMAIN', pos);
        return out(geometCdf(p, k), pos);
      },
      pos,
    );
  },
});
