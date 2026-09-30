/** The error names the calculator can raise (spec §7 "Errors"); each fits in 16 columns as `ERR:<NAME>`. */
export type ErrorName =
  | 'SYNTAX'
  | 'DOMAIN'
  | 'DIVIDE BY 0'
  | 'OVERFLOW'
  | 'NONREAL ANS'
  | 'DATA TYPE'
  | 'ARGUMENT'
  | 'DIM MISMATCH'
  | 'INVALID DIM'
  | 'UNDEFINED'
  | 'INVALID'
  | 'WINDOW RANGE'
  | 'INCREMENT'
  | 'NO SIGN CHNG'
  | 'BAD GUESS'
  | 'BOUND'
  | 'TOL NOT MET'
  | 'ITERATIONS'
  | 'SINGULAR MAT'
  | 'SINGULARITY'
  | 'STAT'
  | 'STAT PLOT'
  | 'BREAK'
  | 'LABEL'
  | 'ILLEGAL NEST'
  | 'MEMORY'
  | 'ARCHIVED'
  | 'MODE'
  | 'RESERVED'
  | 'DUPLICATE'
  | 'VARIABLE';

/**
 * A calculator error: a typed value with a name and a token position (index into the flat token list of the
 * entry or program line being run; -1 when unknown).
 */
export class TIError extends Error {
  readonly tiName: ErrorName;
  /** Token index of the offending token, or -1. */
  pos: number;
  /** Program line number (0-based) when raised inside a program, else -1. */
  line = -1;
  /** Name of the program being run when the error happened, if any. */
  program?: string;

  constructor(name: ErrorName, pos = -1) {
    super(`ERR:${name}`);
    this.tiName = name;
    this.pos = pos;
  }

  /** The text shown on the error screen's first line. */
  get title(): string {
    return `ERR:${this.tiName}`;
  }
}

export const err = (name: ErrorName, pos = -1): TIError => new TIError(name, pos);
export const isTIError = (e: unknown): e is TIError => e instanceof TIError;
