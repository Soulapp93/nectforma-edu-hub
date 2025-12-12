import jsPDF from 'jspdf';
import { ScheduleSlot } from './scheduleService';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';
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
  let currentY = margin;

  // Set default font
  pdf.setFont('helvetica');

  // Header
  pdf.setFillColor(139, 92, 246);
  pdf.rect(0, 0, pageWidth, 20, 'F');
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text(title, pageWidth / 2, 13, { align: 'center' });

  pdf.setTextColor(0, 0, 0);
  currentY = 28;

  // User info and date range
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  if (userName && userRole) {
    pdf.text(`${userRole}: ${userName}`, margin, currentY);
    currentY += 5;
  }

  const formattedStartDate = format(options.dateRange.start, 'd MMMM yyyy', { locale: fr });
  const formattedEndDate = format(options.dateRange.end, 'd MMMM yyyy', { locale: fr });
  pdf.text(`Période: ${formattedStartDate} - ${formattedEndDate}`, margin, currentY);
  currentY += 10;

  // Render based on view mode
  switch (options.viewMode) {
    case 'day':
      renderDayView(pdf, schedules, options, margin, contentWidth, currentY, pageHeight);
      break;
    case 'week':
      renderWeekView(pdf, schedules, options, margin, contentWidth, currentY, pageWidth, pageHeight);
      break;
    case 'month':
      renderMonthView(pdf, schedules, options, margin, contentWidth, currentY, pageWidth, pageHeight);
      break;
    case 'list':
    default:
      renderListView(pdf, schedules, margin, contentWidth, currentY, pageHeight);
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
  options: PrintOptions,
  margin: number,
  contentWidth: number,
  startY: number,
  pageHeight: number
) => {
  let currentY = startY;
  const daySchedules = schedules.filter(s => {
    const slotDate = new Date(s.date);
    return slotDate.toDateString() === options.dateRange.start.toDateString();
  }).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const dateStr = format(options.dateRange.start, 'EEEE d MMMM yyyy', { locale: fr });
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setFillColor(248, 250, 252);
  pdf.rect(margin, currentY - 4, contentWidth, 10, 'F');
  pdf.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), margin + 3, currentY + 2);
  currentY += 12;

  if (daySchedules.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Aucun cours programmé', margin + 5, currentY);
    pdf.setTextColor(0, 0, 0);
    return;
  }

  daySchedules.forEach((slot, index) => {
    if (currentY > pageHeight - 40) {
      pdf.addPage();
      currentY = margin + 10;
    }

    const slotColor = slot.color || '#8B5CF6';
    const rgb = hexToRgb(slotColor);
    
    // Slot card
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.roundedRect(margin, currentY, contentWidth, 22, 2, 2, 'F');

    // Text color based on background
    if (isLightColor(slotColor)) {
      pdf.setTextColor(0, 0, 0);
    } else {
      pdf.setTextColor(255, 255, 255);
    }

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
    pdf.text(moduleName, margin + 5, currentY + 7);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const timeText = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
    pdf.text(timeText, margin + 5, currentY + 13);

    const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné';
    pdf.text(`Formateur: ${instructor}`, margin + 5, currentY + 18);

    if (slot.room) {
      pdf.text(`Salle: ${slot.room}`, margin + contentWidth - 50, currentY + 18);
    }

    pdf.setTextColor(0, 0, 0);
    currentY += 27;
  });
};

