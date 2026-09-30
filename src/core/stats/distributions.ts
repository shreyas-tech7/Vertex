import { integrate } from '../calculus/quad';
import {
  LN_SQRT_2PI,
  betaIBoth,
  dbinomRaw,
  dpoisRaw,
  gammaPQ,
  invNormStd,
  lgamma,
  normLower,
  normPdfStd,
  normUpper,
} from './special';

/** A continuous distribution expressed through both of its tails, so differences stay accurate. */
export interface Tails {
  lower(x: number): number;
  upper(x: number): number;
}

/** P(lo < X < hi), computed from whichever tail is small. */
export function between(d: Tails, lo: number, hi: number): number {
  const loU = lo === -Infinity ? 1 : d.upper(lo);
  if (loU < 0.5) return loU - (hi === Infinity ? 0 : d.upper(hi));
  const hiL = hi === Infinity ? 1 : d.lower(hi);
  return hiL - (lo === -Infinity ? 0 : d.lower(lo));
}

// ---------- normal ----------
export function normalTails(mu: number, sigma: number): Tails {
  return {
    lower: (x) => normLower((x - mu) / sigma),
    upper: (x) => normUpper((x - mu) / sigma),
  };
}
export const normalPdf = (x: number, mu = 0, sigma = 1): number => normPdfStd((x - mu) / sigma) / sigma;
export const invNormal = (p: number, mu = 0, sigma = 1, q: number = 1 - p): number =>
  mu + sigma * invNormStd(p, q);

// ---------- Student t ----------
/** Above this many degrees of freedom the incomplete-beta continued fraction loses digits; integrate the pdf. */
const T_QUAD_DF = 20000;

function tTails(df: number): Tails {
  /** Mass of one tail beyond |t|: P(T <= -|t|). */
  const small = (t: number): number => {
    t = Math.abs(t);
    if (df >= T_QUAD_DF) {
      const pdf = (s: number): number => tPdf(s, df);
      if (t <= 1.5) return 0.5 - integrate(pdf, 0, t, { relTol: 1e-15 }).value;
      const len = 45 / t;
      const breaks: number[] = [];
      for (let k = 1; k < 45; k += 3) breaks.push(t + k / t);
      return integrate(pdf, t, t + len, { relTol: 1e-14, breaks }).value;
    }
    const t2 = t * t;
    const denom = df + t2;
    return betaIBoth(df / denom, t2 / denom, df / 2, 0.5)[0] / 2;
  };
  return {
    lower: (t) => {
      if (t === 0) return 0.5;
      if (t === -Infinity) return 0;
      if (t === Infinity) return 1;
      return t < 0 ? small(t) : 1 - small(t);
    },
    upper: (t) => {
      if (t === 0) return 0.5;
      if (t === Infinity) return 0;
      if (t === -Infinity) return 1;
      return t > 0 ? small(t) : 1 - small(t);
    },
  };
}
export const studentTails = tTails;

function lgammaHalfRatio(nu: number): number {
  // ln Γ((ν+1)/2) - ln Γ(ν/2) without cancellation for large ν
  if (nu < 40) return lgamma((nu + 1) / 2) - lgamma(nu / 2);
  const x0 = nu / 2;
  const x1 = x0 + 0.5;
  const tail = (x: number): number => {
    const x2 = x * x;
    return (1 / 12 - (1 / 360 - (1 / 1260 - (1 / 1680 - 1 / (1188 * x2)) / x2) / x2) / x2) / x;
  };
  return x0 * Math.log1p(1 / nu) + 0.5 * Math.log(x0) - 0.5 + tail(x1) - tail(x0);
}

export function tPdf(t: number, df: number): number {
  return Math.exp(
    lgammaHalfRatio(df) - 0.5 * Math.log(df * Math.PI) - ((df + 1) / 2) * Math.log1p((t * t) / df),
  );
}

