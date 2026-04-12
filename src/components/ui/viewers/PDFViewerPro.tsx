import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const PDFJS_VERSION = pdfjs.version;
// Use unpkg CDN as cdnjs may not have all versions
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

const isIOS = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

interface PDFViewerProProps {
  fileUrl: string;
  zoom: number;
  page: number;
  onPageChange: (page: number) => void;
  onPagesLoaded: (numPages: number) => void;
  onError: (message: string) => void;
  retryKey?: number;
}

type RenderStrategy = 'react-pdf' | 'google-viewer' | 'native-embed';

const PDFViewerPro: React.FC<PDFViewerProProps> = ({
  fileUrl,
  zoom,
  page,
  onPageChange,
  onPagesLoaded,
  onError,
  retryKey = 0
}) => {
  const [strategy, setStrategy] = useState<RenderStrategy>('react-pdf');
  const [isLoading, setIsLoading] = useState(true);
  const [numPages, setNumPages] = useState(0);
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (isIOS()) {
      setStrategy('google-viewer');
    } else {
      setStrategy('react-pdf');
    }
    setIsLoading(true);
    setHasTriedFallback(false);
    setRenderedPages(new Set());
  }, [fileUrl, retryKey]);

  const handleReactPdfSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setIsLoading(false);
    onPagesLoaded(n);
  }, [onPagesLoaded]);

  const handleReactPdfError = useCallback((error: Error) => {
    console.error('react-pdf error:', error);
    if (!hasTriedFallback) {
      setHasTriedFallback(true);
      setStrategy('google-viewer');
      setIsLoading(true);
    } else {
      onError('Impossible de charger le PDF. Essayez de l\'ouvrir dans un nouvel onglet.');
    }
  }, [hasTriedFallback, onError]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    onPagesLoaded(1);
  }, [onPagesLoaded]);

  const handleIframeError = useCallback(() => {
    if (strategy === 'google-viewer' && !hasTriedFallback) {
      setHasTriedFallback(true);
      setStrategy('native-embed');
      setIsLoading(true);
    } else {
      onError('Impossible de charger le PDF');
    }
  }, [strategy, hasTriedFallback, onError]);

  // Scroll to page when page prop changes (from thumbnail click)
  useEffect(() => {
    if (strategy !== 'react-pdf' || numPages === 0) return;
    const el = pageRefs.current.get(page);
    if (el && !isScrollingRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [page, strategy, numPages]);

  // Track visible page on scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current || numPages === 0) return;
    isScrollingRef.current = true;
    clearTimeout((handleScroll as any)._timeout);
    (handleScroll as any)._timeout = setTimeout(() => { isScrollingRef.current = false; }, 200);

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const midPoint = scrollTop + containerHeight / 3;

    let closestPage = 1;
    let closestDist = Infinity;
    pageRefs.current.forEach((el, p) => {
      const dist = Math.abs(el.offsetTop - midPoint);
      if (dist < closestDist) {
        closestDist = dist;
        closestPage = p;
      }
    });

    if (closestPage !== page) {
      onPageChange(closestPage);
    }
  }, [numPages, page, onPageChange]);

  const handlePageRender = useCallback((pageNum: number) => {
    setRenderedPages(prev => {
      const next = new Set(prev);
      next.add(pageNum);
      return next;
    });
  }, []);

  const scale = zoom / 100;
  const openInNewTab = () => window.open(fileUrl, '_blank', 'noopener,noreferrer');

  // Continuous scroll PDF (all pages) - like Edge
  if (strategy === 'react-pdf') {
    return (
      <div
        ref={containerRef}
        className="flex-1 w-full h-full bg-[#525659] overflow-auto"
        onScroll={handleScroll}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <Document
          key={`${fileUrl}-${retryKey}`}
          file={fileUrl}
          onLoadSuccess={handleReactPdfSuccess}
          onLoadError={handleReactPdfError}
          loading={null}
          error={null}
        >
          <div className="flex flex-col items-center gap-3 py-4 px-2">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                ref={(el) => { if (el) pageRefs.current.set(pageNum, el); }}
                className="relative"
              >
                <Page
                  pageNumber={pageNum}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                  className="shadow-xl"
                  onRenderSuccess={() => handlePageRender(pageNum)}
                  loading={
                    <div
                      className="flex items-center justify-center bg-white shadow-xl"
                      style={{ width: 600 * scale, height: 848 * scale }}
                    >
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  }
                />
                {/* Page number overlay */}
                <div className="absolute bottom-2 right-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {pageNum}
                </div>
              </div>
            ))}
          </div>
        </Document>
      </div>
    );
  }

  // Google Docs Viewer fallback
  if (strategy === 'google-viewer') {
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    return (
      <div className="flex-1 w-full h-full bg-muted relative">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Chargement du PDF...</p>
          </div>
        )}
        <iframe
          key={`google-${fileUrl}-${retryKey}`}
          src={googleViewerUrl}
          className="w-full h-full border-0"
          title="PDF Viewer"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>
    );
  }

  // Native embed fallback
  if (strategy === 'native-embed') {
    return (
      <div className="flex-1 w-full h-full bg-muted relative flex flex-col">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <object
          key={`native-${fileUrl}-${retryKey}`}
          data={fileUrl}
          type="application/pdf"
          className="flex-1 w-full h-full"
          onLoad={handleIframeLoad}
        >
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-muted-foreground mb-4">
              Votre navigateur ne supporte pas l'affichage PDF intégré.
            </p>
            <Button onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans un nouvel onglet
            </Button>
          </div>
        </object>
      </div>
    );
  }

  return null;
};

export default PDFViewerPro;