const renderWeekView = (
  pdf: jsPDF,
  schedules: ScheduleSlot[],
  options: PrintOptions,
  margin: number,
  contentWidth: number,
  startY: number,
  pageWidth: number,
  pageHeight: number
) => {
  let currentY = startY;
  
  // Get week days
  const weekStart = startOfWeek(options.dateRange.start, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(options.dateRange.start, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const dayWidth = contentWidth / 7;
  const headerHeight = 15;

  // Day headers
  pdf.setFillColor(139, 92, 246);
  pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  
  days.forEach((day, index) => {
    const x = margin + (index * dayWidth) + (dayWidth / 2);
    const dayName = format(day, 'EEE', { locale: fr });
    const dayNum = format(day, 'd');
    pdf.text(`${dayName} ${dayNum}`, x, currentY + 6, { align: 'center' });
    pdf.text(format(day, 'MMM', { locale: fr }), x, currentY + 11, { align: 'center' });
  });

  pdf.setTextColor(0, 0, 0);
  currentY += headerHeight + 2;

  // Calculate max slots per day for height
  const slotsByDay: { [key: string]: ScheduleSlot[] } = {};
  days.forEach(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    slotsByDay[dateStr] = schedules.filter(s => s.date === dateStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  });

  const maxSlots = Math.max(...Object.values(slotsByDay).map(s => s.length), 1);
  const slotHeight = Math.min(25, (pageHeight - currentY - 30) / maxSlots);

  // Draw slots
  days.forEach((day, dayIndex) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySlots = slotsByDay[dateStr] || [];
    const x = margin + (dayIndex * dayWidth);

    // Day column background
    pdf.setFillColor(dayIndex % 2 === 0 ? 252 : 248, 250, 252);
    pdf.rect(x, currentY, dayWidth, maxSlots * slotHeight, 'F');

    daySlots.forEach((slot, slotIndex) => {
      const y = currentY + (slotIndex * slotHeight);
      const slotColor = slot.color || '#8B5CF6';
      const rgb = hexToRgb(slotColor);

      // Slot background
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.roundedRect(x + 1, y + 1, dayWidth - 2, slotHeight - 2, 1, 1, 'F');

      // Text
      if (isLightColor(slotColor)) {
        pdf.setTextColor(0, 0, 0);
      } else {
        pdf.setTextColor(255, 255, 255);
      }

      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
      const truncatedName = moduleName.length > 15 ? moduleName.substring(0, 15) + '...' : moduleName;
      pdf.text(truncatedName, x + 3, y + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5);
      pdf.text(`${slot.start_time.substring(0, 5)}-${slot.end_time.substring(0, 5)}`, x + 3, y + 10);

      if (slot.room) {
        pdf.text(slot.room, x + 3, y + 14);
      }

      pdf.setTextColor(0, 0, 0);
    });
  });
};

const renderMonthView = (
  pdf: jsPDF,
  schedules: ScheduleSlot[],
  options: PrintOptions,
  margin: number,
  contentWidth: number,
  startY: number,
  pageWidth: number,
  pageHeight: number
) => {
  let currentY = startY;
  
  // Month header
  const monthName = format(options.dateRange.start, 'MMMM yyyy', { locale: fr });
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(monthName.charAt(0).toUpperCase() + monthName.slice(1), pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  // Day headers
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const cellWidth = contentWidth / 7;
  const cellHeight = (pageHeight - currentY - 30) / 6; // 6 weeks max

  pdf.setFillColor(139, 92, 246);
  pdf.rect(margin, currentY, contentWidth, 8, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  dayNames.forEach((name, index) => {
    pdf.text(name, margin + (index * cellWidth) + (cellWidth / 2), currentY + 5, { align: 'center' });
  });
  
  pdf.setTextColor(0, 0, 0);
  currentY += 10;

  // Get all days of the month
  const firstDay = new Date(options.dateRange.start.getFullYear(), options.dateRange.start.getMonth(), 1);
  const lastDay = new Date(options.dateRange.start.getFullYear(), options.dateRange.start.getMonth() + 1, 0);
  
  // Start from Monday of the first week
  const startDate = startOfWeek(firstDay, { weekStartsOn: 1 });
  const endDate = endOfWeek(lastDay, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });

  let row = 0;
  allDays.forEach((day, index) => {
    const col = index % 7;
    if (index > 0 && col === 0) row++;

    const x = margin + (col * cellWidth);
    const y = currentY + (row * cellHeight);

    // Cell background
    const isCurrentMonth = day.getMonth() === options.dateRange.start.getMonth();
    pdf.setFillColor(isCurrentMonth ? 255 : 245, isCurrentMonth ? 255 : 245, isCurrentMonth ? 255 : 245);
    pdf.rect(x, y, cellWidth, cellHeight, 'FD');
    pdf.setDrawColor(220, 220, 220);
    pdf.rect(x, y, cellWidth, cellHeight, 'S');

    // Day number
    pdf.setFontSize(8);
    pdf.setFont('helvetica', isCurrentMonth ? 'bold' : 'normal');
    pdf.setTextColor(isCurrentMonth ? 0 : 150, isCurrentMonth ? 0 : 150, isCurrentMonth ? 0 : 150);
    pdf.text(day.getDate().toString(), x + 2, y + 5);

    // Slots for this day
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySlots = schedules.filter(s => s.date === dateStr);
    
    pdf.setFontSize(5);
    daySlots.slice(0, 3).forEach((slot, slotIndex) => {
      const slotColor = slot.color || '#8B5CF6';
      const rgb = hexToRgb(slotColor);
      
      const slotY = y + 8 + (slotIndex * 6);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.roundedRect(x + 1, slotY, cellWidth - 2, 5, 0.5, 0.5, 'F');
      
      if (isLightColor(slotColor)) {
        pdf.setTextColor(0, 0, 0);
      } else {
        pdf.setTextColor(255, 255, 255);
      }
      
      const slotText = `${slot.start_time.substring(0, 5)} ${slot.formation_modules?.title?.substring(0, 8) || ''}`;
      pdf.text(slotText, x + 2, slotY + 3.5);
    });

    if (daySlots.length > 3) {
      pdf.setTextColor(100, 100, 100);
      pdf.text(`+${daySlots.length - 3}`, x + cellWidth - 6, y + cellHeight - 2);
    }

    pdf.setTextColor(0, 0, 0);
  });
};

const renderListView = (
  pdf: jsPDF,
  schedules: ScheduleSlot[],
  margin: number,
  contentWidth: number,
  startY: number,
  pageHeight: number
) => {
  let currentY = startY;

  // Group by date
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  const sortedDates = Object.keys(schedulesByDate).sort();

  // Table headers
  const colWidths = [25, 55, 45, 30, 25];
  const colPositions = [margin, margin + 25, margin + 80, margin + 125, margin + 155];

  pdf.setFillColor(139, 92, 246);
  pdf.rect(margin, currentY, contentWidth, 8, 'F');
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Horaire', colPositions[0] + 2, currentY + 5);
  pdf.text('Module', colPositions[1] + 2, currentY + 5);
  pdf.text('Formateur', colPositions[2] + 2, currentY + 5);
  pdf.text('Salle', colPositions[3] + 2, currentY + 5);
  pdf.text('Date', colPositions[4] + 2, currentY + 5);
  
  pdf.setTextColor(0, 0, 0);
  currentY += 10;

  sortedDates.forEach((date) => {
    const daySchedules = schedulesByDate[date].sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );

    daySchedules.forEach((slot, index) => {
      if (currentY > pageHeight - 25) {
        pdf.addPage();
        currentY = margin + 10;
        
        // Repeat headers on new page
        pdf.setFillColor(139, 92, 246);
        pdf.rect(margin, currentY, contentWidth, 8, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        pdf.text('Horaire', colPositions[0] + 2, currentY + 5);
        pdf.text('Module', colPositions[1] + 2, currentY + 5);
        pdf.text('Formateur', colPositions[2] + 2, currentY + 5);
        pdf.text('Salle', colPositions[3] + 2, currentY + 5);
        pdf.text('Date', colPositions[4] + 2, currentY + 5);
        pdf.setTextColor(0, 0, 0);
        currentY += 10;
      }

      // Alternating row colors
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, currentY - 1, contentWidth, 8, 'F');
      }

      // Color indicator
      const slotColor = slot.color || '#8B5CF6';
      const rgb = hexToRgb(slotColor);
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.circle(margin + 3, currentY + 3, 2, 'F');

      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      
      // Time
      pdf.text(`${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`, colPositions[0] + 7, currentY + 4);
      
      // Module
      const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
      const truncatedModule = moduleName.length > 28 ? moduleName.substring(0, 28) + '...' : moduleName;
      pdf.setFont('helvetica', 'bold');
      pdf.text(truncatedModule, colPositions[1] + 2, currentY + 4);
      
      // Instructor
      pdf.setFont('helvetica', 'normal');
      const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné';
      pdf.text(instructor, colPositions[2] + 2, currentY + 4);
      
      // Room
      pdf.text(slot.room || '-', colPositions[3] + 2, currentY + 4);
      
      // Date
      const slotDate = new Date(slot.date);
      pdf.text(format(slotDate, 'dd/MM', { locale: fr }), colPositions[4] + 2, currentY + 4);

      currentY += 8;
    });
  });
};

const addFooter = (pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number) => {
  const totalPages = pdf.internal.pages.length - 1;
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    
    pdf.setFontSize(7);
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

// Keep legacy function for backward compatibility
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