/** Inverse Student-t CDF (left-tail area p; q = 1 - p when known more exactly). */
export function invT(p: number, df: number, q: number = 1 - p): number {
  if (!(p > 0 && q > 0)) return p === 0 ? -Infinity : q === 0 ? Infinity : NaN;
  if (p === 0.5) return 0;
  const r = Math.min(p, q);
  if (df === 1) {
    const t = 1 / Math.tan(Math.PI * r);
    return p < 0.5 ? -t : t;
  }
  if (df === 2) {
    const t = (1 - 2 * r) * Math.sqrt(2 / (4 * r * (1 - r)));
    return p < 0.5 ? -t : t;
  }
  const d = tTails(df);
  // start from a Cornish-Fisher expansion of the normal quantile
  const z = -invNormStd(r);
  let t = z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df * df);
  if (!Number.isFinite(t) || t <= 0) t = Math.max(z, 1e-3);
  for (let i = 0; i < 200; i++) {
    const up = d.upper(t);
    const pdf = tPdf(t, df);
    if (pdf === 0 || up === 0) break;
    // Newton on ln(upper): g = ln(up) - ln(r), g' = -pdf/up
    let step = Math.log(up / r) * (up / pdf);
    if (Math.abs(step) > 0.5 * t + 1) step = Math.sign(step) * (0.5 * t + 1);
    const nt = t + step;
    t = nt > 0 ? nt : t / 2;
    if (Math.abs(step) < 1e-15 * Math.max(1, t)) break;
  }
  return p < 0.5 ? -t : t;
}

// ---------- chi-square ----------
export function chi2Tails(df: number): Tails {
  return {
    lower: (x) => (x <= 0 ? 0 : x === Infinity ? 1 : gammaPQ(df / 2, x / 2)[0]),
    upper: (x) => (x <= 0 ? 1 : x === Infinity ? 0 : gammaPQ(df / 2, x / 2)[1]),
  };
}
export function chi2Pdf(x: number, df: number): number {
  if (x < 0) return 0;
  const a = df / 2;
  if (x === 0) return df < 2 ? Infinity : df === 2 ? 0.5 : 0;
  return (0.5 * dpoisRaw(a, x / 2) * a) / (x / 2);
}

// ---------- F ----------
export function fTails(d1: number, d2: number): Tails {
  const parts = (x: number): [number, number] => {
    const den = d1 * x + d2;
    return betaIBoth((d1 * x) / den, d2 / den, d1 / 2, d2 / 2);
  };
  return {
    lower: (x) => (x <= 0 ? 0 : x === Infinity ? 1 : parts(x)[0]),
    upper: (x) => (x <= 0 ? 1 : x === Infinity ? 0 : parts(x)[1]),
  };
}
export function fPdf(x: number, d1: number, d2: number): number {
  if (x < 0) return 0;
  const a = d1 / 2;
  const b = d2 / 2;
  if (x === 0) return d1 < 2 ? Infinity : d1 === 2 ? 1 : 0;
  const den = d1 * x + d2;
  return (dbinomRaw(a, a + b, (d1 * x) / den, d2 / den) * ((a * b) / (a + b))) / x;
}

// ---------- discrete ----------
export const binomPmf = (n: number, p: number, k: number): number =>
  k < 0 || k > n ? 0 : dbinomRaw(k, n, p, 1 - p);
export function binomCdf(n: number, p: number, k: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  return betaIBoth(1 - p, p, n - k, k + 1)[0];
}
export const poissonPmf = (lambda: number, k: number): number => (k < 0 ? 0 : dpoisRaw(k, lambda));
export const poissonCdf = (lambda: number, k: number): number => (k < 0 ? 0 : gammaPQ(k + 1, lambda)[1]);
export const geometPmf = (p: number, k: number): number =>
  k < 1 ? 0 : p === 1 ? (k === 1 ? 1 : 0) : p * Math.exp((k - 1) * Math.log1p(-p));
export const geometCdf = (p: number, k: number): number =>
  k < 1 ? 0 : p === 1 ? 1 : -Math.expm1(k * Math.log1p(-p));

export { LN_SQRT_2PI };
