// Page shell and zoom controls adapted from github.com/bifdu9898/TI84Calculator (MIT), see THIRD_PARTY_NOTICES.md.
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { APP_NAME } from '../core/brand.ts';
import { fillDeep } from '../site/i18n/format.ts';
import { STRINGS } from '../site/i18n/index.ts';
import { Keypad } from './Keypad.tsx';
import { BODY_HEIGHT, BODY_WIDTH } from './keypadLayout.ts';
import { pageLanguage } from './language.ts';
import { RomPanel } from './RomPanel.tsx';
import { Screen } from './Screen.tsx';
import { useCalculator } from './useCalculator.ts';
import { ZoomControls } from './ZoomControls.tsx';
import {
  ZOOM_MAX,
  effectiveZoom,
  frameHeight,
  notifyParentHeight,
  readZoom,
  saveZoom,
  stepFromShown,
  zoomCap,
} from './zoom.ts';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function CalculatorApp() {
  const lang = pageLanguage(window.location.search, document.documentElement.lang);
  const strings = useMemo(() => fillDeep(STRINGS[lang].calc, { brand: APP_NAME }), [lang]);
  const calculator = useCalculator(strings, APP_NAME);
  // What the visitor asked for is remembered. What is shown is that, held at the largest zoom that still fits the frame.
  const [requested, setRequested] = useState(() => readZoom(browserStorage()));
  const [frameWidth, setFrameWidth] = useState(() => document.documentElement.clientWidth);
  const cap = zoomCap(frameWidth, BODY_WIDTH);
  const zoom = effectiveZoom(requested, frameWidth, BODY_WIDTH);
  const maxZoom = Math.min(ZOOM_MAX, cap);

  useEffect(() => {
    document.title = strings.pageTitle;
  }, [strings.pageTitle]);

  useEffect(() => {
    const measure = () => setFrameWidth(document.documentElement.clientWidth);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    saveZoom(browserStorage(), requested);
  }, [requested]);

  // Tell the parent page how tall the iframe needs to be: the case at this zoom plus 150 px. The parent may not be
  // listening yet on the first call, so repeat it once the page has settled.
  useLayoutEffect(() => {
    const report = () => notifyParentHeight(frameHeight(BODY_HEIGHT, zoom));
    report();
    const timers = [setTimeout(report, 100), setTimeout(report, 500)];
    return () => timers.forEach(clearTimeout);
  }, [zoom]);

  const showPanel = calculator.panelOpen;
  const loading = calculator.phase === 'starting' && !showPanel;

  return (
    <>
      <ZoomControls
        strings={strings}
        zoom={zoom}
        maxZoom={maxZoom}
        onZoomOut={() => setRequested(stepFromShown(zoom, -1))}
        onZoomIn={() => setRequested(stepFromShown(zoom, 1))}
      />
      <div className="stage" style={{ height: BODY_HEIGHT * zoom }}>
        <div
          id="calculatorDiv"
          className="calculatorDiv"
          style={{ width: BODY_WIDTH, height: BODY_HEIGHT, transform: `scale(${zoom})` }}
        >
          <div
            className={`calc-body${calculator.dragging ? ' is-dragging' : ''}`}
            data-powered-off={calculator.poweredOff || undefined}
            data-boot={calculator.bootSource ?? undefined}
            data-phase={calculator.phase}
          >
            <Screen strings={strings} canvas={calculator.canvas} loading={loading} toast={calculator.toast}>
              {calculator.phase === 'failed' && !showPanel && (
                <div className="screen-loading screen-failed" role="alert">
                  <span>{calculator.error ? strings.errors[calculator.error] : ''}</span>
                </div>
              )}
              {showPanel && (
                <RomPanel
                  strings={strings}
                  hasRom={calculator.hasRom}
                  busy={calculator.busy}
                  error={calculator.error ? strings.errors[calculator.error] : null}
                  onFile={(file) => void calculator.loadRom(file)}
                  onRemove={() => void calculator.removeRom()}
                  onCancel={calculator.closePanel}
                />
              )}
            </Screen>
            <Keypad
              holders={calculator.holders}
              rows={calculator.rows}
              held={calculator.held}
              label={strings.keypadLabel}
            />
          </div>
        </div>
      </div>
      <div className="below">
        <button
          type="button"
          className="change-rom"
          onClick={calculator.openPanel}
          style={{
            visibility: calculator.phase === 'running' && !calculator.panelOpen ? 'visible' : 'hidden',
          }}
          tabIndex={calculator.phase === 'running' && !calculator.panelOpen ? 0 : -1}
        >
          {strings.changeRom}
        </button>
        <p className="notice">{strings.notice}</p>
      </div>
    </>
  );
}
