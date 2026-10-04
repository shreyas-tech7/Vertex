import { describe, expect, it } from 'vitest';
import { KEY_BY_ID, type KeyId } from '../core/os/keys.ts';
import { KeyHolders } from './keyHolders.ts';
import {
  beginLegacyPress,
  beginPress,
  endLegacyPress,
  endPress,
  inputMode,
  mouseHolder,
  touchHolder,
  type PressEvent,
} from './pointerInput.ts';

/** Records what reached the emulator. */
function output() {
  const events: string[] = [];
  const holders = new KeyHolders({
    setKey: (row, col, down) => events.push(`${row}:${col}:${down ? 'down' : 'up'}`),
    tapKey: (row, col) => events.push(`${row}:${col}:tap`),
  });
  return { holders, events };
}

const ENTER: KeyId = 'ENTER';
const CELL = KEY_BY_ID.get(ENTER)!;

function pointerEvent(over: Partial<PressEvent> = {}): PressEvent {
  let prevented = false;
  return {
    pointerId: 1,
    pointerType: 'mouse',
    button: 0,
    preventDefault: () => {
      prevented = true;
    },
    currentTarget: { setPointerCapture: () => {} },
    ...over,
    get prevented() {
      return prevented;
    },
  } as PressEvent;
}

describe('pointer input', () => {
  it('presses on pointer down and releases on pointer up', () => {
    const { holders, events } = output();
    beginPress(pointerEvent(), holders, ENTER);
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`]);
    endPress({ pointerId: 1 }, holders, ENTER);
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`, `${CELL.row}:${CELL.col}:up`]);
  });

  it('keeps two pointers apart, so one finger lifting does not release the other', () => {
    const { holders, events } = output();
    beginPress(pointerEvent({ pointerId: 1, pointerType: 'touch' }), holders, ENTER);
    beginPress(pointerEvent({ pointerId: 2, pointerType: 'touch' }), holders, ENTER);
    endPress({ pointerId: 1 }, holders, ENTER);
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`]);
    endPress({ pointerId: 2 }, holders, ENTER);
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`, `${CELL.row}:${CELL.col}:up`]);
  });

  it('ignores the right and middle mouse buttons', () => {
    const { holders, events } = output();
    beginPress(pointerEvent({ button: 2 }), holders, ENTER);
    beginPress(pointerEvent({ button: 1 }), holders, ENTER);
    expect(events).toEqual([]);
  });

  it('stops the browser from doing its own thing with the press', () => {
    const { holders } = output();
    const event = pointerEvent();
    beginPress(event, holders, ENTER);
    expect((event as unknown as { prevented: boolean }).prevented).toBe(true);
  });

  it('survives setPointerCapture refusing, when the pointer is already gone', () => {
    const { holders, events } = output();
    const event = pointerEvent({
      currentTarget: {
        setPointerCapture: () => {
          throw new Error('pointer is gone');
        },
      },
    });
    expect(() => beginPress(event, holders, ENTER)).not.toThrow();
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`]);
  });

  it('presses with the fallback for a browser without PointerEvent', () => {
    const { holders, events } = output();
    beginLegacyPress(holders, ENTER, mouseHolder);
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`]);
    endLegacyPress(holders, ENTER, mouseHolder);
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`, `${CELL.row}:${CELL.col}:up`]);
  });

  it('gives touch and mouse their own holders so they cannot cancel each other', () => {
    expect(touchHolder(0)).not.toBe(mouseHolder);
    expect(touchHolder(1)).not.toBe(touchHolder(2));
    const { holders, events } = output();
    beginLegacyPress(holders, ENTER, mouseHolder);
    beginLegacyPress(holders, ENTER, touchHolder(0));
    endLegacyPress(holders, ENTER, mouseHolder);
    expect(events).toEqual([`${CELL.row}:${CELL.col}:down`]);
  });

  it('picks pointer handlers when the browser has PointerEvent', () => {
    expect(inputMode(true)).toBe('pointer');
    expect(inputMode(false)).toBe('legacy');
  });
});
