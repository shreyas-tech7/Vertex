/**
 * Adaptive Gauss-Kronrod (G7 / K15) quadrature on doubles, following the QUADPACK qk15 / qag scheme.
 * Shared by fnInt( and by the statistics code for distributions with huge parameters.
 */

// Kronrod 15-point nodes / weights and the embedded Gauss 7-point weights (positive half; last node is 0).
const XGK = [
  0.9914553711208126, 0.9491079123427585, 0.8648644233597691, 0.7415311855993945, 0.5860872354676911,
  0.4058451513773972, 0.20778495500789848, 0,
];
const WGK = [
  0.022935322010529224, 0.06309209262997856, 0.10479001032225019, 0.14065325971552592, 0.1690047266392679,
  0.19035057806478542, 0.20443294007529889, 0.20948214108472782,
];
const WG = [0.1294849661688697, 0.27970539148927664, 0.3818300505051189, 0.4179591836734694];

export interface Panel {
  a: number;
  b: number;
  value: number;
  err: number;
}

/** One K15 panel with its QUADPACK error estimate. */
export function gk15(f: (x: number) => number, a: number, b: number): Panel {
  const c = 0.5 * (a + b);
  const h = 0.5 * (b - a);
  const fc = f(c);
  let resK = fc * WGK[7];
  let resG = fc * WG[3];
  let resAbs = Math.abs(resK);
  const fv1: number[] = new Array<number>(7);
  const fv2: number[] = new Array<number>(7);
  for (let j = 0; j < 7; j++) {
    const dx = h * XGK[j];
    const f1 = f(c - dx);
    const f2 = f(c + dx);
    fv1[j] = f1;
    fv2[j] = f2;
    resK += WGK[j] * (f1 + f2);
    resAbs += WGK[j] * (Math.abs(f1) + Math.abs(f2));
    if (j % 2 === 1) resG += WG[(j - 1) / 2] * (f1 + f2);
  }
  const reskh = resK * 0.5;
  let resasc = WGK[7] * Math.abs(fc - reskh);
  for (let j = 0; j < 7; j++) resasc += WGK[j] * (Math.abs(fv1[j] - reskh) + Math.abs(fv2[j] - reskh));
  const value = resK * h;
  resAbs *= Math.abs(h);
  resasc *= Math.abs(h);
  let err = Math.abs((resK - resG) * h);
  if (resasc !== 0 && err !== 0) err = resasc * Math.min(1, Math.pow((200 * err) / resasc, 1.5));
  if (resAbs > Number.MIN_VALUE / (50 * Number.EPSILON)) err = Math.max(Number.EPSILON * 50 * resAbs, err);
  return { a, b, value, err };
}

export interface QuadOptions {
  relTol?: number;
  absTol?: number;
  maxPanels?: number;
  /** Extra breakpoints inside (a, b) to start from (for peaked integrands). */
  breaks?: number[];
}

/** Adaptive integration of f over [a, b]. Returns value and an error estimate. */
export function integrate(
  f: (x: number) => number,
  a: number,
  b: number,
  opts: QuadOptions = {},
): { value: number; err: number } {
  if (a === b) return { value: 0, err: 0 };
  const sign = a < b ? 1 : -1;
  if (a > b) [a, b] = [b, a];
  const relTol = opts.relTol ?? 1e-12;
  const absTol = opts.absTol ?? 0;
  const maxPanels = opts.maxPanels ?? 400;
  const pts = [a, ...(opts.breaks ?? []).filter((p) => p > a && p < b).sort((x, y) => x - y), b];
  let panels: Panel[] = [];
  for (let i = 0; i + 1 < pts.length; i++) panels.push(gk15(f, pts[i], pts[i + 1]));
  for (;;) {
    let total = 0;
    let totalErr = 0;
    for (const p of panels) {
      total += p.value;
      totalErr += p.err;
    }
    if (totalErr <= Math.max(absTol, relTol * Math.abs(total)) || panels.length >= maxPanels) {
      return { value: sign * total, err: totalErr };
    }
    // bisect the panel with the largest error
    let worst = 0;
    for (let i = 1; i < panels.length; i++) if (panels[i].err > panels[worst].err) worst = i;
    const p = panels[worst];
    const m = 0.5 * (p.a + p.b);
    if (m === p.a || m === p.b) return { value: sign * total, err: totalErr };
    panels = [...panels.slice(0, worst), gk15(f, p.a, m), gk15(f, m, p.b), ...panels.slice(worst + 1)];
  }
}
