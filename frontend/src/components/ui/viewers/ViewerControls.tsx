import React from 'react';
import { 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw,
  Download, Maximize2, Minimize2, X, RefreshCw, ExternalLink,
  Home, BookOpen, Grid3X3, Search, Settings
} from 'lucide-react';
import { Button } from '../button';
import { Input } from '../input';
import { Separator } from '../separator';

interface ViewerControlsProps {
  // Navigation
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  
  // Zoom
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToWidth: () => void;
  
  // Actions
  onDownload: () => void;
  onOpenInNewTab: () => void;
  onRotate?: () => void;
  onRefresh?: () => void;
  
  // Fullscreen
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onClose?: () => void;
  
  // Display
  fileName: string;
  fileType: string;
  isLoading?: boolean;
  
  // Layout
  compact?: boolean;
  theme?: 'light' | 'dark';
}

const ViewerControls: React.FC<ViewerControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  onPrevPage,
  onNextPage,
  onFirstPage,
  onLastPage,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToWidth,
  onDownload,
  onOpenInNewTab,
  onRotate,
  onRefresh,
  isFullscreen = false,
  onToggleFullscreen,
  onClose,
  fileName,
  fileType,
  isLoading = false,
  compact = false,
  theme = 'light'
}) => {
  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= totalPages) {
      onPageChange(value);
    }
  };

  const isDark = theme === 'dark';
  const containerClass = `${
    isDark 
      ? 'bg-gray-800 text-white border-gray-700' 
      : 'bg-white text-gray-900 border-gray-200'
  } border-b flex-shrink-0`;

  if (compact) {
    return (
      <div className={containerClass}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium truncate max-w-32">
              {fileName}
            </span>
            <span className="text-xs opacity-60">
              {currentPage}/{totalPages}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" onClick={onPrevPage} disabled={currentPage <= 1} className="h-7 px-1">
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onNextPage} disabled={currentPage >= totalPages} className="h-7 px-1">
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button size="sm" variant="ghost" onClick={onZoomOut} className="h-7 px-1">
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onZoomIn} className="h-7 px-1">
              <ZoomIn className="h-3 w-3" />
            </Button>
            <Separator orientation="vertical" className="h-4" />
            {onToggleFullscreen && (
              <Button size="sm" variant="ghost" onClick={onToggleFullscreen} className="h-7 px-1">
                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </Button>
            )}
            {onClose && (
              <Button size="sm" variant="ghost" onClick={onClose} className="h-7 px-1">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      {/* Header Row */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-5 w-5 text-blue-500" />
          <h2 className="text-sm font-semibold truncate max-w-md">
            {fileName}
          </h2>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
            {fileType.toUpperCase()}
          </span>
          {totalPages > 0 && (
            <span className="text-xs opacity-60">
              {totalPages} page{totalPages > 1 ? 's' : ''}
            </span>
          )}
          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-xs opacity-60">Chargement...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {onRefresh && (
            <Button size="sm" variant="ghost" onClick={onRefresh} className="h-8 px-2">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onOpenInNewTab} className="h-8 px-2">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDownload} className="h-8 px-2">
            <Download className="h-4 w-4" />
          </Button>
          {onToggleFullscreen && (
            <Button size="sm" variant="ghost" onClick={onToggleFullscreen} className="h-8 px-2">
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose} className="h-8 px-2">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700">
        {/* Navigation Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onFirstPage}
            disabled={currentPage <= 1}
            className="h-8 px-2"
            title="Première page (Home)"
          >
            <Home className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="h-8 px-2"
            title="Page précédente (←)"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            <Input
              type="number"
              value={currentPage}
              onChange={handlePageInputChange}
              min={1}
              max={totalPages}
              className="w-16 h-8 text-center text-sm"
              title="Numéro de page"
            />
            <span className="text-sm opacity-60">/ {totalPages}</span>
          </div>
          
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="h-8 px-2"
            title="Page suivante (→)"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onLastPage}
            disabled={currentPage >= totalPages}
            className="h-8 px-2"
            title="Dernière page (End)"
          >
            <BookOpen className="h-3 w-3" />
          </Button>
        </div>

        {/* Zoom and Display Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onZoomOut} 
            className="h-8 px-2"
            title="Dézoomer (-)"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onFitToWidth} 
            className="h-8 px-3 text-xs"
            title="Ajuster à la largeur"
          >
            Ajuster
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onResetZoom} 
            className="h-8 px-3 text-xs font-mono"
            title="Zoom par défaut (0)"
          >
            {Math.round(zoom * 100)}%
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onZoomIn} 
            className="h-8 px-2"
            title="Zoomer (+)"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          
          {onRotate && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={onRotate} 
                className="h-8 px-2"
                title="Rotation horaire"
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewerControls;