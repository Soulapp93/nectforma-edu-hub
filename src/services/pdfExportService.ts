import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TextBook, TextBookEntry, textBookService } from './textBookService';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const pdfExportService = {
  async exportTextBookToPDF(textBook: TextBook): Promise<void> {
    try {
      // Fetch entries for this textbook
      const entries = await textBookService.getTextBookEntries(textBook.id);
      
      // Fetch current user details
      const { data: { user } } = await supabase.auth.getUser();
      let currentUser = null;
      
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .eq('id', user.id)
          .single();
        currentUser = userData;
      }

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const formationColor = textBook.formations?.color || '#8B5CF6';
      
      let isFirstPage = true;

      // Add header on first page
      if (isFirstPage) {
        const headerContainer = document.createElement('div');
        headerContainer.style.position = 'absolute';
        headerContainer.style.left = '-9999px';
        headerContainer.style.top = '0';
        headerContainer.style.width = '210mm';
        headerContainer.style.backgroundColor = 'white';
        headerContainer.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(headerContainer);

        headerContainer.innerHTML = `
          <div style="padding: 40px; font-family: Arial, sans-serif;">
            <div style="background: linear-gradient(135deg, ${formationColor}, ${formationColor}cc); border-radius: 8px; padding: 24px; color: white; margin-bottom: 32px;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
                <h1 style="font-size: 28px; font-weight: bold; margin: 0;">
                  Cahier de texte - ${textBook.formations?.title || 'Formation'}
                </h1>
              </div>
              <p style="margin: 0; opacity: 0.9;">Année académique : ${textBook.academic_year}</p>
            </div>
          </div>
        `;

        const headerCanvas = await html2canvas(headerContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          allowTaint: false
        });

        document.body.removeChild(headerContainer);

        const headerImgData = headerCanvas.toDataURL('image/png', 0.95);
        const headerImgWidth = pdfWidth;
        const headerImgHeight = (headerCanvas.height * pdfWidth) / headerCanvas.width;
        
        pdf.addImage(headerImgData, 'PNG', 0, 0, headerImgWidth, headerImgHeight);
        isFirstPage = false;
      }

      // Process each entry separately to ensure proper page breaks
      if (entries && entries.length > 0) {
        for (let index = 0; index < entries.length; index++) {
          const entry = entries[index];
          
          // Add new page for each entry (except if it's the first entry and we're on the first page with header)
          if (index > 0 || !isFirstPage) {
            pdf.addPage();
          }

          // Create container for this entry
          const entryContainer = document.createElement('div');
          entryContainer.style.position = 'absolute';
          entryContainer.style.left = '-9999px';
          entryContainer.style.top = '0';
          entryContainer.style.width = '210mm';
          entryContainer.style.backgroundColor = 'white';
          entryContainer.style.fontFamily = 'Arial, sans-serif';
          document.body.appendChild(entryContainer);

          const contentHtml = entry.content ? `
            <div style="background: #faf5ff; margin-top: 2px;">
              <div style="padding: 20px;">
                <div style="background: white; border-radius: 6px; padding: 16px; border-left: 4px solid ${formationColor}; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  <h4 style="color: ${formationColor}; font-weight: 600; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">CONTENU DE LA SÉANCE</h4>
                  <div style="color: #374151; line-height: 1.7; font-size: 14px;">
                    ${entry.content.replace(/<[^>]*>/g, '')}
                  </div>
                </div>
              </div>
            </div>
          ` : '';

          const homeworkHtml = entry.homework ? `
            <div style="background: #fff7ed; ${entry.content ? 'border-top: 1px solid #fed7aa;' : 'margin-top: 2px;'}">
              <div style="padding: 16px 20px;">
                <div style="background: white; border-radius: 6px; padding: 16px; border-left: 4px solid #f97316; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  <h4 style="color: #f97316; font-weight: 600; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">TRAVAIL À FAIRE</h4>
                  <div style="color: #374151; line-height: 1.6; font-size: 14px;">
                    ${entry.homework}
                  </div>
                </div>
              </div>
            </div>
          ` : '';

          const filesHtml = entry.files && entry.files.length > 0 ? `
            <div style="background: #f0f9ff; ${entry.content || entry.homework ? 'border-top: 1px solid #bae6fd;' : 'margin-top: 2px;'} padding: 16px 20px;">
              <h4 style="color: #0284c7; font-weight: 600; margin-bottom: 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">PIÈCES JOINTES</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                ${entry.files.map((file, fileIndex) => `
                  <span style="
                    background: white; 
                    border: 1px solid #bae6fd; 
                    border-radius: 4px; 
                    padding: 6px 12px; 
                    font-size: 12px; 
                    color: #0284c7;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                  ">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    Fichier joint ${fileIndex + 1}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : '';

          entryContainer.innerHTML = `
            <div style="padding: 40px; font-family: Arial, sans-serif;">
              <div style="
                background: white; 
                border-radius: 8px; 
                box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
                border: 1px solid #e5e7eb; 
                overflow: hidden;
              ">
                <!-- Entry Header with Data -->
                <div style="background: linear-gradient(135deg, ${formationColor}, ${formationColor}cc); color: white;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                    <div style="padding: 8px 12px; border-right: 1px solid rgba(255,255,255,0.2);">DATE</div>
                    <div style="padding: 8px 12px; border-right: 1px solid rgba(255,255,255,0.2);">HEURE</div>
                    <div style="padding: 8px 12px; border-right: 1px solid rgba(255,255,255,0.2);">MATIÈRE/MODULE</div>
                    <div style="padding: 8px 12px;">FORMATEUR</div>
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; font-size: 14px; font-weight: 500; background: rgba(255,255,255,0.1);">
                    <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">
                      ${format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}
                    </div>
                    <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">
                      ${entry.start_time.substring(0, 5)} - ${entry.end_time.substring(0, 5)}
                    </div>
                    <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">
                      ${entry.subject_matter}
                    </div>
                    <div style="padding: 12px;">
                      ${currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'N/A'}
                    </div>
                  </div>
                </div>
                
                ${contentHtml}
                ${homeworkHtml}
                ${filesHtml}
              </div>
            </div>
          `;

          // Convert entry to canvas
          const entryCanvas = await html2canvas(entryContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 1200,
            allowTaint: false
          });

          document.body.removeChild(entryContainer);

          const entryImgData = entryCanvas.toDataURL('image/png', 0.95);
          const entryImgWidth = pdfWidth;
          const entryImgHeight = (entryCanvas.height * pdfWidth) / entryCanvas.width;
          
          // Calculate position - start from top if it's first entry on page with header
          const yPosition = (index === 0 && isFirstPage) ? 80 : 0;
          
          pdf.addImage(entryImgData, 'PNG', 0, yPosition, entryImgWidth, entryImgHeight);
        }
      } else {
        // Add empty state if no entries
        pdf.addPage();
        const emptyContainer = document.createElement('div');
        emptyContainer.style.position = 'absolute';
        emptyContainer.style.left = '-9999px';
        emptyContainer.style.top = '0';
        emptyContainer.style.width = '210mm';
        emptyContainer.style.backgroundColor = 'white';
        emptyContainer.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(emptyContainer);

        emptyContainer.innerHTML = `
          <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
            <div style="width: 64px; height: 64px; background: #f3e8ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <h3 style="font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 8px;">
              Aucune entrée dans ce cahier de texte
            </h3>
            <p style="color: #6b7280;">
              Ce cahier de texte ne contient aucune entrée pour le moment.
            </p>
          </div>
        `;

        const emptyCanvas = await html2canvas(emptyContainer, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          allowTaint: false
        });

        document.body.removeChild(emptyContainer);

        const emptyImgData = emptyCanvas.toDataURL('image/png', 0.95);
        const emptyImgWidth = pdfWidth;
        const emptyImgHeight = (emptyCanvas.height * pdfWidth) / emptyCanvas.width;
        
        pdf.addImage(emptyImgData, 'PNG', 0, 0, emptyImgWidth, emptyImgHeight);
      }

      // Download the PDF
      const fileName = `cahier-texte-${textBook.formations?.title || 'formation'}-${textBook.academic_year}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      throw error;
    }
  }
};