import { useRef, useState, type DragEvent } from 'react';
import { splitAt } from '../site/i18n/format.ts';
import type { CalcStrings } from '../site/i18n/types.ts';
import type { Busy } from './useCalculator.ts';

export const CEMU_DOCS_URL = 'https://ce-programming.github.io/CEmu/';

interface RomPanelProps {
  strings: CalcStrings;
  /** True when a ROM is already stored: the panel then offers Replace, Remove and Cancel. */
  hasRom: boolean;
  busy: Busy;
  error: string | null;
  onFile(file: File): void;
  onRemove(): void;
  onCancel(): void;
}

/** The panel that sits where the LCD is until the visitor has loaded a ROM. */
export function RomPanel({ strings, hasRom, busy, error, onFile, onRemove, onCancel }: RomPanelProps) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const hint = splitAt(strings.romHint, 'link');
  const working = busy !== null;

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setOver(false);
    const file = event.dataTransfer.files[0];
    if (file && !working) onFile(file);
  };

  return (
    <div className="rom-panel" data-no-calc-keys role="region" aria-labelledby="rom-heading">
      <h1 id="rom-heading">{strings.romHeading}</h1>
      <div
        className={`rom-drop${over ? ' is-over' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        <p>{working ? (busy === 'checking' ? strings.checking : strings.starting) : strings.romDrop}</p>
        <div className="rom-actions">
          <input
            ref={input}
            type="file"
            hidden
            data-testid="rom-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) onFile(file);
            }}
          />
          <button
            type="button"
            className="rom-button"
            disabled={working}
            onClick={() => input.current?.click()}
          >
            {hasRom ? strings.replace : strings.romChoose}
          </button>
          {hasRom && (
            <button
              type="button"
              className="rom-button rom-button-quiet"
              disabled={working}
              onClick={onRemove}
            >
              {strings.remove}
            </button>
          )}
        </div>
      </div>
      <p className="rom-error" role="alert">
        {error}
      </p>
      <p className="rom-hint">
        {hint ? (
          <>
            {hint[0]}
            <a href={CEMU_DOCS_URL} target="_blank" rel="noopener noreferrer">
              {strings.romHintLink}
            </a>
            {hint[1]}
          </>
        ) : (
          strings.romHint
        )}
      </p>
      {hasRom && (
        <button type="button" className="rom-cancel" disabled={working} onClick={onCancel}>
          {strings.cancel}
        </button>
      )}
    </div>
  );
}
