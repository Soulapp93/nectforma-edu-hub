// Heavy libs loaded dynamically to reduce initial bundle size
// mammoth, xlsx, jszip are imported on-demand in each function that needs them

export interface ImportedTextContent {
  html: string;
}

export interface ImportedSpreadsheetContent {
  sheets: Array<{
    id: string;
    name: string;
    data: Record<string, {
      value: string;
      formula?: string;
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      align?: 'left' | 'center' | 'right';
      bgColor?: string;
      textColor?: string;
      fontSize?: number;
      fontFamily?: string;
      wrap?: boolean;
      border?: { top?: string; right?: string; bottom?: string; left?: string };
      numberFormat?: string;
    }>;
    numRows: number;
    numCols: number;
    frozenRows: number;
    frozenCols: number;
    colWidths: Record<number, number>;
    rowHeights: Record<number, number>;
    hiddenRows: number[];
    hiddenCols: number[];
    merges?: Array<{ s: { r: number; c: number }; e: { r: number; c: number } }>;
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
    fontStyle?: string;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: string;
    letterSpacing?: number;
    lineHeight?: number;
    textDecoration?: string;
    borderRadius?: number;
    borderColor?: string;
    borderWidth?: number;
    opacity?: number;
    rotation?: number;
    zIndex?: number;
  }>;
  background: string;
  backgroundImage?: string;
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

// ============= XLSX color helpers =============
function xlsxColorToHex(color: any): string | undefined {
  if (!color) return undefined;
  // Themed or RGB color
  if (color.rgb) {
    const rgb = color.rgb.length === 8 ? color.rgb.slice(2) : color.rgb;
    return `#${rgb}`;
  }
  if (color.theme !== undefined) {
    // Theme colors approximate mapping (standard Office theme)
    const themeColors: Record<number, string> = {
      0: '#ffffff', 1: '#000000', 2: '#e7e6e6', 3: '#44546a',
      4: '#4472c4', 5: '#ed7d31', 6: '#a5a5a5', 7: '#ffc000',
      8: '#5b9bd5', 9: '#70ad47',
    };
    return themeColors[color.theme] || undefined;
  }
  return undefined;
}

function getHAlignment(ha: number | undefined): 'left' | 'center' | 'right' | undefined {
  // XLSX alignment enum: 0=general, 1=left, 2=center, 3=right
  if (ha === 1) return 'left';
  if (ha === 2) return 'center';
  if (ha === 3) return 'right';
  return undefined;
}

// ============= PPTX XML color helpers =============
function pptxColorFromNode(node: Element | null): string | undefined {
  if (!node) return undefined;
  // Direct srgbClr
  const srgb = node.querySelector('srgbClr');
  if (srgb) {
    const val = srgb.getAttribute('val');
    if (val) return `#${val}`;
  }
  // schemeClr — approximate standard scheme
  const scheme = node.querySelector('schemeClr');
  if (scheme) {
    const schemeMap: Record<string, string> = {
      'tx1': '#000000', 'tx2': '#44546a', 'bg1': '#ffffff', 'bg2': '#e7e6e6',
      'accent1': '#4472c4', 'accent2': '#ed7d31', 'accent3': '#a5a5a5',
      'accent4': '#ffc000', 'accent5': '#5b9bd5', 'accent6': '#70ad47',
      'dk1': '#000000', 'dk2': '#44546a', 'lt1': '#ffffff', 'lt2': '#e7e6e6',
      'hlink': '#0563c1', 'folHlink': '#954f72',
    };
    const val = scheme.getAttribute('val');
    if (val && schemeMap[val]) return schemeMap[val];
  }
  return undefined;
}

function emuToPx(emu: string | null): number {
  return emu ? parseInt(emu) / 12700 : 0;
}

export const fileImportService = {
  /**
   * Parse a .docx file into HTML — preserving styles, colors, indentation
   */
  async importDocx(file: File): Promise<ImportedTextContent> {
    const arrayBuffer = await file.arrayBuffer();

    // Dynamic import — mammoth is heavy (~3MB)
    const mammoth = await import('mammoth');
    const result = await mammoth.default.convertToHtml({
      arrayBuffer,
    }, {
      styleMap: [
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='List Paragraph'] => li:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
      ],
      includeDefaultStyleMap: true,
    } as any);

    // Wrap in container preserving original styles
    const html = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000000;">${result.value}</div>`;
    return { html };
  },

