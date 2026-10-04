/**
 * Compiles the emulator's WebAssembly module.
 *
 * Streaming compilation is used when the browser has it and the server sends the right MIME type. GitHub Pages and
 * most other hosts send `application/wasm`, but some do not, and Safari is strict about it. When either is missing
 * the module is fetched as an ArrayBuffer and compiled from that, which every browser supports.
 */

export interface WasmResponseLike {
  ok: boolean;
  status?: number;
  headers?: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}

export type FetchLike = (url: string) => Promise<WasmResponseLike>;

/** The MIME type `compileStreaming` and `instantiateStreaming` insist on. */
export const WASM_MIME_TYPE = 'application/wasm';

function sentAsWasm(response: WasmResponseLike): boolean {
  const type = response.headers?.get('content-type');
  if (!type) return false;
  return type.toLowerCase().split(';')[0]!.trim() === WASM_MIME_TYPE;
}

function streamingAvailable(): boolean {
  const wasm = (globalThis as { WebAssembly?: Record<string, unknown> }).WebAssembly;
  return typeof wasm?.compileStreaming === 'function';
}

/**
 * Compiles the module at `url`. Tries streaming first, then falls back to an ArrayBuffer, then fails with a plain
 * error. `streaming` is only for the one retry: without it a server that always sends the wrong type would be
 * fetched twice on every load.
 */
export async function compileWasm(
  url: string,
  fetchImpl: FetchLike = (target) => fetch(target) as Promise<WasmResponseLike>,
  streaming = true,
): Promise<WebAssembly.Module> {
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`could not fetch ${url} (${response.status ?? 'no status'})`);
  if (streaming && streamingAvailable() && sentAsWasm(response)) {
    try {
      return await WebAssembly.compileStreaming(response as unknown as Response);
    } catch {
      return compileWasm(url, fetchImpl, false);
    }
  }
  return WebAssembly.compile(await response.arrayBuffer());
}
