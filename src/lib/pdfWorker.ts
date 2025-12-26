import type { PDFWorker } from 'pdfjs-dist/types/src/display/api';

// Vite supports importing assets as URLs with ?url
// This avoids relying on external CDNs (often blocked on mobile / CSP) and fixes stuck loading.
// eslint-disable-next-line import/no-unresolved
import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url';

export function configurePdfJsWorker(pdfjs: { GlobalWorkerOptions: { workerSrc: string | PDFWorker } }) {
  // Always prefer a same-origin/bundled worker for maximum reliability.
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}
