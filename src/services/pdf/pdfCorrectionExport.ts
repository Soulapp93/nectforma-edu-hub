// Heavy libs loaded dynamically to reduce initial bundle size
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const loadJsPDF = async () => (await import('jspdf')).default;
const loadHtml2Canvas = async () => (await import('html2canvas')).default;

export const pdfCorrectionExport = {
  async exportCorrectionSheet(
    assignmentId: string,
    assignmentTitle: string,
    submissions: { student_name: string; grade: number | null; max_grade: number }[],
    moduleTitle: string,
    formationTitle: string,
    instructorName: string,
    formationId: string
  ): Promise<void> {
    try {
      const jsPDF = await loadJsPDF();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const margin = 15;

      // Load establishment info
      let establishmentLogo = '';
      let establishmentName = '';
      if (formationId) {
        const { data: formationData } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', formationId)
          .single();
        if (formationData?.establishment_id) {
          const { data: estData } = await supabase
            .from('establishments')
            .select('logo_url, name')
            .eq('id', formationData.establishment_id)
            .single();
          if (estData) {
            establishmentLogo = estData.logo_url || '';
            establishmentName = estData.name || '';
          }
        }
      }

      // Header background
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 55, 'F');

      // Logo
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
            pdf.setFillColor(255, 255, 255);
            pdf.roundedRect(margin - 2, 5, 26, 26, 3, 3, 'F');
            pdf.addImage(logoData, 'PNG', margin, 7, 22, 22);
          }
        } catch (e) {
          console.error('Error loading logo:', e);
        }
      }

      if (establishmentName) {
        pdf.setFontSize(7);
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'normal');
        const nameY = establishmentLogo ? 37 : 15;
        const lines = pdf.splitTextToSize(establishmentName, 30);
        pdf.text(lines, margin + 10, nameY, { align: 'center' });
      }

      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('FEUILLE DE CORRECTION', pageWidth / 2, 18, { align: 'center' });

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'normal');
      pdf.text(formationTitle, pageWidth / 2, 28, { align: 'center' });

      pdf.setFontSize(11);
      pdf.text(`Module : ${moduleTitle}`, pageWidth / 2, 38, { align: 'center' });

      pdf.setFontSize(10);
      pdf.text(`Devoir : ${assignmentTitle}`, pageWidth / 2, 47, { align: 'center' });

      // Details
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const detailsY = 63;
      const formattedDate = format(new Date(), 'dd/MM/yyyy', { locale: fr });
      pdf.text(`Date : ${formattedDate}`, margin, detailsY);
      pdf.text(`Formateur : ${instructorName}`, 100, detailsY);

      // Stats
      const corrected = submissions.filter(s => s.grade !== null);
      const avg = corrected.length > 0 ? corrected.reduce((acc, s) => acc + (s.grade || 0), 0) / corrected.length : 0;
      pdf.setFontSize(9);
      pdf.text(`Total étudiants : ${submissions.length}`, margin, detailsY + 7);
      pdf.text(`Corrigés : ${corrected.length}`, 70, detailsY + 7);
      if (corrected.length > 0) {
        pdf.text(`Moyenne : ${avg.toFixed(2)}/${submissions[0]?.max_grade || 20}`, 120, detailsY + 7);
      }

      // Table header
      const tableStartY = detailsY + 15;
      const colWidths = [120, 60];
      const colX = [margin, margin + colWidths[0]];

      pdf.setFillColor(139, 92, 246);
      pdf.rect(margin, tableStartY, pageWidth - 2 * margin, 10, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Nom complet', colX[0] + 5, tableStartY + 7);
      pdf.text('Note', colX[1] + 15, tableStartY + 7);

      // Table rows
      let currentY = tableStartY + 10;
      const rowHeight = 10;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      submissions.forEach((sub, index) => {
        if (currentY > 270) {
          pdf.addPage();
          currentY = 20;
        }

        if (index % 2 === 0) {
          pdf.setFillColor(255, 255, 255);
        } else {
          pdf.setFillColor(249, 250, 251);
        }
        pdf.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, 'F');
        pdf.setDrawColor(220, 220, 220);
        pdf.rect(colX[0], currentY, colWidths[0], rowHeight);
        pdf.rect(colX[1], currentY, colWidths[1], rowHeight);

        pdf.setTextColor(0, 0, 0);
        pdf.text(sub.student_name, colX[0] + 5, currentY + 7);

        if (sub.grade !== null) {
          pdf.setTextColor(34, 197, 94);
          pdf.text(`${sub.grade}/${sub.max_grade}`, colX[1] + 15, currentY + 7);
        } else {
          pdf.setTextColor(156, 163, 175);
          pdf.text('Non corrigé', colX[1] + 10, currentY + 7);
        }

        currentY += rowHeight;
      });

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      const footerY = Math.min(currentY + 15, 285);
      const generatedAt = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
      pdf.text(`Document généré le ${generatedAt} - ${establishmentName || 'NECTFORMA'}`, pageWidth / 2, footerY, { align: 'center' });

      const filename = `correction-${assignmentTitle.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting correction sheet PDF:', error);
      throw new Error("Erreur lors de l'export de la feuille de correction");
    }
  },


};
