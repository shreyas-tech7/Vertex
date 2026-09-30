import type { Node } from '../parser/ast';
import type { Ctx } from './ctx';
import type { Value } from './values';

export type Thunk = (c: Ctx) => Value;

/** A built-in function token (the ones whose text ends in "("). */
export interface FnDef {
  name: string;
  min: number;
  max: number;
  /** Arguments are evaluated before the call. */
  eager?: (c: Ctx, args: Value[], pos: number) => Value;
  /** Arguments arrive unevaluated (compiled), for functions that loop over an expression. */
  lazy?: (c: Ctx, args: Thunk[], nodes: Node[], pos: number) => Value;
}

export const REGISTRY = new Map<number, FnDef>();

export function reg(code: number, def: FnDef): void {
  REGISTRY.set(code, def);
}
