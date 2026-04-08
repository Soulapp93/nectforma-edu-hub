// Heavy libs loaded dynamically to reduce initial bundle size
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const loadJsPDF = async () => (await import('jspdf')).default;
const loadHtml2Canvas = async () => (await import('html2canvas')).default;

export const pdfTextBookExport = {
  async exportTextBookToPDF(textBook: any, entries: any[], orientation: 'portrait' | 'landscape' = 'portrait'): Promise<void> {
    try {
      const jsPDF = await loadJsPDF();
      const isLandscape = orientation === 'landscape';
      const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
      
      // Page dimensions with margins (20mm all around)
      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      const headerHeight = 40;
      const footerHeight = 20;
      const contentStartY = margin + headerHeight;
      const maxContentY = pageHeight - margin - footerHeight;
      
      let currentY = contentStartY;
      let currentPage = 1;
      
      // Load establishment info
      let establishmentLogo = '';
      let establishmentName = '';
      if (textBook.formation_id) {
        const { data: formationData } = await supabase
          .from('formations')
          .select('establishment_id')
          .eq('id', textBook.formation_id)
          .single();
        
        if (formationData?.establishment_id) {
          const { data: establishmentData } = await supabase
            .from('establishments')
            .select('logo_url, name')
            .eq('id', formationData.establishment_id)
            .single();
          
          if (establishmentData) {
            establishmentLogo = establishmentData.logo_url || '';
            establishmentName = establishmentData.name || '';
          }
        }
      }
      
      // Pre-load instructor names to avoid async issues
      const instructorCache: Record<string, string> = {};
      for (const entry of entries) {
        if (entry.instructor_id && !instructorCache[entry.instructor_id]) {
          const { data: instructorData } = await supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', entry.instructor_id)
            .single();
          if (instructorData) {
            instructorCache[entry.instructor_id] = `${instructorData.first_name || ''} ${instructorData.last_name || ''}`.trim();
          }
        }
      }
      
      // Function to add header (logo, title, and establishment name ONLY on first page)
      const addHeader = async (pageNum: number) => {
        if (pageNum === 1) {
          // Logo ONLY on first page
          if (establishmentLogo) {
            try {
              const logoImg = new Image();
              logoImg.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
                setTimeout(reject, 3000);
                logoImg.src = establishmentLogo;
              });
              
              const canvas = document.createElement('canvas');
              canvas.width = logoImg.width;
              canvas.height = logoImg.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(logoImg, 0, 0);
                const logoData = canvas.toDataURL('image/png');
                pdf.addImage(logoData, 'PNG', margin, margin, 22, 22);
              }
            } catch (e) {
              console.error('Error loading logo:', e);
            }
          }
          
          // Establishment name below logo ONLY on first page
          if (establishmentName) {
            pdf.setFontSize(8);
            pdf.setTextColor(100, 100, 100);
            pdf.setFont('helvetica', 'normal');
            const nameY = establishmentLogo ? margin + 27 : margin + 10;
            const lines = pdf.splitTextToSize(establishmentName, 35);
            pdf.text(lines, margin + 11, nameY, { align: 'center' });
          }
          
          // Title ONLY on first page
          pdf.setFontSize(16);
          pdf.setTextColor(139, 92, 246);
          pdf.setFont('helvetica', 'bold');
          const title = `Cahier de Texte - ${textBook.formations?.title || 'Formation'}`;
          pdf.text(title, pageWidth / 2, margin + 15, { align: 'center' });
          
          // Academic year ONLY on first page
          pdf.setFontSize(10);
          pdf.setTextColor(100, 100, 100);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Année académique : ${textBook.academic_year || ''}`, pageWidth / 2, margin + 23, { align: 'center' });
          
          // Header separator line ONLY on first page
          pdf.setDrawColor(139, 92, 246);
          pdf.setLineWidth(0.5);
          pdf.line(margin, margin + headerHeight - 5, pageWidth - margin, margin + headerHeight - 5);
        }
        // Pages after first page: no header, content starts higher
      };
      
      // Function to add footer on each page
      const addFooter = (pageNum: number) => {
        const footerY = pageHeight - margin;
        
        // Separator line
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
        
        // Footer text
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.setFont('helvetica', 'normal');
        
        const generatedAt = format(new Date(), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
        pdf.text(`Document généré le ${generatedAt}`, margin, footerY - 5);
        pdf.text(establishmentName, pageWidth / 2, footerY - 5, { align: 'center' });
        pdf.text(`Page ${pageNum}`, pageWidth - margin, footerY - 5, { align: 'right' });
        
        // App mention
        pdf.setFontSize(7);
        pdf.text('Document généré automatiquement depuis NECTFORMA', pageWidth / 2, footerY, { align: 'center' });
      };
      
      // Function to handle page break - returns new Y position
      // Pages after first start content higher since no header
      const handlePageBreak = async (neededHeight: number): Promise<number> => {
        if (currentY + neededHeight > maxContentY) {
          addFooter(currentPage);
          pdf.addPage();
          currentPage++;
          await addHeader(currentPage);
          // No header on subsequent pages, start content at margin
          return margin + 5;
        }
        return currentY;
      };
      
      // Function to strip email addresses from text
      const stripEmails = (text: string): string => {
        // Remove email patterns like "email@domain.com Name" or just "email@domain.com"
        return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\s*[A-Za-zÀ-ÿ]*/g, '').trim();
      };
      
      // Function to render plain text from HTML (simplified, no async issues)
      // IMPORTANT: entry.content may sometimes be plain text (no <p>), so we enforce
      // a consistent top padding to prevent overlap with the section header.
      const renderContent = (html: string, startY: number, maxWidth: number): number => {
        if (!html || html.trim() === '' || html === '<p></p>') return startY;
        
        // Strip emails from HTML content
        html = stripEmails(html);

        // Always add a bit of breathing room before first rendered line
        let y = startY + 2;

        // Clean HTML and extract text
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        const ensurePageSpace = (needed: number) => {
          if (y + needed > maxContentY) {
            addFooter(currentPage);
            pdf.addPage();
            currentPage++;
            // No header on subsequent pages, start content at margin
            y = margin + 7;
          }
        };

        const processElement = (element: Element | ChildNode, indent: number = 0): void => {
          if (element.nodeType === Node.TEXT_NODE) {
            const text = element.textContent?.replace(/\s+/g, ' ').trim();
            if (text) {
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10);
              pdf.setTextColor(60, 60, 60);

              const lines = pdf.splitTextToSize(text, maxWidth - indent - 6);
              for (const line of lines) {
                ensurePageSpace(6);
                pdf.text(line, margin + 5 + indent, y);
                y += 5;
              }
            }
          } else if (element.nodeType === Node.ELEMENT_NODE) {
            const el = element as HTMLElement;
            const tagName = el.tagName.toLowerCase();

            // Pre spacing for common blocks
            if (tagName === 'p' || tagName === 'div') {
              y += 2;
            } else if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
              y += 4;
              pdf.setFont('helvetica', 'bold');
              pdf.setFontSize(tagName === 'h1' ? 14 : tagName === 'h2' ? 12 : 11);
            } else if (tagName === 'br') {
              y += 4;
              return;
            } else if (tagName === 'ul' || tagName === 'ol') {
              y += 2;
            } else if (tagName === 'li') {
              const bullet = el.parentElement?.tagName.toLowerCase() === 'ol'
                ? `${Array.from(el.parentElement.children).indexOf(el) + 1}. `
                : '• ';
              const text = el.textContent?.replace(/\s+/g, ' ').trim();
              if (text) {
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(10);
                pdf.setTextColor(60, 60, 60);

                const lines = pdf.splitTextToSize(bullet + text, maxWidth - 15);
                for (const line of lines) {
                  ensurePageSpace(6);
                  pdf.text(line, margin + 10, y);
                  y += 5;
                }
              }
              return; // Don't process children for li
            } else if (tagName === 'strong' || tagName === 'b') {
              pdf.setFont('helvetica', 'bold');
            } else if (tagName === 'em' || tagName === 'i') {
              pdf.setFont('helvetica', 'italic');
            }

            // Process children
            for (const child of Array.from(el.childNodes)) {
              processElement(child, indent);
            }

            // Reset after block elements
            if (['p', 'div', 'h1', 'h2', 'h3', 'ul', 'ol'].includes(tagName)) {
              y += 3;
              pdf.setFont('helvetica', 'normal');
              pdf.setFontSize(10);
            }
          }
        };

        for (const child of Array.from(tempDiv.childNodes)) {
          processElement(child);
        }

        return y;
      };
      
      // Add first page header
      await addHeader(1);
      
      // Sort entries by date
      const sortedEntries = [...entries].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        return a.start_time.localeCompare(b.start_time);
      });
      
      if (sortedEntries.length === 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Aucune entrée dans ce cahier de texte.', pageWidth / 2, currentY + 20, { align: 'center' });
      } else {
        // Render each entry
        for (let i = 0; i < sortedEntries.length; i++) {
          const entry = sortedEntries[i];
          
          // Check if we need a page break for entry header
          currentY = await handlePageBreak(40);
          
          // Entry header background
          pdf.setFillColor(139, 92, 246);
          pdf.rect(margin, currentY, contentWidth, 8, 'F');
          
          // Entry header columns
          const colWidths = isLandscape 
            ? [50, 45, 85, 77]
            : [40, 35, 55, 40];
          const colX = [
            margin,
            margin + colWidths[0],
            margin + colWidths[0] + colWidths[1],
            margin + colWidths[0] + colWidths[1] + colWidths[2]
          ];
          
          pdf.setFontSize(9);
          pdf.setTextColor(255, 255, 255);
          pdf.setFont('helvetica', 'bold');
          pdf.text('DATE', colX[0] + 3, currentY + 5.5);
          pdf.text('HEURE', colX[1] + 3, currentY + 5.5);
          pdf.text('MATIÈRE/MODULE', colX[2] + 3, currentY + 5.5);
          pdf.text('FORMATEUR', colX[3] + 3, currentY + 5.5);
          
          currentY += 8;
          
          // Entry data row
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, currentY, contentWidth, 10, 'F');
          
          // Draw cell borders
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineWidth(0.2);
          for (let j = 0; j < 4; j++) {
            pdf.rect(colX[j], currentY, colWidths[j], 10);
          }
          
          pdf.setFontSize(9);
          pdf.setTextColor(60, 60, 60);
          pdf.setFont('helvetica', 'normal');
          
          const formattedDate = format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr });
          const timeRange = `${entry.start_time.substring(0, 5)} - ${entry.end_time.substring(0, 5)}`;
          
          pdf.text(formattedDate, colX[0] + 3, currentY + 6.5);
          pdf.text(timeRange, colX[1] + 3, currentY + 6.5);
          
          // Subject matter
          const subjectText = entry.subject_matter || '';
          const maxSubjectLen = isLandscape ? 40 : 25;
          const truncatedSubject = subjectText.length > maxSubjectLen 
            ? subjectText.substring(0, maxSubjectLen - 3) + '...'
            : subjectText;
          pdf.text(truncatedSubject, colX[2] + 3, currentY + 6.5);
          
          // Instructor name from cache
          const instructorName = entry.instructor_id ? (instructorCache[entry.instructor_id] || 'N/A') : 'N/A';
          const maxInstructorLen = isLandscape ? 35 : 18;
          const truncatedInstructor = instructorName.length > maxInstructorLen 
            ? instructorName.substring(0, maxInstructorLen - 3) + '...'
            : instructorName;
          pdf.text(truncatedInstructor, colX[3] + 3, currentY + 6.5);
          
          currentY += 12;
          
          // Content section if exists
          if (entry.content && entry.content.trim() !== '' && entry.content !== '<p></p>') {
            // Reserve enough space for the header band + first lines
            currentY = await handlePageBreak(22);

            // Content header (taller band to avoid baseline overlap)
            const contentHeaderH = 7;
            pdf.setFillColor(243, 232, 255);
            pdf.rect(margin, currentY, contentWidth, contentHeaderH, 'F');

            pdf.setFontSize(8);
            pdf.setTextColor(139, 92, 246);
            pdf.setFont('helvetica', 'bold');
            pdf.text('CONTENU DE LA SÉANCE', margin + 3, currentY + 4.8);

            // Space between the header band and the content block
            currentY += contentHeaderH + 4;

            // Render content (renderContent already adds a small top padding)
            currentY = renderContent(entry.content, currentY, contentWidth);
            currentY += 6;
          }
          
          // Files section if exists
          if (entry.files && entry.files.length > 0) {
            currentY = await handlePageBreak(20);
            
            pdf.setFillColor(239, 246, 255);
            pdf.rect(margin, currentY, contentWidth, 6, 'F');
            
            pdf.setFontSize(8);
            pdf.setTextColor(59, 130, 246);
            pdf.setFont('helvetica', 'bold');
            pdf.text('PIÈCES JOINTES', margin + 3, currentY + 4);
            
            currentY += 8;
            
            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);
            pdf.setFont('helvetica', 'normal');
            
            for (const file of entry.files) {
              currentY = await handlePageBreak(8);
              
              const fileName = file.file_name || 'Document';
              const fileExt = fileName.split('.').pop()?.toUpperCase() || 'FILE';
              
              pdf.setFillColor(220, 220, 220);
              pdf.roundedRect(margin + 3, currentY - 3, 12, 5, 1, 1, 'F');
              pdf.setFontSize(6);
              pdf.setTextColor(100, 100, 100);
              pdf.text(fileExt.substring(0, 4), margin + 4, currentY);
              
              pdf.setFontSize(9);
              pdf.setTextColor(60, 60, 60);
              pdf.text(`${fileName} - Document joint à la séance`, margin + 18, currentY);
              
              currentY += 7;
            }
            
            currentY += 3;
          }
          
          // Spacing between entries
          currentY += 10;
          
          // Separator line between entries
          if (i < sortedEntries.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.1);
            pdf.line(margin + 20, currentY - 5, pageWidth - margin - 20, currentY - 5);
          }
        }
      }
      
      // Add footer to the last page
      addFooter(currentPage);
      
      // Generate filename
      const formationTitle = textBook.formations?.title?.replace(/\s+/g, '-') || 'formation';
      const filename = `cahier-texte-${formationTitle}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      
      pdf.save(filename);
    } catch (error) {
      console.error('Error exporting text book PDF:', error);
      throw new Error('Erreur lors de l\'export PDF du cahier de texte');
    }
  },


};
