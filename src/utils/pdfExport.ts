import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Convert an array of HTMLElement pages into a downloadable PDF.
 * Each element is rendered as a separate A4 page.
 * The page orientation is inferred from the element aspect ratio.
 */
export async function exportElementsToPdf(elements: HTMLElement[], filename: string) {
  if (!elements.length) return;

  // Determine orientation from first element
  const first = elements[0];
  const orientation = first.offsetWidth >= first.offsetHeight ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const img = canvas.toDataURL('image/png');
    if (i > 0) pdf.addPage('a4', orientation);
    // Fit to page keeping aspect ratio
    const ratio = canvas.width / canvas.height;
    let w = pageW;
    let h = pageW / ratio;
    if (h > pageH) { h = pageH; w = pageH * ratio; }
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    pdf.addImage(img, 'PNG', x, y, w, h);
  }

  pdf.save(filename);
}
