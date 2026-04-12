import React, { useState, useCallback } from 'react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { FileText, FileSpreadsheet, Image, Film, Music, File } from 'lucide-react';

interface FilePreviewTooltipProps {
  fileUrl: string;
  fileName: string;
  children: React.ReactNode;
}

const getFileExt = (name: string) => name.split('.').pop()?.toLowerCase() || '';

const isPreviewable = (ext: string) => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  const pdfExts = ['pdf'];
  return imageExts.includes(ext) || pdfExts.includes(ext);
};

const isImage = (ext: string) =>
  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);

const getFileIcon = (ext: string) => {
  if (isImage(ext)) return Image;
  if (ext === 'pdf') return FileText;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return Film;
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) return Music;
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) return FileText;
  return File;
};

const getFileColor = (ext: string) => {
  if (isImage(ext)) return 'text-blue-500';
  if (ext === 'pdf') return 'text-red-500';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'text-emerald-500';
  if (['doc', 'docx'].includes(ext)) return 'text-blue-600';
  if (['ppt', 'pptx'].includes(ext)) return 'text-orange-500';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'text-purple-500';
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'text-pink-500';
  return 'text-muted-foreground';
};

const FilePreviewTooltip: React.FC<FilePreviewTooltipProps> = ({ fileUrl, fileName, children }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ext = getFileExt(fileName);
  const canPreview = isPreviewable(ext);
  const isImg = isImage(ext);
  const Icon = getFileIcon(ext);
  const iconColor = getFileColor(ext);

  const handleImgLoad = useCallback(() => setImgLoaded(true), []);
  const handleImgError = useCallback(() => setImgError(true), []);

  if (!fileUrl) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="p-0 overflow-hidden rounded-xl border-2 border-border/60 shadow-xl bg-card max-w-[280px]"
        >
          {canPreview && isImg && !imgError ? (
            <div className="relative">
              {!imgLoaded && (
                <div className="w-[260px] h-[160px] flex items-center justify-center bg-muted/30">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={fileUrl}
                alt={fileName}
                onLoad={handleImgLoad}
                onError={handleImgError}
                className={`w-[260px] max-h-[200px] object-cover ${imgLoaded ? '' : 'hidden'}`}
              />
              <div className="px-3 py-2 bg-card border-t border-border/40">
                <p className="text-xs font-medium truncate">{fileName}</p>
              </div>
            </div>
          ) : canPreview && ext === 'pdf' ? (
            <div className="w-[260px]">
              <div className="h-[140px] bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-card flex flex-col items-center justify-center gap-2">
                <FileText className="w-10 h-10 text-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded">PDF</span>
              </div>
              <div className="px-3 py-2 border-t border-border/40">
                <p className="text-xs font-medium truncate">{fileName}</p>
                <p className="text-[10px] text-muted-foreground">Cliquer pour visualiser</p>
              </div>
            </div>
          ) : (
            <div className="w-[220px]">
              <div className="h-[100px] bg-gradient-to-b from-muted/40 to-card flex flex-col items-center justify-center gap-2">
                <Icon className={`w-9 h-9 ${iconColor}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                  {ext.toUpperCase()}
                </span>
              </div>
              <div className="px-3 py-2 border-t border-border/40">
                <p className="text-xs font-medium truncate">{fileName}</p>
                <p className="text-[10px] text-muted-foreground">Cliquer pour visualiser</p>
              </div>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FilePreviewTooltip;
