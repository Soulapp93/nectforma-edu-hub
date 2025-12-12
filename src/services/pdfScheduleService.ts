import jsPDF from 'jspdf';
import { ScheduleSlot } from './scheduleService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, addMonths, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PrintOptions {
  viewMode: 'day' | 'week' | 'month' | 'list';
  dateRange: {
    start: Date;
    end: Date;
  };
  orientation: 'portrait' | 'landscape';
}

// Convertir couleur hex en RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 139, g: 92, b: 246 }; // Fallback violet
};

// Déterminer si une couleur est claire ou foncée
const isLightColor = (hex: string): boolean => {
  const rgb = hexToRgb(hex);
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5;
};

// Truncate text to fit in a given width
const truncateText = (pdf: jsPDF, text: string, maxWidth: number): string => {
  if (pdf.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (pdf.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
};

export const exportScheduleToPDFAdvanced = (
  schedules: ScheduleSlot[],
  title: string,
  options: PrintOptions,
  userRole?: string,
  userName?: string
) => {
  const isLandscape = options.orientation === 'landscape';
  const pdf = new jsPDF(isLandscape ? 'l' : 'p', 'mm', 'a4');
  
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - (2 * margin);

  // Set default font
  pdf.setFont('helvetica');

  // Filter schedules by date range
  const filteredSchedules = schedules.filter(s => {
    const slotDate = new Date(s.date);
    return slotDate >= options.dateRange.start && slotDate <= options.dateRange.end;
  }).sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start_time.localeCompare(b.start_time);
  });

  // Render header on first page
  const renderHeader = (startY: number): number => {
    let currentY = startY;
    
    // Header banner
    pdf.setFillColor(139, 92, 246);
    pdf.rect(0, 0, pageWidth, 22, 'F');
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, pageWidth / 2, 14, { align: 'center' });

    pdf.setTextColor(0, 0, 0);
    currentY = 30;

    // Period info
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (userName && userRole) {
      pdf.text(`${userRole}: ${userName}`, margin, currentY);
      currentY += 6;
    }

    const formattedStartDate = format(options.dateRange.start, 'd MMMM yyyy', { locale: fr });
    const formattedEndDate = format(options.dateRange.end, 'd MMMM yyyy', { locale: fr });
    pdf.setTextColor(139, 92, 246);
    pdf.text(`Période: ${formattedStartDate} - ${formattedEndDate}`, margin, currentY);
    pdf.setTextColor(0, 0, 0);
    currentY += 10;

    return currentY;
  };

  let startY = renderHeader(margin);

  // Render based on view mode
  switch (options.viewMode) {
    case 'day':
      renderDayView(pdf, filteredSchedules, options.dateRange.start, options.dateRange.end, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape);
      break;
    case 'week':
      renderWeekView(pdf, filteredSchedules, options.dateRange.start, options.dateRange.end, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape);
      break;
    case 'month':
      renderMonthView(pdf, filteredSchedules, options.dateRange.start, options.dateRange.end, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape);
      break;
    case 'list':
    default:
      renderListView(pdf, filteredSchedules, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape);
      break;
  }

  // Footer for all pages
  addFooter(pdf, pageWidth, pageHeight, margin);

  // Save
  const filename = `emploi-du-temps-${format(options.dateRange.start, 'yyyy-MM-dd')}-${format(options.dateRange.end, 'yyyy-MM-dd')}.pdf`;
  pdf.save(filename);
};

