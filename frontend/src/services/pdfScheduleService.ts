import jsPDF from 'jspdf';
import { ScheduleSlot } from './scheduleService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const exportScheduleToPDF = (
  schedules: ScheduleSlot[],
  title: string,
  userRole?: string,
  userName?: string,
  startDate?: Date,
  endDate?: Date
) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  let currentY = margin;

  // Set default font
  pdf.setFont('helvetica');

  // Header with modern design
  pdf.setFillColor(139, 92, 246); // Primary color
  pdf.rect(0, 0, pageWidth, 25, 'F');

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(title, pageWidth / 2, 16, { align: 'center' });

  // Reset color for body content
  pdf.setTextColor(0, 0, 0);
  currentY = 35;

  // User info if provided
  if (userName && userRole) {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${userRole}: ${userName}`, margin, currentY);
    currentY += 8;
  }

  // Date range with better formatting
  if (startDate && endDate) {
    const formattedStartDate = format(startDate, 'EEEE d MMMM yyyy', { locale: fr });
    const formattedEndDate = format(endDate, 'EEEE d MMMM yyyy', { locale: fr });
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Période:', margin, currentY);
    pdf.setFont('helvetica', 'normal');
    
    if (formattedStartDate === formattedEndDate) {
      pdf.text(formattedStartDate, margin + 20, currentY);
    } else {
      pdf.text(`Du ${formattedStartDate}`, margin + 20, currentY);
      currentY += 6;
      pdf.text(`Au ${formattedEndDate}`, margin + 20, currentY);
    }
    currentY += 15;
  } else if (schedules.length > 0) {
    const dates = schedules.map(s => s.date).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Période:', margin, currentY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${firstDate} - ${lastDate}`, margin + 20, currentY);
    currentY += 15;
  }

  // Group schedules by date
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  // Generate schedule for each date with modern design
  const sortedDates = Object.keys(schedulesByDate).sort();
  
  sortedDates.forEach((date, dateIndex) => {
    const daySchedules = schedulesByDate[date];
    
    // Check if we need a new page
    if (currentY > pageHeight - 120) {
      pdf.addPage();
      currentY = margin + 15;
    }

    // Date header with background
    const headerY = currentY;
    pdf.setFillColor(248, 250, 252); // Light gray background
    pdf.rect(margin, headerY - 5, pageWidth - (2 * margin), 12, 'F');
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229); // Indigo color
    
    const dateObj = new Date(date);
    const formattedDate = format(dateObj, 'EEEE d MMMM yyyy', { locale: fr });
    pdf.text(formattedDate, margin + 5, currentY + 3);
    
    // Reset color
    pdf.setTextColor(0, 0, 0);
    currentY += 15;

    // Sort by time
    const sortedSchedules = daySchedules.sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );

    if (sortedSchedules.length === 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(128, 128, 128);
      pdf.text('Aucun cours programmé', margin + 10, currentY);
      pdf.setTextColor(0, 0, 0);
      currentY += 15;
      return;
    }

    // Table headers
    const colWidths = [25, 60, 45, 35]; // Time, Module, Instructor, Room
    const colPositions = [margin + 5, margin + 30, margin + 95, margin + 145];
    
    pdf.setFillColor(239, 246, 255); // Light blue background
    pdf.rect(margin, currentY - 2, pageWidth - (2 * margin), 8, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Horaire', colPositions[0], currentY + 3);
    pdf.text('Module', colPositions[1], currentY + 3);
    pdf.text('Formateur', colPositions[2], currentY + 3);
    pdf.text('Salle', colPositions[3], currentY + 3);
    currentY += 12;

    // Draw schedule slots with alternating colors
    sortedSchedules.forEach((schedule, index) => {
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 15;
      }

      // Alternating row colors
      if (index % 2 === 1) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, currentY - 2, pageWidth - (2 * margin), 10, 'F');
      }

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');

      // Time
      const timeText = `${schedule.start_time} - ${schedule.end_time}`;
      pdf.text(timeText, colPositions[0], currentY + 3);

      // Module/Formation info with truncation
      let moduleText = '';
      if (schedule.formation_modules?.title) {
        moduleText = schedule.formation_modules.title;
      } else if (schedule.notes) {
        moduleText = schedule.notes;
      }
      
      if (moduleText) {
        // Truncate if too long
        const maxModuleLength = 35;
        if (moduleText.length > maxModuleLength) {
          moduleText = moduleText.substring(0, maxModuleLength) + '...';
        }
        pdf.setFont('helvetica', 'bold');
        pdf.text(moduleText, colPositions[1], currentY + 3);
        pdf.setFont('helvetica', 'normal');
      }

      // Instructor
      if (schedule.users?.first_name && schedule.users?.last_name) {
        const instructorText = `${schedule.users.first_name} ${schedule.users.last_name}`;
        pdf.text(instructorText, colPositions[2], currentY + 3);
      } else {
        pdf.setTextColor(128, 128, 128);
        pdf.text('Non assigné', colPositions[2], currentY + 3);
        pdf.setTextColor(0, 0, 0);
      }

      // Room
      if (schedule.room) {
        pdf.text(schedule.room, colPositions[3], currentY + 3);
      } else {
        pdf.setTextColor(128, 128, 128);
        pdf.text('Non défini', colPositions[3], currentY + 3);
        pdf.setTextColor(0, 0, 0);
      }

      currentY += 10;
    });

    currentY += 8; // Space between days
  });

  // Footer for all pages
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    // Page number
    pdf.text(
      `Page ${i} sur ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
    
    // Generation date
    const now = new Date();
    const formattedDate = format(now, 'EEEE d MMMM yyyy à HH:mm', { locale: fr });
    pdf.text(
      `Généré le ${formattedDate}`,
      margin,
      pageHeight - 8
    );
    
    // Reset color
    pdf.setTextColor(0, 0, 0);
  }

  // Save the PDF with better filename
  let filename = 'emploi-du-temps';
  if (startDate && endDate) {
    const start = format(startDate, 'yyyy-MM-dd');
    const end = format(endDate, 'yyyy-MM-dd');
    filename = `emploi-du-temps-${start}-${end}.pdf`;
  } else {
    filename = `emploi-du-temps-${new Date().toISOString().split('T')[0]}.pdf`;
  }
  
  pdf.save(filename);
};