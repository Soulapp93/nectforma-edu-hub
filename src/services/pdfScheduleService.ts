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
  showFormationName?: boolean; // Afficher le nom de la formation sur les cartes (uniquement pour formateurs)
  formationTitle?: string; // Titre de la formation à afficher dans le header
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

  // Les créneaux sont déjà filtrés en amont (ex: PrintScheduleModal)
  // Ici, on ne fait que trier pour garantir l'ordre d'affichage
  const filteredSchedules = [...schedules].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start_time.localeCompare(b.start_time);
  });

  // Render header on first page
  const renderHeader = (startY: number): number => {
    let currentY = startY;
    
    // Générer le titre dynamique selon le rôle
    // Pour les formateurs: "EMPLOI DU TEMPS" simple
    // Pour les étudiants/admins/tuteurs: "EMPLOI DU TEMPS – [FORMATION]"
    let headerTitle = title;
    if (options.formationTitle && !options.showFormationName) {
      // Pour étudiants/admins/tuteurs: ajouter le nom de la formation dans le titre
      headerTitle = `${title} – ${options.formationTitle}`;
    }
    
    // Header banner
    pdf.setFillColor(139, 92, 246);
    pdf.rect(0, 0, pageWidth, 22, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(truncateText(pdf, headerTitle, pageWidth - 20), pageWidth / 2, 14, { align: 'center' });

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

  const showFormationOnCards = options.showFormationName || false;

  // Render based on view mode
  switch (options.viewMode) {
    case 'day':
      renderDayView(pdf, filteredSchedules, options.dateRange.start, options.dateRange.end, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape, showFormationOnCards);
      break;
    case 'week':
      renderWeekView(pdf, filteredSchedules, options.dateRange.start, options.dateRange.end, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape, showFormationOnCards);
      break;
    case 'month':
      renderMonthView(pdf, filteredSchedules, options.dateRange.start, options.dateRange.end, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape, showFormationOnCards);
      break;
    case 'list':
    default:
      renderListView(pdf, filteredSchedules, margin, contentWidth, startY, pageWidth, pageHeight, isLandscape, showFormationOnCards);
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
  isLandscape: boolean,
  showFormationOnCards: boolean = false
) => {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  let currentY = startY;
  let isFirstDay = true;

  days.forEach((day) => {
    const daySchedules = schedules.filter(s => isSameDay(new Date(s.date), day))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    // Nouvelle page si nécessaire
    const estimatedHeight = 20 + (daySchedules.length * 45);
    if (!isFirstDay && currentY + estimatedHeight > pageHeight - 30) {
      pdf.addPage();
      currentY = margin + 10;
    }
    isFirstDay = false;

    // En-tête du jour
    const dateStr = format(day, 'EEEE d MMMM yyyy', { locale: fr });
    pdf.setFillColor(139, 92, 246);
    pdf.roundedRect(margin, currentY, contentWidth, 14, 3, 3, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), margin + 8, currentY + 9);
    pdf.setTextColor(0, 0, 0);
    currentY += 18;

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
      // Saut de page si nécessaire
      if (currentY + 42 > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 10;
      }

      const slotColor = slot.color || '#8B5CF6';
      const rgb = hexToRgb(slotColor);
      const cardHeight = 38;

      // Carte colorée avec coins arrondis
      pdf.setFillColor(rgb.r, rgb.g, rgb.b);
      pdf.roundedRect(margin, currentY, contentWidth, cardHeight, 4, 4, 'F');

      // Couleur du texte selon luminosité
      const textColor = isLightColor(slotColor) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
      pdf.setTextColor(textColor.r, textColor.g, textColor.b);

      // Nom du module en gras
      const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(truncateText(pdf, moduleName, contentWidth - 20), margin + 10, currentY + 10);

      // Formation (uniquement pour les formateurs)
      let infoY = currentY + 20;
      if (showFormationOnCards && (slot as any).formationTitle) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.text(truncateText(pdf, (slot as any).formationTitle, contentWidth - 20), margin + 10, infoY);
        infoY += 8;
      }

      // Horaires
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const timeText = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
      pdf.text(timeText, margin + 10, infoY);

      // Formateur
      const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : 'Non assigné';
      pdf.text(instructor, margin + 80, infoY);

      // Salle
      if (slot.room) {
        pdf.text(`Salle ${slot.room}`, margin + 10, infoY + 10);
      }

      pdf.setTextColor(0, 0, 0);
      currentY += cardHeight + 6;
    });

    currentY += 8;
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
  isLandscape: boolean,
  showFormationOnCards: boolean = false
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

    // Titre de la semaine
    const weekStartStr = format(currentWeekStart, 'd MMMM', { locale: fr });
    const weekEndStr = format(weekEnd, 'd MMMM yyyy', { locale: fr });
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(139, 92, 246);
    pdf.text(`Semaine du ${weekStartStr} au ${weekEndStr}`, pageWidth / 2, currentY, { align: 'center' });
    pdf.setTextColor(0, 0, 0);
    currentY += 10;

    const dayWidth = contentWidth / 7;
    const headerHeight = 16;

    // En-têtes des jours
    pdf.setFillColor(139, 92, 246);
    pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);

    days.forEach((day, index) => {
      const x = margin + index * dayWidth + dayWidth / 2;
      const dayName = format(day, 'EEE', { locale: fr });
      const dayNum = format(day, 'd', { locale: fr });
      pdf.text(`${dayName.charAt(0).toUpperCase()}${dayName.slice(1, 3)} ${dayNum}`, x, currentY + 10, { align: 'center' });
    });

    pdf.setTextColor(0, 0, 0);
    currentY += headerHeight + 2;

    // Grouper les créneaux par jour
    const slotsByDay: { [key: string]: ScheduleSlot[] } = {};
    days.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      slotsByDay[dateStr] = schedules
        .filter((s) => s.date === dateStr)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    const maxSlots = Math.max(...Object.values(slotsByDay).map((s) => s.length), 1);
    const availableHeight = pageHeight - currentY - 25;
    const slotHeight = Math.min(48, Math.max(32, availableHeight / Math.max(maxSlots, 3)));

    // Dessiner les colonnes et créneaux
    days.forEach((day, dayIndex) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySlots = slotsByDay[dateStr] || [];
      const x = margin + dayIndex * dayWidth;

      // Fond de colonne alternée
      pdf.setFillColor(dayIndex % 2 === 0 ? 252 : 248, 250, 255);
      pdf.rect(x, currentY, dayWidth, availableHeight, 'F');

      // Bordure de colonne
      pdf.setDrawColor(220, 220, 220);
      pdf.rect(x, currentY, dayWidth, availableHeight, 'S');

      daySlots.forEach((slot, slotIndex) => {
        const y = currentY + slotIndex * slotHeight + 3;
        const slotColor = slot.color || '#8B5CF6';
        const rgb = hexToRgb(slotColor);

        // Carte du créneau
        const cardHeight = slotHeight - 6;
        pdf.setFillColor(rgb.r, rgb.g, rgb.b);
        pdf.roundedRect(x + 2, y, dayWidth - 4, cardHeight, 2, 2, 'F');

        // Couleur du texte
        const textColor = isLightColor(slotColor) ? { r: 0, g: 0, b: 0 } : { r: 255, g: 255, b: 255 };
        pdf.setTextColor(textColor.r, textColor.g, textColor.b);

        const maxTextWidth = dayWidth - 8;
        let textY = y + 6;

        // Nom du module
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'bold');
        const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
        pdf.text(truncateText(pdf, moduleName, maxTextWidth), x + 4, textY);
        textY += 6;

        // Formation (uniquement pour les formateurs)
        if (showFormationOnCards && (slot as any).formationTitle && cardHeight >= 36) {
          pdf.setFontSize(5);
          pdf.setFont('helvetica', 'italic');
          pdf.text(truncateText(pdf, (slot as any).formationTitle, maxTextWidth), x + 4, textY);
          textY += 5;
        }

        // Horaires
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6);
        pdf.text(`${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`, x + 4, textY);
        textY += 6;

        // Salle
        if (slot.room && cardHeight >= 24) {
          pdf.text(truncateText(pdf, `Salle ${slot.room}`, maxTextWidth), x + 4, textY);
          textY += 6;
        }

        // Formateur
        if (cardHeight >= 30) {
          const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : '';
          if (instructor) {
            pdf.text(truncateText(pdf, instructor, maxTextWidth), x + 4, textY);
          }
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
  isLandscape: boolean,
  showFormationOnCards: boolean = false
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

    // Regrouper les jours par semaines (7 jours par ligne)
    const weeks: Date[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }

    // Paramètres d'affichage des créneaux dans une cellule
    const minSlotCardHeight = 11; // hauteur minimale confortable pour afficher titre + horaire + salle/formateur
    const slotSpacing = 1.5; // espace vertical entre les cartes
    const dayHeaderHeight = 8; // hauteur pour le numéro du jour
    const bottomPadding = 3; // marge basse de la cellule

    weeks.forEach((week, weekIndex) => {
      // Calculer le nombre maximum de créneaux sur un jour de cette semaine
      let maxSlotsInWeek = 0;
      week.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const daySlotsCount = schedules.filter((s) => s.date === dateStr).length;
        if (daySlotsCount > maxSlotsInWeek) maxSlotsInWeek = daySlotsCount;
      });

      // Hauteur nécessaire pour cette ligne de semaine pour afficher TOUS les créneaux sans chevauchement
      let slotAreaHeight = 0;
      if (maxSlotsInWeek > 0) {
        slotAreaHeight =
          maxSlotsInWeek * minSlotCardHeight + (maxSlotsInWeek - 1) * slotSpacing + 1;
      }
      const cellHeight = dayHeaderHeight + slotAreaHeight + bottomPadding;

      // Saut de page si la semaine ne tient pas sur la page actuelle
      if (currentY + cellHeight > pageHeight - 20) {
        pdf.addPage();

        // Réafficher le titre du mois et les en-têtes de jours sur la nouvelle page
        currentY = startY;
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
      }

      // Dessiner la semaine
      week.forEach((day, dayIndex) => {
        const col = dayIndex;
        const x = margin + col * cellWidth;
        const y = currentY;

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
        pdf.text(day.getDate().toString(), x + 2, y + 6);

        // Créneaux pour ce jour
        const dateStr = format(day, 'yyyy-MM-dd');
        const daySlots = schedules
          .filter((s) => s.date === dateStr)
          .sort((a, b) => a.start_time.localeCompare(b.start_time));

        if (daySlots.length > 0) {
          const slotAreaTop = y + dayHeaderHeight + 1;
          const availableHeightForSlots = cellHeight - dayHeaderHeight - bottomPadding;
          const effectiveCardHeight = Math.max(
            minSlotCardHeight,
            (availableHeightForSlots - (daySlots.length - 1) * slotSpacing) / daySlots.length
          );

          let slotY = slotAreaTop;

          daySlots.forEach((slot) => {
            const slotColor = slot.color || '#8B5CF6';
            const rgb = hexToRgb(slotColor);

            const cardX = x + 1;
            const cardWidth = cellWidth - 2;

            pdf.setFillColor(rgb.r, rgb.g, rgb.b);
            pdf.roundedRect(cardX, slotY, cardWidth, effectiveCardHeight, 1, 1, 'F');

            const textColor = isLightColor(slotColor)
              ? { r: 0, g: 0, b: 0 }
              : { r: 255, g: 255, b: 255 };
            pdf.setTextColor(textColor.r, textColor.g, textColor.b);

            const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
            const maxTextWidth = cardWidth - 3;

            // Titre du module
            pdf.setFontSize(5);
            pdf.setFont('helvetica', 'bold');
            pdf.text(truncateText(pdf, moduleName, maxTextWidth), cardX + 1.5, slotY + 3.5);

            // Formation (uniquement pour formateurs) - si assez de place
            let cardTextY = slotY + 7;
            if (showFormationOnCards && (slot as any).formationTitle && effectiveCardHeight >= 14) {
              pdf.setFont('helvetica', 'italic');
              pdf.setFontSize(3.5);
              pdf.text(truncateText(pdf, (slot as any).formationTitle, maxTextWidth), cardX + 1.5, cardTextY);
              cardTextY += 3;
            }

            // Horaires (ligne suivante si assez de place)
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(4);
            const timeText = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
            if (effectiveCardHeight >= 8) {
              pdf.text(truncateText(pdf, timeText, maxTextWidth), cardX + 1.5, cardTextY);
              cardTextY += 3;
            }

            // Salle + formateur si assez de place
            if (effectiveCardHeight >= 11) {
              let infoText = '';
              if (slot.room) infoText += `Salle ${slot.room}`;
              const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : '';
              if (instructor) infoText += infoText ? ` • ${instructor}` : instructor;
              if (infoText) {
                pdf.text(truncateText(pdf, infoText, maxTextWidth), cardX + 1.5, slotY + 10);
              }
            }

            pdf.setTextColor(0, 0, 0);
            slotY += effectiveCardHeight + slotSpacing;
          });
        }
      });

      currentY += cellHeight;
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
  isLandscape: boolean,
  showFormationOnCards: boolean = false
) => {
  let currentY = startY;

  // Colonnes adaptées à l'orientation et au rôle
  // Pour les formateurs: ajouter une colonne Formation
  const colWidths = showFormationOnCards
    ? (isLandscape 
        ? { date: 30, time: 30, formation: 50, module: 60, instructor: 40, room: 30 }
        : { date: 24, time: 28, formation: 35, module: 45, instructor: 30, room: 18 })
    : (isLandscape 
        ? { date: 35, time: 35, module: 85, instructor: 55, room: 35 }
        : { date: 28, time: 32, module: 60, instructor: 40, room: 20 });

  const colPositions = showFormationOnCards
    ? {
        date: margin,
        time: margin + colWidths.date,
        formation: margin + colWidths.date + colWidths.time,
        module: margin + colWidths.date + colWidths.time + (colWidths as any).formation,
        instructor: margin + colWidths.date + colWidths.time + (colWidths as any).formation + colWidths.module,
        room: margin + colWidths.date + colWidths.time + (colWidths as any).formation + colWidths.module + colWidths.instructor
      }
    : {
        date: margin,
        time: margin + colWidths.date,
        module: margin + colWidths.date + colWidths.time,
        instructor: margin + colWidths.date + colWidths.time + colWidths.module,
        room: margin + colWidths.date + colWidths.time + colWidths.module + colWidths.instructor
      };

  const renderTableHeader = (y: number): number => {
    pdf.setFillColor(139, 92, 246);
    pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('Date', colPositions.date + 4, y + 8);
    pdf.text('Horaire', colPositions.time + 4, y + 8);
    if (showFormationOnCards) {
      pdf.text('Formation', (colPositions as any).formation + 4, y + 8);
    }
    pdf.text('Module', colPositions.module + 4, y + 8);
    pdf.text('Formateur', colPositions.instructor + 4, y + 8);
    pdf.text('Salle', colPositions.room + 4, y + 8);
    
    pdf.setTextColor(0, 0, 0);
    return y + 14;
  };

  currentY = renderTableHeader(currentY);

  // Trier par date et heure
  const sortedSchedules = [...schedules].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start_time.localeCompare(b.start_time);
  });

  const rowHeight = 14;

  sortedSchedules.forEach((slot, index) => {
    // Saut de page si nécessaire
    if (currentY + rowHeight > pageHeight - 25) {
      pdf.addPage();
      currentY = margin + 10;
      currentY = renderTableHeader(currentY);
    }

    // Fond alterné
    if (index % 2 === 0) {
      pdf.setFillColor(250, 248, 255);
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Bordure légère
    pdf.setDrawColor(230, 230, 230);
    pdf.rect(margin, currentY, contentWidth, rowHeight, 'S');

    // Indicateur de couleur
    const slotColor = slot.color || '#8B5CF6';
    const rgb = hexToRgb(slotColor);
    pdf.setFillColor(rgb.r, rgb.g, rgb.b);
    pdf.roundedRect(colPositions.date + 2, currentY + 3, 4, rowHeight - 6, 1, 1, 'F');

    pdf.setFontSize(8);
    
    // Date
    const slotDate = new Date(slot.date);
    pdf.setFont('helvetica', 'normal');
    pdf.text(format(slotDate, 'dd/MM/yyyy', { locale: fr }), colPositions.date + 9, currentY + 9);
    
    // Horaire
    pdf.text(`${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`, colPositions.time + 4, currentY + 9);
    
    // Formation (uniquement pour les formateurs)
    if (showFormationOnCards) {
      const formationName = (slot as any).formationTitle || '-';
      pdf.text(truncateText(pdf, formationName, (colWidths as any).formation - 6), (colPositions as any).formation + 4, currentY + 9);
    }
    
    // Module (en gras)
    pdf.setFont('helvetica', 'bold');
    const moduleName = slot.formation_modules?.title || slot.notes || 'Cours';
    pdf.text(truncateText(pdf, moduleName, colWidths.module - 6), colPositions.module + 4, currentY + 9);
    
    // Formateur
    pdf.setFont('helvetica', 'normal');
    const instructor = slot.users ? `${slot.users.first_name} ${slot.users.last_name}` : '-';
    pdf.text(truncateText(pdf, instructor, colWidths.instructor - 6), colPositions.instructor + 4, currentY + 9);
    
    // Salle
    pdf.text(truncateText(pdf, slot.room || '-', colWidths.room - 6), colPositions.room + 4, currentY + 9);

    currentY += rowHeight;
  });

  // Aucun cours
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
