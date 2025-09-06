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
        <style>
          @page {
            margin: 20mm;
            size: A4;
          }
          @media print {
            .entry-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              margin-bottom: 50px !important;
            }
            .header-section {
              page-break-after: avoid !important;
            }
            .content-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .homework-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .files-section {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .entry-header {
              page-break-after: avoid !important;
            }
          }
          .entry-block {
            margin-bottom: 50px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .entry-header {
            page-break-after: avoid !important;
          }
          .content-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .homework-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .files-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        </style>
        <div style="padding: 40px; padding-bottom: 80px; min-height: 297mm; font-family: Arial, sans-serif;">
          <!-- Header -->
          <div class="header-section" style="background: linear-gradient(135deg, ${formationColor}, ${formationColor}cc); border-radius: 8px; padding: 24px; color: white; margin-bottom: 32px; page-break-after: avoid;">
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
          <div style="margin-bottom: 20px;">
            ${entries && entries.length > 0 ? entries.map((entry, index) => {
              const contentHtml = entry.content ? `
                <div class="content-section" style="background: #faf5ff; page-break-inside: avoid;">
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
                <div class="homework-section" style="background: #fff7ed; border-top: 1px solid #fed7aa;">
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
                <div class="files-section" style="background: #f0f9ff; border-top: 1px solid #bae6fd; padding: 16px 20px;">
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

              return `
                <div class="entry-block" style="
                  background: white; 
                  border-radius: 8px; 
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
                  border: 1px solid #e5e7eb; 
                  overflow: hidden; 
                  margin-bottom: 60px;
                  page-break-inside: avoid;
                  break-inside: avoid;
                  ${index === 0 ? 'margin-top: 0;' : ''}
                ">
                  <!-- Entry Header with Data -->
                  <div class="entry-header" style="background: linear-gradient(135deg, ${formationColor}, ${formationColor}cc); color: white;">
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
              `;
            }).join('') : `
              <div style="text-align: center; padding: 64px; page-break-inside: avoid;">
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

      // Create PDF with better page handling
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate optimal scale for better quality
      const scale = Math.min(2, window.devicePixelRatio || 1);
      
      // Convert to canvas with better settings
      const canvas = await html2canvas(tempContainer, {
        scale: scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        height: tempContainer.scrollHeight,
        windowWidth: 1200,
        windowHeight: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        allowTaint: false,
        removeContainer: true
      });

      // Clean up
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Add margins for safer page breaks
      const marginTop = 10;
      const marginBottom = 15;
      const usableHeight = pdfHeight - marginTop - marginBottom;
      
      let heightLeft = imgHeight;
      let position = 0;
      let pageCount = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, marginTop, imgWidth, imgHeight);
      heightLeft -= usableHeight;

      // Add additional pages with proper margins
      while (heightLeft > 0) {
        pageCount++;
        position = -(usableHeight * pageCount);
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position + marginTop, imgWidth, imgHeight);
        heightLeft -= usableHeight;
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