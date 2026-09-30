import { TIError } from '../errors';
import { Cx, isNum, type Num } from '../numbers/complex';
import { D, E, PI, ONE, ZERO, isReal, type Real } from '../numbers/decimal';
import type { Node } from '../parser/ast';
import { parseLine } from '../parser/parser';
import { T, code, isListVarCode, isMatrixCode, isStrCode, isYCode } from '../tokens/codes';
import { Memory, type Ctx, MAX_LIST } from './ctx';
import { binary, negate, postfix, degToAngle } from './ops';
import { REGISTRY, type Thunk } from './registry';
import { EqV, ListV, MatV, StrV, asInt, asReal, type Value } from './values';

const TVM_CODES = new Set<number>([0xbb20, 0xbb21, 0xbb22, 0xbb23, 0xbb24]);

/** Re-throw runtime errors with the failing node's token position. */
function at<R>(pos: number, f: () => R): R {
  try {
    return f();
  } catch (e) {
    if (e instanceof TIError && e.pos < 0) throw new TIError(e.tiName, pos);
    throw e;
  }
}

function listIndex(l: ListV, idxV: Value, pos: number): number {
  const i = asInt(idxV, 1, 999, 'INVALID DIM', pos);
  if (i > l.length) throw new TIError('INVALID DIM', pos);
  return i - 1;
}

function baseList(c: Ctx, base: Node): { get: () => ListV; set: (l: ListV) => void } | null {
  if (base.k === 'ref' && isListVarCode(base.c)) {
    const key = Memory.listKey(base.c);
    return { get: () => c.mem.getList(key), set: (l) => c.mem.setList(key, l) };
  }
  if (base.k === 'ulist') {
    return { get: () => c.mem.getList(base.name), set: (l) => c.mem.setList(base.name, l) };
  }
  return null;
}

/** Evaluate a function equation (Y1 ...) at x by binding X; lists evaluate elementwise. */
export function callEquation(c: Ctx, eqCode: number, x: Value, pos: number): Value {
  const eq = c.mem.getEq(eqCode);
  if (eq.toks.length === 0) throw new TIError('UNDEFINED', pos);
  if (c.depth >= 40) throw new TIError('MEMORY', pos);
  const X = 0x58;
  const had = c.mem.hasRealSlot(X);
  const old = c.mem.getVar(X);
  c.depth++;
  try {
    const one = (xv: Value): Value => {
      c.mem.setVar(X, xv);
      return evalTokens(c, eq.toks).value;
    };
    if (x instanceof ListV) {
      return new ListV(
        x.items.map((xi) => {
          const r = one(xi);
          if (!isNum(r)) throw new TIError('DATA TYPE', pos);
          return r;
        }),
      );
    }
    return one(x);
  } finally {
    c.depth--;
    if (had) c.mem.setVar(X, old);
    else c.mem.deleteVar(X);
  }
}

function compileIndex(n: Extract<Node, { k: 'index' }>): Thunk {
  const args = n.args.map(compileNode);
  const base = n.base;
  return (c) =>
    at(n.pos, () => {
      const bl = baseList(c, base);
      if (bl) {
        if (args.length !== 1) throw new TIError('SYNTAX', n.pos);
        const l = bl.get();
        return l.items[listIndex(l, args[0](c), n.pos)];
      }
      if (base.k === 'ref' && isMatrixCode(base.c)) {
        const m = c.mem.getMat(base.c);
        if (args.length !== 2) throw new TIError('INVALID DIM', n.pos);
        const r = asInt(args[0](c), 1, m.rows, 'INVALID DIM', n.pos);
        const k = asInt(args[1](c), 1, m.cols, 'INVALID DIM', n.pos);
        return m.at(r - 1, k - 1);
      }
      if (base.k === 'ref' && isYCode(base.c)) {
        if (args.length !== 1) throw new TIError('SYNTAX', n.pos);
        return callEquation(c, base.c, args[0](c), n.pos);
      }
      throw new TIError('SYNTAX', n.pos);
    });
}

function constThunk(n: Extract<Node, { k: 'const' }>): Thunk {
  switch (n.c) {
    case T.ANS:
      return (c) => c.mem.ans;
    case T.PI:
      return () => PI;
    case T.E:
      return () => E;
    case T.I:
      return () => new Cx(ZERO, ONE);
    case T.RAND:
      return (c) => c.rng.next();
    case T.GETKEY:
      return (c) => new D(c.getKey());
    default:
      if (TVM_CODES.has(n.c)) {
        return (c) => {
          if (!c.finance) throw new TIError('INVALID', n.pos);
          return c.finance(n.c, []);
        };
      }
      return () => {
        throw new TIError('SYNTAX', n.pos);
      };
  }
}

