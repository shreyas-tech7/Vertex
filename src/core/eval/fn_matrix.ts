import { TIError } from '../errors';
import * as linalg from '../matrix/linalg';
import { checkRange, mul } from '../numbers/complex';
import { ZERO, type Real } from '../numbers/decimal';
import { code } from '../tokens/codes';
import { reg } from './registry';
import { MatV, asInt, asReal, type Value } from './values';

function mat(v: Value, pos: number): MatV {
  if (v instanceof MatV) return v;
  throw new TIError('DATA TYPE', pos);
}

reg(code('det('), {
  name: 'det(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => {
    const m = mat(a, pos);
    if (m.rows !== m.cols) throw new TIError('INVALID DIM', pos);
    return linalg.det(m.toRows());
  },
});

reg(code('identity('), {
  name: 'identity(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => MatV.from(linalg.identity(asInt(a, 1, 99, 'DOMAIN', pos))),
});

reg(code('ref('), {
  name: 'ref(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => MatV.from(linalg.echelon(mat(a, pos).toRows(), false)),
});
reg(code('rref('), {
  name: 'rref(',
  min: 1,
  max: 1,
  eager: (_c, [a], pos) => MatV.from(linalg.echelon(mat(a, pos).toRows(), true)),
});

function rowIndex(v: Value, m: MatV, pos: number): number {
  return asInt(v, 1, m.rows, 'DOMAIN', pos) - 1;
}

reg(code('rowSwap('), {
  name: 'rowSwap(',
  min: 3,
  max: 3,
  eager: (_c, [a, r1, r2], pos) => {
    const m = mat(a, pos);
    const rows = m.toRows();
    const i = rowIndex(r1, m, pos);
    const j = rowIndex(r2, m, pos);
    [rows[i], rows[j]] = [rows[j], rows[i]];
    return MatV.from(rows);
  },
});

reg(code('row+('), {
  name: 'row+(',
  min: 3,
  max: 3,
  eager: (_c, [a, r1, r2], pos) => {
    const m = mat(a, pos);
    const rows = m.toRows();
    const i = rowIndex(r1, m, pos);
    const j = rowIndex(r2, m, pos);
    rows[j] = rows[j].map((x, k) => checkRange(x.plus(rows[i][k])));
    return MatV.from(rows);
  },
});

reg(code('*row('), {
  name: '*row(',
  min: 3,
  max: 3,
  eager: (_c, [v, a, r], pos) => {
    const m = mat(a, pos);
    const k = asReal(v, pos);
    const rows = m.toRows();
    const i = rowIndex(r, m, pos);
    rows[i] = rows[i].map((x) => mul(x, k) as Real);
    return MatV.from(rows);
  },
});

reg(code('*row+('), {
  name: '*row+(',
  min: 4,
  max: 4,
  eager: (_c, [v, a, r1, r2], pos) => {
    const m = mat(a, pos);
    const k = asReal(v, pos);
    const rows = m.toRows();
    const i = rowIndex(r1, m, pos);
    const j = rowIndex(r2, m, pos);
    rows[j] = rows[j].map((x, c) => checkRange(x.plus(rows[i][c].times(k))));
    return MatV.from(rows);
  },
});

export const zeroMatrix = (r: number, c: number): MatV =>
  new MatV(
    r,
    c,
    Array.from({ length: r * c }, () => ZERO),
  );
