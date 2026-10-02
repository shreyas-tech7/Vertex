import type { Ref } from 'react';
import type { CalcStrings } from '../site/i18n/types.ts';
import { ZOOM_MAX, ZOOM_MIN, zoomLabel } from './zoom.ts';

interface ZoomControlsProps {
  controlsRef?: Ref<HTMLDivElement>;
  strings: CalcStrings;
  zoom: number;
  onZoomOut(): void;
  onZoomIn(): void;
}

/** Minus button, percentage, plus button. The ids and markup follow the reference page. */
export function ZoomControls({ controlsRef, strings, zoom, onZoomOut, onZoomIn }: ZoomControlsProps) {
  return (
    <div id="zoom_controls" ref={controlsRef}>
      <button type="button" aria-label={strings.zoomOut} disabled={zoom <= ZOOM_MIN} onClick={onZoomOut}>
        -
      </button>
      <span id="zoom_level" role="status" aria-label={strings.zoomLabel}>
        {zoomLabel(zoom)}
      </span>
      <button type="button" aria-label={strings.zoomIn} disabled={zoom >= ZOOM_MAX} onClick={onZoomIn}>
        +
      </button>
    </div>
  );
}
