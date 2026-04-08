// Re-export facade — actual implementations split into pdf/ subdirectory
import { pdfAttendanceExport } from './pdf/pdfAttendanceExport';
import { pdfTextBookExport } from './pdf/pdfTextBookExport';
import { pdfCorrectionExport } from './pdf/pdfCorrectionExport';

export const pdfExportService = {
  exportAttendanceSheet: pdfAttendanceExport.exportAttendanceSheet,
  exportAttendanceSheetSimple: pdfAttendanceExport.exportAttendanceSheetSimple,
  exportBlankAttendanceSheet: pdfAttendanceExport.exportBlankAttendanceSheet,
  exportTextBookToPDF: pdfTextBookExport.exportTextBookToPDF,
  exportCorrectionSheet: pdfCorrectionExport.exportCorrectionSheet,
};
