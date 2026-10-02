/**
 * The Content Security Policy for every page. All assets are self-hosted, so nothing outside the site's own origin
 * is allowed. WebAssembly needs 'wasm-unsafe-eval' to compile the emulator. There is no 'unsafe-inline' and no
 * 'unsafe-eval'. React and the zoom code style elements through the CSSOM, which style-src does not block.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "frame-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** Policy for hosts that can send headers. A meta tag cannot carry frame-ancestors, so it only goes here. */
export const CONTENT_SECURITY_POLICY_HEADER = `${CONTENT_SECURITY_POLICY}; frame-ancestors 'self'`;
