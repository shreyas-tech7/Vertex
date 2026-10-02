/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { generatePages } from './scripts/generate-pages.ts';
import { CONTENT_SECURITY_POLICY } from './src/site/csp.ts';
import { SECURITY_HEADERS } from './src/site/support.ts';

/**
 * Generates the nine-language pages before Vite looks for its HTML entries, lists them as build inputs, and adds the
 * Content Security Policy to every page in the production build.
 */
function vertexPages(): Plugin {
  let outDir = 'dist';
  return {
    name: 'vertex-pages',
    enforce: 'post',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    // vite-plugin-pwa links the manifest as "./manifest.webmanifest", which is wrong from a language folder.
    closeBundle() {
      const fix = (directory: string, depth: number) => {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const path = resolve(directory, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== 'assets' && entry.name !== 'source') fix(path, depth + 1);
          } else if (entry.name.endsWith('.html')) {
            const html = readFileSync(path, 'utf8');
            const fixed = html.replace(
              'href="./manifest.webmanifest"',
              `href="${'../'.repeat(depth)}manifest.webmanifest"`,
            );
            if (fixed !== html) writeFileSync(path, fixed);
          }
        }
      };
      if (existsSync(outDir)) fix(outDir, 0);
    },
    config() {
      const pages = generatePages();
      const input: Record<string, string> = { calculator: resolve(import.meta.dirname, 'calculator.html') };
      for (const page of pages)
        input[page.file.replace(/\/?index\.html$/, '') || 'index'] = resolve(import.meta.dirname, page.file);
      return { build: { rollupOptions: { input } } };
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!context.bundle) return html; // dev server: Vite and React Refresh need inline scripts
        const tag = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`;
        return html.replace(/<meta charset="UTF-8"\s*\/?>/i, (match) => `${match}\n    ${tag}`);
      },
    },
  };
}

export default defineConfig({
  // Relative asset URLs so the same build works at a domain root and under a GitHub Pages project path
  // (https://<user>.github.io/Vertex/).
  base: './',
  plugins: [
    vertexPages(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // src/site/serviceWorker.ts registers it with a path that works from every folder
      includeAssets: ['favicon.svg', 'preview.png'],
      manifest: {
        name: 'Vertex Graphing Calculator',
        short_name: 'Vertex',
        description: 'An ad-free TI-84 Plus CE calculator that runs in your browser.',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2,wasm}'],
        globIgnores: ['source/**'],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        // A new build takes over on its own. Without these two the plugin only waits for a SKIP_WAITING message that
        // nothing sends, so returning visitors stay on the old build until every tab closes.
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ],
  worker: { format: 'es' },
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  // The preview server sends the same security headers a real host should, so the tests run under the full policy.
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true, headers: Object.fromEntries(SECURITY_HEADERS) },
  build: { target: 'es2022', sourcemap: false },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
  },
});
