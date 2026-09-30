import { TIError, err } from '../errors';
import { mk } from '../numbers/complex';
import { D } from '../numbers/decimal';
import {
  T,
  isDigit,
  isLetter,
  isListVarCode,
  isMatrixCode,
  isStatVarCode,
  isStrCode,
  isWindowVarCode,
  isYCode,
} from '../tokens/codes';
import { TOKEN_BY_CODE } from '../tokens/table';
import type { Node } from './ast';

const POSTFIX = new Set<number>([T.SQR, T.CUBE, T.INV, T.FACT, T.DEG_POST, T.RAD_POST, T.TRANSP, T.PRIME]);
const CONVERSIONS = new Set<number>([T.FRAC, T.DEC, T.DMS, T.RECT, T.POLAR, T.F_D, T.ND_UND]);

/** Function tokens that carry their own open paren (everything whose text ends in "(" except "(" itself). */
const FUNCTION_TOKENS = new Set<number>();
for (const [c, info] of TOKEN_BY_CODE) {
  if (info.text.endsWith('(') && c !== T.LPAREN && info.text.length > 1) FUNCTION_TOKENS.add(c);
}
export const isFunctionToken = (c: number): boolean => FUNCTION_TOKENS.has(c);

// constants that are operands without arguments: tvm_Pmt, tvm_I%, tvm_PV, tvm_N, tvm_FV
const TVM_FUNCS = new Set<number>([0xbb20, 0xbb21, 0xbb22, 0xbb23, 0xbb24]);

const isEquationCode = (c: number): boolean =>
  isYCode(c) || (c >= 0x5e20 && c <= 0x5e2b) || (c >= 0x5e40 && c <= 0x5e45) || (c >= 0x5e80 && c <= 0x5e82);

/** True for tokens that can begin an operand (used for implied multiplication). */
export function startsOperand(c: number): boolean {
  if (isDigit(c) || c === T.DOT || c === T.EE) return true;
  if (isLetter(c) || c === T.THETA) return true;
  switch (c) {
    case T.LPAREN:
    case T.LBRACE:
    case T.LBRACKET:
    case T.ANS:
    case T.PI:
    case T.E:
    case T.I:
    case T.RAND:
    case T.GETKEY:
    case T.LIST_L:
      return true;
    default:
  }
  return (
    isListVarCode(c) ||
    isMatrixCode(c) ||
    isStrCode(c) ||
    isEquationCode(c) ||
    isStatVarCode(c) ||
    isWindowVarCode(c) ||
    TVM_FUNCS.has(c) ||
    FUNCTION_TOKENS.has(c)
  );
}

export interface ParseOptions {
  /** Index to start parsing at. */
  start?: number;
}

/** Recursive-descent parser over token codes (spec §7 "Parsing and order of operations"). */
export class Parser {
  i: number;
  constructor(
    readonly toks: readonly number[],
    start = 0,
  ) {
    this.i = start;
  }

  peek(offset = 0): number | undefined {
    return this.toks[this.i + offset];
  }
  get atEnd(): boolean {
    return this.i >= this.toks.length;
  }
  /** A missing closer is fine at the end of the line, before STO→, and at a statement separator. */
  private endish(): boolean {
    const c = this.peek();
    return c === undefined || c === T.STO || c === T.NEWLINE || c === T.COLON;
  }
  private fail(pos = this.i): never {
    throw new TIError('SYNTAX', Math.min(pos, this.toks.length));
  }

  // ---------- statement-level ----------

  /** expression [conversion] {→ target}. The caller checks that input is exhausted. */
  parseExpressionStatement(): Node {
    let n = this.parseExpression();
    const c = this.peek();
    if (c !== undefined && CONVERSIONS.has(c)) {
      n = { k: 'conv', op: c, a: n, pos: this.i };
      this.i++;
    }
    while (this.peek() === T.STO) {
      const pos = this.i;
      this.i++;
      const target = this.parseTarget();
      n = { k: 'sto', a: n, target, pos };
    }
    return n;
  }

