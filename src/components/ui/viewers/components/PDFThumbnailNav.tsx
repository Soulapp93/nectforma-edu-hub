import React, { useRef, useEffect } from 'react';
import { ChevronLeft, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PDFThumbnailNavProps {
  fileUrl: string;
  numPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const PDFThumbnailNav: React.FC<PDFThumbnailNavProps> = ({
  fileUrl,
  numPages,
  currentPage,
  onPageChange,
  isOpen,
  onToggle
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to current page thumbnail
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      const thumbnail = scrollRef.current.querySelector(`[data-page="${currentPage}"]`);
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentPage, isOpen]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="absolute left-4 top-4 z-50 bg-background/95 backdrop-blur-sm shadow-lg"
        data-testid="pdf-thumbnails-toggle"
      >
        <Grid3X3 className="h-4 w-4 mr-2" />
        Pages
      </Button>
    );
  }

  return (
    <div className="w-36 bg-[#2b2b2b] border-r border-[#444] flex flex-col shrink-0">
      <div className="flex items-center justify-between p-2 border-b border-[#444]">
        <span className="text-xs font-medium text-white/80">Pages</span>
        <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-2">
        {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
          <button
            key={pageNum}
            data-page={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={cn(
              "w-full rounded-md overflow-hidden transition-all",
              pageNum === currentPage 
                ? "ring-2 ring-blue-500" 
                : "hover:ring-1 hover:ring-white/30"
            )}
          >
            {/* Simple placeholder thumbnail - just page number */}
            <div className={cn(
              "w-full aspect-[3/4] flex items-center justify-center",
              pageNum === currentPage ? "bg-blue-500/20" : "bg-white/10"
            )}>
              <span className={cn(
                "text-lg font-bold",
                pageNum === currentPage ? "text-blue-400" : "text-white/40"
              )}>
                {pageNum}
              </span>
            </div>
            <div className={cn(
              "text-[10px] text-center py-0.5",
              pageNum === currentPage ? "text-blue-400 font-medium" : "text-white/50"
            )}>
              {pageNum}
            </div>
          </button>
        ))}
      </div>

      {/* Quick nav */}
      <div className="p-2 border-t border-[#444] text-center">
        <span className="text-[10px] text-white/50 tabular-nums">
          {currentPage} / {numPages}
        </span>
      </div>
    </div>
  );
};

export default PDFThumbnailNav;
