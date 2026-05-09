import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  X, Download, ExternalLink, Loader2, FileText, AlertCircle, Maximize2, Minimize2,
  Image as ImageIcon, Video, Music, FileSpreadsheet, Archive, FileQuestion,
} from 'lucide-react';
import AudioViewer from './AudioViewer';
import TextViewer from './TextViewer';
import ArchiveViewer from './ArchiveViewer';
import { useResolvedFileUrl } from '@/hooks/useResolvedFileUrl';
import FloatingViewerWindow from '@/components/common/FloatingViewerWindow';

interface ProductionFileViewerProps {
  fileUrl: string;
  fileName: string;
  isOpen: boolean;
  onClose: () => void;
}

type FileKind = 'pdf' | 'image' | 'video' | 'audio' | 'office' | 'text' | 'archive' | 'other';

const getFileExtension = (name: string): string => name.split('.').pop()?.toLowerCase() || '';

const getFileKind = (ext: string): FileKind => {
  const map: Record<string, FileKind> = {
    pdf: 'pdf',
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image',
    svg: 'image', webp: 'image', heic: 'image',
    mp4: 'video', webm: 'video', mov: 'video', avi: 'video', mkv: 'video',
    mp3: 'audio', wav: 'audio', aac: 'audio', flac: 'audio', m4a: 'audio', wma: 'audio',
    xls: 'office', xlsx: 'office',
    doc: 'office', docx: 'office', ppt: 'office', pptx: 'office',
    txt: 'text', md: 'text', markdown: 'text', log: 'text', json: 'text', xml: 'text',
    csv: 'text', yaml: 'text', yml: 'text', js: 'text', jsx: 'text', ts: 'text',
    tsx: 'text', py: 'text', java: 'text', c: 'text', cpp: 'text', h: 'text',
    css: 'text', scss: 'text', html: 'text', sh: 'text', bash: 'text', sql: 'text',
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
  };
  return map[ext] || 'other';
};

const KindIcon: Record<FileKind, React.FC<{ className?: string }>> = {
  pdf: FileText,
  image: ImageIcon,
  video: Video,
  audio: Music,
  office: FileSpreadsheet,
  text: FileText,
  archive: Archive,
  other: FileQuestion,
};

/**
 * Unified file viewer — uses the same FloatingViewerWindow as PdfViewerModal,
 * with drag, resize on all 4 sides, maximize/restore.
 */
const ProductionFileViewer: React.FC<ProductionFileViewerProps> = ({
  fileUrl, fileName, isOpen, onClose,
}) => {
  const { resolvedUrl, isResolving, resolveError } = useResolvedFileUrl(fileUrl);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [imgError, setImgError] = useState(false);

  const ext = getFileExtension(fileName);
  const kind = getFileKind(ext);
  const Icon = KindIcon[kind];

  useEffect(() => {
    if (isOpen) {
      setIframeLoaded(false);
      setIframeError(false);
      setImgError(false);
    }
  }, [isOpen, resolvedUrl]);

  const url = resolvedUrl || fileUrl;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'document';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderBody = () => {
    if (isResolving) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Préparation du fichier...</p>
        </div>
      );
    }
    if (resolveError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-14 w-14 rounded-2xl bg-destructive/15 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Impossible de charger le fichier</p>
            <p className="text-sm text-muted-foreground mt-1">{resolveError}</p>
          </div>
        </div>
      );
    }

    if (kind === 'pdf') {
      const embedUrl = `${url}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`;
      if (iframeError) return <FallbackUnsupported url={url} onDownload={handleDownload} />;
      return (
        <>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground pointer-events-none z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Chargement du document...</p>
            </div>
          )}
          <iframe
            key={url}
            src={embedUrl}
            title={fileName}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
            data-testid="pdf-viewer-iframe"
          />
        </>
      );
    }

    if (kind === 'image') {
      if (imgError) {
        return <FallbackUnsupported url={url} onDownload={handleDownload} message="Impossible d'afficher cette image." />;
      }
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 overflow-auto">
          <img
            src={url}
            alt={fileName}
            onError={() => setImgError(true)}
            onLoad={() => setIframeLoaded(true)}
            className="max-w-full max-h-full object-contain"
            data-testid="image-viewer-img"
          />
          {!iframeLoaded && !imgError && <Loader2 className="absolute h-8 w-8 animate-spin text-primary" />}
        </div>
      );
    }

    if (kind === 'video') {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <video src={url} controls className="max-w-full max-h-full" data-testid="video-viewer" />
        </div>
      );
    }

    if (kind === 'audio') return <AudioViewer fileUrl={url} fileName={fileName} />;
    if (kind === 'text') return <TextViewer fileUrl={url} fileName={fileName} />;
    if (kind === 'archive') return <ArchiveViewer fileUrl={url} fileName={fileName} />;

    if (kind === 'office') {
      const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
      return (
        <>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground pointer-events-none z-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Chargement du document Office...</p>
            </div>
          )}
          <iframe
            key={url}
            src={officeUrl}
            title={fileName}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
            data-testid="office-viewer-iframe"
          />
        </>
      );
    }

    return <FallbackUnsupported url={url} onDownload={handleDownload} message="Aperçu non supporté pour ce type de fichier." />;
  };

  return (
    <FloatingViewerWindow
      open={isOpen}
      onClose={onClose}
      testId="file-viewer-modal"
      renderHeader={({ dragHandleProps, isMaximized, toggleMaximize }) => (
        <div
          className="flex items-center justify-between gap-2 px-3 sm:px-5 py-3 border-b border-border bg-card/95 backdrop-blur-sm shrink-0"
          {...dragHandleProps}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground truncate" data-testid="file-viewer-title">{fileName}</h3>
              {ext && <p className="text-[11px] text-muted-foreground truncate hidden sm:block uppercase">{ext}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0" data-no-drag>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="gap-1.5 hidden sm:inline-flex" data-testid="file-viewer-download" title="Télécharger">
              <Download className="h-4 w-4" /><span>Télécharger</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} className="sm:hidden h-9 w-9" data-testid="file-viewer-download-mobile" title="Télécharger">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} className="h-9 w-9" data-testid="file-viewer-newtab" title="Ouvrir dans un nouvel onglet">
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMaximize}
              className="h-9 w-9 hidden sm:inline-flex"
              data-testid="file-viewer-maximize"
              title={isMaximized ? 'Restaurer' : 'Plein écran'}
            >
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive" data-testid="file-viewer-close" title="Fermer">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    >
      {renderBody()}
    </FloatingViewerWindow>
  );
};

const FallbackUnsupported: React.FC<{ url: string; onDownload: () => void; message?: string }> = ({
  url, onDownload, message = "Impossible d'afficher le fichier dans le navigateur",
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
    <div className="h-14 w-14 rounded-2xl bg-amber-500/15 flex items-center justify-center">
      <AlertCircle className="h-7 w-7 text-amber-600" />
    </div>
    <div>
      <p className="text-base font-semibold text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-1">Téléchargez le fichier ou ouvrez-le dans un nouvel onglet pour le consulter.</p>
    </div>
    <div className="flex flex-wrap gap-2 justify-center">
      <Button onClick={onDownload} className="gap-2"><Download className="h-4 w-4" /> Télécharger</Button>
      <Button variant="outline" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} className="gap-2"><ExternalLink className="h-4 w-4" /> Nouvel onglet</Button>
    </div>
  </div>
);

export default ProductionFileViewer;
