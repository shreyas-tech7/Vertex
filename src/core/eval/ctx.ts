import { err } from '../errors';
import { isNum, type Num, type NumCtx } from '../numbers/complex';
import { ZERO } from '../numbers/decimal';
import { FLOAT_FORMAT, type ComplexStyle, type NumFormat } from '../numbers/format';
import { T, isLetter, isListVarCode, isMatrixCode, isStrCode } from '../tokens/codes';
import { Rng } from './rng';
import { EqV, ListV, MatV, StrV, type Value } from './values';

/** The MODE settings that affect evaluation and display. */
export interface Settings {
  angle: 'RADIAN' | 'DEGREE';
  /** REAL, a+bi (rectangular) or re^θi (polar). */
  complex: 'REAL' | 'RECT' | 'POLAR';
  format: NumFormat;
  /** MathPrint answer style for ►F◄►D etc.: AUTO / DEC / FRAC-APPROX, and n/d vs Un/d. */
  answers: 'AUTO' | 'DEC' | 'FRAC';
  fraction: 'n/d' | 'Un/d';
}

export function defaultSettings(): Settings {
  return { angle: 'RADIAN', complex: 'REAL', format: { ...FLOAT_FORMAT }, answers: 'AUTO', fraction: 'n/d' };
}

/** A variable whose storage lives outside Memory (window variables, statistics results, TVM values ...). */
export interface MagicVar {
  get(): Value;
  set?(v: Value): void;
}

const MAX_LIST = 999;
export { MAX_LIST };

/** Calculator memory: all variables that expressions can read and STO→ can write. */
export class Memory {
  private reals = new Map<number, Num>();
  readonly lists = new Map<string, ListV>();
  readonly mats = new Map<number, MatV>();
  readonly strs = new Map<number, StrV>();
  readonly eqs = new Map<number, EqV>();
  readonly magic = new Map<number, MagicVar>();
  ans: Value = ZERO;

  // ---- reals and magic variables ----
  getVar(code: number): Value {
    const m = this.magic.get(code);
    if (m) return m.get();
    const v = this.reals.get(code);
    if (v !== undefined) return v;
    if (isLetter(code) || code === T.THETA) return ZERO;
    throw err('UNDEFINED');
  }
  setVar(code: number, v: Value): void {
    const m = this.magic.get(code);
    if (m) {
      if (!m.set) throw err('INVALID');
      m.set(v);
      return;
    }
    if (!isNum(v)) throw err('DATA TYPE');
    this.reals.set(code, v);
  }
  /** Raw letter-variable access for loops (bypasses magic). */
  getReal(code: number): Num {
    const v = this.getVar(code);
    if (!isNum(v)) throw err('DATA TYPE');
    return v;
  }
  hasRealSlot(code: number): boolean {
    return this.reals.has(code);
  }
  deleteVar(code: number): void {
    this.reals.delete(code);
  }
  realEntries(): IterableIterator<[number, Num]> {
    return this.reals.entries();
  }

  // ---- lists ----
  static listKey(code: number): string {
    return `L${code - 0x5d00 + 1}`;
  }
  getList(key: string): ListV {
    const l = this.lists.get(key);
    if (l) return l;
    if (/^L[1-6]$/.test(key)) return new ListV([]);
    throw err('UNDEFINED');
  }
  setList(key: string, v: ListV): void {
    if (v.length > MAX_LIST) throw err('INVALID DIM');
    this.lists.set(key, v);
  }
  hasList(key: string): boolean {
    return this.lists.has(key) || /^L[1-6]$/.test(key);
  }

  // ---- matrices, strings, equations ----
  getMat(code: number): MatV {
    const m = this.mats.get(code);
    if (!m) throw err('UNDEFINED');
    return m;
  }
  getStr(code: number): StrV {
    const s = this.strs.get(code);
    if (!s) throw err('UNDEFINED');
    return s;
  }
  getEq(code: number): EqV {
    return this.eqs.get(code) ?? new EqV([]);
  }

  /** Read a whole-object reference by its variable token. */
  getRef(code: number): Value {
    if (isListVarCode(code)) return this.getList(Memory.listKey(code));
    if (isMatrixCode(code)) return this.getMat(code);
    if (isStrCode(code)) return this.getStr(code);
    const m = this.magic.get(code);
    if (m) return m.get();
    return this.getEq(code);
  }
}

/** Everything an expression needs while it runs. */
export class Ctx {
  readonly mem: Memory;
  settings: Settings;
  readonly rng: Rng;
  depth = 0;
  /** Key read by getKey (0 when none is waiting). Set by the OS. */
  getKey: () => number = () => 0;
  /** Hook for tvm_* functions and finance variables (set by the finance module). */
  finance: ((code: number, args: Value[]) => Value) | null = null;
  /** Called by long-running numeric loops so the OS can honour ON (ERR:BREAK). */
  checkBreak: () => void = () => {};
  private _nc: NumCtx = { realOnly: true, degrees: false };

  constructor(mem = new Memory(), settings = defaultSettings(), rng = new Rng(0)) {
    this.mem = mem;
    this.settings = settings;
    this.rng = rng;
  }

  get nc(): NumCtx {
    const realOnly = this.settings.complex === 'REAL';
    const degrees = this.settings.angle === 'DEGREE';
    if (this._nc.realOnly !== realOnly || this._nc.degrees !== degrees) this._nc = { realOnly, degrees };
    return this._nc;
  }
  get complexStyle(): ComplexStyle {
    return this.settings.complex === 'POLAR' ? 'POLAR' : 'RECT';
  }
}
