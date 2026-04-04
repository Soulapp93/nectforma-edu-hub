-- Insérer un utilisateur temporaire pour les tests de soumission de devoirs
INSERT INTO users (
  id,
  first_name,
  last_name,
  email,
  role,
  establishment_id,
  status,
  is_activated
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Utilisateur',
  'Temporaire',
  'temp@test.com',
  'Étudiant',
  '00000000-0000-0000-0000-000000000000', -- ID de l'établissement par défaut
  'Actif',
  true
) ON CONFLICT (id) DO NOTHING;