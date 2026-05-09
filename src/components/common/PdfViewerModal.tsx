import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink, Loader2, FileText, AlertCircle, Maximize2, Minimize2, Presentation, ChevronLeft, ChevronRight } from 'lucide-react';
import FloatingViewerWindow from './FloatingViewerWindow';

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  filename?: string;
}

const HIDE_CONTROLS_DELAY_MS = 3000;

const PdfViewerModal: React.FC<Props> = ({ open, onClose, url, title = 'Référentiel de formation', filename }) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const presentationRef = useRef<HTMLDivElement>(null);
  const presentationIframeRef = useRef<HTMLIFrameElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setIframeLoaded(false);
      setIframeError(false);
    } else {
      setIsPresenting(false);
    }
  }, [open, url]);

  // Sync isPresenting with native fullscreen state (so Esc / F11 closes overlay)
  useEffect(() => {
    const handler = () => {
      // Only auto-exit when we WERE in fullscreen and now we're not
      if (isPresenting && !document.fullscreenElement) {
        setIsPresenting(false);
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [isPresenting]);

  /** Auto-hide controls after inactivity */
  const scheduleHideControls = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setControlsVisible(true);
    hideTimerRef.current = window.setTimeout(() => setControlsVisible(false), HIDE_CONTROLS_DELAY_MS) as unknown as number;
  }, []);

  /**
   * Enter presentation mode.
   * Strategy: render a full-bleed overlay (always covers 100vw × 100vh),
   * then ATTEMPT to also request native OS fullscreen. If the iframe is
   * sandboxed (preview), the fullscreen request will silently fail —
   * the soft overlay still gives a clean presentation experience.
   */
  const enterPresentation = () => {
    setPageNumber(1);
    setIsPresenting(true);
    scheduleHideControls();
  };

  const exitPresentation = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch { /* ignore */ }
    setIsPresenting(false);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
  }, []);

  // Try native fullscreen as soon as the overlay mounts
  useEffect(() => {
    if (!isPresenting) return;
    const el = presentationRef.current;
    if (!el) return;
    if (document.fullscreenElement === el) return;
    const t = window.setTimeout(() => {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          // Sandboxed preview blocks it; the overlay alone provides a clean experience
        });
      }
    }, 50);
    return () => window.clearTimeout(t);
  }, [isPresenting]);

  // Keyboard navigation in presentation mode
  useEffect(() => {
    if (!isPresenting) return;
    const onKey = (e: KeyboardEvent) => {
      // Show controls on any key
      scheduleHideControls();
      switch (e.key) {
        case 'Escape':
          // Browser already exits fullscreen; just sync our state
          setIsPresenting(false);
          break;
        case 'ArrowRight':
        case ' ':
        case 'PageDown':
          e.preventDefault();
          setPageNumber(p => p + 1);
          break;
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault();
          setPageNumber(p => Math.max(1, p - 1));
          break;
        case 'Home':
          e.preventDefault();
          setPageNumber(1);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPresenting, scheduleHideControls]);

  // Show controls on mouse move
  const handleOverlayMouseMove = useCallback(() => {
    scheduleHideControls();
  }, [scheduleHideControls]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.pdf';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const embedUrl = `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
  // Clean URL for presentation mode: NO toolbar, NO navpanes, NO scrollbar, fit to width, jump to page N
  const presentationUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&pagemode=none&view=Fit&page=${pageNumber}`;

  return (
    <>
      <FloatingViewerWindow
        open={open}
        onClose={onClose}
        testId="pdf-viewer-modal"
        renderHeader={({ dragHandleProps, isMaximized, toggleMaximize }) => (
          <div
            className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-border bg-card/95 backdrop-blur-sm shrink-0"
            {...dragHandleProps}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-semibold text-foreground truncate" data-testid="pdf-viewer-title">{title}</h3>
                {filename && <p className="text-[11px] text-muted-foreground truncate hidden sm:block">{filename}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0" data-no-drag>
              <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5 hidden sm:inline-flex" data-testid="pdf-viewer-download" title="Télécharger">
                <Download className="h-4 w-4" /><span>Télécharger</span>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDownload} className="sm:hidden h-9 w-9" data-testid="pdf-viewer-download-mobile" title="Télécharger">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} className="h-9 w-9" data-testid="pdf-viewer-newtab" title="Ouvrir dans un nouvel onglet">
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={enterPresentation} className="h-9 w-9 hidden sm:inline-flex" data-testid="pdf-viewer-presentation" title="Mode diaporama (plein écran)">
                <Presentation className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleMaximize} className="h-9 w-9 hidden sm:inline-flex" data-testid="pdf-viewer-maximize" title={isMaximized ? 'Restaurer' : 'Plein écran (fenêtre)'}>
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive" data-testid="pdf-viewer-close" title="Fermer">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      >
        {!iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground pointer-events-none z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Chargement du document...</p>
          </div>
        )}

        {iframeError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Impossible d'afficher le PDF dans le navigateur</p>
              <p className="text-sm text-muted-foreground mt-1">Téléchargez le fichier ou ouvrez-le dans un nouvel onglet pour le consulter.</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button onClick={handleDownload} className="gap-2"><Download className="h-4 w-4" /> Télécharger</Button>
              <Button variant="outline" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} className="gap-2"><ExternalLink className="h-4 w-4" /> Nouvel onglet</Button>
            </div>
          </div>
        ) : (
          <iframe key={url} src={embedUrl} title={title} className="absolute inset-0 w-full h-full border-0 bg-white" onLoad={() => setIframeLoaded(true)} onError={() => setIframeError(true)} data-testid="pdf-viewer-iframe" allowFullScreen />
        )}
      </FloatingViewerWindow>

      {/* PRESENTATION OVERLAY */}
      {isPresenting && createPortal(
        <div
          ref={presentationRef}
          className="fixed inset-0 z-[2147483647] bg-black flex items-center justify-center"
          data-testid="pdf-presentation-overlay"
          onMouseMove={handleOverlayMouseMove}
        >
          <iframe
            ref={presentationIframeRef}
            key={`pres-${pageNumber}`}
            src={presentationUrl}
            title={`${title} — Mode diaporama`}
            className="w-full h-full border-0 bg-black"
            allowFullScreen
            data-testid="pdf-presentation-iframe"
          />

          {/* Top-right: Quitter */}
          <div
            className={`fixed top-4 right-4 z-[2147483646] transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <button
              type="button"
              onClick={exitPresentation}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 hover:bg-black/85 text-white text-sm font-medium backdrop-blur-md border border-white/20 shadow-2xl transition-all"
              data-testid="pdf-presentation-exit"
              title="Quitter le mode diaporama (Esc)"
            >
              <X className="h-4 w-4" />
              <span>Quitter</span>
              <kbd className="ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/15 border border-white/20">Esc</kbd>
            </button>
          </div>

          {/* Bottom: Navigation arrows + Page indicator */}
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[2147483646] transition-opacity duration-300 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/20 shadow-2xl">
              <button
                type="button"
                onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                disabled={pageNumber === 1}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                data-testid="pdf-presentation-prev"
                title="Page précédente (←)"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="px-3 text-sm font-medium tabular-nums select-none" data-testid="pdf-presentation-page">
                Page {pageNumber}
              </div>
              <button
                type="button"
                onClick={() => setPageNumber(p => p + 1)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-white/15 transition-colors"
                data-testid="pdf-presentation-next"
                title="Page suivante (→ ou Espace)"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <p className="text-center text-[10px] text-white/40 mt-1.5 font-mono select-none">
              ← → pour naviguer · Esc pour quitter
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PdfViewerModal;
