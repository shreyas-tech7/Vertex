import { TIError } from '../errors';
import { integrate } from '../calculus/quad';
import { checkRange, div, isNum, mul, sub, type Num } from '../numbers/complex';
import { D, fromNumber, type Real } from '../numbers/decimal';
import { code } from '../tokens/codes';
import type { Node } from '../parser/ast';
import type { Ctx } from './ctx';
import { withBinding } from './fn_lists';
import { reg, type Thunk } from './registry';
import { asReal } from './values';

type F = (x: Real) => Real;

/** Turn an expression thunk plus its bound variable into a real function, with the variable restored afterwards. */
function withFunction<R>(c: Ctx, args: Thunk[], nodes: Node[], pos: number, run: (f: F) => R): R {
  return withBinding(c, nodes[1], pos, (set) => {
    let calls = 0;
    const f: F = (x) => {
      set(x);
      const v = args[0](c);
      if (!isNum(v)) throw new TIError('DATA TYPE', pos);
      if (!('re' in v) || v.im.isZero()) return 're' in v ? v.re : v;
      throw new TIError('NONREAL ANS', pos);
    };
    const counted: F = (x) => {
      if (++calls % 64 === 0) c.checkBreak();
      return f(x);
    };
    return run(counted);
  });
}

reg(code('nDeriv('), {
  name: 'nDeriv(',
  min: 3,
  max: 4,
  lazy: (c, args, nodes, pos) => {
    const at = asReal(args[2](c), pos);
    const eps = args.length > 3 ? asReal(args[3](c), pos) : new D('0.001');
    if (eps.isZero()) throw new TIError('DOMAIN', pos);
    return withFunction(c, args, nodes, pos, (f) => {
      const hi = f(at.plus(eps));
      const lo = f(at.minus(eps));
      return div(sub(hi, lo), mul(new D(2), eps)) as Num;
    });
  },
});

reg(code('fnInt('), {
  name: 'fnInt(',
  min: 4,
  max: 5,
  lazy: (c, args, nodes, pos) => {
    const lo = asReal(args[2](c), pos);
    const hi = asReal(args[3](c), pos);
    const tol = args.length > 4 ? asReal(args[4](c), pos).toNumber() : 1e-5;
    if (!(tol > 0)) throw new TIError('DOMAIN', pos);
    return withFunction(c, args, nodes, pos, (f) => {
      const { value } = integrate((x) => f(fromNumber(x)).toNumber(), lo.toNumber(), hi.toNumber(), {
        relTol: Math.min(tol, 1e-12),
        absTol: 0,
        maxPanels: 300,
      });
      return checkRange(fromNumber(value));
    });
  },
});

/** Brent's bounded minimisation (golden section + parabolic steps). */
export function brentMin(f: (x: number) => number, a: number, b: number, tol: number): number {
  const GOLD = 0.3819660112501051;
  let x = a + GOLD * (b - a);
  let w = x;
  let v = x;
  let fx = f(x);
  let fw = fx;
  let fv = fx;
  let d = 0;
  let e = 0;
  for (let iter = 0; iter < 200; iter++) {
    const xm = 0.5 * (a + b);
    const tol1 = tol * Math.abs(x) + 1e-12;
    const tol2 = 2 * tol1;
    if (Math.abs(x - xm) <= tol2 - 0.5 * (b - a)) break;
    let useGolden = true;
    if (Math.abs(e) > tol1) {
      let r = (x - w) * (fx - fv);
      let q = (x - v) * (fx - fw);
      let p = (x - v) * q - (x - w) * r;
      q = 2 * (q - r);
      if (q > 0) p = -p;
      q = Math.abs(q);
      r = e;
      e = d;
      if (Math.abs(p) < Math.abs(0.5 * q * r) && p > q * (a - x) && p < q * (b - x)) {
        d = p / q;
        const u = x + d;
        if (u - a < tol2 || b - u < tol2) d = xm >= x ? tol1 : -tol1;
        useGolden = false;
      }
    }
    if (useGolden) {
      e = x >= xm ? a - x : b - x;
      d = GOLD * e;
    }
    const u = Math.abs(d) >= tol1 ? x + d : x + (d >= 0 ? tol1 : -tol1);
    const fu = f(u);
    if (fu <= fx) {
      if (u >= x) a = x;
      else b = x;
      v = w;
      fv = fw;
      w = x;
      fw = fx;
      x = u;
      fx = fu;
    } else {
      if (u < x) a = u;
      else b = u;
      if (fu <= fw || w === x) {
        v = w;
        fv = fw;
        w = u;
        fw = fu;
      } else if (fu <= fv || v === x || v === w) {
        v = u;
        fv = fu;
      }
    }
  }
  return x;
}