const renderDayView = (
  pdf: jsPDF,
  schedules: ScheduleSlot[],
  startDate: Date,
  endDate: Date,
  margin: number,
  contentWidth: number,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  isLandscape: boolean
) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  let currentY = startY;
  let isFirstDay = true;

  days.forEach((day) => {
    const daySchedules = schedules.filter(s => isSameDay(new Date(s.date), day))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Check if we need a new page
    const estimatedHeight = 20 + (daySchedules.length * 35);
    if (!isFirstDay && currentY + estimatedHeight > pageHeight - 30) {
      pdf.addPage();
      currentY = margin + 10;
    }
    isFirstDay = false;

    // Day header
    const dateStr = format(day, 'EEEE d MMMM yyyy', { locale: fr });
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, currentY, contentWidth, 12, 2, 2, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(139, 92, 246);
    pdf.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), margin + 5, currentY + 8);
    pdf.setTextColor(0, 0, 0);
    currentY += 16;

    if (daySchedules.length === 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Aucun cours programmé ce jour', margin + 10, currentY + 5);
      pdf.setTextColor(0, 0, 0);
      currentY += 15;
      return;
    }

    daySchedules.forEach((slot) => {
      // Check for page break
      if (currentY + 35 > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 10;
      }

      const slotColor = slot.color || '#8B5CF6';
      const rgb = hexToRgb(slotColor);
      const slotHeight = 30;

      // Slot card with color
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.roundedRect(margin, currentY, contentWidth, slotHeight, 3, 3, 'F');

      // Text color based on background
      const textColor = isLightColor(slotColor) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
      pdf.setTextColor(textColor.r, textColor.g, textColor.b);

      // Module name
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
      pdf.text(truncateText(pdf, moduleName, contentWidth - 20), margin + 8, currentY + 8);

      // Time
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const timeText = `🕐 ${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
      pdf.text(timeText, margin + 8, currentY + 16);

      // Instructor
      const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné';
      pdf.text(`👤 ${instructor}`, margin + 60, currentY + 16);

      // Room
      if (slot.room) {
        pdf.text(`📍 ${slot.room}`, margin + 8, currentY + 24);
      }

      pdf.setTextColor(0, 0, 0);
      currentY += slotHeight + 5;
    });

    currentY += 10;
  });
};

const renderWeekView = (
  pdf: jsPDF,
  schedules: ScheduleSlot[],
  startDate: Date,
  endDate: Date,
  margin: number,
  contentWidth: number,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  isLandscape: boolean
) => {
  let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 });
  let isFirstWeek = true;

  while (currentWeekStart <= endDate) {
    if (!isFirstWeek) {
      pdf.addPage();
    }
    isFirstWeek = false;

    let currentY = startY;
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

    // Week period header
    const weekStartStr = format(currentWeekStart, 'd MMMM', { locale: fr });
    const weekEndStr = format(weekEnd, 'd MMMM yyyy', { locale: fr });
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Semaine du ${weekStartStr} au ${weekEndStr}`, margin, currentY);
    currentY += 8;

    const dayWidth = contentWidth / 7;
    const headerHeight = 18;

    // Day headers with date
    pdf.setFillColor(139, 92, 246);
    pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);

    days.forEach((day, index) => {
      const x = margin + index * dayWidth + dayWidth / 2;
      const dayName = format(day, 'EEEE', { locale: fr });
      const dayNum = format(day, 'd MMM', { locale: fr });
      pdf.text(dayName.charAt(0).toUpperCase() + dayName.slice(1, 3), x, currentY + 7, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(dayNum, x, currentY + 13, { align: 'center' });
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
    });

    pdf.setTextColor(0, 0, 0);
    currentY += headerHeight + 2;

    // Group slots by day
    const slotsByDay: { [key: string]: ScheduleSlot[] } = {};
    days.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      slotsByDay[dateStr] = schedules
        .filter((s) => s.date === dateStr)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    const maxSlots = Math.max(...Object.values(slotsByDay).map((s) => s.length), 1);
    const availableHeight = pageHeight - currentY - 25;
    const slotHeight = Math.min(40, Math.max(25, availableHeight / maxSlots));

    // Draw columns and slots
    days.forEach((day, dayIndex) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySlots = slotsByDay[dateStr] || [];
      const x = margin + dayIndex * dayWidth;

      // Column background
      pdf.setFillColor(dayIndex % 2 === 0 ? 250 : 255, 250, 255);
      pdf.rect(x, currentY, dayWidth, availableHeight, 'F');

      // Column border
      pdf.setDrawColor(220, 220, 220);
      pdf.rect(x, currentY, dayWidth, availableHeight, 'S');

      daySlots.forEach((slot, slotIndex) => {
        const y = currentY + slotIndex * slotHeight + 2;
        const slotColor = slot.color || '#8B5CF6';
        const rgb = hexToRgb(slotColor);

        // Slot card
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.roundedRect(x + 2, y, dayWidth - 4, slotHeight - 4, 2, 2, 'F');

        // Text
        const textColor = isLightColor(slotColor) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
        pdf.setTextColor(textColor.r, textColor.g, textColor.b);

        // Module name
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
        const maxTextWidth = dayWidth - 8;
        pdf.text(truncateText(pdf, moduleName, maxTextWidth), x + 4, y + 6);

        // Time
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.text(`${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`, x + 4, y + 11);

        // Instructor (if space)
        if (slotHeight >= 30) {
          const instructor = slot.users ? `${slot.users.first_name?.charAt(0)}. ${slot.users.last_name}` : '';
          pdf.text(truncateText(pdf, instructor, maxTextWidth), x + 4, y + 16);
        }

        // Room (if space)
        if (slotHeight >= 35 && slot.room) {
          pdf.text(truncateText(pdf, slot.room, maxTextWidth), x + 4, y + 21);
        }

        pdf.setTextColor(0, 0, 0);
      });
    });

    currentWeekStart = addDays(currentWeekStart, 7);
  }
};

