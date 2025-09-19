export const seedDemoEvents = () => {
  // Créer un utilisateur admin démo
  const demoAdmin = {
    id: 'demo-adminprincipal',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'Principal'
  };
  sessionStorage.setItem('demo_user', JSON.stringify(demoAdmin));

  // Créer des événements démo avec fichiers
  const demoEvents = [
    {
      id: '1',
      establishment_id: 'demo-establishment',
      title: 'atelier découverte',
      description: 'J\'ai ajouté le bouton modifier pour l\'administration, rendu les fichiers visibles et cliquables, et masqué les sections formations/audiences comme demandé.',
      formation_ids: ['formation1', 'formation2'],
      audiences: ['Étudiants', 'Formateurs'],
      file_urls: ['https://example.com/file1.pdf', 'https://example.com/document.docx'],
      created_by: 'demo-adminprincipal',
      created_at: '2025-09-19T20:09:55Z',
      updated_at: '2025-09-19T20:09:55Z'
    },
    {
      id: '2',
      establishment_id: 'demo-establishment',
      title: 'porte ouverte',
      description: 'J\'ai résolu l\'erreur en ajoutant des vérifications de sécurité dans la modale...',
      formation_ids: ['formation3'],
      audiences: ['Étudiants'],
      file_urls: ['https://example.com/presentation.pptx'],
      created_by: 'demo-adminprincipal',
      created_at: '2025-09-19T20:08:00Z',
      updated_at: '2025-09-19T20:08:00Z'
    },
    {
      id: '3',
      establishment_id: 'demo-establishment',
      title: 'remise de diplôme',
      description: 'I corrigé tous les problèmes : ajouté des vérifications de sécurité...',
      formation_ids: [],
      audiences: ['Toutes les audiences'],
      file_urls: ['https://example.com/programme.pdf', 'https://example.com/reglement.pdf'],
      created_by: 'demo-adminprincipal',
      created_at: '2025-09-19T20:07:00Z',
      updated_at: '2025-09-19T20:07:00Z'
    },
    {
      id: '4',
      establishment_id: 'demo-establishment',
      title: 'journée entrée',
      description: 'Aucune description disponible',
      formation_ids: [],
      audiences: ['Toutes les audiences'],
      file_urls: [],
      created_by: 'demo-adminprincipal',
      created_at: '2025-09-19T20:06:00Z',
      updated_at: '2025-09-19T20:06:00Z'
    }
  ];

  localStorage.setItem('demo_events', JSON.stringify(demoEvents));
};