function extremum(name: string, sign: 1 | -1): void {
  reg(code(name), {
    name,
    min: 4,
    max: 5,
    lazy: (c, args, nodes, pos) => {
      const lo = asReal(args[2](c), pos).toNumber();
      const hi = asReal(args[3](c), pos).toNumber();
      const tol = args.length > 4 ? asReal(args[4](c), pos).toNumber() : 1e-5;
      if (!(lo < hi) || !(tol > 0)) throw new TIError('BOUND', pos);
      return withFunction(c, args, nodes, pos, (f) => {
        const x = brentMin((t) => sign * f(fromNumber(t)).toNumber(), lo, hi, Math.min(tol, 1e-8));
        return checkRange(fromNumber(x));
      });
    },
  });
}
extremum('fMin(', 1);
extremum('fMax(', -1);

/** Brent's root finder on a bracket with a sign change. */
export function brentRoot(f: (x: number) => number, a: number, b: number, fa: number, fb: number): number {
  let c = a;
  let fc = fa;
  let d = b - a;
  let e = d;
  for (let iter = 0; iter < 200; iter++) {
    if ((fb > 0 && fc > 0) || (fb < 0 && fc < 0)) {
      c = a;
      fc = fa;
      d = b - a;
      e = d;
    }
    if (Math.abs(fc) < Math.abs(fb)) {
      a = b;
      b = c;
      c = a;
      fa = fb;
      fb = fc;
      fc = fa;
    }
    const tol1 = 2 * Number.EPSILON * Math.abs(b) + 1e-15;
    const xm = 0.5 * (c - b);
    if (Math.abs(xm) <= tol1 || fb === 0) return b;
    if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
      const s = fb / fa;
      let p: number;
      let q: number;
      if (a === c) {
        p = 2 * xm * s;
        q = 1 - s;
      } else {
        const qq = fa / fc;
        const r = fb / fc;
        p = s * (2 * xm * qq * (qq - r) - (b - a) * (r - 1));
        q = (qq - 1) * (r - 1) * (s - 1);
      }
      if (p > 0) q = -q;
      p = Math.abs(p);
      if (2 * p < Math.min(3 * xm * q - Math.abs(tol1 * q), Math.abs(e * q))) {
        e = d;
        d = p / q;
      } else {
        d = xm;
        e = d;
      }
    } else {
      d = xm;
      e = d;
    }
    a = b;
    fa = fb;
    b += Math.abs(d) > tol1 ? d : xm > 0 ? tol1 : -tol1;
    fb = f(b);
  }
  return b;
}

/** Find a bracket around `guess` by stepping outwards, then refine with Brent. */
export function solveRoot(f: (x: number) => number, guess: number, lo: number, hi: number): number {
  const fg = f(guess);
  if (fg === 0) return guess;
  let step = Math.max(Math.abs(guess) * 0.05, 0.05);
  let left = guess;
  let fl = fg;
  let right = guess;
  let fr = fg;
  for (let i = 0; i < 400; i++) {
    const nl = Math.max(lo, left - step);
    const nr = Math.min(hi, right + step);
    const fnr = nr > right ? f(nr) : fr;
    if (Number.isFinite(fnr) && Math.sign(fnr) !== Math.sign(fg)) {
      return fnr === 0 ? nr : brentRoot(f, right, nr, fr, fnr);
    }
    const fnl = nl < left ? f(nl) : fl;
    if (Number.isFinite(fnl) && Math.sign(fnl) !== Math.sign(fg)) {
      return fnl === 0 ? nl : brentRoot(f, nl, left, fnl, fl);
    }
    left = nl;
    fl = fnl;
    right = nr;
    fr = fnr;
    if (nl <= lo && nr >= hi) break;
    step *= 1.6;
  }
  throw new TIError('NO SIGN CHNG');
}

reg(code('solve('), {
  name: 'solve(',
  min: 3,
  max: 4,
  lazy: (c, args, nodes, pos) => {
    const guess = asReal(args[2](c), pos).toNumber();
    let lo = -1e99;
    let hi = 1e99;
    if (args.length > 3) {
      const b = args[3](c);
      if (!('items' in b) || b.items.length !== 2) throw new TIError('DATA TYPE', pos);
      lo = asReal(b.items[0], pos).toNumber();
      hi = asReal(b.items[1], pos).toNumber();
    }
    if (!(lo < hi)) throw new TIError('BOUND', pos);
    if (guess < lo || guess > hi) throw new TIError('BAD GUESS', pos);
    return withFunction(c, args, nodes, pos, (f) => {
      const g = (x: number): number => {
        try {
          return f(fromNumber(x)).toNumber();
        } catch (e) {
          if (
            e instanceof TIError &&
            (e.tiName === 'DOMAIN' || e.tiName === 'DIVIDE BY 0' || e.tiName === 'NONREAL ANS')
          )
            return NaN;
          throw e;
        }
      };
      if (Number.isNaN(g(guess))) throw new TIError('BAD GUESS', pos);
      const r = solveRoot((x) => g(x), guess, lo, hi);
      return checkRange(fromNumber(r));
    });
  },
});