/** Node kinds whose value is certainly a string (used to decide how STO into an equation variable behaves). */
function isStringy(n: Node): boolean {
  if (n.k === 'str') return true;
  if (n.k === 'ref') return isStrCode(n.c);
  if (n.k === 'bin' && n.op === T.PLUS) return isStringy(n.a) || isStringy(n.b);
  if (n.k === 'call') return n.fn === SUB;
  return false;
}
const SUB = code('sub(');

export function compileNode(n: Node): Thunk {
  switch (n.k) {
    case 'num': {
      const v = n.v;
      return () => v;
    }
    case 'const':
      return constThunk(n);
    case 'var': {
      const code = n.c;
      return (c) => c.mem.getVar(code);
    }
    case 'ref': {
      const code = n.c;
      return (c) => at(n.pos, () => c.mem.getRef(code));
    }
    case 'ulist': {
      const name = n.name;
      return (c) => at(n.pos, () => c.mem.getList(name));
    }
    case 'list': {
      const items = n.items.map(compileNode);
      return (c) =>
        at(n.pos, () => {
          if (items.length > MAX_LIST) throw new TIError('INVALID DIM', n.pos);
          return new ListV(
            items.map((t) => {
              const v = t(c);
              if (!isNum(v)) throw new TIError('DATA TYPE', n.pos);
              return v;
            }),
          );
        });
    }
    case 'mat': {
      const rows = n.rows.map((r) => r.map(compileNode));
      return (c) =>
        at(n.pos, () =>
          MatV.from(
            rows.map((r) =>
              r.map((t) => {
                const v = t(c);
                if (!isReal(v)) throw new TIError('DATA TYPE', n.pos);
                return v;
              }),
            ),
          ),
        );
    }
    case 'str': {
      const v = new StrV(n.toks);
      return () => v;
    }
    case 'neg': {
      const a = compileNode(n.a);
      return (c) => negate(a(c), n.pos);
    }
    case 'post': {
      const a = compileNode(n.a);
      return (c) => postfix(c, n.op, a(c), n.pos);
    }
    case 'dms': {
      const deg = compileNode(n.deg);
      const min = n.min ? compileNode(n.min) : null;
      const sec = n.sec ? compileNode(n.sec) : null;
      return (c) =>
        at(n.pos, () => {
          const d = asReal(deg(c), n.pos);
          const m = min ? asReal(min(c), n.pos) : ZERO;
          const s = sec ? asReal(sec(c), n.pos) : ZERO;
          const total = d.plus(m.div(60)).plus(s.div(3600));
          return degToAngle(c, total);
        });
    }
    case 'bin': {
      const a = compileNode(n.a);
      const b = compileNode(n.b);
      const op = n.op;
      // and / or short-circuit nothing on the calculator; evaluate both sides left to right
      return (c) => {
        const av = a(c);
        const bv = b(c);
        return binary(c, op, av, bv, n.pos);
      };
    }
    case 'call': {
      const def = REGISTRY.get(n.fn);
      if (!def) {
        return () => {
          throw new TIError('SYNTAX', n.pos);
        };
      }
      if (n.args.length < def.min || n.args.length > def.max) {
        return () => {
          throw new TIError('SYNTAX', n.pos);
        };
      }
      const args = n.args.map(compileNode);
      if (def.lazy) {
        const lazy = def.lazy;
        return (c) => at(n.pos, () => lazy(c, args, n.args, n.pos));
      }
      const eager = def.eager;
      if (!eager) throw new Error(`function ${def.name} has no implementation`);
      return (c) => {
        const vals = args.map((t) => t(c));
        return at(n.pos, () => eager(c, vals, n.pos));
      };
    }
    case 'index':
      return compileIndex(n);
    case 'conv': {
      // conversions only change how the final value is displayed; the value passes through
      return compileNode(n.a);
    }
    case 'sto':
      return compileSto(n);
  }
}

