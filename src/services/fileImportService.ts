import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ImportedTextContent {
  html: string;
}

export interface ImportedSpreadsheetContent {
  sheets: Array<{
    id: string;
    name: string;
    data: Record<string, { value: string; formula?: string }>;
    numRows: number;
    numCols: number;
    frozenRows: number;
    frozenCols: number;
    colWidths: Record<number, number>;
    rowHeights: Record<number, number>;
    hiddenRows: number[];
    hiddenCols: number[];
  }>;
}

export interface ImportedSlide {
  id: string;
  elements: Array<{
    id: string;
    type: 'text' | 'image' | 'shape';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    src?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: string;
  }>;
  background: string;
}

export interface ImportedPresentationContent {
  slides: ImportedSlide[];
}

export interface ImportedVisualContent {
  width: number;
  height: number;
  background: string;
  elements: Array<{
    id: string;
    type: 'text' | 'image' | 'rectangle';
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    src?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    opacity?: number;
    zIndex?: number;
  }>;
}

const newId = () => Math.random().toString(36).slice(2, 10);
const colLetter = (col: number) => {
  let s = '';
  let c = col;
  while (c >= 0) {
    s = String.fromCharCode(65 + (c % 26)) + s;
    c = Math.floor(c / 26) - 1;
  }
  return s;
};

