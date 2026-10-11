import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyId } from '../core/os/keys.ts';
import { fill } from '../site/i18n/format.ts';
import type { CalcStrings } from '../site/i18n/types.ts';
import { startEmulatorEarly } from './emulator/early.ts';
import { LCD_HEIGHT, LCD_WIDTH, STATUS_POWERED_OFF, type RomRejection } from './emulator/protocol.ts';
import { classifyDroppedFile } from './files.ts';
import { canRunEmulator, detectFeatures, type DetectedFeatures } from './features.ts';
import { KeyHolders } from './keyHolders.ts';
import { KeyboardController } from './keyboard.ts';
import { preflightRom } from './romCheck.ts';
import { downloadRom, romUrl, sameVersion, type RomVersion } from './romSource.ts';
import { CalculatorStorage, persistBrowserStorage, type StoredRom } from './storage.ts';

export type Phase = 'starting' | 'needRom' | 'running' | 'failed' | 'unsupported';
export type Busy = 'checking' | 'booting' | null;
type ErrorKey = RomRejection | 'storage' | 'crashed' | 'unreadable' | 'missing' | 'offline';

/** The ETag and Last-Modified of a ROM in storage, in the shape the conditional request wants. */
function cachedVersion(rom: StoredRom | undefined, url: string): RomVersion | undefined {
  if (!rom || rom.source !== url) return undefined;
  if (!rom.etag && !rom.lastModified) return undefined;
  return { size: rom.size, etag: rom.etag ?? '', lastModified: rom.lastModified ?? '' };
}

export interface Toast {
  text: string;
  tone: 'info' | 'error';
}

const AUTOSAVE_MS = 30_000;
const RESTORED_TOAST_MS = 3500;

/** True once the page has tried the stored ROM. A remount must not boot the emulator twice. */
let autoBootStarted = false;

