import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { KEY_BY_ID, type KeyId } from '../core/os/keys.ts';
import type { KeyHolders } from './keyHolders.ts';
import { ARROW_PAD, ARROWS, BODY_WIDTH, KEY_BOXES } from './keypadLayout.ts';

interface KeypadProps {
  holders: KeyHolders;
  /** The emulated keypad's held keys, one byte per matrix row, as the worker reports them. */
  rows: readonly number[];
  held: ReadonlySet<KeyId>;
  label: string;
}

/** Renders "10^x" and "e^x" with a real superscript. Everything else prints as written. */
function legend(text: string): ReactNode {
  const at = text.indexOf('^');
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <sup>{text.slice(at + 1)}</sup>
    </>
  );
}

const matrixAttribute = (rows: readonly number[]) =>
  rows.map((r) => r.toString(16).padStart(2, '0')).join('');

export function Keypad({ holders, rows, held, label }: KeypadProps) {
  const emulatedDown = (id: KeyId): boolean => {
    const key = KEY_BY_ID.get(id)!;
    return ((rows[key.row] ?? 0) >> key.col) & 1 ? true : false;
  };

  const pointerHandlers = (id: KeyId) => {
    const release = (event: ReactPointerEvent<HTMLButtonElement>) =>
      holders.release(id, `ptr:${event.pointerId}`);
    return {
      onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          /* the pointer is already gone */
        }
        holders.press(id, `ptr:${event.pointerId}`);
      },
      onPointerUp: release,
      onPointerCancel: release,
      onLostPointerCapture: release,
      onContextMenu: (event: { preventDefault(): void }) => event.preventDefault(),
      // Assistive technology and keyboard activation click without a pointer. Real clicks have detail 1 or more.
      onClick: (event: { detail: number }) => {
        if (event.detail === 0) holders.tap(id);
      },
    };
  };

  const classes = (id: KeyId, base: string) => `${base}${held.has(id) || emulatedDown(id) ? ' is-down' : ''}`;

  return (
    <div
      className="keypad"
      role="group"
      aria-label={label}
      data-matrix={matrixAttribute(rows)}
      style={{ width: BODY_WIDTH }}
    >
      {KEY_BOXES.map((box) => {
        const key = KEY_BY_ID.get(box.id)!;
        return (
          <div key={box.id}>
            {key.second && (
              <span
                className="legend legend-second"
                aria-hidden="true"
                style={{ left: box.legendX, top: box.legendY }}
              >
                {legend(key.second)}
              </span>
            )}
            {key.alpha && (
              <span
                className="legend legend-alpha"
                aria-hidden="true"
                style={{ left: box.legendX + box.legendWidth - 30, top: box.legendY, width: 30 }}
              >
                {key.alpha}
              </span>
            )}
            <button
              type="button"
              className={classes(box.id, `key key-${box.kind}`)}
              style={{ left: box.x, top: box.y, width: box.width, height: box.height }}
              data-key={box.id}
              data-row={key.row}
              data-col={key.col}
              data-emu-down={emulatedDown(box.id)}
              aria-label={key.aria}
              title={[
                key.label,
                key.second && `2nd: ${key.second.replace('^', '')}`,
                key.alpha && `ALPHA: ${key.alpha}`,
              ]
                .filter(Boolean)
                .join(' · ')}
              {...pointerHandlers(box.id)}
            >
              {key.label}
            </button>
          </div>
        );
      })}
      <div
        className="arrow-pad"
        role="group"
        aria-label="Arrow keys"
        style={{ left: ARROW_PAD.x, top: ARROW_PAD.y, width: ARROW_PAD.size, height: ARROW_PAD.size }}
      >
        {ARROWS.map((arrow) => {
          const key = KEY_BY_ID.get(arrow.id)!;
          return (
            <button
              key={arrow.id}
              type="button"
              className={classes(arrow.id, 'arrow')}
              style={{ clipPath: arrow.clip }}
              data-key={arrow.id}
              data-row={key.row}
              data-col={key.col}
              data-emu-down={emulatedDown(arrow.id)}
              aria-label={key.aria}
              {...pointerHandlers(arrow.id)}
            >
              <span
                className="arrow-glyph"
                aria-hidden="true"
                style={{ left: `${arrow.glyph.x}%`, top: `${arrow.glyph.y}%` }}
              >
                {key.label}
              </span>
            </button>
          );
        })}
        <span className="arrow-hub" aria-hidden="true" />
      </div>
    </div>
  );
}
