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
      
      // Header
      pdf.setFillColor(139, 92, 246); // Purple color
      pdf.rect(0, 0, 210, 40, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.text('FEUILLE D\'ÉMARGEMENT', 105, 15, { align: 'center' });
      
      pdf.setFontSize(14);
      pdf.text(attendanceSheet.formations?.title || '', 105, 25, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Niveau : ${attendanceSheet.formations?.level || ''}`, 105, 32, { align: 'center' });

      // Course info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      const formattedDate = format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr });
      pdf.text(`Date: ${formattedDate}`, 10, 50);
      pdf.text(`Heure: ${attendanceSheet.start_time.substring(0, 5)} - ${attendanceSheet.end_time.substring(0, 5)}`, 70, 50);
      pdf.text(`Salle: ${attendanceSheet.room || 'A101'}`, 140, 50);
      pdf.text(`Formateur: ${attendanceSheet.instructor?.first_name} ${attendanceSheet.instructor?.last_name}`, 10, 57);

      // Table header
      const startY = 70;
      pdf.setFillColor(139, 92, 246, 0.1);
      pdf.rect(10, startY, 190, 8, 'F');
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nom et Prénom', 15, startY + 5);
      pdf.text('Statut', 80, startY + 5);
      pdf.text('Email', 110, startY + 5);
      pdf.text('Signature', 160, startY + 5);

      // Table content
      let currentY = startY + 12;
      const signatures = attendanceSheet.signatures || [];
      
      pdf.setFont('helvetica', 'normal');
      
      signatures.forEach((signature, index) => {
        if (currentY > 270) {
          pdf.addPage();
          currentY = 20;
        }

        const bgColor = index % 2 === 0 ? [255, 255, 255] : [249, 250, 251];
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(10, currentY - 4, 190, 8, 'F');

        pdf.text(`${signature.user?.first_name} ${signature.user?.last_name}`, 15, currentY);
        pdf.text(signature.present ? 'Présent' : 'Absent', 80, currentY);
        pdf.text(signature.user?.email || '', 110, currentY);
        
        if (signature.signature_data) {
          pdf.text('Signé', 160, currentY);
        } else {
          pdf.text('Non signé', 160, currentY);
        }
        
        currentY += 8;
      });

      // Signature boxes
      if (currentY > 220) {
        pdf.addPage();
        currentY = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text('Signature du Formateur', 30, currentY + 20);
      pdf.rect(20, currentY + 25, 70, 20);

      pdf.text('Signature de l\'Administration', 130, currentY + 20);
      pdf.rect(120, currentY + 25, 70, 20);

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