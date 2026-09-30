import { describe, expect, it } from 'vitest';
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
  normalTails,
  poissonCdf,
  poissonPmf,
  studentTails,
  tPdf,
} from './distributions';
import { REF } from './reference.data';

/** Relative error check: tight enough for 10 displayed digits with lots of margin. */
function close(actual: number, expected: number, rel = 2e-12): void {
  if (expected === 0) {
    expect(Math.abs(actual)).toBeLessThan(1e-300);
    return;
  }
  const err = Math.abs(actual - expected) / Math.abs(expected);
  if (err > rel) throw new Error(`expected ${expected}, got ${actual} (rel err ${err.toExponential(2)})`);
}

describe('normal distribution', () => {
  it('tails match mpmath', () => {
    const d = normalTails(0, 1);
    for (const [z, lo, up] of REF.normal) {
      close(d.lower(z), lo);
      close(d.upper(z), up);
    }
  });
  it('invNorm matches mpmath, including deep tails', () => {
    for (const [p, x] of REF.invnorm) close(invNormal(p), x, 1e-13);
  });
  it('normalcdf(5,1E99) keeps its tail digits', () => {
    close(between(normalTails(0, 1), 5, 1e99), 2.866515718791939e-7);
    close(between(normalTails(0, 1), -1, 1), 0.6826894921370859);
    close(between(normalTails(100, 15), 85, 115), 0.6826894921370859);
  });
});

describe('Student t', () => {
  it('cdf and pdf match mpmath', () => {
    for (const [t, df, lo, up, pdf] of REF.t) {
      const d = studentTails(df);
      close(d.lower(t), lo);
      close(d.upper(t), up);
      close(tPdf(t, df), pdf, 1e-11);
    }
  });
  it('invT round-trips mpmath values', () => {
    for (const [p, df, t] of REF.invt) close(invT(p, df), t, 1e-11);
  });
  it('one-tail areas stay accurate for large df (quadrature path)', () => {
    for (const [t, df, small] of REF.tsmall) close(studentTails(df).lower(-t), small, 1e-12);
  });
  it('tcdf with a huge df approaches the normal', () => {
    close(between(studentTails(1e9), -1e99, 1.96), 0.9750021048517795, 1e-8);
  });
});

describe('chi-square and F', () => {
  it('chi-square matches mpmath', () => {
    for (const [x, df, lo, up, pdf] of REF.chi2) {
      const d = chi2Tails(df);
      close(d.lower(x), lo);
      close(d.upper(x), up);
      close(chi2Pdf(x, df), pdf, 1e-11);
    }
  });
  it('F matches mpmath', () => {
    for (const [x, d1, d2, lo, up, pdf] of REF.f) {
      const d = fTails(d1, d2);
      close(d.lower(x), lo);
      close(d.upper(x), up);
      close(fPdf(x, d1, d2), pdf, 1e-11);
    }
  });
});

describe('discrete distributions', () => {
  it('binomial matches mpmath', () => {
    for (const [n, p, k, pmf, cdf] of REF.binom) {
      close(binomPmf(n, p, k), pmf, 1e-11);
      close(binomCdf(n, p, k), cdf, 1e-11);
    }
  });
  it('poisson matches mpmath', () => {
    for (const [lam, k, pmf, cdf] of REF.poisson) {
      close(poissonPmf(lam, k), pmf, 1e-11);
      close(poissonCdf(lam, k), cdf, 1e-11);
    }
  });
  it('geometric matches mpmath', () => {
    for (const [p, k, pmf, cdf] of REF.geomet) {
      close(geometPmf(p, k), pmf);
      close(geometCdf(p, k), cdf);
    }
  });
});
