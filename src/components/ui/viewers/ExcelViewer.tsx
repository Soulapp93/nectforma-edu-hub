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
      const wb = XLSX.read(data, { 
        type: 'array',
        cellStyles: true,
        cellHTML: false,
        cellFormula: true,
        cellText: true
      });
      
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

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur lors du téléchargement');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
    }
  };

  const openInNewTab = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Erreur lors de l\'ouverture');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (error) {
      console.error('Erreur d\'ouverture:', error);
    }
  };

  const getCurrentSheetData = () => {
    if (!workbook || !currentSheet) return { data: [], styles: {} };
    const sheet = workbook.Sheets[currentSheet];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as any[][];
    
    // Extract cell styles and properties
    const styles: any = {};
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = sheet[cellAddress];
        
        if (cell) {
          const cellStyle: any = {};
          
          // Extract background color from cell fill
          if (cell.s && cell.s.fgColor) {
            const color = cell.s.fgColor;
            if (color.rgb) {
              cellStyle.backgroundColor = `#${color.rgb.substring(2)}`;
            }
          }
          
          // Extract font color
          if (cell.s && cell.s.font && cell.s.font.color) {
            const fontColor = cell.s.font.color;
            if (fontColor.rgb) {
              cellStyle.color = `#${fontColor.rgb.substring(2)}`;
            }
          }
          
          // Extract font styles
          if (cell.s && cell.s.font) {
            if (cell.s.font.bold) cellStyle.fontWeight = 'bold';
            if (cell.s.font.italic) cellStyle.fontStyle = 'italic';
            if (cell.s.font.underline) cellStyle.textDecoration = 'underline';
            if (cell.s.font.sz) cellStyle.fontSize = `${cell.s.font.sz}px`;
          }
          
          // Extract alignment
          if (cell.s && cell.s.alignment) {
            if (cell.s.alignment.horizontal) {
              cellStyle.textAlign = cell.s.alignment.horizontal;
            }
            if (cell.s.alignment.vertical) {
              cellStyle.verticalAlign = cell.s.alignment.vertical === 'center' ? 'middle' : cell.s.alignment.vertical;
            }
          }
          
          // Extract borders
          if (cell.s && cell.s.border) {
            const borders = [];
            if (cell.s.border.top) borders.push('top');
            if (cell.s.border.bottom) borders.push('bottom');
            if (cell.s.border.left) borders.push('left');
            if (cell.s.border.right) borders.push('right');
            if (borders.length > 0) {
              cellStyle.border = '1px solid #d1d5db';
            }
          }
          
          if (Object.keys(cellStyle).length > 0) {
            styles[cellAddress] = cellStyle;
          }
        }
      }
    }
    
    return { data, styles };
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

  const { data: sheetData, styles: cellStyles } = getCurrentSheetData();
  
  const getCellStyle = (rowIdx: number, cellIdx: number) => {
    const cellAddress = XLSX.utils.encode_cell({ r: rowIdx, c: cellIdx });
    return cellStyles[cellAddress] || {};
  };

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
              onClick={openInNewTab}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ouvrir dans un nouvel onglet
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
                <div className="border rounded-lg overflow-hidden bg-background">
                  <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
                    <thead>
                      <tr>
                        {sheetData[0]?.map((header: any, idx: number) => {
                          const headerStyle = getCellStyle(0, idx);
                          return (
                            <th
                              key={idx}
                              className="border border-border px-3 py-2 text-left text-sm sticky top-0"
                              style={{
                                minWidth: '100px',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                backgroundColor: headerStyle.backgroundColor || 'hsl(var(--muted))',
                                color: headerStyle.color || 'inherit',
                                fontWeight: headerStyle.fontWeight || 'bold',
                                textAlign: headerStyle.textAlign || 'left',
                                verticalAlign: headerStyle.verticalAlign || 'middle',
                                fontSize: headerStyle.fontSize || '0.875rem',
                                fontStyle: headerStyle.fontStyle,
                                textDecoration: headerStyle.textDecoration,
                                ...headerStyle
                              }}
                            >
                              {header || ''}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {sheetData.slice(1).map((row: any[], rowIdx: number) => (
                        <tr key={rowIdx}>
                          {row.map((cell: any, cellIdx: number) => {
                            const cellStyle = getCellStyle(rowIdx + 1, cellIdx);
                            return (
                              <td
                                key={cellIdx}
                                className="border border-border px-3 py-2 text-sm"
                                style={{
                                  whiteSpace: 'pre-wrap',
                                  wordBreak: 'break-word',
                                  backgroundColor: cellStyle.backgroundColor || 'transparent',
                                  color: cellStyle.color || 'inherit',
                                  fontWeight: cellStyle.fontWeight,
                                  textAlign: cellStyle.textAlign || 'left',
                                  verticalAlign: cellStyle.verticalAlign || 'top',
                                  fontSize: cellStyle.fontSize || '0.875rem',
                                  fontStyle: cellStyle.fontStyle,
                                  textDecoration: cellStyle.textDecoration,
                                  ...cellStyle
                                }}
                              >
                                {cell !== null && cell !== undefined && cell !== '' ? String(cell) : ''}
                              </td>
                            );
                          })}
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
