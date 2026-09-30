/**
 * Special functions in double precision, accurate to about 1e-15 relative error across the whole domain
 * (series and continued fractions; Loader's saddle-point formulas for the prefactors, so huge parameters
 * do not lose digits). Everything here works on JS numbers; callers round to 14 digits.
 */

const EPS = 2.220446049250313e-16;
const FPMIN = 1e-300;
export const LN_SQRT_2PI = 0.9189385332046728;
const LN_2PI = 1.8378770664093456;

/** Stirling series tail for ln Γ(x), valid for x >= 16. */
function stirlingTail(x: number): number {
  const x2 = x * x;
  return (1 / 12 - (1 / 360 - (1 / 1260 - (1 / 1680 - 1 / (1188 * x2)) / x2) / x2) / x2) / x;
}

/** ln Γ(x) for x > 0. */
export function lgamma(x: number): number {
  if (x < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * x))) - lgamma(1 - x);
  if (x >= 16) return (x - 0.5) * Math.log(x) - x + LN_SQRT_2PI + stirlingTail(x);
  let prod = 1;
  let y = x;
  while (y < 16) {
    prod *= y;
    y += 1;
  }
  return (y - 0.5) * Math.log(y) - y + LN_SQRT_2PI + stirlingTail(y) - Math.log(prod);
}

/** ln Γ(x+1) - ((x+0.5) ln x - x + ln√(2π)); small and smooth, the heart of Loader's algorithm. */
export function stirlerr(n: number): number {
  if (n >= 16) {
    const n2 = n * n;
    if (n > 500) return (1 / 12 - 1 / (360 * n2)) / n;
    return (1 / 12 - (1 / 360 - (1 / 1260 - (1 / 1680 - 1 / (1188 * n2)) / n2) / n2) / n2) / n;
  }
  return lgamma(n + 1) - (n + 0.5) * Math.log(n) + n - LN_SQRT_2PI;
}

/** x ln(x/np) + np - x, computed without cancellation near x = np. */
export function bd0(x: number, np: number): number {
  if (Math.abs(x - np) < 0.1 * (x + np)) {
    let v = (x - np) / (x + np);
    let s = (x - np) * v;
    if (Math.abs(s) < Number.MIN_VALUE) return s;
    let ej = 2 * x * v;
    v *= v;
    for (let j = 1; j < 1000; j++) {
      ej *= v;
      const s1 = s + ej / (2 * j + 1);
      if (s1 === s) return s1;
      s = s1;
    }
  }
  return x * Math.log(x / np) + np - x;
}

/** Binomial pmf for real arguments: C(n,x) p^x q^(n-x). `m` is n - x when the caller knows it exactly. */
export function dbinomRaw(x: number, n: number, p: number, q: number, m: number = n - x): number {
  if (p === 0) return x === 0 ? 1 : 0;
  if (q === 0) return x === n ? 1 : 0;
  if (x < 0 || m < 0) return 0;
  if (x === 0) {
    if (n === 0) return 1;
    const lc = p < 0.1 ? -bd0(n, n * q) - n * p : n * Math.log(q);
    return Math.exp(lc);
  }
  if (m === 0) {
    const lc = q < 0.1 ? -bd0(n, n * p) - n * q : n * Math.log(p);
    return Math.exp(lc);
  }
  const lc = stirlerr(n) - stirlerr(x) - stirlerr(m) - bd0(x, n * p) - bd0(m, n * q);
  const lf = LN_2PI + Math.log(x) + Math.log(m) - Math.log(n);
  return Math.exp(lc - 0.5 * lf);
}

/** Poisson pmf for real x: λ^x e^-λ / Γ(x+1). */
export function dpoisRaw(x: number, lambda: number): number {
  if (lambda === 0) return x === 0 ? 1 : 0;
  if (!Number.isFinite(lambda)) return 0;
  if (x < 0) return 0;
  if (x <= lambda * Number.MIN_VALUE) return Math.exp(-lambda);
  if (lambda < x * Number.MIN_VALUE) {
    if (!Number.isFinite(x)) return 0;
    return Math.exp(-lambda + x * Math.log(lambda) - lgamma(x + 1));
  }
  return Math.exp(-stirlerr(x) - bd0(x, lambda)) / Math.sqrt(2 * Math.PI * x);
}

