import { describe, expect, it } from 'vitest';
import { gk15, integrate } from './quad';

describe('Gauss-Kronrod', () => {
  it('integrates polynomials exactly up to degree 22 on one panel', () => {
    for (let k = 0; k <= 22; k++) {
      const exact = k % 2 === 1 ? 0 : 2 / (k + 1);
      const v = gk15((x) => x ** k, -1, 1).value;
      expect(Math.abs(v - exact)).toBeLessThan(2e-15);
    }
  });
  it('weights sum to the interval length', () => {
    expect(gk15(() => 1, 0, 3).value).toBeCloseTo(3, 14);
  });
  it('adaptive integration of smooth and peaked functions', () => {
    expect(integrate(Math.sin, 0, Math.PI).value).toBeCloseTo(2, 13);
    expect(integrate((x) => Math.exp(-x * x), -8, 8).value).toBeCloseTo(Math.sqrt(Math.PI), 13);
    expect(integrate((x) => 1 / x, 1, 2).value).toBeCloseTo(Math.LN2, 13);
    expect(integrate((x) => 1 / (1 + 25 * x * x), -1, 1).value).toBeCloseTo((2 / 5) * Math.atan(5), 13);
    expect(integrate((x) => x ** 2, 3, 0).value).toBeCloseTo(-9, 13);
  });
  it('handles an integrable endpoint singularity', () => {
    expect(integrate((x) => 1 / Math.sqrt(x), 1e-300, 1, { relTol: 1e-10 }).value).toBeCloseTo(2, 8);
  });
});
