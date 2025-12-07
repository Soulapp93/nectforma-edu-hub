import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AttendanceSheet } from './attendanceService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

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
      
      // Load establishment info for logo
      let establishmentLogo = '';
      let establishmentName = '';
      if (attendanceSheet.formation_id) {
        const { data: formationData, error: formationError } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', attendanceSheet.formation_id)
          .single();
        
        if (!formationError && formationData?.establishment_id) {
          const { data: establishmentData, error: establishmentError } = await supabase
            .from('establishments')
            .select('logo_url, name')
            .eq('id', formationData.establishment_id)
            .single();
          
          if (!establishmentError && establishmentData) {
            establishmentLogo = establishmentData.logo_url || '';
            establishmentName = establishmentData.name || '';
          }
        }
      }
      
      // Load admin signature if sheet is validated
      let adminSignatureData = '';
      if (attendanceSheet.validated_by) {
        const { data: adminSig, error } = await supabase
          .from('user_signatures')
          .select('signature_data')
          .eq('user_id', attendanceSheet.validated_by)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (!error && adminSig) {
          adminSignatureData = adminSig.signature_data;
        }
      }

      // Always reload signatures from the database to ensure instructor signature is available
      let signatures: any[] = [];
      try {
        const { data: signaturesData, error: signaturesError } = await supabase
          .from('attendance_signatures')
          .select(`*, users(first_name, last_name, email)`)
          .eq('attendance_sheet_id', attendanceSheet.id);

        if (signaturesError) {
          console.error('Error loading signatures for PDF export:', signaturesError);
        } else if (signaturesData) {
          signatures = (signaturesData as any[]).map(sig => ({
            ...sig,
            user: (sig as any).users
          }));
        }
      } catch (e) {
        console.error('Unexpected error loading signatures for PDF export:', e);
      }
      
      // Header with purple background
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 45, 'F');
      
      // Add establishment logo in top-left corner if available
      if (establishmentLogo) {
        try {
          // Load and add logo image
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
            logoImg.src = establishmentLogo;
          });
          
          // Create canvas to convert to base64
          const canvas = document.createElement('canvas');
          canvas.width = logoImg.width;
          canvas.height = logoImg.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(logoImg, 0, 0);
            const logoData = canvas.toDataURL('image/png');
            
            // Add white background for logo
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(margin - 2, 5, 26, 26, 3, 3, 'F');
            
            // Add logo
            pdf.addImage(logoData, 'PNG', margin, 7, 22, 22);
          }
        } catch (e) {
          console.error('Error loading establishment logo:', e);
          // Fallback: just show establishment name
          if (establishmentName) {
            pdf.setFontSize(8);
            pdf.setTextColor(255, 255, 255);
            pdf.text(establishmentName, margin, 15);
          }
        }
      } else if (establishmentName) {
        // No logo, just show establishment name
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text(establishmentName, margin, 15);
      }
      
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
      const tableStartY = 70;
      const colWidths = [90, 50, 40]; // Nom et Prénom, Statut, Signature
      const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1]];
      
      // Header background (violet comme l'entête principal)
      pdf.setFillColor(139, 92, 246);
      pdf.rect(margin, tableStartY, pageWidth - 2 * margin, 12, 'F');
      
      // Header text
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nom et Prénom', colX[0] + 3, tableStartY + 8);
      pdf.text('Statut', colX[1] + 3, tableStartY + 8);
      pdf.text('Signature', colX[2] + 3, tableStartY + 8);

      // Table content
      let currentY = tableStartY + 12;
      const rowHeight = 12;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
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
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(margin, currentY, colWidths[0], rowHeight);
        pdf.rect(colX[1], currentY, colWidths[1], rowHeight);
        pdf.rect(colX[2], currentY, colWidths[2], rowHeight);

        // Cell content
        pdf.setTextColor(0, 0, 0);
        pdf.text(`${signature.user?.first_name || ''} ${signature.user?.last_name || ''}`, colX[0] + 3, currentY + 8);
        pdf.text(signature.present ? 'Présent' : 'Absent', colX[1] + 3, currentY + 8);
        
        // Display signature image if exists
        if (signature.signature_data) {
          try {
            pdf.addImage(
              signature.signature_data,
              'PNG',
              colX[2] + 2,
              currentY + 2,
              colWidths[2] - 4,
              rowHeight - 4,
              undefined,
              'FAST'
            );
          } catch (e) {
            console.error('Error adding signature image:', e);
            pdf.text('Signé', colX[2] + 3, currentY + 8);
          }
        }
        
        currentY += rowHeight;
      });

      // Signature boxes
      const signatureY = currentY + 20;
      if (signatureY > 220) {
        pdf.addPage();
        currentY = 20;
      } else {
        currentY = signatureY;
      }

      // Trainer signature
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Signature du Formateur', margin, currentY);
      pdf.setDrawColor(100, 100, 100);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, currentY + 5, 85, 35);
      
      // Display trainer signature if exists
      const instructorSignature = signatures.find(sig => sig.user_type === 'instructor');
      if (instructorSignature?.signature_data) {
        try {
          pdf.addImage(
            instructorSignature.signature_data,
            'PNG',
            margin + 10,
            currentY + 10,
            65,
            25,
            undefined,
            'FAST'
          );
        } catch (e) {
          console.error('Error adding instructor signature:', e);
        }
      }

      // Admin signature
      pdf.text('Signature de l\'Administration', pageWidth - margin - 85, currentY);
      pdf.rect(pageWidth - margin - 85, currentY + 5, 85, 35);
      
      // Display admin signature if validated
      if (adminSignatureData) {
        try {
          pdf.addImage(
            adminSignatureData,
            'PNG',
            pageWidth - margin - 75,
            currentY + 10,
            65,
            25,
            undefined,
            'FAST'
          );
        } catch (e) {
          console.error('Error adding admin signature:', e);
        }
      }

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