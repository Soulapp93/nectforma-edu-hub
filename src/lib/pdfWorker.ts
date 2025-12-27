import type { PDFWorker } from 'pdfjs-dist/types/src/display/api';

// Vite supports importing assets as URLs with ?url.
// IMPORTANT: react-pdf currently uses PDF.js v5.x, so the worker must match.
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  // Exclude iOS Chrome/Firefox which embed Safari but have different quirks
  const isCriOS = /CriOS/.test(ua);
  const isFxiOS = /FxiOS/.test(ua);
  return isIOS && !isCriOS && !isFxiOS;
}

export function configurePdfJsWorker(pdfjs: { GlobalWorkerOptions: { workerSrc: string | PDFWorker } }) {
  // Always prefer a same-origin/bundled worker for maximum reliability.
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  // iOS Safari has recurring issues with module workers in PDF.js/react-pdf that can crash rendering
  // (e.g. "null is not an object (evaluating 'this.messageHandler.sendWithPromise')").
  // Fallback: disable worker only on iOS Safari to keep PDFs opening reliably.
  if (isIOSSafari()) {
    (pdfjs as any).disableWorker = true;
  }
}

