import jsPDF from 'jspdf';
import { ScheduleSlot } from './scheduleService';

export const exportScheduleToPDF = (
  schedules: ScheduleSlot[],
  title: string,
  userRole?: string,
  userName?: string
) => {
  const pdf = new jsPDF();
  const margin = 20;
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  let currentY = margin;

  // Title
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // User info if provided
  if (userName && userRole) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${userRole}: ${userName}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;
  }

  // Date range
  if (schedules.length > 0) {
    const dates = schedules.map(s => s.date).sort();
    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    pdf.text(`Période: ${startDate} - ${endDate}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;
  }

  // Group schedules by date
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    if (!acc[schedule.date]) {
      acc[schedule.date] = [];
    }
    acc[schedule.date].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleSlot[]>);

  // Generate schedule for each date
  Object.entries(schedulesByDate).forEach(([date, daySchedules]) => {
    // Check if we need a new page
    if (currentY > pageHeight - 100) {
      pdf.addPage();
      currentY = margin;
    }

    // Date header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(formattedDate, margin, currentY);
    currentY += 10;

    // Sort by time
    const sortedSchedules = daySchedules.sort((a, b) => 
      a.start_time.localeCompare(b.start_time)
    );

    // Draw schedule slots
    sortedSchedules.forEach((schedule) => {
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');

      // Time
      const timeText = `${schedule.start_time} - ${schedule.end_time}`;
      pdf.text(timeText, margin + 10, currentY);

      // Module/Formation info
      let moduleText = '';
      if (schedule.formation_modules?.title) {
        moduleText = schedule.formation_modules.title;
      } else if (schedule.notes) {
        moduleText = schedule.notes;
      }

      if (moduleText) {
        pdf.text(moduleText, margin + 80, currentY);
      }

      // Instructor
      if (schedule.users?.first_name && schedule.users?.last_name) {
        const instructorText = `${schedule.users.first_name} ${schedule.users.last_name}`;
        pdf.text(instructorText, margin + 160, currentY);
      }

      // Room
      if (schedule.room) {
        pdf.text(schedule.room, pageWidth - margin - 30, currentY, { align: 'right' });
      }

      currentY += 8;
    });

    currentY += 10; // Space between days
  });

  // Footer
  const totalPages = pdf.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Page ${i} sur ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
    pdf.text(
      `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
      margin,
      pageHeight - 10
    );
  }

  // Save the PDF
  const filename = `emploi-du-temps-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
};