function assign(c: Ctx, t: Node, v: Value, pos: number): void {
  switch (t.k) {
    case 'var': {
      if (!isNum(v) && !c.mem.magic.has(t.c)) throw new TIError('DATA TYPE', pos);
      c.mem.setVar(t.c, v);
      return;
    }
    case 'const': {
      if (t.c !== T.RAND) throw new TIError('SYNTAX', pos);
      c.rng.seed(asReal(v, pos));
      return;
    }
    case 'ref': {
      if (isListVarCode(t.c)) {
        if (!(v instanceof ListV)) throw new TIError('DATA TYPE', pos);
        c.mem.setList(Memory.listKey(t.c), v);
      } else if (isMatrixCode(t.c)) {
        if (!(v instanceof MatV)) throw new TIError('DATA TYPE', pos);
        c.mem.mats.set(t.c, v);
      } else if (isStrCode(t.c)) {
        if (!(v instanceof StrV)) throw new TIError('DATA TYPE', pos);
        c.mem.strs.set(t.c, v);
      } else {
        if (v instanceof StrV) c.mem.eqs.set(t.c, new EqV(v.toks));
        else if (v instanceof EqV) c.mem.eqs.set(t.c, v);
        else throw new TIError('DATA TYPE', pos);
      }
      return;
    }
    case 'ulist': {
      if (!(v instanceof ListV)) throw new TIError('DATA TYPE', pos);
      c.mem.setList(t.name, v);
      return;
    }
    case 'index': {
      const bl = baseList(c, t.base);
      if (bl) {
        if (!isNum(v)) throw new TIError('DATA TYPE', pos);
        const l = bl.get();
        const i = asInt(evalNode(c, t.args[0]), 1, 999, 'INVALID DIM', pos);
        if (i > l.length + 1) throw new TIError('INVALID DIM', pos);
        const items = [...l.items];
        items[i - 1] = v;
        bl.set(new ListV(items));
        return;
      }
      if (t.base.k === 'ref' && isMatrixCode(t.base.c)) {
        if (!isReal(v)) throw new TIError('DATA TYPE', pos);
        const m = c.mem.getMat(t.base.c);
        if (t.args.length !== 2) throw new TIError('INVALID DIM', pos);
        const r = asInt(evalNode(c, t.args[0]), 1, m.rows, 'INVALID DIM', pos);
        const k = asInt(evalNode(c, t.args[1]), 1, m.cols, 'INVALID DIM', pos);
        const data = [...m.data];
        data[(r - 1) * m.cols + (k - 1)] = v;
        c.mem.mats.set(t.base.c, new MatV(m.rows, m.cols, data));
        return;
      }
      throw new TIError('SYNTAX', pos);
    }
    case 'call': {
      if (t.fn !== T.DIM || t.args.length !== 1) throw new TIError('SYNTAX', pos);
      const target = t.args[0];
      const bl = baseList(c, target);
      if (bl) {
        const n = asInt(v, 0, 999, 'INVALID DIM', pos);
        let items: Num[];
        try {
          items = [...bl.get().items];
        } catch {
          items = [];
        }
        items.length = Math.min(items.length, n);
        while (items.length < n) items.push(ZERO);
        bl.set(new ListV(items));
        return;
      }
      if (target.k === 'ref' && isMatrixCode(target.c)) {
        if (!(v instanceof ListV) || v.length !== 2) throw new TIError('DATA TYPE', pos);
        const r = asInt(v.items[0], 1, 99, 'INVALID DIM', pos);
        const k = asInt(v.items[1], 1, 99, 'INVALID DIM', pos);
        const old = c.mem.mats.get(target.c);
        const data: Real[] = [];
        for (let i = 0; i < r; i++)
          for (let j = 0; j < k; j++) data.push(old && i < old.rows && j < old.cols ? old.at(i, j) : ZERO);
        c.mem.mats.set(target.c, new MatV(r, k, data));
        return;
      }
      throw new TIError('DATA TYPE', pos);
    }
    default:
      throw new TIError('SYNTAX', pos);
  }
}

function evalNode(c: Ctx, n: Node): Value {
  return compileNode(n)(c);
}

function compileSto(n: Extract<Node, { k: 'sto' }>): Thunk {
  const target = n.target;
  const src = n.a;
  // Storing an unquoted expression into an equation variable keeps the expression (a documented deviation:
  // hardware raises ERR:DATA TYPE). Strings are stored as written.
  const isEq =
    target.k === 'ref' && !isListVarCode(target.c) && !isMatrixCode(target.c) && !isStrCode(target.c);
  if (isEq && !isStringy(src)) {
    return (c) => {
      const eq = new EqV(n.src);
      assign(c, target, eq, n.pos);
      return eq;
    };
  }
  const value = compileNode(src);
  return (c) => {
    const v = value(c);
    at(n.pos, () => assign(c, target, v, n.pos));
    return v;
  };
}

export interface LineResult {
  value: Value;
  /** The display conversion typed at the end of the line (►Frac ...), if any. */
  conv: number | null;
  /** True when the line was a STO (shows its value like any expression). */
  stored: boolean;
}

interface Compiled {
  run: (c: Ctx) => LineResult;
}

const cache = new Map<string, Compiled>();

function topLevel(ast: Node): { node: Node; conv: number | null } {
  if (ast.k === 'conv') return { node: ast.a, conv: ast.op };
  return { node: ast, conv: null };
}

export function compileTokens(toks: readonly number[]): Compiled {
  const key = toks.join(',');
  const hit = cache.get(key);
  if (hit) return hit;
  const ast = parseLine(toks);
  const { node, conv } = topLevel(ast);
  const thunk = compileNode(node);
  const stored = ast.k === 'sto';
  const compiled: Compiled = { run: (c) => ({ value: thunk(c), conv, stored }) };
  if (cache.size > 400) cache.clear();
  cache.set(key, compiled);
  return compiled;
}

/** Parse, compile (cached) and run a token line. Errors are TIErrors with a token position. */
export function evalTokens(c: Ctx, toks: readonly number[]): LineResult {
  return compileTokens(toks).run(c);
}
