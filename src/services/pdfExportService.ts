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
      
      // Load instructor info if not present
      let instructorName = '';
      if (attendanceSheet.instructor) {
        instructorName = `${attendanceSheet.instructor.first_name || ''} ${attendanceSheet.instructor.last_name || ''}`.trim();
      }
      if (!instructorName && attendanceSheet.instructor_id) {
        const { data: instructorData } = await supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', attendanceSheet.instructor_id)
          .single();
        
        if (instructorData) {
          instructorName = `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim();
        }
      }
      if (!instructorName) {
        instructorName = 'Non assigné';
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

      // Load all students assigned to the formation
      let students: { id: string; first_name: string; last_name: string; email: string }[] = [];
      if (attendanceSheet.formation_id) {
        const { data: studentFormations } = await supabase
          .from('student_formations')
          .select('student_id, users:student_id(id, first_name, last_name, email)')
          .eq('formation_id', attendanceSheet.formation_id);
        
        if (studentFormations) {
          students = studentFormations
            .filter((sf: any) => sf.users)
            .map((sf: any) => ({
              id: sf.users.id,
              first_name: sf.users.first_name || '',
              last_name: sf.users.last_name || '',
              email: sf.users.email || ''
            }));
        }
      }

      // Load all signatures from the database
      let signatures: any[] = [];
      try {
        const { data: signaturesData, error: signaturesError } = await supabase
          .from('attendance_signatures')
          .select(`*, users(first_name, last_name, email)`)
          .eq('attendance_sheet_id', attendanceSheet.id);

        if (!signaturesError && signaturesData) {
          signatures = (signaturesData as any[]).map(sig => ({
            ...sig,
            user: (sig as any).users
          }));
        }
      } catch (e) {
        console.error('Unexpected error loading signatures for PDF export:', e);
      }

      // Create a map of signatures by user_id
      const signatureMap = new Map<string, any>();
      signatures.forEach(sig => {
        signatureMap.set(sig.user_id, sig);
      });

      // Merge students with their signatures
      const participants = students.map(student => {
        const signature = signatureMap.get(student.id);
        return {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          present: signature?.present ?? false,
          signed: !!signature,
          signature_data: signature?.signature_data || null,
          absence_reason: signature?.absence_reason || null
        };
      });

      // Get instructor signature
      const instructorSignature = signatures.find(sig => sig.user_type === 'instructor');
      
      // Header with purple background
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 50, 'F');
      
      // Add establishment logo and name in top-left corner
      let logoHeight = 0;
      if (establishmentLogo) {
        try {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            logoImg.onload = resolve;
            logoImg.onerror = reject;
            logoImg.src = establishmentLogo;
          });
          
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
            logoHeight = 30;
          }
        } catch (e) {
          console.error('Error loading establishment logo:', e);
        }
      }
      
      // Add establishment name below logo
      if (establishmentName) {
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'normal');
        const nameY = establishmentLogo ? 37 : 15;
        const maxWidth = 30;
        const lines = pdf.splitTextToSize(establishmentName, maxWidth);
        pdf.text(lines, margin + 10, nameY, { align: 'center' });
      }
      
      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FEUILLE D\'ÉMARGEMENT', pageWidth / 2, 18, { align: 'center' });
      
      // Formation info
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(attendanceSheet.formations?.title || '', pageWidth / 2, 30, { align: 'center' });
      
      pdf.setFontSize(11);
      pdf.text(`Niveau : ${attendanceSheet.formations?.level || ''}`, pageWidth / 2, 42, { align: 'center' });

      // Course details section
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const formattedDate = format(new Date(attendanceSheet.date), 'dd/MM/yyyy', { locale: fr });
      
      const detailsY = 60;
      pdf.text(`Date: ${formattedDate}`, margin, detailsY);
      pdf.text(`Heure: ${attendanceSheet.start_time.substring(0, 5)} - ${attendanceSheet.end_time.substring(0, 5)}`, 80, detailsY);
      pdf.text(`Salle: ${attendanceSheet.room || 'Non définie'}`, 160, detailsY);
      pdf.text(`Formateur: ${instructorName}`, margin, detailsY + 7);

      // Count present and absent
      const presentCount = participants.filter(p => p.present).length;
      const absentCount = participants.filter(p => !p.present).length;

      // Participants list header
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Liste des participants (${participants.length})`, margin, detailsY + 18);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`Présents: ${presentCount}`, margin, detailsY + 24);
      pdf.setTextColor(239, 68, 68);
      pdf.text(`Absents: ${absentCount}`, margin + 30, detailsY + 24);

      // Table header
      const tableStartY = detailsY + 30;
      const colWidths = [90, 50, 40]; // Nom et Prénom, Statut, Signature
      const colX = [margin, margin + colWidths[0], margin + colWidths[0] + colWidths[1]];
      
      // Header background (violet)
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
      const rowHeight = 14;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      
      participants.forEach((participant, index) => {
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

        // Name
        pdf.setTextColor(0, 0, 0);
        const fullName = `${participant.first_name} ${participant.last_name}`.trim() || 'Nom inconnu';
        pdf.text(fullName, colX[0] + 3, currentY + 9);
        
        // Status with color
        if (participant.signed) {
          if (participant.present) {
            pdf.setTextColor(34, 197, 94); // Green
            pdf.text('Présent', colX[1] + 3, currentY + 9);
          } else {
            pdf.setTextColor(239, 68, 68); // Red
            pdf.text('Absent', colX[1] + 3, currentY + 9);
          }
        } else {
          pdf.setTextColor(156, 163, 175); // Gray
          pdf.text('Non signé', colX[1] + 3, currentY + 9);
        }
        
        // Display signature image if exists
        if (participant.signature_data) {
          try {
            pdf.addImage(
              participant.signature_data,
              'PNG',
              colX[2] + 2,
              currentY + 2,
              colWidths[2] - 4,
              rowHeight - 4,
              undefined,
              'FAST'
            );
          } catch (e) {
            pdf.setTextColor(34, 197, 94);
            pdf.text('Signé', colX[2] + 3, currentY + 9);
          }
        } else {
          pdf.setTextColor(156, 163, 175);
          pdf.text('Non signé', colX[2] + 3, currentY + 9);
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
      } else {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(156, 163, 175);
        pdf.text('En attente de signature', margin + 15, currentY + 25);
      }

      // Instructor name below signature box
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(instructorName, margin + 42.5, currentY + 45, { align: 'center' });

      // Admin signature
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
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
      } else {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(156, 163, 175);
        pdf.text('En attente de validation', pageWidth - margin - 60, currentY + 25);
      }

      // Admin label
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text('Administration', pageWidth - margin - 42.5, currentY + 45, { align: 'center' });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      const footerY = Math.min(currentY + 55, 285);
      const generatedAt = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
      pdf.text(`Document généré le ${generatedAt} - NECTFY`, pageWidth / 2, footerY, { align: 'center' });

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