const renderMonthView = (
  pdf: jsPDF,
  schedules: ScheduleSlot[],
  startDate: Date,
  endDate: Date,
  margin: number,
  contentWidth: number,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  isLandscape: boolean
) => {
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  let isFirstMonth = true;

  while (currentMonth <= endMonth) {
    // Nouvelle page pour chaque mois (sauf le premier)
    if (!isFirstMonth) {
      pdf.addPage();
    }
    isFirstMonth = false;

    let currentY = startY;

    // Titre du mois – similaire à l'interface
    const monthName = format(currentMonth, 'MMMM yyyy', { locale: fr });
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(139, 92, 246);
    pdf.text(
      monthName.charAt(0).toUpperCase() + monthName.slice(1),
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
    pdf.setTextColor(0, 0, 0);
    currentY += 12;

    // En-têtes des jours
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const cellWidth = contentWidth / 7;
    // Cellules plus grandes pour afficher les cartes lisibles
    const cellHeight = 38;

    pdf.setFillColor(139, 92, 246);
    pdf.rect(margin, currentY, contentWidth, 10, 'F');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    dayNames.forEach((name, index) => {
      pdf.text(name, margin + index * cellWidth + cellWidth / 2, currentY + 7, {
        align: 'center',
      });
    });

    pdf.setTextColor(0, 0, 0);
    currentY += 12;

    // Calcul de tous les jours du mois
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const calendarStart = startOfWeek(firstDay, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    let row = 0;
    allDays.forEach((day, index) => {
      const col = index % 7;
      if (index > 0 && col === 0) row++;

      const x = margin + col * cellWidth;
      const y = currentY + row * cellHeight;

      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

      // Fond de cellule
      pdf.setFillColor(isCurrentMonth ? 255 : 248, isCurrentMonth ? 255 : 248, isCurrentMonth ? 255 : 248);
      pdf.rect(x, y, cellWidth, cellHeight, 'F');
      pdf.setDrawColor(230, 230, 230);
      pdf.rect(x, y, cellWidth, cellHeight, 'S');

      // Numéro du jour
      pdf.setFontSize(8);
      pdf.setFont('helvetica', isCurrentMonth ? 'bold' : 'normal');
      pdf.setTextColor(isCurrentMonth ? 60 : 180, isCurrentMonth ? 60 : 180, isCurrentMonth ? 60 : 180);
      pdf.text(day.getDate().toString(), x + 2, y + 5);

      // Créneaux pour ce jour
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySlots = schedules
        .filter((s) => s.date === dateStr)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      if (daySlots.length > 0) {
        const slot = daySlots[0];
        const slotColor = slot.color || '#8B5CF6';
        const rgb = hexToRgb(slotColor);
        
        // Carte créneau sous le numéro du jour
        const cardX = x + 2;
        const cardY = y + 8;
        const cardWidth = cellWidth - 4;
        const cardHeight = cellHeight - 12;

        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 2, 2, 'F');

        const textColor = isLightColor(slotColor)
          ? { r: 0, g: 0, b: 0 }
          : { r: 255, g: 255, b: 255 };
        pdf.setTextColor(textColor.r, textColor.g, textColor.b);

        const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
        const maxTextWidth = cardWidth - 4;

        // Titre du module
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text(truncateText(pdf, moduleName, maxTextWidth), cardX + 2, cardY + 5);

        // Horaires
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5);
        const timeText = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
        pdf.text(truncateText(pdf, timeText, maxTextWidth), cardX + 2, cardY + 10);

        // Salle
        if (slot.room) {
          pdf.text(truncateText(pdf, `Salle ${slot.room}`, maxTextWidth), cardX + 2, cardY + 15);
        }

        // Formateur
        const instructor = slot.users
          ? `${slot.users.first_name} ${slot.users.last_name}`
          : undefined;
        if (instructor && cardHeight >= 22) {
          pdf.text(truncateText(pdf, instructor, maxTextWidth), cardX + 2, cardY + 20);
        }

        pdf.setTextColor(0, 0, 0);

        // Indicateur +N si plusieurs créneaux
        if (daySlots.length > 1) {
          pdf.setFontSize(5);
          pdf.setTextColor(100, 100, 100);
          pdf.text(`+${daySlots.length - 1}`, x + cellWidth - 6, y + 5);
          pdf.setTextColor(0, 0, 0);
        }
      }
    });

    currentMonth = addMonths(currentMonth, 1);
  }
};

