/**
 * Registers the offline service worker that vite-plugin-pwa generates at the site root. The URL comes from this
 * script's own location (assets/), so one build works from the domain root, a project path, and every language folder.
 * Production only: the dev server has no service worker.
 *
 * The generated worker calls skipWaiting and clientsClaim itself (vite.config.ts). When a new worker takes over a page
 * that an older worker was already controlling, the page reloads once so it runs the new build, not the cached one.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const worker = new URL('../sw.js', import.meta.url);
  const scope = new URL('../', import.meta.url).pathname;
  // A first visit has no controller yet. Claiming the page then is not an update, so it must not reload.
  const hadController = navigator.serviceWorker.controller !== null;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(worker, { scope }).catch(() => {
      /* offline support is a bonus: the site works without it */
    });
  });
}
