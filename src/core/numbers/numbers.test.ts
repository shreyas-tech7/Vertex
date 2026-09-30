import { describe, expect, it } from 'vitest';
import { Cx, add, acosN, asinN, atanN, div, lnN, mul, powN, sqrtN, trigN, type NumCtx } from './complex';
import { D, PI, num } from './decimal';
import { formatNum, formatReal, formatSig, toPlain, type NumFormat } from './format';
import { fracText } from './frac';

const R: NumCtx = { realOnly: true, degrees: false };
const DEG: NumCtx = { realOnly: true, degrees: true };
const CPLX: NumCtx = { realOnly: false, degrees: false };
const f = (s: string | number, fmt?: NumFormat) => toPlain(formatReal(num(s), fmt));

describe('formatting (Float)', () => {
  it('matches the spec examples', () => {
    expect(formatReal(new D(1).div(3))).toBe('.3333333333');
    expect(formatReal(new D(2).div(3))).toBe('.6666666667');
    expect(formatReal(PI)).toBe('3.141592654');
    expect(formatReal(new D(10).pow(10))).toBe('1ᴇ10');
    expect(formatReal(num('9999999999'))).toBe('9999999999');
    expect(formatReal(num('.001'))).toBe('.001');
    expect(formatReal(num('.0001'))).toBe('1ᴇ⁻4');
    expect(formatReal(num('123456.78912345'))).toBe('123456.7891');
    expect(formatReal(num(2000))).toBe('2000');
    expect(formatReal(num('-.25'))).toBe('⁻.25');
    expect(f('1.711224524E98')).toBe('1.711224524E98');
    expect(f(0)).toBe('0');
    expect(f('12345678901')).toBe('1.23456789E10');
    expect(f('-1.5e-7')).toBe('⁻1.5E⁻7');
  });
  it('handles Fix / Sci / Eng', () => {
    expect(f('3.14159', { mode: 'NORMAL', digits: 2 })).toBe('3.14');
    expect(f('.5', { mode: 'NORMAL', digits: 2 })).toBe('.50');
    expect(f('2.5', { mode: 'NORMAL', digits: 0 })).toBe('3.');
    expect(f('1234.5', { mode: 'SCI', digits: -1 })).toBe('1.2345E3');
    expect(f('1234.5', { mode: 'SCI', digits: 2 })).toBe('1.23E3');
    expect(f('12345', { mode: 'ENG', digits: -1 })).toBe('12.345E3');
    expect(f('0.00012', { mode: 'ENG', digits: -1 })).toBe('120E⁻6');
    expect(f('1e15', { mode: 'NORMAL', digits: 2 })).toBe('1E15');
    expect(f('-0.001', { mode: 'NORMAL', digits: 2 })).toBe('0.00');
  });
  it('graph readouts use 8 significant digits', () => {
    expect(formatSig(num('.21276595744681'))).toBe('.21276596');
  });
  it('formats complex numbers', () => {
    expect(toPlain(formatNum(new Cx(num(-5), num(10))))).toBe('⁻5+10i');
    expect(toPlain(formatNum(new Cx(num(0), num(1))))).toBe('i');
    expect(toPlain(formatNum(new Cx(num(1), num(-2))))).toBe('1-2i');
    expect(toPlain(formatNum(new Cx(num(0), num(-1))))).toBe('⁻i');
  });
});

describe('fractions', () => {
  it('converts simple decimals', () => {
    expect(fracText(num('.75'))).toBe('3/4');
    expect(fracText(new D(1).div(3))).toBe('1/3');
    expect(fracText(new D(1).div(3).plus(new D(1).div(6)))).toBe('1/2');
    expect(fracText(num('-.125'))).toBe('⁻1/8');
    expect(fracText(PI)).toBeNull();
    expect(fracText(num('617').div(50000))).toBe('617/50000');
  });
});

describe('scalar math', () => {
  it('trig with snapping', () => {
    expect(f(trigN(DEG, 'sin', num(30)).toString())).toBe('.5');
    expect(trigN(DEG, 'sin', num(180)).toString()).toBe('0');
    expect(trigN(DEG, 'cos', num(90)).toString()).toBe('0');
    expect(() => trigN(DEG, 'tan', num(90))).toThrow(/DOMAIN/);
    expect(trigN(R, 'sin', PI).toString()).toBe('0');
    expect(trigN(R, 'cos', PI.div(2)).toString()).toBe('0');
    expect(f(trigN(R, 'cos', num(1)).toString())).toBe('.5403023059');
  });
  it('inverse trig', () => {
    expect(f(asinN(R, num(1)).toString())).toBe('1.570796327');
    expect(f(asinN(DEG, num(1)).toString())).toBe('90');
    expect(f(acosN(R, num(0)).toString())).toBe('1.570796327');
    expect(f(atanN(DEG, num(1)).toString())).toBe('45');
    expect(() => asinN(R, num(2))).toThrow(/DOMAIN/);
  });
  it('real mode vs complex results', () => {
    expect(() => sqrtN(R, num(-1))).toThrow(/NONREAL/);
    expect(toPlain(formatNum(sqrtN(CPLX, num(-1))))).toBe('i');
    expect(toPlain(formatNum(lnN(CPLX, num(-1))))).toBe('3.141592654i');
    expect(f(powN(R, num(-8), new D(1).div(3)).toString())).toBe('⁻2');
    expect(() => powN(R, num(-8), num('.5'))).toThrow(/NONREAL/);
    expect(f(powN(R, num(2), num(-2)).toString())).toBe('.25');
    expect(() => div(num(1), num(0))).toThrow(/DIVIDE BY 0/);
    expect(() => powN(R, num(10), num(100))).toThrow(/OVERFLOW/);
  });
  it('complex arithmetic', () => {
    const a = new Cx(num(1), num(2));
    const b = new Cx(num(3), num(4));
    expect(toPlain(formatNum(mul(a, b)))).toBe('⁻5+10i');
    expect(toPlain(formatNum(add(a, b)))).toBe('4+6i');
    expect(toPlain(formatNum(div(a, b)))).toBe('.44+.08i');
    expect(toPlain(formatNum(powN(CPLX, a, num(2))))).toBe('⁻3+4i');
  });
});
