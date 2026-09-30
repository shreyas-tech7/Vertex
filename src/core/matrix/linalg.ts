import { err } from '../errors';
import { D, ONE, ZERO, type Real } from '../numbers/decimal';

/**
 * Exact linear algebra. Matrix entries are decimals, so each entry is converted to an exact fraction (BigInt),
 * eliminated exactly, and rounded to 14 digits once at the end. There is no round-off noise: a value that is
 * mathematically zero is zero.
 */
interface Q {
  n: bigint;
  d: bigint;
}

const gcd = (a: bigint, b: bigint): bigint => {
  a = a < 0n ? -a : a;
  b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a;
};
const q = (n: bigint, d: bigint = 1n): Q => {
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return g > 1n ? { n: n / g, d: d / g } : { n, d };
};
const qSub = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
const qMul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
const qDiv = (a: Q, b: Q): Q => q(a.n * b.d, a.d * b.n);
const qZero = (a: Q): boolean => a.n === 0n;
const qAbsCmp = (a: Q, b: Q): number => {
  const l = (a.n < 0n ? -a.n : a.n) * b.d;
  const r = (b.n < 0n ? -b.n : b.n) * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
};

export function toQ(x: Real): Q {
  const s = x.toFixed();
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  const dot = body.indexOf('.');
  const digits = dot < 0 ? body : body.slice(0, dot) + body.slice(dot + 1);
  const scale = dot < 0 ? 0 : body.length - dot - 1;
  const n = BigInt(digits);
  return q(neg ? -n : n, 10n ** BigInt(scale));
}
export function fromQ(f: Q): Real {
  if (f.n === 0n) return ZERO;
  return new D(f.n.toString()).div(f.d.toString());
}

type QM = Q[][];
const toQM = (rows: Real[][]): QM => rows.map((r) => r.map(toQ));
const fromQM = (m: QM): Real[][] => m.map((r) => r.map(fromQ));

export function det(rows: Real[][]): Real {
  const n = rows.length;
  if (n === 0 || rows.some((r) => r.length !== n)) throw err('INVALID DIM');
  const m = toQM(rows);
  let sign = 1n;
  let acc = q(1n);
  for (let c = 0; c < n; c++) {
    let p = -1;
    for (let r = c; r < n; r++)
      if (!qZero(m[r][c])) {
        p = r;
        break;
      }
    if (p < 0) return ZERO;
    if (p !== c) {
      [m[p], m[c]] = [m[c], m[p]];
      sign = -sign;
    }
    acc = qMul(acc, m[c][c]);
    for (let r = c + 1; r < n; r++) {
      if (qZero(m[r][c])) continue;
      const f = qDiv(m[r][c], m[c][c]);
      for (let k = c; k < n; k++) m[r][k] = qSub(m[r][k], qMul(f, m[c][k]));
    }
  }
  return fromQ(sign < 0n ? q(-acc.n, acc.d) : acc);
}

export function inverse(rows: Real[][]): Real[][] {
  const n = rows.length;
  if (n === 0 || rows.some((r) => r.length !== n)) throw err('INVALID DIM');
  const m = toQM(rows);
  const inv: QM = m.map((_, i) => m.map((__, j) => q(i === j ? 1n : 0n)));
  for (let c = 0; c < n; c++) {
    let p = -1;
    for (let r = c; r < n; r++)
      if (!qZero(m[r][c])) {
        p = r;
        break;
      }
    if (p < 0) throw err('SINGULAR MAT');
    if (p !== c) {
      [m[p], m[c]] = [m[c], m[p]];
      [inv[p], inv[c]] = [inv[c], inv[p]];
    }
    const piv = m[c][c];
    for (let k = 0; k < n; k++) {
      m[c][k] = qDiv(m[c][k], piv);
      inv[c][k] = qDiv(inv[c][k], piv);
    }
    for (let r = 0; r < n; r++) {
      if (r === c || qZero(m[r][c])) continue;
      const f = m[r][c];
      for (let k = 0; k < n; k++) {
        m[r][k] = qSub(m[r][k], qMul(f, m[c][k]));
        inv[r][k] = qSub(inv[r][k], qMul(f, inv[c][k]));
      }
    }
  }
  return fromQM(inv);
}

/** Row echelon form (ref) or reduced row echelon form (rref) with partial pivoting and unit pivots. */
export function echelon(rows: Real[][], reduced: boolean): Real[][] {
  const m = toQM(rows);
  const nr = m.length;
  const nc = nr ? m[0].length : 0;
  let r = 0;
  for (let c = 0; c < nc && r < nr; c++) {
    let p = -1;
    for (let i = r; i < nr; i++) if (!qZero(m[i][c]) && (p < 0 || qAbsCmp(m[i][c], m[p][c]) > 0)) p = i;
    if (p < 0) continue;
    [m[p], m[r]] = [m[r], m[p]];
    const piv = m[r][c];
    for (let k = c; k < nc; k++) m[r][k] = qDiv(m[r][k], piv);
    for (let i = reduced ? 0 : r + 1; i < nr; i++) {
      if (i === r || qZero(m[i][c])) continue;
      const f = m[i][c];
      for (let k = c; k < nc; k++) m[i][k] = qSub(m[i][k], qMul(f, m[r][k]));
    }
    r++;
  }
  return fromQM(m);
}

export function transpose(rows: Real[][]): Real[][] {
  const nr = rows.length;
  const nc = nr ? rows[0].length : 0;
  return Array.from({ length: nc }, (_, j) => Array.from({ length: nr }, (__, i) => rows[i][j]));
}

export function identity(n: number): Real[][] {
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (__, j) => (i === j ? ONE : ZERO)));
}
