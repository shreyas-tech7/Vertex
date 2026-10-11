import { afterEach, describe, expect, it } from 'vitest';
import { buildSyntheticRom } from '../test-support/syntheticRom.ts';
import { ROM_PATH, downloadRom, romUrl, romVersionOf, sameVersion, type RomVersion } from './romSource.ts';

/**
 * The ROM the site serves, fetched and checked before the emulator sees it. Every ROM in this file is the synthetic
 * fixture: a test file, not a calculator image.
 */
const ROM = buildSyntheticRom().buffer as ArrayBuffer;
const VERSION: RomVersion = { size: ROM.byteLength, etag: '"v1"', lastModified: 'Mon, 01 Jan 2024 00:00:00 GMT' };

type Fetch = typeof globalThis.fetch;

/** Replaces fetch for one test. The fake never touches the network. */
function withFetch(fetch: Fetch): void {
  original = globalThis.fetch;
  globalThis.fetch = fetch;
}

let original: Fetch | undefined;

afterEach(() => {
  if (original) globalThis.fetch = original;
  original = undefined;
});

const response = (init: { status: number; body?: ArrayBuffer | string; headers?: Record<string, string> }) =>
  new Response(init.body as BodyInit | undefined, { status: init.status, headers: init.headers });

describe('romSource', () => {
  it('serves the ROM from one path, which the build can point elsewhere', () => {
    expect(ROM_PATH).toBe('rom/ti84ce.rom');
    // No VITE_ROM_URL in the test environment, so the default stands.
    expect(romUrl()).toBe(ROM_PATH);
  });

  it('reads the size, the ETag and Last-Modified a server sent', () => {
    expect(romVersionOf(response({ status: 200, headers: { etag: '"a"', 'last-modified': 'today' } }), 12)).toEqual(
      { size: 12, etag: '"a"', lastModified: 'today' },
    );
    expect(romVersionOf(response({ status: 200 }), 4)).toEqual({ size: 4, etag: '', lastModified: '' });
  });

  it('knows when two versions are the same file', () => {
    expect(sameVersion(VERSION, { ...VERSION })).toBe(true);
    expect(sameVersion(VERSION, { ...VERSION, etag: '"v2"' })).toBe(false);
    expect(sameVersion(VERSION, undefined)).toBe(false);
  });

  it('downloads the ROM the site serves', async () => {
    withFetch(async () => response({ status: 200, body: ROM, headers: { etag: '"v1"' } }));
    const result = await downloadRom(ROM_PATH);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bytes?.byteLength).toBe(ROM.byteLength);
    expect(result.version.etag).toBe('"v1"');
  });

  it('asks whether the copy in storage is still current', async () => {
    let sent: HeadersInit | undefined;
    withFetch(async (_url, init) => {
      sent = init?.headers;
      return response({ status: 304 });
    });
    const result = await downloadRom(ROM_PATH, VERSION);
    expect(new Headers(sent).get('if-none-match')).toBe('"v1"');
    // A 304 downloads nothing: the bytes in storage are still the right ones.
    expect(result).toEqual({ ok: true, bytes: undefined, version: VERSION });
  });

  it('falls back to Last-Modified when the server sent no ETag', async () => {
    let sent: HeadersInit | undefined;
    withFetch(async (_url, init) => {
      sent = init?.headers;
      return response({ status: 304 });
    });
    await downloadRom(ROM_PATH, { ...VERSION, etag: '' });
    expect(new Headers(sent).get('if-modified-since')).toBe(VERSION.lastModified);
  });

  it('reports a site with no ROM, and a host that answers with an error', async () => {
    withFetch(async () => response({ status: 404 }));
    expect(await downloadRom(ROM_PATH)).toEqual({ ok: false, reason: 'missing' });
    withFetch(async () => response({ status: 500 }));
    expect(await downloadRom(ROM_PATH)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('reports a lost connection instead of throwing', async () => {
    withFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect(await downloadRom(ROM_PATH)).toEqual({ ok: false, reason: 'offline' });
  });

  it('refuses a file at that path which cannot be a ROM', async () => {
    withFetch(async () => response({ status: 200, body: new ArrayBuffer(0x400000) }));
    expect(await downloadRom(ROM_PATH)).toEqual({ ok: false, reason: 'invalid' });
  });
});
