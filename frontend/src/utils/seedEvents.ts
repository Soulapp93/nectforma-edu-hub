export const seedDemoEvents = () => {
  // Créer un utilisateur admin démo
  const demoAdmin = {
    id: 'demo-adminprincipal',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'Principal'
  };
  sessionStorage.setItem('demo_user', JSON.stringify(demoAdmin));
  
  console.log('Setting demo user:', demoAdmin);

  // Créer des événements démo avec de vrais fichiers accessibles
  const demoEvents = [
    {
      id: '1',
      establishment_id: 'demo-establishment',
      title: 'Atelier Innovation Numérique',
      description: 'Une conférence passionnante sur les dernières tendances en matière d\'innovation numérique et leur impact sur l\'éducation moderne.',
      formation_ids: ['formation1', 'formation2'],
      audiences: ['Étudiants', 'Formateurs'],
      file_urls: [
        'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        'https://file-examples.com/storage/fe068c4e3f16814756e6b55/2017/10/file_example_JPG_100kB.jpg'
      ],
      created_by: '00000000-0000-4000-8000-000000000001',
      created_at: '2025-09-19T20:09:55Z',
      updated_at: '2025-09-19T20:09:55Z'
    },
    {
      id: '2',
      establishment_id: 'demo-establishment',
      title: 'Journée Portes Ouvertes',
      description: 'Venez découvrir notre établissement et rencontrer nos équipes pédagogiques lors de cette journée spéciale.',
      formation_ids: ['formation3'],
      audiences: ['Étudiants', 'Parents'],
      file_urls: [
        'https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf'
      ],
      created_by: '00000000-0000-4000-8000-000000000001',
      created_at: '2025-09-19T20:08:00Z',
      updated_at: '2025-09-19T20:08:00Z'
    },
    {
      id: '3',
      establishment_id: 'demo-establishment',
      title: 'Remise des Diplômes 2025',
      description: 'Cérémonie officielle de remise des diplômes pour la promotion 2025. Un moment solennel et festif.',
      formation_ids: [],
      audiences: ['Toutes les audiences'],
      file_urls: [
        'https://www.africau.edu/images/default/sample.pdf',
        'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Programme+Ceremonie'
      ],
      created_by: '00000000-0000-4000-8000-000000000001',
      created_at: '2025-09-19T20:07:00Z',
      updated_at: '2025-09-19T20:07:00Z'
    },
    {
      id: '4',
      establishment_id: 'demo-establishment',
      title: 'Journée d\'Intégration',
      description: 'Accueil des nouveaux étudiants et activités d\'intégration pour faciliter leur adaptation.',
      formation_ids: [],
      audiences: ['Étudiants'],
      file_urls: [],
      created_by: '00000000-0000-4000-8000-000000000002',
      created_at: '2025-09-19T20:06:00Z',
      updated_at: '2025-09-19T20:06:00Z'
    }
  ];

  localStorage.setItem('demo_events', JSON.stringify(demoEvents));
  console.log('Demo events set:', demoEvents);
};