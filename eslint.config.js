import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const domGlobals = [
  'document',
  'window',
  'localStorage',
  'sessionStorage',
  'indexedDB',
  'navigator',
  'location',
  'HTMLElement',
  'requestAnimationFrame',
  'Image',
  'fetch',
].map((name) => ({ name, message: 'src/core is headless: no DOM or browser globals.' }));

export default defineConfig(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
      'screenshots',
      'emulator/dist',
      'emulator/.cache',
      'public/source',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/calculator/**/*.{ts,tsx}', 'src/site/**/*.ts'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['src/core/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      'no-restricted-globals': ['error', ...domGlobals],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },
);
