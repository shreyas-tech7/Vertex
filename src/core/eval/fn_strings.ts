import { TIError } from '../errors';
import { D } from '../numbers/decimal';
import { code, isStrCode, isYCode } from '../tokens/codes';
import { evalTokens } from './compile';
import { reg } from './registry';
import { EqV, StrV, asInt, type Value } from './values';

function str(v: Value, pos: number): StrV {
  if (v instanceof StrV) return v;
  throw new TIError('DATA TYPE', pos);
}

reg(code('sub('), {
  name: 'sub(',
  min: 3,
  max: 3,
  eager: (_c, [s, b, n], pos) => {
    const t = str(s, pos);
    const begin = asInt(b, 1, 9999, 'DOMAIN', pos);
    const len = asInt(n, 0, 9999, 'DOMAIN', pos);
    if (begin > t.toks.length || begin - 1 + len > t.toks.length) throw new TIError('DOMAIN', pos);
    return new StrV(t.toks.slice(begin - 1, begin - 1 + len));
  },
});

reg(code('length('), {
  name: 'length(',
  min: 1,
  max: 1,
  eager: (_c, [s], pos) => new D(str(s, pos).toks.length),
});

reg(code('inString('), {
  name: 'inString(',
  min: 2,
  max: 3,
  eager: (_c, args, pos) => {
    const hay = str(args[0], pos).toks;
    const needle = str(args[1], pos).toks;
    const start = args.length > 2 ? asInt(args[2], 1, 9999, 'DOMAIN', pos) : 1;
    if (start > hay.length) throw new TIError('DOMAIN', pos);
    for (let i = start - 1; i + needle.length <= hay.length; i++) {
      if (needle.every((t, k) => hay[i + k] === t)) return new D(i + 1);
    }
    return new D(0);
  },
});

reg(code('expr('), {
  name: 'expr(',
  min: 1,
  max: 1,
  eager: (c, [s], pos) => {
    const t = str(s, pos);
    if (t.toks.length === 0) throw new TIError('SYNTAX', pos);
    if (c.depth >= 40) throw new TIError('MEMORY', pos);
    c.depth++;
    try {
      return evalTokens(c, t.toks).value;
    } finally {
      c.depth--;
    }
  },
});

reg(code('Equ►String('), {
  name: 'Equ►String(',
  min: 2,
  max: 2,
  lazy: (c, _args, nodes, pos) => {
    const [a, b] = nodes;
    if (a.k !== 'ref' || !isYCode(a.c) || b.k !== 'ref' || !isStrCode(b.c))
      throw new TIError('DATA TYPE', pos);
    const s = new StrV(c.mem.getEq(a.c).toks);
    c.mem.strs.set(b.c, s);
    return s;
  },
});

reg(code('String►Equ('), {
  name: 'String►Equ(',
  min: 2,
  max: 2,
  lazy: (c, args, nodes, pos) => {
    const [, b] = nodes;
    if (b.k !== 'ref' || !isYCode(b.c)) throw new TIError('DATA TYPE', pos);
    const s = str(args[0](c), pos);
    const e = new EqV(s.toks);
    c.mem.eqs.set(b.c, e);
    return e;
  },
});
