import { useEffect, useRef } from 'react';
import { APP_NAME } from '../core/brand';
import { KEYS } from '../core/os/keys';

/** M0 placeholder: a calculator-shaped face with a blank LCD. Replaced by the real shell in M2. */
export function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--lcd-bg') || '#a9c4a0';
    ctx.fillRect(0, 0, 96, 64);
  }, []);
  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col items-center gap-4 p-4">
      <h1 className="text-sm tracking-widest uppercase opacity-70">{APP_NAME}</h1>
      <canvas
        ref={canvas}
        width={96}
        height={64}
        aria-label="Calculator screen"
        className="lcd-canvas w-full"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="grid w-full grid-cols-5 gap-2">
        {KEYS.map((key) => (
          <button
            key={key.id}
            type="button"
            aria-label={key.aria}
            className="rounded bg-slate-700 p-2 text-xs"
          >
            {key.label}
          </button>
        ))}
      </div>
    </main>
  );
}
