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

      // Create a temporary container for the PDF content
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = '210mm'; // A4 width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(tempContainer);

      // Build the HTML content
      const formationColor = textBook.formations?.color || '#8B5CF6';
      
      tempContainer.innerHTML = `
        <div style="padding: 20px; min-height: 297mm;">
          <!-- Header -->
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

          <!-- Entries -->
          <div style="space-y: 16px;">
            ${entries && entries.length > 0 ? entries.map(entry => `
              <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 16px;">
                <!-- Entry Header -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; background: linear-gradient(135deg, ${formationColor}, ${formationColor}cc); color: white; font-size: 14px; font-weight: 500;">
                  <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">DATE</div>
                  <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">HEURE</div>
                  <div style="padding: 12px; border-right: 1px solid rgba(255,255,255,0.2);">MATIÈRE/MODULE</div>
                  <div style="padding: 12px;">FORMATEUR</div>
                </div>
                
                <!-- Entry Data -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; font-size: 14px;">
                  <div style="padding: 12px; border-right: 1px solid #e5e7eb; font-weight: 500;">
                    ${format(new Date(entry.date), 'dd/MM/yyyy', { locale: fr })}
                  </div>
                  <div style="padding: 12px; border-right: 1px solid #e5e7eb;">
                    ${entry.start_time} - ${entry.end_time}
                  </div>
                  <div style="padding: 12px; border-right: 1px solid #e5e7eb; font-weight: 500;">
                    ${entry.subject_matter}
                  </div>
                  <div style="padding: 12px;">
                    ${currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'N/A'}
                  </div>
                </div>
                
                ${entry.content ? `
                  <!-- Content Section -->
                  <div style="background: #faf5ff; border-top: 1px solid #e5e7eb;">
                    <div style="padding: 16px;">
                      <div style="background: white; border-radius: 4px; padding: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        <h4 style="color: ${formationColor}; font-weight: 500; margin-bottom: 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">CONTENU</h4>
                        <div style="color: #374151; line-height: 1.6;">
                          ${entry.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            `).join('') : `
              <div style="text-align: center; padding: 64px;">
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
            `}
          </div>
        </div>
      `;

      // Convert to canvas and generate PDF
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // Clean up
      document.body.removeChild(tempContainer);

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
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