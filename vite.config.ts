/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative asset URLs so the same build works at a domain root (Vercel) and under a
  // GitHub Pages project path (https://<user>.github.io/Vertex/).
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.png'],
      manifest: {
        name: 'Vertex Graphing Calculator',
        short_name: 'Vertex',
        description: 'A free, TI-84 Plus compatible graphing calculator that works offline.',
        theme_color: '#14171f',
        background_color: '#14171f',
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
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { host: '0.0.0.0', port: 5173, allowedHosts: true },
  preview: { host: '0.0.0.0', port: 4173, allowedHosts: true },
  build: { target: 'es2022', sourcemap: false },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    testTimeout: 30000,
  },
});
