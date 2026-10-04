import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from '../site/serviceWorker.ts';
import { CalculatorApp } from './CalculatorApp.tsx';
import { startEmulatorEarly } from './emulator/early.ts';
import './calculator.css';

registerServiceWorker();
// The worker starts now, while React is still setting up, so the WebAssembly compile overlaps with the first render
// and with reading the visitor's ROM out of IndexedDB.
startEmulatorEarly();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CalculatorApp />
  </StrictMode>,
);
