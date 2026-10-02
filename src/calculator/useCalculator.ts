import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyId } from '../core/os/keys.ts';
import { fill } from '../site/i18n/format.ts';
import type { CalcStrings } from '../site/i18n/types.ts';
import { EmulatorClient } from './emulator/client.ts';
import { LCD_HEIGHT, LCD_WIDTH, STATUS_POWERED_OFF, type RomRejection } from './emulator/protocol.ts';
import { KeyHolders } from './keyHolders.ts';
import { KeyboardController } from './keyboard.ts';
import { CalculatorStorage } from './storage.ts';
import { classifyDroppedFile } from './files.ts';

export type Phase = 'starting' | 'needRom' | 'running' | 'failed';
export type Busy = 'checking' | 'booting' | null;
type ErrorKey = RomRejection | 'storage' | 'crashed' | 'unreadable';

export interface Toast {
  text: string;
  tone: 'info' | 'error';
}

const AUTOSAVE_MS = 30_000;

/** Runs the whole calculator page: storage, the emulator worker, input and saving. */
export function useCalculator(strings: CalcStrings, brand: string) {
  const [phase, setPhase] = useState<Phase>('starting');
  const [hasRom, setHasRom] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [rows, setRows] = useState<readonly number[]>([0, 0, 0, 0, 0, 0, 0, 0]);
  const [held, setHeld] = useState<ReadonlySet<KeyId>>(new Set());
  const [poweredOff, setPoweredOff] = useState(false);
  const [dragging, setDragging] = useState(false);

  const canvas = useRef<HTMLCanvasElement | null>(null);
  const clientRef = useRef<EmulatorClient | null>(null);
  const storage = useMemo(() => new CalculatorStorage(), []);
  const romSize = useRef<number | undefined>(undefined);
  const saving = useRef<Promise<void> | null>(null);
  const dirty = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const live = useRef({ phase, panelOpen });
  useEffect(() => {
    live.current = { phase, panelOpen };
  }, [phase, panelOpen]);

  const holders = useMemo(
    () =>
      new KeyHolders({
        setKey: (row, col, down) => {
          dirty.current = true;
          clientRef.current?.setKey(row, col, down);
        },
        tapKey: (row, col) => {
          dirty.current = true;
          clientRef.current?.tapKey(row, col);
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

  const blankScreen = useCallback(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    context.fillStyle = '#000';
    context.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
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

  // Start up: read storage, wait for WebAssembly, boot from the saved state or the ROM.
  useEffect(() => {
    const client = new EmulatorClient();
    clientRef.current = client;
    let alive = true;
    client.events = {
      frame: paint,
      keys: (next) => setRows(next),
      status: (flags) => setPoweredOff((flags & STATUS_POWERED_OFF) !== 0),
      crashed: () => {
        setError('crashed');
        setPhase('failed');
      },
    };
    void (async () => {
      let stored;
      try {
        stored = await storage.getRom();
      } catch {
        stored = undefined;
      }
      if (!alive) return;
      if (!stored) {
        setPhase('needRom');
        setPanelOpen(true);
        return;
      }
      setHasRom(true);
      if (!(await client.whenReady())) {
        if (alive) {
          setError('unavailable');
          setPhase('failed');
        }
        return;
      }
      let state;
      try {
        state = await storage.getState(stored.size);
      } catch {
        state = undefined;
      }
      const result = await client.boot({ rom: stored.data, state: state?.data });
      if (!alive) return;
      if (result.ok) {
        romSize.current = stored.size;
        setPhase('running');
        if (document.visibilityState === 'hidden') client.pause();
      } else {
        setError(result.reason === 'noSource' ? 'unavailable' : result.reason);
        setHasRom(false);
        setPhase('needRom');
        setPanelOpen(true);
      }
    })();
    return () => {
      alive = false;
      client.dispose();
      clientRef.current = null;
    };
  }, [paint, storage]);

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
      if (live.current.phase !== 'running' || live.current.panelOpen) return false;
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

  /** Checks a ROM with CEmu, stores it, and boots it. Returns true on success. */
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
      if (!(await client.whenReady())) {
        setError('unavailable');
        setBusy(null);
        return false;
      }
      const check = await client.validateRom(buffer);
      if (!check.ok) {
        setError(check.reason);
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
      const result = await client.boot({ rom: buffer });
      setBusy(null);
      if (!result.ok) {
        setError(result.reason === 'noSource' ? 'unavailable' : result.reason);
        return false;
      }
      romSize.current = buffer.byteLength;
      setHasRom(true);
      setPanelOpen(false);
      setPhase('running');
      if (!stored) showToast({ text: strings.errors.storage, tone: 'error' }, 8000);
      return true;
    },
    [showToast, storage, strings],
  );

  const removeRom = useCallback(async () => {
    const client = clientRef.current;
    await client?.boot({});
    try {
      await storage.clear();
    } catch {
      /* nothing stored, or storage is blocked */
    }
    romSize.current = undefined;
    keyboard.releaseAll();
    holders.releaseAll();
    blankScreen();
    setError(null);
    setHasRom(false);
    setPhase('needRom');
    setPanelOpen(true);
  }, [blankScreen, holders, keyboard, storage]);

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
    panelOpen,
    busy,
    error,
    toast,
    rows,
    held,
    poweredOff,
    dragging,
    canvas,
    holders,
    loadRom,
    removeRom,
    openPanel: () => {
      setError(null);
      setPanelOpen(true);
    },
    closePanel: () => {
      setError(null);
      setPanelOpen(false);
    },
  };
}