const renderListView = (
  pdf: jsPDF,
  schedules: ScheduleSlot[],
  margin: number,
  contentWidth: number,
  startY: number,
  pageWidth: number,
  pageHeight: number,
  isLandscape: boolean
) => {
  let currentY = startY;

  // Define columns based on orientation
  const colWidths = isLandscape 
    ? { time: 30, module: 80, instructor: 60, room: 40, date: 30 }
    : { time: 28, module: 55, instructor: 45, room: 28, date: 24 };

  const colPositions = {
    time: margin,
    module: margin + colWidths.time,
    instructor: margin + colWidths.time + colWidths.module,
    room: margin + colWidths.time + colWidths.module + colWidths.instructor,
    date: margin + colWidths.time + colWidths.module + colWidths.instructor + colWidths.room
  };

  const renderTableHeader = (y: number): number => {
    pdf.setFillColor(139, 92, 246);
    pdf.rect(margin, y, contentWidth, 10, 'F');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Horaire', colPositions.time + 3, y + 7);
    pdf.text('Module', colPositions.module + 3, y + 7);
    pdf.text('Formateur', colPositions.instructor + 3, y + 7);
    pdf.text('Salle', colPositions.room + 3, y + 7);
    pdf.text('Date', colPositions.date + 3, y + 7);
    
    pdf.setTextColor(0, 0, 0);
    return y + 12;
  };

  currentY = renderTableHeader(currentY);

  // Sort schedules by date and time
  const sortedSchedules = [...schedules].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start_time.localeCompare(b.start_time);
  });

  const rowHeight = 10;

  sortedSchedules.forEach((slot, index) => {
    // Check for page break
    if (currentY + rowHeight > pageHeight - 25) {
      pdf.addPage();
      currentY = margin + 10;
      currentY = renderTableHeader(currentY);
    }

    // Alternating row background
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 252);
      pdf.rect(margin, currentY - 2, contentWidth, rowHeight, 'F');
    }

    // Color indicator circle
    const slotColor = slot.color || '#8B5CF6';
    const rgb = hexToRgb(slotColor);
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.circle(colPositions.time + 4, currentY + 3, 2.5, 'F');

    pdf.setFontSize(8);
    
    // Time
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`, colPositions.time + 9, currentY + 4);
    
    // Module (bold)
    pdf.setFont('helvetica', 'bold');
    const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
    pdf.text(truncateText(pdf, moduleName, colWidths.module - 5), colPositions.module + 3, currentY + 4);
    
    // Instructor
    pdf.setFont('helvetica', 'normal');
    const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné';
    pdf.text(truncateText(pdf, instructor, colWidths.instructor - 5), colPositions.instructor + 3, currentY + 4);
    
    // Room
    pdf.text(truncateText(pdf, slot.room || '-', colWidths.room - 5), colPositions.room + 3, currentY + 4);
    
    // Date
    const slotDate = new Date(slot.date);
    pdf.text(format(slotDate, 'dd/MM/yy', { locale: fr }), colPositions.date + 3, currentY + 4);

    currentY += rowHeight;
  });

  // If no schedules
  if (sortedSchedules.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Aucun cours dans cette période', margin + 10, currentY + 10);
    pdf.setTextColor(0, 0, 0);
  }
};

const addFooter = (pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number) => {
  const totalPages = pdf.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    pdf.text(
      `Page ${i} sur ${totalPages}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
    
    const now = new Date();
    const formattedDate = format(now, 'dd/MM/yyyy à HH:mm', { locale: fr });
    pdf.text(
      `Généré le ${formattedDate}`,
      margin,
      pageHeight - 6
    );
    
    pdf.setTextColor(0, 0, 0);
  }
};

// Legacy function for backward compatibility
export const exportScheduleToPDF = (
  schedules: ScheduleSlot[],
  title: string,
  userRole?: string,
  userName?: string,
  startDate?: Date,
  endDate?: Date
) => {
  const options: PrintOptions = {
    viewMode: 'list',
    dateRange: {
      start: startDate || new Date(),
      end: endDate || new Date()
    },
    orientation: 'portrait'
  };
  
  exportScheduleToPDFAdvanced(schedules, title, options, userRole, userName);
};
