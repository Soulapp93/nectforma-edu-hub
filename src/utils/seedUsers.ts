import { userService, CreateUserData } from '@/services/userService';

export const generateTestUsers = (): CreateUserData[] => {
  return [
    // Administrateurs
    {
      first_name: 'Sophie',
      last_name: 'Martin',
      email: 'sophie.martin@nectfy.com',
      role: 'Admin',
      status: 'Actif',
      phone: '+33 6 12 34 56 78'
    },
    {
      first_name: 'Pierre',
      last_name: 'Dubois',
      email: 'pierre.dubois@nectfy.com',
      role: 'Admin',
      status: 'Actif',
      phone: '+33 6 23 45 67 89'
    },
    
    // Formateurs
    {
      first_name: 'Marie',
      last_name: 'Lefebvre',
      email: 'marie.lefebvre@nectfy.com',
      role: 'Formateur',
      status: 'Actif',
      phone: '+33 6 34 56 78 90'
    },
    {
      first_name: 'Jean',
      last_name: 'Moreau',
      email: 'jean.moreau@nectfy.com',
      role: 'Formateur',
      status: 'Actif',
      phone: '+33 6 45 67 89 01'
    },
    {
      first_name: 'Claire',
      last_name: 'Bernard',
      email: 'claire.bernard@nectfy.com',
      role: 'Formateur',
      status: 'Actif',
      phone: '+33 6 56 78 90 12'
    },
    {
      first_name: 'Thomas',
      last_name: 'Petit',
      email: 'thomas.petit@nectfy.com',
      role: 'Formateur',
      status: 'En attente',
      phone: '+33 6 67 89 01 23'
    },
    
    // Étudiants
    {
      first_name: 'Lucas',
      last_name: 'Roux',
      email: 'lucas.roux@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 78 90 12 34'
    },
    {
      first_name: 'Emma',
      last_name: 'Garcia',
      email: 'emma.garcia@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 89 01 23 45'
    },
    {
      first_name: 'Hugo',
      last_name: 'Simon',
      email: 'hugo.simon@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 90 12 34 56'
    },
    {
      first_name: 'Léa',
      last_name: 'Laurent',
      email: 'lea.laurent@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 01 23 45 67'
    },
    {
      first_name: 'Nathan',
      last_name: 'Michel',
      email: 'nathan.michel@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 12 34 56 89'
    },
    {
      first_name: 'Chloé',
      last_name: 'Durand',
      email: 'chloe.durand@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 23 45 67 90'
    },
    {
      first_name: 'Arthur',
      last_name: 'Leroy',
      email: 'arthur.leroy@student.nectfy.com',
      role: 'Étudiant',
      status: 'En attente',
      phone: '+33 6 34 56 78 01'
    },
    {
      first_name: 'Manon',
      last_name: 'Blanc',
      email: 'manon.blanc@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 45 67 89 12'
    },
    {
      first_name: 'Alexandre',
      last_name: 'Rousseau',
      email: 'alexandre.rousseau@student.nectfy.com',
      role: 'Étudiant',
      status: 'Inactif',
      phone: '+33 6 56 78 90 23'
    },
    {
      first_name: 'Sarah',
      last_name: 'Vincent',
      email: 'sarah.vincent@student.nectfy.com',
      role: 'Étudiant',
      status: 'Actif',
      phone: '+33 6 67 89 01 34'
    }
  ];
};

export const seedTestUsers = async () => {
  try {
    const testUsers = generateTestUsers();
    const createdUsers = await userService.bulkCreateUsers(testUsers);
    console.log(`✅ ${createdUsers.length} utilisateurs de test créés avec succès`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs de test:', error);
    throw error;
  }
};
