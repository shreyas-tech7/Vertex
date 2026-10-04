import { useEffect, useState } from 'react';
import type { CalcStrings } from '../site/i18n/types.ts';
import { isIosLike, isStandalone } from './features.ts';

const DISMISS_KEY = 'vertex_install_hint_dismissed';

function browserStore(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

interface InstallHintProps {
  strings: CalcStrings;
}

/**
 * One hint, once, for iPhone and iPad Safari: add Vertex to the Home Screen.
 *
 * Safari can clear the storage of a site that has not been opened for a while, and the visitor's ROM lives in that
 * storage. An installed site keeps it. The hint is a fixed bar, so it never changes the height the calculator
 * reports to the page above it, and it never comes back after the visitor dismisses it.
 */
export function InstallHint({ strings }: InstallHintProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosLike() || isStandalone()) return;
    let dismissed: boolean;
    try {
      dismissed = browserStore()?.getItem(DISMISS_KEY) === '1';
    } catch {
      dismissed = false;
    }
    setVisible(!dismissed);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      browserStore()?.setItem(DISMISS_KEY, '1');
    } catch {
      /* storage blocked: the hint goes away for this visit, which is the least we can do */
    }
    setVisible(false);
  };

  return (
    <div className="install-hint" role="region" aria-label={strings.installTitle} data-no-calc-keys>
      <p>
        <strong>{strings.installTitle}</strong> {strings.installBody}
      </p>
      <button type="button" className="install-dismiss" onClick={dismiss}>
        {strings.installDismiss}
      </button>
    </div>
  );
}