// ---------- incomplete gamma ----------

/** [P(a,x), Q(a,x)]: regularized lower and upper incomplete gamma, each accurate in its own tail. */
export function gammaPQ(a: number, x: number): [number, number] {
  if (x <= 0) return [0, 1];
  if (x === Infinity) return [1, 0];
  const pre = dpoisRaw(a, x); // x^a e^-x / Γ(a+1)
  if (x < a + 1) {
    let sum = 1;
    let term = 1;
    for (let n = 1; n < 100000; n++) {
      term *= x / (a + n);
      sum += term;
      if (term < sum * EPS * 0.25) break;
    }
    const p = Math.min(1, pre * sum);
    return [p, 1 - p];
  }
  // Lentz continued fraction for Q
  let b = x + 1 - a;
  let c = 1 / FPMIN;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = b + an / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  const q = Math.min(1, a * pre * h);
  return [1 - q, q];
}

// ---------- error function and the normal distribution ----------

/** erfc(x) accurate in both tails. */
export function erfc(x: number): number {
  if (Number.isNaN(x)) return NaN;
  if (x === Infinity) return 0;
  if (x === -Infinity) return 2;
  if (x >= 0) return gammaPQ(0.5, x * x)[1];
  return 2 - gammaPQ(0.5, x * x)[1];
}
export function erf(x: number): number {
  if (x >= 0) return gammaPQ(0.5, x * x)[0];
  return -gammaPQ(0.5, x * x)[0];
}

/** Standard normal: lower tail Φ(z) and upper tail 1-Φ(z), each with full relative accuracy. */
export function normLower(z: number): number {
  if (z === Infinity) return 1;
  if (z === -Infinity) return 0;
  return z < 0 ? 0.5 * gammaPQ(0.5, (z * z) / 2)[1] : 1 - 0.5 * gammaPQ(0.5, (z * z) / 2)[1];
}
export const normUpper = (z: number): number => normLower(-z);
export const normPdfStd = (z: number): number => Math.exp(-0.5 * z * z - LN_SQRT_2PI);

/**
 * Inverse standard normal CDF (Acklam's rational approximation refined by Halley steps). `q` is 1 - p; pass it
 * when it is known more exactly than 1 - p in binary (for example p = .999999 typed as a decimal).
 */
export function invNormStd(p: number, q: number = 1 - p): number {
  if (!(p > 0 && q > 0)) {
    if (p === 0) return -Infinity;
    if (q === 0) return Infinity;
    return NaN;
  }
  if (p > 0.5) return -invNormStd(q, p);
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1,
    2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968,
    2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const plow = 0.02425;
  let x: number;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    x =
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p > 1 - plow) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x =
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else {
    const q = p - 0.5;
    const r = q * q;
    x =
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  for (let i = 0; i < 3; i++) {
    // Halley step on f(x) = Φ(x) - p (p <= .5 here, so the lower tail is the accurate one)
    const e = normLower(x) - p;
    const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
    const dx = u / (1 + (x * u) / 2);
    x -= dx;
    if (Math.abs(dx) < 1e-16 * Math.max(1, Math.abs(x))) break;
  }
  return x;
}

// ---------- incomplete beta ----------

function betaCf(a: number, b: number, x: number): number {
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  const maxIt = 20000 + Math.floor(20 * Math.sqrt(Math.max(a, b)));
  for (let m = 1; m <= maxIt; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/**
 * Regularized incomplete beta [I_x(a,b), 1 - I_x(a,b)] where the caller supplies y = 1 - x exactly
 * (so neither tail suffers cancellation).
 */
export function betaIBoth(x: number, y: number, a: number, b: number): [number, number] {
  if (x <= 0) return [0, 1];
  if (y <= 0) return [1, 0];
  const n = a + b;
  if (x < (a + 1) / (n + 2)) {
    const pre = dbinomRaw(a, n, x, y, b) * (b / n);
    const lower = Math.min(1, pre * betaCf(a, b, x));
    return [lower, 1 - lower];
  }
  const pre = dbinomRaw(b, n, y, x, a) * (a / n);
  const upper = Math.min(1, pre * betaCf(b, a, y));
  return [1 - upper, upper];
}
