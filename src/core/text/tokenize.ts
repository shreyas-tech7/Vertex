import { err } from '../errors';
import { T, code } from '../tokens/codes';
import { TOKENS, TOKEN_BY_CODE } from '../tokens/table';

interface Entry {
  text: string;
  code: number;
}

const SUBS = '₀₁₂₃₄₅₆₇₈₉';
const asciiSubs = (s: string): string => s.replace(/[₀-₉]/g, (c) => String(SUBS.indexOf(c)));

/** Tokens that are never produced by typing plain text (they would shadow letters and digits). */
function isTextMatchable(c: number, text: string): boolean {
  if (c >= 0x6201 && c <= 0x623c && text.length < 2) return false; // one-letter statistic names
  if (c >= 0x6201 && c <= 0x623c && /^(df|SS|MS)$/.test(text)) return false;
  if (c >= 0xbbb0 && c <= 0xbbca) return false; // lower-case letters: handled by the letter rule
  if (c >= 0xbbe0 && c <= 0xbbea) return false; // subscript digits
  if (c === T.SPACE) return false;
  return text.length > 0;
}

const ALIASES: ReadonlyArray<readonly [string, string]> = [
  ['->', '→'],
  ['<=', '≤'],
  ['>=', '≥'],
  ['!=', '≠'],
  ['<>', '≠'],
  ['pi', 'π'],
  ['theta', 'θ'],
  ['sqrt(', '√('],
  ['cbrt(', '³√('],
  ['asin(', 'sin⁻¹('],
  ['acos(', 'cos⁻¹('],
  ['atan(', 'tan⁻¹('],
  ['asinh(', 'sinh⁻¹('],
  ['acosh(', 'cosh⁻¹('],
  ['atanh(', 'tanh⁻¹('],
  ['e^(', 'ℯ^('],
  ['×', '*'],
  ['÷', '/'],
  ['−', '-'],
  ['ans', 'Ans'],
  ['^-1', '⁻¹'],
  ['chi²', 'χ²'],
  ['>Frac', '►Frac'],
  ['>Dec', '►Dec'],
  ['>DMS', '►DMS'],
  ['>Rect', '►Rect'],
  ['>Polar', '►Polar'],
];

const BY_FIRST = new Map<string, Entry[]>();
const SINGLE_BY_CHAR = new Map<string, number>(); // strings: one token per character

function addEntry(text: string, c: number): void {
  const k = text[0];
  let list = BY_FIRST.get(k);
  if (!list) BY_FIRST.set(k, (list = []));
  if (!list.some((e) => e.text === text)) list.push({ text, code: c });
}

for (const tk of TOKENS) {
  if (!isTextMatchable(tk.code, tk.text)) continue;
  addEntry(tk.text, tk.code);
  const a = asciiSubs(tk.text);
  if (a !== tk.text) addEntry(a, tk.code);
  const trimmed = tk.text.trim();
  if (trimmed && trimmed !== tk.text) addEntry(trimmed, tk.code);
}
for (const [alias, canonical] of ALIASES) {
  if (alias !== canonical) addEntry(alias, code(canonical));
}
for (const list of BY_FIRST.values()) list.sort((a, b) => b.text.length - a.text.length);

// single-character tokens usable inside strings
for (const tk of TOKENS) {
  if (tk.text.length === 1 && tk.code !== T.NEWLINE && tk.code !== T.QUOTE) {
    if (!SINGLE_BY_CHAR.has(tk.text) || tk.code < (SINGLE_BY_CHAR.get(tk.text) ?? 0))
      SINGLE_BY_CHAR.set(tk.text, tk.code);
  }
}
// lower-case letters in strings use the 0xBBxx lower-case tokens
for (let c = 0; c < 26; c++) SINGLE_BY_CHAR.set(String.fromCharCode(97 + c), 0xbbb0 + c + (c >= 11 ? 1 : 0));
SINGLE_BY_CHAR.set(' ', T.SPACE);

const isDigitChar = (ch: string | undefined): boolean => ch !== undefined && ch >= '0' && ch <= '9';

/** Convert typed text to a flat token list. Aliases such as `->`, `<=`, `pi` and `sqrt(` are accepted. */
export function tokenize(src: string): number[] {
  const out: number[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"') {
      out.push(T.QUOTE);
      i++;
      while (i < src.length && src[i] !== '"' && src[i] !== '\n') {
        if (src[i] === '→' || (src[i] === '-' && src[i + 1] === '>')) {
          out.push(T.STO);
          i += src[i] === '→' ? 1 : 2;
          continue;
        }
        const c = SINGLE_BY_CHAR.get(src[i]);
        if (c === undefined) throw err('SYNTAX');
        out.push(c);
        i++;
      }
      if (src[i] === '"') {
        out.push(T.QUOTE);
        i++;
      }
      continue;
    }
    if (ch === ' ' || ch === '\t' || ch === '\r') {
      // a space is only significant inside multi-character token texts such as " and "
      const list = BY_FIRST.get(' ');
      const hit = list?.find((e) => src.startsWith(e.text, i));
      if (hit) {
        out.push(hit.code);
        i += hit.text.length;
      } else i++;
      continue;
    }
    if (ch === '\n') {
      out.push(T.NEWLINE);
      i++;
      continue;
    }
    // E as EE: directly after a digit or '.', followed by a digit or a minus sign
    if (
      (ch === 'E' || ch === 'ᴇ') &&
      out.length > 0 &&
      (out[out.length - 1] === T.DOT || (out[out.length - 1] >= T.D0 && out[out.length - 1] <= T.D9)) &&
      (isDigitChar(src[i + 1]) || src[i + 1] === '⁻' || src[i + 1] === '-')
    ) {
      out.push(T.EE);
      i++;
      if (src[i] === '-') {
        out.push(T.NEG);
        i++;
      }
      continue;
    }
    if (ch === 'ᴇ') {
      out.push(T.EE);
      i++;
      continue;
    }
    // '-' after EE is a negative exponent
    if (ch === '-' && out[out.length - 1] === T.EE) {
      out.push(T.NEG);
      i++;
      continue;
    }
    const list = BY_FIRST.get(ch);
    const hit = list?.find((e) => src.startsWith(e.text, i));
    if (hit) {
      out.push(hit.code);
      i += hit.text.length;
      continue;
    }
    if (ch >= 'a' && ch <= 'z') {
      out.push(0x41 + ch.charCodeAt(0) - 97);
      i++;
      continue;
    }
    throw err('SYNTAX');
  }
  return out;
}

/** The display text of a token list (special glyphs: ⁻ ᴇ ⅈ ℯ → ►, subscripts). */
export function detokenize(toks: readonly number[]): string {
  let s = '';
  for (const c of toks) s += TOKEN_BY_CODE.get(c)?.text ?? '?';
  return s;
}