  /**
   * Parse a .xlsx file into spreadsheet data — preserving cell styles
   */
  async importXlsx(file: File): Promise<ImportedSpreadsheetContent> {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamic import — xlsx is heavy (~7MB)
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(arrayBuffer, {
      type: 'array',
      cellStyles: true,
      cellNF: true,
      cellFormula: true,
    });

    const sheets = workbook.SheetNames.map((name) => {
      const ws = workbook.Sheets[name];
      const data: Record<string, {
        value: string;
        formula?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
        align?: 'left' | 'center' | 'right';
        bgColor?: string;
        textColor?: string;
        fontSize?: number;
        fontFamily?: string;
        wrap?: boolean;
        border?: { top?: string; right?: string; bottom?: string; left?: string };
        numberFormat?: string;
      }> = {};
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      let maxRow = 0;
      let maxCol = 0;

      for (let r = range.s.r; r <= range.e.r; r++) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cellAddr = XLSX.utils.encode_cell({ r, c });
          const cell = ws[cellAddr];
          if (cell) {
            const key = `${colLetter(c)}${r + 1}`;
            
            const style = cell.s || {};
            const font = style.font || {};
            const fill = style.fill || {};
            const alignment = style.alignment || {};
            const border = style.border || {};

            data[key] = {
              value: cell.v !== undefined ? String(cell.v) : '',
              formula: cell.f ? `=${cell.f}` : undefined,
              bold: font.bold || false,
              italic: font.italic || false,
              underline: !!font.underline,
              align: getHAlignment(alignment.horizontal),
              bgColor: xlsxColorToHex(fill.fgColor) || xlsxColorToHex(fill.bgColor),
              textColor: xlsxColorToHex(font.color),
              fontSize: font.sz || undefined,
              fontFamily: font.name || undefined,
              wrap: alignment.wrapText || false,
              border: {
                top: border.top ? '1px solid #000' : undefined,
                right: border.right ? '1px solid #000' : undefined,
                bottom: border.bottom ? '1px solid #000' : undefined,
                left: border.left ? '1px solid #000' : undefined,
              },
              numberFormat: cell.z || undefined,
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

      // Parse row heights
      const rowHeights: Record<number, number> = {};
      if (ws['!rows']) {
        ws['!rows'].forEach((row: any, i: number) => {
          if (row?.hpx) rowHeights[i] = Math.max(20, row.hpx);
          else if (row?.hpt) rowHeights[i] = Math.max(20, row.hpt * 1.33);
        });
      }

      // Parse merges
      const merges = ws['!merges']?.map((m: any) => ({
        s: { r: m.s.r, c: m.s.c },
        e: { r: m.e.r, c: m.e.c },
      })) || [];

      // Parse frozen panes
      let frozenRows = 0;
      let frozenCols = 0;
      if ((ws as any)['!freeze']) {
        const f = (ws as any)['!freeze'];
        frozenRows = f.ySplit || 0;
        frozenCols = f.xSplit || 0;
      }

      return {
        id: crypto.randomUUID(),
        name,
        data,
        numRows: Math.max(100, maxRow + 20),
        numCols: Math.max(26, maxCol + 5),
        frozenRows,
        frozenCols,
        colWidths,
        rowHeights,
        hiddenRows: [],
        hiddenCols: [],
        merges,
      };
    });

    return { sheets };
  },

  /**
   * Parse a .pptx file into presentation slides — preserving colors, fonts, backgrounds
   */
  async importPptx(file: File): Promise<ImportedPresentationContent> {
    const arrayBuffer = await file.arrayBuffer();
    // Dynamic import — jszip is loaded on demand
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default;
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    const slides: ImportedSlide[] = [];

    // Extract images from the pptx
    const imageCache: Record<string, string> = {};
    const mediaFiles = Object.keys(zip.files).filter(n => n.startsWith('ppt/media/'));
    for (const mf of mediaFiles) {
      try {
        const blob = await zip.file(mf)?.async('blob');
        if (blob) {
          const ext = mf.split('.').pop()?.toLowerCase() || 'png';
          const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
            : ext === 'png' ? 'image/png'
            : ext === 'gif' ? 'image/gif'
            : ext === 'svg' ? 'image/svg+xml'
            : 'image/png';
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(new Blob([blob], { type: mimeType }));
          });
          imageCache[mf.split('/').pop()!] = dataUrl;
        }
      } catch { /* skip */ }
    }
    
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

      // Extract slide background color
      let slideBg = '#ffffff';
      const bgFill = doc.querySelector('cSld bg bgPr solidFill');
      if (bgFill) {
        const c = pptxColorFromNode(bgFill);
        if (c) slideBg = c;
      }
      // Check for gradient background
      const bgGrad = doc.querySelector('cSld bg bgPr gradFill');
      if (bgGrad) {
        const stops = bgGrad.querySelectorAll('gs');
        if (stops.length >= 2) {
          const c1 = pptxColorFromNode(stops[0]);
          const c2 = pptxColorFromNode(stops[stops.length - 1]);
          if (c1 && c2) slideBg = c1; // Use first gradient stop as solid fallback
        }
      }

      // Try to get slide background image
      let slideBgImage: string | undefined;
      
      // Parse relationships to resolve image references
      const relsFile = slideFile.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
      const relsXml = await zip.file(relsFile)?.async('string');
      const relsMap: Record<string, string> = {};
      if (relsXml) {
        const relsDoc = parser.parseFromString(relsXml, 'text/xml');
        const rels = relsDoc.querySelectorAll('Relationship');
        rels.forEach(rel => {
          const id = rel.getAttribute('Id');
          const target = rel.getAttribute('Target');
          if (id && target) {
            const fileName = target.split('/').pop();
            if (fileName) relsMap[id] = fileName;
          }
        });
      }

      // Extract all shapes
      const spTree = doc.querySelector('cSld spTree');
      if (spTree) {
        const shapeNodes = spTree.children;
        let zIdx = 0;
        
        for (let si = 0; si < shapeNodes.length; si++) {
          const sp = shapeNodes[si];
          const tagName = sp.tagName?.split(':').pop();
          
          if (tagName === 'sp') {
            // Text shape
            const txBody = sp.querySelector('txBody');
            const spPr = sp.querySelector('spPr');

            // Position
            const off = spPr?.querySelector('xfrm off');
            const ext = spPr?.querySelector('xfrm ext');
            const rot = spPr?.querySelector('xfrm')?.getAttribute('rot');
            
            const x = emuToPx(off?.getAttribute('x') || null);
            const y = emuToPx(off?.getAttribute('y') || null);
            const w = emuToPx(ext?.getAttribute('cx') || null);
            const h = emuToPx(ext?.getAttribute('cy') || null);

            // Shape fill color
            let shapeBg: string | undefined;
            const solidFill = spPr?.querySelector('solidFill');
            if (solidFill) {
              shapeBg = pptxColorFromNode(solidFill);
            }

            // Shape border
            let borderColor: string | undefined;
            let borderWidth: number | undefined;
            const ln = spPr?.querySelector('ln');
            if (ln) {
              const lnFill = ln.querySelector('solidFill');
              borderColor = pptxColorFromNode(lnFill || null);
              const lnW = ln.getAttribute('w');
              if (lnW) borderWidth = parseInt(lnW) / 12700;
            }

            if (txBody) {
              // Extract rich text with per-run formatting
              let fullText = '';
              let dominantFontSize = 16;
              let dominantBold = false;
              let dominantItalic = false;
              let dominantColor = '#000000';
              let dominantFont: string | undefined;
              let dominantAlign = 'left';
              let dominantUnderline: string | undefined;
              let runCount = 0;

              const paragraphs = txBody.querySelectorAll('p');
              paragraphs.forEach((p, pi) => {
                // Paragraph alignment
                const pPr = p.querySelector('pPr');
                const algn = pPr?.getAttribute('algn');
                if (algn === 'ctr') dominantAlign = 'center';
                else if (algn === 'r') dominantAlign = 'right';
                else if (algn === 'just') dominantAlign = 'justify';

                const runs = p.querySelectorAll('r');
                runs.forEach(r => {
                  const t = r.querySelector('t');
                  if (t?.textContent) {
                    fullText += t.textContent;
                    runCount++;

                    const rPr = r.querySelector('rPr');
                    if (rPr) {
                      const b = rPr.getAttribute('b');
                      if (b === '1') dominantBold = true;
                      const i = rPr.getAttribute('i');
                      if (i === '1') dominantItalic = true;
                      const u = rPr.getAttribute('u');
                      if (u && u !== 'none') dominantUnderline = 'underline';
                      const sz = rPr.getAttribute('sz');
                      if (sz) dominantFontSize = parseInt(sz) / 100;
                      
                      // Font color
                      const solidFillR = rPr.querySelector('solidFill');
                      const rc = pptxColorFromNode(solidFillR || null);
                      if (rc) dominantColor = rc;

                      // Font family
                      const latin = rPr.querySelector('latin');
                      if (latin) {
                        const typeface = latin.getAttribute('typeface');
                        if (typeface && !typeface.startsWith('+')) dominantFont = typeface;
                      }
                    }
                  }
                });
                if (pi < paragraphs.length - 1) fullText += '\n';
              });

              if (fullText.trim()) {
                elements.push({
                  id: newId(),
                  type: 'text',
                  x: Math.max(0, x),
                  y: Math.max(0, y),
                  width: Math.max(50, Math.min(960, w)),
                  height: Math.max(20, Math.min(600, h)),
                  content: fullText,
                  fontSize: Math.max(8, Math.min(120, dominantFontSize)),
                  fontWeight: dominantBold ? 'bold' : 'normal',
                  fontStyle: dominantItalic ? 'italic' : 'normal',
                  fontFamily: dominantFont,
                  color: dominantColor,
                  backgroundColor: shapeBg,
                  textAlign: dominantAlign,
                  textDecoration: dominantUnderline,
                  borderColor,
                  borderWidth,
                  rotation: rot ? parseInt(rot) / 60000 : undefined,
                  opacity: 1,
                  zIndex: zIdx++,
                });
              } else if (shapeBg) {
                // Empty shape with fill — render as colored rectangle
                elements.push({
                  id: newId(),
                  type: 'shape',
                  x: Math.max(0, x),
                  y: Math.max(0, y),
                  width: Math.max(10, Math.min(960, w)),
                  height: Math.max(10, Math.min(600, h)),
                  backgroundColor: shapeBg,
                  borderColor,
                  borderWidth,
                  rotation: rot ? parseInt(rot) / 60000 : undefined,
                  opacity: 1,
                  zIndex: zIdx++,
                });
              }
            }
          } else if (tagName === 'pic') {
            // Image
            const spPr = sp.querySelector('spPr');
            const off = spPr?.querySelector('xfrm off');
            const ext = spPr?.querySelector('xfrm ext');
            
            const x = emuToPx(off?.getAttribute('x') || null);
            const y = emuToPx(off?.getAttribute('y') || null);
            const w = emuToPx(ext?.getAttribute('cx') || null);
            const h = emuToPx(ext?.getAttribute('cy') || null);

            // Get image reference
            const blipFill = sp.querySelector('blipFill');
            const blip = blipFill?.querySelector('blip');
            const embedId = blip?.getAttribute('r:embed') || blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed');
            
            if (embedId && relsMap[embedId] && imageCache[relsMap[embedId]]) {
              elements.push({
                id: newId(),
                type: 'image',
                x: Math.max(0, x),
                y: Math.max(0, y),
                width: Math.max(20, Math.min(960, w)),
                height: Math.max(20, Math.min(600, h)),
                src: imageCache[relsMap[embedId]],
                opacity: 1,
                zIndex: zIdx++,
              });
            }
          }
        }
      }

      slides.push({
        id: newId(),
        elements,
        background: slideBg,
        backgroundImage: slideBgImage,
      });
    }

    // Ensure at least one slide
    if (slides.length === 0) {
      slides.push({ id: newId(), elements: [], background: '#ffffff' });
    }

    return { slides };
  },

  /**
   * Parse a PDF file into presentation slides (one slide per page) — full fidelity rendering
   */
  async importPdfAsPresentation(file: File): Promise<ImportedPresentationContent> {
    const pdfjsLib = await import('pdfjs-dist');
    const { configurePdfJsWorker } = await import('@/lib/pdfWorker');
    configurePdfJsWorker(pdfjsLib);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const slides: ImportedSlide[] = [];
    const maxPages = Math.min(pdf.numPages, 50);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      
      const canvas = window.document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        const dataUrl = canvas.toDataURL('image/png');
        
        slides.push({
          id: newId(),
          elements: [{
            id: newId(),
            type: 'image',
            x: 0,
            y: 0,
            width: 960,
            height: Math.round(960 * (viewport.height / viewport.width)),
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
    const { configurePdfJsWorker } = await import('@/lib/pdfWorker');
    configurePdfJsWorker(pdfjsLib);

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
      dataUrl = canvas.toDataURL('image/png');
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
