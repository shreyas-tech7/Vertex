import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerServiceWorker } from '../site/serviceWorker.ts';
import { CalculatorApp } from './CalculatorApp.tsx';
import './calculator.css';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CalculatorApp />
  </StrictMode>,
);