  // ---------- precedence levels ----------

  parseExpression(): Node {
    return this.parseOr();
  }

  private parseOr(): Node {
    let a = this.parseAnd();
    for (;;) {
      const c = this.peek();
      if (c !== T.OR && c !== T.XOR) return a;
      const pos = this.i++;
      const b = this.parseAnd();
      a = { k: 'bin', op: c, a, b, pos };
    }
  }

  private parseAnd(): Node {
    let a = this.parseRel();
    while (this.peek() === T.AND) {
      const pos = this.i++;
      const b = this.parseRel();
      a = { k: 'bin', op: T.AND, a, b, pos };
    }
    return a;
  }

  private parseRel(): Node {
    let a = this.parseAdd();
    for (;;) {
      const c = this.peek();
      if (c !== T.EQ && c !== T.NE && c !== T.LT && c !== T.GT && c !== T.LE && c !== T.GE) return a;
      const pos = this.i++;
      const b = this.parseAdd();
      a = { k: 'bin', op: c, a, b, pos };
    }
  }

  private parseAdd(): Node {
    let a = this.parseMul();
    for (;;) {
      const c = this.peek();
      if (c !== T.PLUS && c !== T.MINUS) return a;
      const pos = this.i++;
      const b = this.parseMul();
      a = { k: 'bin', op: c, a, b, pos };
    }
  }

  private parseMul(): Node {
    let a = this.parseNpr();
    for (;;) {
      const c = this.peek();
      if (c === T.MUL || c === T.DIV) {
        const pos = this.i++;
        const b = this.parseNpr();
        a = { k: 'bin', op: c, a, b, pos };
      } else if (c !== undefined && c !== T.QUOTE && startsOperand(c)) {
        const pos = this.i;
        const b = this.parseNpr();
        a = { k: 'bin', op: T.MUL, a, b, pos };
      } else return a;
    }
  }

  private parseNpr(): Node {
    let a = this.parseNeg();
    for (;;) {
      const c = this.peek();
      if (c !== T.NPR && c !== T.NCR) return a;
      const pos = this.i++;
      const b = this.parseNeg();
      a = { k: 'bin', op: c, a, b, pos };
    }
  }

  private parseNeg(): Node {
    if (this.peek() === T.NEG) {
      const pos = this.i++;
      return { k: 'neg', a: this.parseNeg(), pos };
    }
    return this.parsePow();
  }

  private parsePow(): Node {
    let a = this.parsePostfix();
    for (;;) {
      const c = this.peek();
      if (c !== T.POW && c !== T.XROOT) return a;
      const pos = this.i++;
      const b = this.parsePowOperand();
      a = { k: 'bin', op: c, a, b, pos };
    }
  }

