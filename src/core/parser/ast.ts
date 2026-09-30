import type { Num } from '../numbers/complex';

/** Expression tree. `pos` is the index of the node's first token in the flat token list (for error cursors). */
export type Node =
  | { k: 'num'; v: Num; pos: number }
  | { k: 'const'; c: number; pos: number } // π ℯ ⅈ rand Ans getKey tvm_*
  | { k: 'var'; c: number; pos: number } // real variable, window/stat/finance variable
  | { k: 'ref'; c: number; pos: number } // a whole list / matrix / string / equation variable
  | { k: 'ulist'; name: string; pos: number } // ∟NAME
  | { k: 'list'; items: Node[]; pos: number }
  | { k: 'mat'; rows: Node[][]; pos: number }
  | { k: 'str'; toks: number[]; pos: number }
  | { k: 'neg'; a: Node; pos: number }
  | { k: 'post'; op: number; a: Node; pos: number }
  | { k: 'dms'; deg: Node; min: Node | null; sec: Node | null; pos: number }
  | { k: 'bin'; op: number; a: Node; b: Node; pos: number }
  | { k: 'call'; fn: number; args: Node[]; pos: number }
  | { k: 'index'; base: Node; args: Node[]; pos: number }
  | { k: 'conv'; op: number; a: Node; pos: number }
  | { k: 'sto'; a: Node; target: Node; pos: number; src: number[] };

export type NodeKind = Node['k'];
