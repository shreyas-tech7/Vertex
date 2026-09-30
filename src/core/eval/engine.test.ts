import { describe, expect, it } from 'vitest';
import { Calc, calc } from './calc';

/** Spec §8 "Engine" table: Float, Radian, Real unless noted. Each row is [input, expected display text]. */
const ROWS: Array<[string, string]> = [
  ['⁻3²', '⁻9'],
  ['⁻2^2', '⁻4'],
  ['2^3^2', '64'],
  ['6/2(1+2)', '9'],
  ['1/3', '.3333333333'],
  ['2/3', '.6666666667'],
  ['π', '3.141592654'],
  ['10^10', '1ᴇ10'],
  ['9999999999', '9999999999'],
  ['.001', '.001'],
  ['.0001', '1ᴇ⁻4'],
  ['123456.78912345', '123456.7891'],
  ['2ᴇ3', '2000'],
  ['ᴇ3', '1000'],
  ['69!', '1.711224524ᴇ98'],
  ['70!', 'ERR:OVERFLOW'],
  ['.5!', '.8862269255'],
  ['1/0', 'ERR:DIVIDE BY 0'],
  ['√(⁻1)', 'ERR:NONREAL ANS'],
  ['(1+2ⅈ)(3+4ⅈ)', '⁻5+10ⅈ'],
  ['abs(3+4ⅈ)', '5'],
  ['(⁻8)^(1/3)', '⁻2'],
  ['sin(30°)', '.5'],
  ['sin⁻¹(1)', '1.570796327'],
  ['ln(ℯ)', '1'],
  ['log(100)', '2'],
  ['ℯ^(1)', '2.718281828'],
  ['5 nCr 2', '10'],
  ['5 nPr 2', '20'],
  ['round(π,4)', '3.1416'],
  ['int(⁻2.5)', '⁻3'],
  ['iPart(⁻2.5)', '⁻2'],
  ['fPart(⁻2.5)', '⁻.5'],
  ['remainder(17,5)', '2'],
  ['gcd(12,18)', '6'],
  ['lcm(4,6)', '12'],
  ['.75►Frac', '3/4'],
  ['1/3+1/6►Frac', '1/2'],
  ['2>1', '1'],
  ['2=3', '0'],
  ['1 and 0', '0'],
  ['{1,2,3}+{4,5,6}', '{5 7 9}'],
  ['{1,2}+{1,2,3}', 'ERR:DIM MISMATCH'],
  ['sum(seq(X²,X,1,10))', '385'],
  ['mean({1,2,3,4})', '2.5'],
  ['stdDev({2,4,4,4,5,5,7,9})', '2.138089935'],
  ['det([[1,2][3,4]])', '⁻2'],
  ['[[1,2][3,4]]⁻¹', '[[⁻2 1][1.5 ⁻.5]]'],
  ['rref([[1,2,3][4,5,6]])', '[[1 0 ⁻1][0 1 2]]'],
  ['nDeriv(X³,X,2)', '12.000001'],
  ['fnInt(X²,X,0,3)', '9'],
  ['binompdf(10,.5,5)', '.24609375'],
  ['poissonpdf(2,3)', '.1804470443'],
  ['normalcdf(⁻1E99,0)', '.5'],
];

describe('§8 engine table', () => {
  for (const [input, expected] of ROWS) {
    it(`${input} = ${expected}`, () => {
      expect(calc(input)).toBe(expected);
    });
  }

  it('√(⁻1) in a+bi mode is i', () => {
    expect(calc('√(⁻1)', { complex: 'RECT' })).toBe('ⅈ');
  });
  it('sin⁻¹(1) in Degree mode is 90', () => {
    expect(calc('sin⁻¹(1)', { angle: 'DEGREE' })).toBe('90');
  });
  it('"HELLO"→Str1 then sub(Str1,2,3)', () => {
    const c = new Calc();
    expect(c.show('"HELLO"→Str1')).toBe('HELLO');
    expect(c.show('sub(Str1,2,3)')).toBe('ELL');
  });
  it('X²→Y1 then Y1(3)', () => {
    const c = new Calc();
    c.show('X²→Y1');
    expect(c.show('Y1(3)')).toBe('9');
  });
  it('0→rand then rand', () => {
    const c = new Calc();
    c.show('0→rand');
    expect(c.show('rand')).toBe('.9435974025');
  });
});
