/**
 * Where the calculator's ROM comes from.
 *
 * The site serves one ROM next to the page, at `rom/ti84ce.rom` by default, and the calculator boots it on its own
 * the moment the page opens. No visitor is ever asked to pick a file. The ROM is a dump the site owner made from a
 * calculator they own: Vertex does not ship one, and this repository holds none (`npm run scan` fails if it ever
 * does).
 *
 * `VITE_ROM_URL` points somewhere else at build time, for a host that keeps the ROM on another path or origin:
 *
 *   VITE_ROM_URL=https://cdn.example.com/ti84ce.rom npm run build
 *
 * The bytes are cached in IndexedDB (see `useCalculator.ts`), so a second visit revalidates with `If-None-Match`
 * instead of downloading four megabytes again. A conditional request that answers 304 boots the copy in storage and
 * downloads nothing.
 */
import type { RomCheck } from './emulator/protocol.ts';
import { preflightRom } from './romCheck.ts';

/** Where the ROM is served from, relative to the page. One place to change it. */
export const ROM_PATH = 'rom/ti84ce.rom';

/** What the server said about the file, so a changed ROM is noticed without reading it all again. */
export interface RomVersion {
  size: number;
  etag: string;
  lastModified: string;
}

export type RomDownload =
  /** `bytes` is undefined when the server answered 304: the copy in storage is still the right one. */
  | { ok: true; bytes: ArrayBuffer | undefined; version: RomVersion }
  | { ok: false; reason: 'missing' | 'offline' | 'unavailable' | 'invalid' };

/** The URL the ROM is fetched from. `VITE_ROM_URL` wins when the build sets it. */
export function romUrl(): string {
  const configured = import.meta.env.VITE_ROM_URL;
  return typeof configured === 'string' && configured.trim() !== '' ? configured.trim() : ROM_PATH;
}

/** Reads the size and the two conditional-request headers the server sent. */
export function romVersionOf(response: Response, size: number): RomVersion {
  return {
    size,
    etag: response.headers.get('etag') ?? '',
    lastModified: response.headers.get('last-modified') ?? '',
  };
}

/** Two ROMs are the same file when size, ETag and Last-Modified all agree. */
export function sameVersion(a: RomVersion | undefined, b: RomVersion | undefined): boolean {
  if (!a || !b) return false;
  return a.size === b.size && a.etag === b.etag && a.lastModified === b.lastModified;
}

/**
 * Fetches the ROM, or asks whether the copy in storage is still current.
 *
 * The size and header preflight runs here, on the bytes in memory, so a wrong file at that path is reported before
 * the emulator is asked. CEmu's own checks in the worker still decide in the end.
 */
export async function downloadRom(url: string, cached?: RomVersion): Promise<RomDownload> {
  const headers = new Headers();
  if (cached?.etag) headers.set('if-none-match', cached.etag);
  else if (cached?.lastModified) headers.set('if-modified-since', cached.lastModified);

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      credentials: 'same-origin',
      // The bytes go into IndexedDB, which wants a buffer anyway, and a redirect to a login page must not be followed.
      redirect: 'follow',
    });
  } catch {
    // No connection, or the request was blocked. A copy in storage still boots.
    return { ok: false, reason: 'offline' };
  }

  if (response.status === 304 && cached) return { ok: true, bytes: undefined, version: cached };
  if (response.status === 404 || response.status === 410) return { ok: false, reason: 'missing' };
  if (!response.ok) return { ok: false, reason: 'unavailable' };

  let bytes: ArrayBuffer;
  try {
    bytes = await response.arrayBuffer();
  } catch {
    return { ok: false, reason: 'offline' };
  }
  const version = romVersionOf(response, bytes.byteLength);
  // The fast preflight first: a placeholder or a half-written file never reaches the emulator.
  const check: RomCheck = preflightRom(new Uint8Array(bytes));
  if (!check.ok) return { ok: false, reason: 'invalid' };
  return { ok: true, bytes, version };
}
