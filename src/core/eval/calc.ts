import { isTIError } from '../errors';
import { tokenize } from '../text/tokenize';
import { Ctx, defaultSettings, type Settings } from './ctx';
import { evalTokens } from './compile';
import './index';
import { Rng } from './rng';
import { valueText } from './valuefmt';
import type { Value } from './values';

export interface CalcResult {
  /** Display text, or ERR:NAME for an error. */
  text: string;
  value?: Value;
  errorName?: string;
  /** Token index of the error, when known. */
  errorPos?: number;
}

/** A headless calculator for tests and tools: type a line of text, get the displayed result. */
export class Calc {
  readonly ctx: Ctx;
  constructor(settings: Partial<Settings> = {}, seed = 0) {
    this.ctx = new Ctx(undefined, { ...defaultSettings(), ...settings }, new Rng(seed));
  }
  get settings(): Settings {
    return this.ctx.settings;
  }
  run(text: string): CalcResult {
    try {
      const toks = tokenize(text);
      const r = evalTokens(this.ctx, toks);
      this.ctx.mem.ans = r.value;
      return { text: valueText(r.value, { settings: this.ctx.settings, conv: r.conv }), value: r.value };
    } catch (e) {
      if (isTIError(e)) return { text: e.title, errorName: e.tiName, errorPos: e.pos };
      throw e;
    }
  }
  /** Run a line and return only the displayed text. */
  show(text: string): string {
    return this.run(text).text;
  }
}

/** One-shot evaluation on a fresh calculator. */
export function calc(text: string, settings: Partial<Settings> = {}): string {
  return new Calc(settings).show(text);
}