/** Runs the whole calculator page: storage, the emulator worker, input and saving. */
export function useCalculator(strings: CalcStrings, brand: string) {
  const [hasRom, setHasRom] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [rows, setRows] = useState<readonly number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [held, setHeld] = useState<ReadonlySet<KeyId>>(new Set());
  const [poweredOff, setPoweredOff] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [bootSource, setBootSource] = useState<'state' | 'rom' | null>(null);
  const [features] = useState<DetectedFeatures>(() => detectFeatures());
  const supported = canRunEmulator(features);
  // A browser that cannot run the emulator at all hears about it at once, instead of watching a dead screen.
  const [phase, setPhase] = useState<Phase>(supported ? 'starting' : 'unsupported');

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const clientRef = useRef(startEmulatorEarly());
  const storage = useMemo(() => new CalculatorStorage(), []);
  const romSize = useRef<number | undefined>(undefined);
  const saving = useRef<Promise<void> | null>(null);
  const dirty = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const live = useRef({ phase });
  useEffect(() => {
    live.current = { phase };
  }, [phase]);

  const holders = useMemo(
    () =>
      new KeyHolders({
        setKey: (row, col, down) => {
          dirty.current = true;
          clientRef.current.setKey(row, col, down);
        },
        tapKey: (row, col) => {
          dirty.current = true;
          clientRef.current.tapKey(row, col);
        },
      }),
    [],
  );
  const keyboard = useMemo(() => new KeyboardController(holders), [holders]);

  const showToast = useCallback((next: Toast | null, ms = 4000) => {
    clearTimeout(toastTimer.current);
    setToast(next);
    if (next && ms > 0) toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const paint = useCallback((pixels: Uint8ClampedArray) => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.putImageData(
      new ImageData(pixels as Uint8ClampedArray<ArrayBuffer>, LCD_WIDTH, LCD_HEIGHT),
      0,
      0,
    );
  }, []);

  /** Writes the emulator's state to IndexedDB. Safe to call often: calls that overlap share one save. */
  const saveNow = useCallback((): Promise<void> => {
    const client = clientRef.current;
    const size = romSize.current;
    if (!client || size === undefined || live.current.phase !== 'running') return Promise.resolve();
    if (saving.current) return saving.current;
    const job = (async () => {
      try {
        const data = await client.saveState();
        if (data) {
          await storage.putState(data, size);
          dirty.current = false;
        }
      } catch {
        /* storage blocked or full: the calculator keeps running, it just will not resume next time */
      }
    })().finally(() => {
      saving.current = null;
    });
    saving.current = job;
    return job;
  }, [storage]);

  /**
   * Start up. Nothing here waits for a click.
   *
   * The worker was already started before React ran, so this only gets the ROM the site serves, checks it, and boots.
   * The download, the copy in IndexedDB and the WebAssembly compile all run at the same time.
   *
   * Order of preference: the ROM the site serves, then the copy this browser kept. A site that serves no ROM, and a
   * browser that has never stored one, ends in one plain sentence inside the screen, never in a file picker.
   */
  useEffect(() => {
    const client = clientRef.current;
    client.events = {
      frame: paint,
      keys: (next) => setRows(next),
      status: (flags) => setPoweredOff((flags & STATUS_POWERED_OFF) !== 0),
      crashed: () => {
        setError('crashed');
        setPhase('failed');
      },
    };
    if (!supported) return;
    if (autoBootStarted) return;
    autoBootStarted = true;

    void (async () => {
      const url = romUrl();
      const [stored, state] = await Promise.all([
        storage.getRom().catch(() => undefined),
        storage.getState().catch(() => undefined),
      ]);
      const cached = stored && stored.data.byteLength > 0 ? stored : undefined;
      const download = await downloadRom(url, cachedVersion(cached, url));

      // The served file wins. Whatever is in storage is the fallback when it is gone or unreachable.
      let bytes: ArrayBuffer | undefined = download.ok ? download.bytes : undefined;
      let version: RomVersion | undefined = download.ok ? download.version : undefined;
      let name = url.split('/').pop() || 'ti84ce.rom';
      let fromCache = false;

      if (!bytes && cached) {
        bytes = cached.data;
        version = undefined;
        name = cached.name;
        fromCache = true;
      }
      if (!bytes) {
        // Nothing served and nothing stored: say so in the screen, and never ask the visitor for a file.
        setError(download.ok ? 'missing' : download.reason === 'missing' ? 'missing' : download.reason);
        setPhase('needRom');
        return;
      }
      if (fromCache && !download.ok) {
        // The ROM could not be reached, but an older copy boots. Say it once, quietly.
        showToast({ text: strings.errors.offline, tone: 'info' }, 6000);
      }

      // A file that cannot possibly be a ROM is reported before the emulator is asked.
      const quick = preflightRom(new Uint8Array(bytes));
      if (!quick.ok) {
        setError(quick.reason === 'unavailable' ? 'unavailable' : quick.reason);
        setPhase('needRom');
        return;
      }

      if (!(await client.whenReady())) {
        setError('unavailable');
        setPhase('failed');
        return;
      }

      setBusy('booting');
      const saved = state && state.romSize === bytes.byteLength ? state : undefined;
      const result = await client.boot({ rom: bytes, state: saved?.data });
      setBusy(null);
      if (!result.ok) {
        setError(result.reason === 'noSource' ? 'unavailable' : result.reason);
        setHasRom(false);
        setPhase('needRom');
        return;
      }

      romSize.current = bytes.byteLength;
      setBootSource(result.from);
      setHasRom(true);
      setPhase('running');
      if (result.from === 'state') showToast({ text: strings.restoring, tone: 'info' }, RESTORED_TOAST_MS);
      if (document.visibilityState === 'hidden') client.pause();

      // Keep the served ROM, and only write it when it is not already there: re-saving would drop the saved state.
      const served = version !== undefined ? cachedVersion(cached, url) : undefined;
      const unchanged =
        cached !== undefined &&
        cached.source === url &&
        cached.size === bytes.byteLength &&
        (served === undefined || sameVersion(served, version));
      if (download.ok && download.bytes && !unchanged) {
        const stored = await storage
          .putRom(name, download.bytes, {
            source: url,
            etag: version?.etag,
            lastModified: version?.lastModified,
          })
          .then(() => true)
          .catch(() => false);
        void persistBrowserStorage();
        if (!stored) showToast({ text: strings.errors.storage, tone: 'error' }, 8000);
      } else if (download.ok && download.bytes) {
        void persistBrowserStorage();
      }
    })();
  }, [paint, showToast, storage, strings, supported]);

  // Pause while the tab is hidden, and save the state when it hides or closes.
  useEffect(() => {
    const onVisibility = () => {
      const client = clientRef.current;
      if (!client) return;
      if (document.visibilityState === 'hidden') {
        keyboard.releaseAll();
        holders.releaseAll();
        client.pause();
        void saveNow();
      } else {
        client.resume();
      }
    };
    const onPageHide = () => {
      keyboard.releaseAll();
      holders.releaseAll();
      void saveNow();
    };
    const onBlur = () => {
      keyboard.releaseAll();
      holders.releaseAll();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('blur', onBlur);
    const autosave = setInterval(() => {
      if (document.visibilityState === 'visible' && dirty.current) void saveNow();
    }, AUTOSAVE_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('blur', onBlur);
      clearInterval(autosave);
    };
  }, [holders, keyboard, saveNow]);

  useEffect(() => {
    holders.onChange = setHeld;
  }, [holders]);

  // Physical keyboard. It is off while the ROM panel is open so the panel's own controls keep working.
  useEffect(() => {
    const active = (event: KeyboardEvent): boolean => {
      if (live.current.phase !== 'running') return false;
      const target = event.target as HTMLElement | null;
      return !target?.closest('input, textarea, select, [data-no-calc-keys]');
    };
    const down = (event: KeyboardEvent) => {
      if (active(event)) keyboard.keyDown(event);
    };
    const up = (event: KeyboardEvent) => {
      if (active(event)) keyboard.keyUp(event);
      else if (event.type === 'keyup') keyboard.releaseAll();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [keyboard]);

  /**
   * Checks a ROM dropped on the page, stores it, and boots it. Returns true on success.
   *
   * The site serves its own ROM, so this is the back door for the owner: dropping a `.rom` file on the calculator
   * replaces the served one without a rebuild. No visitor is ever asked to do it, and nothing in the interface
   * mentions it.
   *
   * The size and header check runs first, in microseconds, so a wrong file is refused before the emulator is asked.
   * What survives goes to CEmu's own checks in the worker.
   */
  const loadRom = useCallback(
    async (file: File): Promise<boolean> => {
      const client = clientRef.current;
      if (!client) return false;
      setError(null);
      setBusy('checking');
      let buffer: ArrayBuffer;
      try {
        buffer = await file.arrayBuffer();
      } catch {
        setError('unreadable');
        setBusy(null);
        return false;
      }
      const quick = preflightRom(new Uint8Array(buffer));
      if (!quick.ok) {
        setError(quick.reason === 'unavailable' ? 'unavailable' : quick.reason);
        setBusy(null);
        return false;
      }
      if (!(await client.whenReady())) {
        setError('unavailable');
        setBusy(null);
        return false;
      }
      const check = await client.validateRom(buffer);
      if (!check.ok) {
        setError(check.reason === 'unavailable' ? 'unavailable' : check.reason);
        setBusy(null);
        return false;
      }
      setBusy('booting');
      let stored = true;
      try {
        await storage.putRom(file.name, buffer);
      } catch {
        stored = false;
      }
      // Ask the browser to keep it. Chrome grants it silently, Safari does not have the call.
      void persistBrowserStorage();
      const result = await client.boot({ rom: buffer });
      setBusy(null);
      if (!result.ok) {
        setError(result.reason === 'noSource' ? 'unavailable' : result.reason);
        return false;
      }
      romSize.current = buffer.byteLength;
      setBootSource('rom');
      setHasRom(true);
      setPhase('running');
      if (!stored) showToast({ text: strings.errors.storage, tone: 'error' }, 8000);
      return true;
    },
    [showToast, storage, strings],
  );

  const sendFile = useCallback(
    async (file: File) => {
      const client = clientRef.current;
      const name = file.name;
      if (!client || live.current.phase !== 'running') {
        showToast({ text: strings.transfer.notRunning, tone: 'error' });
        return;
      }
      showToast({ text: fill(strings.transfer.sending, { name }), tone: 'info' }, 0);
      let data: ArrayBuffer;
      try {
        data = await file.arrayBuffer();
      } catch {
        showToast({ text: fill(strings.transfer.failed, { name }), tone: 'error' });
        return;
      }
      const result = await client.send(name, data);
      showToast(
        result.ok
          ? { text: fill(strings.transfer.sent, { name }), tone: 'info' }
          : { text: fill(strings.transfer.failed, { name }), tone: 'error' },
      );
    },
    [showToast, strings],
  );

  /** Files dropped anywhere on the page: ROMs replace the ROM, TI variable files go to the calculator. */
  const handleFiles = useCallback(
    async (files: readonly File[]) => {
      for (const file of files) {
        const kind = classifyDroppedFile(file.name, file.size);
        if (kind === 'rom') {
          await loadRom(file);
        } else if (kind === 'variable') {
          await sendFile(file);
        } else {
          showToast({ text: fill(strings.transfer.unsupported, { name: file.name, brand }), tone: 'error' });
        }
      }
    },
    [brand, loadRom, sendFile, showToast, strings],
  );

  useEffect(() => {
    let depth = 0;
    const hasFiles = (event: DragEvent) => event.dataTransfer?.types.includes('Files') ?? false;
    const over = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
    };
    const enter = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth++;
      setDragging(true);
    };
    const leave = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) setDragging(false);
    };
    const drop = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      depth = 0;
      setDragging(false);
      const files = [...(event.dataTransfer?.files ?? [])];
      if (files.length > 0) void handleFiles(files);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [handleFiles]);

  return {
    phase,
    hasRom,
    busy,
    error,
    toast,
    rows,
    held,
    poweredOff,
    dragging,
    bootSource,
    features,
    canvas,
    holders,
    loadRom,
  };
}
