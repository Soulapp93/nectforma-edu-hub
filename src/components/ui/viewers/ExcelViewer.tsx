import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Download, ExternalLink, Maximize2, Minimize2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExcelViewerProps {
  fileUrl: string;
  fileName: string;
  onClose: () => void;
}

const ExcelViewer: React.FC<ExcelViewerProps> = ({ fileUrl, fileName, onClose }) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [currentSheet, setCurrentSheet] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadExcelFile();
  }, [fileUrl]);

  const loadExcelFile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      
      setWorkbook(wb);
      if (wb.SheetNames.length > 0) {
        setCurrentSheet(wb.SheetNames[0]);
      }
    } catch (err) {
      console.error('Error loading Excel file:', err);
      setError('Erreur lors du chargement du fichier Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCurrentSheetData = () => {
    if (!workbook || !currentSheet) return [];
    const sheet = workbook.Sheets[currentSheet];
    return XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const currentSheetIndex = workbook?.SheetNames.indexOf(currentSheet) ?? -1;
  const canGoPrevious = currentSheetIndex > 0;
  const canGoNext = currentSheetIndex < (workbook?.SheetNames.length ?? 0) - 1;

  const goToPreviousSheet = () => {
    if (canGoPrevious && workbook) {
      setCurrentSheet(workbook.SheetNames[currentSheetIndex - 1]);
    }
  };

  const goToNextSheet = () => {
    if (canGoNext && workbook) {
      setCurrentSheet(workbook.SheetNames[currentSheetIndex + 1]);
    }
  };

  const sheetData = getCurrentSheetData();

  return (
    <div className={`fixed inset-0 z-50 bg-background ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className="h-full flex flex-col bg-card rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{fileName}</h2>
              <p className="text-sm text-muted-foreground">
                Fichier Excel • {workbook?.SheetNames.length || 0} feuille(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir dans Excel
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sheet selector and navigation */}
        {workbook && workbook.SheetNames.length > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousSheet}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Select value={currentSheet} onValueChange={setCurrentSheet}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sélectionner une feuille" />
                </SelectTrigger>
                <SelectContent>
                  {workbook.SheetNames.map((sheetName) => (
                    <SelectItem key={sheetName} value={sheetName}>
                      {sheetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextSheet}
                disabled={!canGoNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Feuille {currentSheetIndex + 1} sur {workbook.SheetNames.length}
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Chargement du fichier...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={loadExcelFile} variant="outline">
                  Réessayer
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && sheetData.length > 0 && (
            <ScrollArea className="h-full">
              <div className="p-6">
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted">
                        {sheetData[0]?.map((header: any, idx: number) => (
                          <th
                            key={idx}
                            className="border border-border px-4 py-2 text-left text-sm font-semibold sticky top-0 bg-muted"
                          >
                            {header || `Colonne ${idx + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sheetData.slice(1).map((row: any[], rowIdx: number) => (
                        <tr key={rowIdx} className="hover:bg-muted/50">
                          {row.map((cell: any, cellIdx: number) => (
                            <td
                              key={cellIdx}
                              className="border border-border px-4 py-2 text-sm"
                            >
                              {cell !== null && cell !== undefined ? String(cell) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </ScrollArea>
          )}

          {!loading && !error && sheetData.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Aucune donnée disponible dans cette feuille</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExcelViewer;
