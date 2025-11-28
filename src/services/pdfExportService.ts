import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AttendanceSheet } from './attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const pdfExportService = {
  async exportAttendanceSheet(attendanceSheet: AttendanceSheet, elementId: string): Promise<void> {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found for PDF export');
      }

      // Generate canvas from HTML element
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Generate filename
      const formattedDate = format(new Date(attendanceSheet.date), 'yyyy-MM-dd');
      const filename = `emargement-${formattedDate}-${attendanceSheet.formations?.title?.replace(/\s+/g, '-')}.pdf`;

      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Erreur lors de l\'export PDF');
    }
  },

  async exportAttendanceSheetSimple(attendanceSheet: AttendanceSheet): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const margin = 15;
      
      // Header with purple background
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FEUILLE D\'ÉMARGEMENT', pageWidth / 2, 18, { align: 'center' });
      
      // Formation info
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(attendanceSheet.formations?.title || '', pageWidth / 2, 28, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.text(`Niveau : ${attendanceSheet.formations?.level || ''}`, pageWidth / 2, 37, { align: 'center' });

      // Course details section
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const formattedDate = format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr });
      
      const detailsY = 55;
      pdf.text(`Date: ${formattedDate}`, margin, detailsY);
      pdf.text(`Heure: ${attendanceSheet.start_time.substring(0, 5)} - ${attendanceSheet.end_time.substring(0, 5)}`, 80, detailsY);
      pdf.text(`Salle: ${attendanceSheet.room || ''}`, 160, detailsY);
      pdf.text(`Formateur: ${attendanceSheet.instructor?.first_name || 'undefined'} ${attendanceSheet.instructor?.last_name || 'undefined'}`, margin, detailsY + 7);

      // Table header
      const tableStartY = 72;
      const colWidths = [70, 30, 65, 35]; // Nom, Statut, Email, Signature
      const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1], margin + colWidths[0] + colWidths[1] + colWidths[2]];
      
      // Header background (dark gray)
      pdf.setFillColor(50, 50, 50);
      pdf.rect(margin, tableStartY, pageWidth - 2 * margin, 10, 'F');
      
      // Header text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nom et Prénom', colX[0] + 2, tableStartY + 7);
      pdf.text('Statut', colX[1] + 2, tableStartY + 7);
      pdf.text('Email', colX[2] + 2, tableStartY + 7);
      pdf.text('Signature', colX[3] + 2, tableStartY + 7);

      // Table content
      let currentY = tableStartY + 10;
      const signatures = attendanceSheet.signatures || [];
      const rowHeight = 10;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      
      signatures.forEach((signature, index) => {
        if (currentY > 250) {
          pdf.addPage();
          currentY = 20;
        }

        // Alternate row colors
        if (index % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(249, 250, 251);
        }
        pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, 'F');

        // Draw cell borders
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, currentY, colWidths[0], rowHeight);
        pdf.rect(colX[1], currentY, colWidths[1], rowHeight);
        pdf.rect(colX[2], currentY, colWidths[2], rowHeight);
        pdf.rect(colX[3], currentY, colWidths[3], rowHeight);

        // Cell content
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${signature.user?.first_name || ''} ${signature.user?.last_name || ''}`, colX[0] + 2, currentY + 7);
        pdf.text(signature.present ? 'Présent' : 'Absent', colX[1] + 2, currentY + 7);
        
        const email = signature.user?.email || '';
        const maxEmailWidth = colWidths[2] - 4;
        const emailText = pdf.splitTextToSize(email, maxEmailWidth);
        pdf.text(emailText[0] || '', colX[2] + 2, currentY + 7);
        
        if (signature.signature_data) {
          pdf.text('Signé', colX[3] + 2, currentY + 7);
        } else {
          pdf.text('', colX[3] + 2, currentY + 7);
        }
        
        currentY += rowHeight;
      });

      // Signature boxes
      const signatureY = currentY + 15;
      if (signatureY > 230) {
        pdf.addPage();
        currentY = 20;
      } else {
        currentY = signatureY;
      }

      // Trainer signature
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Signature du Formateur', margin + 20, currentY);
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, currentY + 5, 80, 30);

      // Admin signature
      pdf.text('Signature de l\'Administration', pageWidth - margin - 80 + 5, currentY);
      pdf.rect(pageWidth - margin - 80, currentY + 5, 80, 30);

      // Generate filename
      const filename = `emargement-${format(new Date(attendanceSheet.date), 'yyyy-MM-dd')}-${attendanceSheet.formations?.title?.replace(/\s+/g, '-')}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw new Error('Erreur lors de l\'export PDF');
    }
  },

  async exportTextBookToPDF(textBook: any): Promise<void> {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Simple text book export
      pdf.setFontSize(20);
      pdf.text('Cahier de Texte', 105, 20, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Formation: ${textBook.formation?.title || ''}`, 10, 40);
      pdf.text(`Année académique: ${textBook.academic_year || ''}`, 10, 50);
      
      pdf.save(`cahier-texte-${textBook.formation?.title?.replace(/\s+/g, '-')}.pdf`);
    } catch (error) {
      console.error('Error exporting text book PDF:', error);
      throw new Error('Erreur lors de l\'export PDF');
    }
  }
};