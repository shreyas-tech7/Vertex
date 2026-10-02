// Markup and ids adapted from github.com/bifdu9898/TI84Calculator (MIT), see THIRD_PARTY_NOTICES.md.
import type { CalcStrings } from '../site/i18n/types.ts';
import { ZOOM_MIN, zoomLabel } from './zoom.ts';

interface ZoomControlsProps {
  strings: CalcStrings;
  /** The zoom shown, which is held at the cap on a narrow screen. */
  zoom: number;
  /** The largest zoom this frame can show. Plus is off once the zoom reaches it. */
  maxZoom: number;
  onZoomOut(): void;
  onZoomIn(): void;
}

/** Minus button, percentage, plus button. The ids and markup follow the reference page. */
export function ZoomControls({ strings, zoom, maxZoom, onZoomOut, onZoomIn }: ZoomControlsProps) {
  return (
    <div id="zoom_controls">
      <button type="button" aria-label={strings.zoomOut} disabled={zoom <= ZOOM_MIN} onClick={onZoomOut}>
        -
      </button>
      <span id="zoom_level" role="status" aria-label={strings.zoomLabel}>
        {zoomLabel(zoom)}
      </span>
      <button type="button" aria-label={strings.zoomIn} disabled={zoom >= maxZoom} onClick={onZoomIn}>
        +
      </button>
    </div>
  );
}
