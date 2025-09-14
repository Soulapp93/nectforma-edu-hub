// Service pour créer des données de démonstration pour les sessions d'émargement
export const demoDataService = {
  // Cours fictifs pour la démonstration
  getTodaySchedules: () => [
    {
      id: 'demo-1',
      start_time: '09:00',
      end_time: '12:00',
      room: 'Salle A101',
      formation_title: 'Développement Web Avancé',
      module_title: 'React et TypeScript',
      instructor_name: 'Marie Dubois',
      day_of_week: new Date().getDay()
    },
    {
      id: 'demo-2',
      start_time: '14:00',
      end_time: '17:00',
      room: 'Salle B203',
      formation_title: 'Base de données et SQL',
      module_title: 'PostgreSQL Avancé',
      instructor_name: 'Pierre Martin',
      day_of_week: new Date().getDay()
    },
    {
      id: 'demo-3',
      start_time: '08:30',
      end_time: '11:30',
      room: 'Lab Informatique',
      formation_title: 'Intelligence Artificielle',
      module_title: 'Machine Learning avec Python',
      instructor_name: 'Sophie Laurent',
      day_of_week: new Date().getDay()
    }
  ],

  // Étudiants fictifs pour la démonstration
  getDemoStudents: () => [
    { id: '1', first_name: 'Alice', last_name: 'Martin', email: 'alice.martin@example.com' },
    { id: '2', first_name: 'Bob', last_name: 'Dupont', email: 'bob.dupont@example.com' },
    { id: '3', first_name: 'Claire', last_name: 'Bernard', email: 'claire.bernard@example.com' },
    { id: '4', first_name: 'David', last_name: 'Moreau', email: 'david.moreau@example.com' },
    { id: '5', first_name: 'Emma', last_name: 'Petit', email: 'emma.petit@example.com' },
    { id: '6', first_name: 'François', last_name: 'Roux', email: 'francois.roux@example.com' },
    { id: '7', first_name: 'Gabrielle', last_name: 'Leroy', email: 'gabrielle.leroy@example.com' },
    { id: '8', first_name: 'Hugo', last_name: 'Simon', email: 'hugo.simon@example.com' },
    { id: '9', first_name: 'Inès', last_name: 'Michel', email: 'ines.michel@example.com' },
    { id: '10', first_name: 'Julien', last_name: 'Garcia', email: 'julien.garcia@example.com' },
    { id: '11', first_name: 'Karine', last_name: 'Rodriguez', email: 'karine.rodriguez@example.com' },
    { id: '12', first_name: 'Lucas', last_name: 'Lopez', email: 'lucas.lopez@example.com' },
    { id: '13', first_name: 'Marine', last_name: 'Gonzalez', email: 'marine.gonzalez@example.com' },
    { id: '14', first_name: 'Nicolas', last_name: 'Perez', email: 'nicolas.perez@example.com' },
    { id: '15', first_name: 'Océane', last_name: 'Sanchez', email: 'oceane.sanchez@example.com' }
  ],

  // Générer un code QR fictif
  generateDemoQRCode: (sessionId: string) => {
    return `QR_${sessionId}_${Date.now()}`;
  },

  // Générer un code numérique fictif
  generateDemoNumericCode: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Créer une session d'émargement de démonstration
  createDemoAttendanceSession: (scheduleId: string) => {
    const schedule = demoDataService.getTodaySchedules().find(s => s.id === scheduleId);
    if (!schedule) return null;

    const sessionId = `session_${Date.now()}`;
    const qrCode = demoDataService.generateDemoQRCode(sessionId);
    const numericCode = demoDataService.generateDemoNumericCode();

    return {
      id: sessionId,
      formation_title: schedule.formation_title,
      module_title: schedule.module_title,
      instructor_name: schedule.instructor_name,
      room: schedule.room,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      date: new Date().toLocaleDateString('fr-FR'),
      qr_code: qrCode,
      numeric_code: numericCode,
      students: demoDataService.getDemoStudents(),
      created_at: new Date().toISOString()
    };
  }
};