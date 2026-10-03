// The iframe height listener is adapted from github.com/bifdu9898/TI84Calculator (MIT), see THIRD_PARTY_NOTICES.md.
import { acceptHeightMessage } from '../calculator/zoom.ts';
import { registerServiceWorker } from './serviceWorker.ts';

registerServiceWorker();

/**
 * Behavior shared by the landing, privacy and terms pages. No inline scripts, so the Content Security Policy can
 * forbid them.
 */

// Resize the calculator iframe when the calculator page asks. Only our own iframe, from our own origin, may do so.
const frame = document.getElementById('calculatorFrame') as HTMLIFrameElement | null;
if (frame) {
  window.addEventListener('message', (event: MessageEvent) => {
    const height = acceptHeightMessage(event, { origin: window.location.origin, frame: frame.contentWindow });
    if (height !== null) {
      frame.style.height = `${height}px`;
      frame.style.transition = 'height 0.3s ease';
    }
  });
}

// "Back to Calculator" scrolls to the top smoothly.
document.querySelector<HTMLAnchorElement>('.cta-button')?.addEventListener('click', (event) => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Close the language menu when the visitor clicks elsewhere or presses Escape.
const menu = document.querySelector<HTMLDetailsElement>('.lang-menu');
if (menu) {
  document.addEventListener('click', (event) => {
    if (menu.open && !menu.contains(event.target as Node)) menu.open = false;
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
}
