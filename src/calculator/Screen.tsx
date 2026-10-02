import type { ReactNode, RefObject } from 'react';
import type { CalcStrings } from '../site/i18n/types.ts';
import { LCD_HEIGHT, LCD_WIDTH } from './emulator/protocol.ts';
import { SCREEN } from './keypadLayout.ts';
import type { Toast } from './useCalculator.ts';

interface ScreenProps {
  strings: CalcStrings;
  canvas: RefObject<HTMLCanvasElement | null>;
  loading: boolean;
  toast: Toast | null;
  children?: ReactNode;
}

/** The LCD: a 320 x 240 canvas drawn at 232 x 174 with smooth scaling, with panels and messages laid over it. */
export function Screen({ strings, canvas, loading, toast, children }: ScreenProps) {
  return (
    <div
      className="screen"
      style={{ left: SCREEN.x, top: SCREEN.y, width: SCREEN.width, height: SCREEN.height }}
    >
      <canvas
        ref={canvas}
        width={LCD_WIDTH}
        height={LCD_HEIGHT}
        role="img"
        aria-label={strings.screenLabel}
      />
      {loading && (
        <div className="screen-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          <span>{strings.loading}</span>
        </div>
      )}
      {children}
      {toast && (
        <div className={`toast toast-${toast.tone}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
}