export const fileImportService = {
  /**
   * Parse a .docx file into HTML
   */
  async importDocx(file: File): Promise<ImportedTextContent> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return { html: result.value };
  },

  /**
   * Parse a .xlsx file into spreadsheet data
   */
  async importXlsx(file: File): Promise<ImportedSpreadsheetContent> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const sheets = workbook.SheetNames.map((name, idx) => {
      const ws = workbook.Sheets[name];
      const data: Record<string, { value: string; formula?: string }> = {};
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      let maxRow = 0;
      let maxCol = 0;

      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellAddr = XLSX.utils.encode_cell({ r, c });
          const cell = ws[cellAddr];
          if (cell) {
            const key = `${colLetter(c)}${r + 1}`;
            data[key] = {
              value: cell.v !== undefined ? String(cell.v) : '',
              formula: cell.f ? `=${cell.f}` : undefined,
            };
            maxRow = Math.max(maxRow, r + 1);
            maxCol = Math.max(maxCol, c + 1);
          }
        }
      }

      // Parse column widths
      const colWidths: Record<number, number> = {};
      if (ws['!cols']) {
        ws['!cols'].forEach((col: any, i: number) => {
          if (col?.wpx) colWidths[i] = Math.max(40, col.wpx);
          else if (col?.wch) colWidths[i] = Math.max(40, col.wch * 8);
        });
      }

      return {
        id: crypto.randomUUID(),
        name,
        data,
        numRows: Math.max(100, maxRow + 20),
        numCols: Math.max(26, maxCol + 5),
        frozenRows: 0,
        frozenCols: 0,
        colWidths,
        rowHeights: {},
        hiddenRows: [],
        hiddenCols: [],
      };
    });

    return { sheets };
  },

  /**
   * Parse a .pptx file into presentation slides
   */
  async importPptx(file: File): Promise<ImportedPresentationContent> {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const slides: ImportedSlide[] = [];
    
    // Find all slide XML files
    const slideFiles = Object.keys(zip.files)
      .filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
        return numA - numB;
      });

    for (const slideFile of slideFiles) {
      const xmlStr = await zip.file(slideFile)?.async('string');
      if (!xmlStr) continue;

      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'text/xml');
      
      const elements: ImportedSlide['elements'] = [];
      
      // Extract text from shape tree
      const spNodes = doc.querySelectorAll('sp');
      spNodes.forEach((sp) => {
        const txBody = sp.querySelector('txBody');
        if (txBody) {
          let text = '';
          const paragraphs = txBody.querySelectorAll('p');
          paragraphs.forEach((p, pi) => {
            const runs = p.querySelectorAll('r');
            runs.forEach(r => {
              const t = r.querySelector('t');
              if (t?.textContent) text += t.textContent;
            });
            if (pi < paragraphs.length - 1) text += '\n';
          });

          if (text.trim()) {
            // Try to get position from sp > spPr > xfrm
            const off = sp.querySelector('spPr xfrm off');
            const ext = sp.querySelector('spPr xfrm ext');
            
            const x = off ? parseInt(off.getAttribute('x') || '0') / 12700 : 50;
            const y = off ? parseInt(off.getAttribute('y') || '0') / 12700 : 50;
            const w = ext ? parseInt(ext.getAttribute('cx') || '0') / 12700 : 400;
            const h = ext ? parseInt(ext.getAttribute('cy') || '0') / 12700 : 60;

            // Check for bold/size
            const rPr = txBody.querySelector('r rPr');
            const isBold = rPr?.getAttribute('b') === '1';
            const szAttr = rPr?.getAttribute('sz');
            const fontSize = szAttr ? parseInt(szAttr) / 100 : (text.length < 50 ? 28 : 16);

            elements.push({
              id: newId(),
              type: 'text',
              x: Math.max(0, x),
              y: Math.max(0, y),
              width: Math.max(100, Math.min(900, w)),
              height: Math.max(30, Math.min(500, h)),
              content: text,
              fontSize: Math.max(10, Math.min(72, fontSize)),
              fontWeight: isBold ? 'bold' : 'normal',
              color: '#000000',
              textAlign: 'left',
            });
          }
        }
      });

      slides.push({
        id: newId(),
        elements,
        background: '#ffffff',
      });
    }

    // Ensure at least one slide
    if (slides.length === 0) {
      slides.push({ id: newId(), elements: [], background: '#ffffff' });
    }

    return { slides };
  },

  /**
   * Parse a PDF file into presentation slides (one slide per page)
   */
  async importPdfAsPresentation(file: File): Promise<ImportedPresentationContent> {
    // Use pdfjs-dist to render each page as an image
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const slides: ImportedSlide[] = [];
    const maxPages = Math.min(pdf.numPages, 50); // Limit to 50 pages

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      
      const canvas = window.document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        slides.push({
          id: newId(),
          elements: [{
            id: newId(),
            type: 'image',
            x: 0,
            y: 0,
            width: 960,
            height: 540,
            src: dataUrl,
          }],
          background: '#ffffff',
        });
      }
    }

    if (slides.length === 0) {
      slides.push({ id: newId(), elements: [], background: '#ffffff' });
    }

    return { slides };
  },

  /**
   * Parse a PDF into visual editor (first page as background image)
   */
  async importPdfAsVisual(file: File): Promise<ImportedVisualContent> {
    const pdfjsLib = await import('pdfjs-dist');
    
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    
    const canvas = window.document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    
    let dataUrl = '';
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise;
      dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    }

    return {
      width: 1080,
      height: Math.round(1080 * (viewport.height / viewport.width)),
      background: '#ffffff',
      elements: dataUrl ? [{
        id: newId(),
        type: 'image' as const,
        x: 0,
        y: 0,
        width: 1080,
        height: Math.round(1080 * (viewport.height / viewport.width)),
        src: dataUrl,
        opacity: 1,
        zIndex: 0,
      }] : [],
    };
  },

  /**
   * Import an image file as visual editor content
   */
  async importImageAsVisual(file: File): Promise<ImportedVisualContent> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          // Scale to fit within reasonable bounds
          const maxDim = 1920;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          resolve({
            width: w,
            height: h,
            background: '#ffffff',
            elements: [{
              id: newId(),
              type: 'image',
              x: 0,
              y: 0,
              width: w,
              height: h,
              src: dataUrl,
              opacity: 1,
              zIndex: 0,
            }],
          });
        };
        img.onerror = () => reject(new Error('Impossible de charger l\'image'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Import an image as a presentation slide element
   */
  async importImageAsPresentation(file: File): Promise<ImportedPresentationContent> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          slides: [{
            id: newId(),
            elements: [{
              id: newId(),
              type: 'image',
              x: 0,
              y: 0,
              width: 960,
              height: 540,
              src: dataUrl,
            }],
            background: '#ffffff',
          }],
        });
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsDataURL(file);
    });
  },

  /**
   * Detect the target editor type from file extension
   */
  getTargetEditorType(fileName: string): 'text' | 'spreadsheet' | 'presentation' | 'visual' | null {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'docx':
      case 'doc':
        return 'text';
      case 'xlsx':
      case 'xls':
      case 'csv':
        return 'spreadsheet';
      case 'pptx':
      case 'ppt':
        return 'presentation';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'webp':
      case 'svg':
        return 'visual';
      case 'pdf':
        return null; // PDF can go to either presentation or visual
      default:
        return null;
    }
  },

  /**
   * Get accepted file extensions for a specific editor type
   */
  getAcceptedExtensions(editorType: 'text' | 'spreadsheet' | 'presentation' | 'visual'): string {
    switch (editorType) {
      case 'text':
        return '.docx,.doc';
      case 'spreadsheet':
        return '.xlsx,.xls,.csv';
      case 'presentation':
        return '.pptx,.ppt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg';
      case 'visual':
        return '.png,.jpg,.jpeg,.gif,.webp,.svg,.pdf';
      default:
        return '';
    }
  },

  /**
   * Get all accepted extensions for the import modal
   */
  getAllAcceptedExtensions(): string {
    return '.docx,.doc,.xlsx,.xls,.csv,.pptx,.ppt,.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg';
  },
};
