/**
 * Registers the offline service worker that vite-plugin-pwa generates at the site root. The URL comes from this
 * script's own location (assets/), so one build works from the domain root, a project path, and every language folder.
 * Production only: the dev server has no service worker.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const worker = new URL('../sw.js', import.meta.url);
  const scope = new URL('../', import.meta.url).pathname;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(worker, { scope }).catch(() => {
      /* offline support is a bonus: the site works without it */
    });
  });
}
