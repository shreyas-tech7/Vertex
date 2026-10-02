import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import { notifyParentHeight, readZoom, saveZoom, stepZoom } from './zoom.ts';

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
  const [zoom, setZoom] = useState(() => readZoom(browserStorage()));

  const controls = useRef<HTMLDivElement>(null);
  const below = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = strings.pageTitle;
  }, [strings.pageTitle]);

  // Remember the zoom level and tell the parent page how tall the iframe needs to be.
  useLayoutEffect(() => {
    saveZoom(browserStorage(), zoom);
    const report = () => {
      const top = controls.current ? controls.current.getBoundingClientRect().bottom + window.scrollY : 0;
      const bottom = below.current ? below.current.offsetHeight : 0;
      notifyParentHeight(Math.ceil(top + BODY_HEIGHT * zoom + bottom));
    };
    report();
    // The parent may not be listening yet on the first call, so repeat it once the page has settled.
    const timers = [setTimeout(report, 100), setTimeout(report, 500)];
    window.addEventListener('resize', report);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', report);
    };
  }, [zoom]);

  const showPanel = calculator.panelOpen;
  const loading = calculator.phase === 'starting' && !showPanel;

  return (
    <>
      <ZoomControls
        controlsRef={controls}
        strings={strings}
        zoom={zoom}
        onZoomOut={() => setZoom((value) => stepZoom(value, -1))}
        onZoomIn={() => setZoom((value) => stepZoom(value, 1))}
      />
      <div className="stage" style={{ height: BODY_HEIGHT * zoom }}>
        <div
          id="calculatorDiv"
          className="calculatorDiv"
          style={{ width: BODY_WIDTH, height: BODY_HEIGHT, transform: `scale(${zoom})` }}
        >
          <div className="calc-body" data-powered-off={calculator.poweredOff || undefined}>
            <div className="brand" aria-hidden="true">
              {APP_NAME}
            </div>
            <Screen
              strings={strings}
              canvas={calculator.canvas}
              loading={loading}
              dragging={calculator.dragging}
              toast={calculator.toast}
            >
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
      <div ref={below} className="below">
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
