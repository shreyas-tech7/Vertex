declare module '*/vertex-cemu.js' {
  import type { CemuModule } from './core.ts';
  /**
   * Emscripten's module factory. Vertex passes `instantiateWasm` so the module is compiled with
   * `WebAssembly.compileStreaming` once and instantiated from that, with an ArrayBuffer fallback.
   */
  const createVertexCemu: (options?: Record<string, unknown>) => Promise<CemuModule>;
  export default createVertexCemu;
}