  /** Right operand of ^ and x√: may itself start with negation (2^⁻2 = .25). */
  private parsePowOperand(): Node {
    if (this.peek() === T.NEG) {
      const pos = this.i++;
      return { k: 'neg', a: this.parsePowOperand(), pos };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Node {
    let a = this.parsePrimary();
    for (;;) {
      const c = this.peek();
      if (c === undefined || !POSTFIX.has(c)) return a;
      const pos = this.i++;
      if (c === T.DEG_POST) {
        const dms = this.tryDms(a, pos);
        if (dms) {
          a = dms;
          continue;
        }
      }
      a = { k: 'post', op: c, a, pos };
    }
  }

  /** a°b'c" : minutes and seconds entry after a degree sign. */
  private tryDms(deg: Node, pos: number): Node | null {
    const save = this.i;
    const c = this.peek();
    if (c === undefined || !(isDigit(c) || c === T.DOT)) return null;
    const min = this.parseNumberLiteral();
    if (this.peek() !== T.PRIME) {
      this.i = save;
      return null;
    }
    this.i++;
    let sec: Node | null = null;
    const c2 = this.peek();
    if (c2 !== undefined && (isDigit(c2) || c2 === T.DOT)) {
      const s2 = this.i;
      const sv = this.parseNumberLiteral();
      if (this.peek() === T.QUOTE) {
        this.i++;
        sec = sv;
      } else this.i = s2;
    }
    return { k: 'dms', deg, min, sec, pos };
  }

  // ---------- primaries ----------

  private parseNumberLiteral(): Node {
    const start = this.i;
    let mant = '';
    let dot = false;
    for (;;) {
      const c = this.peek();
      if (c !== undefined && isDigit(c)) mant += String(c - T.D0);
      else if (c === T.DOT) {
        if (dot) this.fail();
        dot = true;
        mant += '.';
      } else break;
      this.i++;
    }
    let exp = '';
    if (this.peek() === T.EE) {
      this.i++;
      if (mant === '') mant = '1';
      let neg = false;
      if (this.peek() === T.NEG) {
        neg = true;
        this.i++;
      }
      for (;;) {
        const c = this.peek();
        if (c !== undefined && isDigit(c)) exp += String(c - T.D0);
        else break;
        this.i++;
      }
      if (exp === '') this.fail();
      if (this.peek() === T.DOT) this.fail();
      exp = (neg ? '-' : '') + exp;
    }
    if (mant === '' || mant === '.') this.fail(start === this.i ? start : this.i);
    if (mant.endsWith('.') && mant.length === 1) this.fail();
    const d = new D(exp ? `${mant}e${exp}` : mant).toSD(14);
    if (!d.isFinite()) throw new TIError('OVERFLOW', start);
    return { k: 'num', v: mk(d, new D(0)), pos: start };
  }

  private closeParen(): void {
    if (this.peek() === T.RPAREN) this.i++;
    else if (!this.endish()) this.fail();
  }

  private parseArgs(): Node[] {
    const args: Node[] = [];
    if (this.peek() === T.RPAREN) {
      this.i++;
      return args;
    }
    if (this.endish()) return args;
    for (;;) {
      args.push(this.parseExpression());
      if (this.peek() === T.COMMA) {
        this.i++;
        continue;
      }
      break;
    }
    this.closeParen();
    return args;
  }

  private parseIndexArgsIfAny(): Node[] | null {
    if (this.peek() !== T.LPAREN) return null;
    this.i++;
    const args = this.parseArgs();
    return args;
  }

  private parsePrimary(): Node {
    const pos = this.i;
    const c = this.peek();
    if (c === undefined) this.fail();
    if (isDigit(c) || c === T.DOT || c === T.EE) return this.parseNumberLiteral();
    if (isLetter(c) || c === T.THETA) {
      this.i++;
      return { k: 'var', c, pos };
    }
    switch (c) {
      case T.LPAREN: {
        this.i++;
        const inner = this.parseExpression();
        this.closeParen();
        return inner;
      }
      case T.LBRACE:
        return this.parseListLiteral();
      case T.LBRACKET:
        return this.parseMatrixLiteral();
      case T.QUOTE:
        return this.parseStringLiteral();
      case T.ANS:
      case T.PI:
      case T.E:
      case T.I:
      case T.GETKEY:
        this.i++;
        return { k: 'const', c, pos };
      case T.RAND: {
        this.i++;
        if (this.peek() === T.LPAREN) {
          this.i++;
          return { k: 'call', fn: T.RAND, args: this.parseArgs(), pos };
        }
        return { k: 'const', c, pos };
      }
      case T.LIST_L:
        return this.parseUserList();
      default:
    }
    if (TVM_FUNCS.has(c)) {
      this.i++;
      return { k: 'const', c, pos };
    }
    if (FUNCTION_TOKENS.has(c)) {
      this.i++;
      return { k: 'call', fn: c, args: this.parseArgs(), pos };
    }
    if (isListVarCode(c) || isMatrixCode(c) || isStrCode(c) || isEquationCode(c)) {
      this.i++;
      const ref: Node = { k: 'ref', c, pos };
      const args = this.parseIndexArgsIfAny();
      return args ? { k: 'index', base: ref, args, pos } : ref;
    }
    if (isStatVarCode(c) || isWindowVarCode(c)) {
      this.i++;
      return { k: 'var', c, pos };
    }
    return this.fail();
  }

  private parseUserList(): Node {
    const pos = this.i++;
    let name = '';
    for (let n = 0; n < 5; n++) {
      const c = this.peek();
      if (c !== undefined && (isLetter(c) || c === T.THETA || (name !== '' && isDigit(c)))) {
        name += c === T.THETA ? 'θ' : isLetter(c) ? String.fromCharCode(c) : String(c - T.D0);
        this.i++;
      } else break;
    }
    if (name === '') this.fail();
    const node: Node = { k: 'ulist', name, pos };
    const args = this.parseIndexArgsIfAny();
    return args ? { k: 'index', base: node, args, pos } : node;
  }

  private parseListLiteral(): Node {
    const pos = this.i++;
    const items: Node[] = [];
    if (this.peek() === T.RBRACE) {
      this.i++;
      return { k: 'list', items, pos };
    }
    if (!this.endish()) {
      for (;;) {
        items.push(this.parseExpression());
        if (this.peek() === T.COMMA) {
          this.i++;
          continue;
        }
        break;
      }
    }
    if (this.peek() === T.RBRACE) this.i++;
    else if (!this.endish()) this.fail();
    return { k: 'list', items, pos };
  }

  private parseMatrixLiteral(): Node {
    const pos = this.i++;
    const rows: Node[][] = [];
    while (this.peek() === T.LBRACKET) {
      this.i++;
      const row: Node[] = [];
      for (;;) {
        row.push(this.parseExpression());
        if (this.peek() === T.COMMA) {
          this.i++;
          continue;
        }
        break;
      }
      if (this.peek() === T.RBRACKET) this.i++;
      else if (!this.endish()) this.fail();
      rows.push(row);
    }
    if (rows.length === 0) this.fail();
    if (this.peek() === T.RBRACKET) this.i++;
    else if (!this.endish()) this.fail();
    if (rows.some((r) => r.length !== rows[0].length)) throw new TIError('DIM MISMATCH', pos);
    return { k: 'mat', rows, pos };
  }

  private parseStringLiteral(): Node {
    const pos = this.i++;
    const toks: number[] = [];
    for (;;) {
      const c = this.peek();
      if (c === undefined || c === T.NEWLINE || c === T.STO) break;
      this.i++;
      if (c === T.QUOTE) break;
      toks.push(c);
    }
    return { k: 'str', toks, pos };
  }

  // ---------- STO targets ----------

  private parseTarget(): Node {
    const pos = this.i;
    const c = this.peek();
    if (c === undefined) this.fail();
    if (isLetter(c) || c === T.THETA || isStatVarCode(c) || isWindowVarCode(c)) {
      this.i++;
      return { k: 'var', c, pos };
    }
    if (c === T.RAND) {
      this.i++;
      return { k: 'const', c, pos };
    }
    if (c === T.LIST_L) return this.parseUserList();
    if (isListVarCode(c) || isMatrixCode(c) || isStrCode(c) || isEquationCode(c)) {
      this.i++;
      const ref: Node = { k: 'ref', c, pos };
      const args = this.parseIndexArgsIfAny();
      return args ? { k: 'index', base: ref, args, pos } : ref;
    }
    if (c === T.DIM) {
      // dim(
      this.i++;
      return { k: 'call', fn: c, args: this.parseArgs(), pos };
    }
    return this.fail();
  }
}

/** Parse a full home-screen style entry. Throws TIError('SYNTAX', pos) for leftovers. */
export function parseLine(toks: readonly number[]): Node {
  const p = new Parser(toks);
  if (toks.length === 0) throw err('SYNTAX', 0);
  const n = p.parseExpressionStatement();
  if (!p.atEnd) throw err('SYNTAX', p.i);
  return n;
}
