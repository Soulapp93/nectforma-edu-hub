import type { PDFWorker } from 'pdfjs-dist/types/src/display/api';

// Vite supports importing assets as URLs with ?url.
// IMPORTANT: react-pdf currently uses PDF.js v5.x, so the worker must match.
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export function configurePdfJsWorker(pdfjs: { GlobalWorkerOptions: { workerSrc: string | PDFWorker } }) {
  // Always prefer a same-origin/bundled worker for maximum reliability.
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}
