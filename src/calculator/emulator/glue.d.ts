declare module '*/vertex-cemu.js' {
  import type { CemuModule } from './core.ts';
  const createVertexCemu: () => Promise<CemuModule>;
  export default createVertexCemu;
}
