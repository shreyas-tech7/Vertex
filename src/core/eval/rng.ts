import { D, type Real } from '../numbers/decimal';

const MOD1 = 2147483563;
const MOD2 = 2147483399;
const MULT1 = 40014;
const MULT2 = 40692;

/**
 * L'Ecuyer's combined generator, as used by the calculator (spec §7 "Random numbers").
 * Seeding: abs(int(n)); 0 gives (12345, 67890); otherwise seed1 = 40014·n mod 2147483563, seed2 = n mod 2147483399.
 */
export class Rng {
  seed1 = 12345;
  seed2 = 67890;

  constructor(seed = 0) {
    this.seed(seed);
  }

  seed(n: number | bigint | Real = 0): void {
    let v: bigint;
    if (typeof n === 'bigint') v = n < 0n ? -n : n;
    else if (typeof n === 'number') v = BigInt(Math.trunc(Math.abs(n)));
    else v = BigInt(n.abs().trunc().toFixed(0));
    if (v === 0n) {
      this.seed1 = 12345;
      this.seed2 = 67890;
    } else {
      this.seed1 = Number((BigInt(MULT1) * v) % BigInt(MOD1));
      this.seed2 = Number(v % BigInt(MOD2));
    }
  }

  /** Advance the generator; returns the raw difference (seed1 - seed2). */
  private step(): number {
    this.seed1 = (this.seed1 * MULT1) % MOD1;
    this.seed2 = (this.seed2 * MULT2) % MOD2;
    return this.seed1 - this.seed2;
  }

  /** The next uniform value in (0,1) as a 14-digit real. */
  next(): Real {
    const diff = this.step();
    const r = new D(diff).div(MOD1);
    return diff < 0 ? r.plus(1) : r;
  }

  /** The next uniform value as a double (for bulk sampling where 14-digit exactness is irrelevant). */
  nextDouble(): number {
    const diff = this.step();
    return (diff < 0 ? diff + MOD1 : diff) / MOD1;
  }

  /** randInt(lo, hi): lo + floor((hi - lo + 1)·rand), bounds swapped if needed. */
  randInt(lo: number, hi: number): number {
    if (lo > hi) [lo, hi] = [hi, lo];
    return lo + Math.floor((hi - lo + 1) * this.nextDouble());
  }

  getState(): { s1: number; s2: number } {
    return { s1: this.seed1, s2: this.seed2 };
  }
  setState(s: { s1: number; s2: number }): void {
    this.seed1 = s.s1;
    this.seed2 = s.s2;
  }
}
