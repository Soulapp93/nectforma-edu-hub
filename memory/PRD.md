# PRD - Nectforma

## Plateforme
ERP Education - Gestion academique (React + Vite + TypeScript + Supabase)

## Session 38 (2026-04-16/17)

### Carte Etudiant - Dimensions ISO + Photos + Profil Etudiant (UPDATE)
- **Dimensions ISO ID-1** (85.6x54mm) + Portrait + Grande + Custom dans editeur
- **Photos de profil** recuperees depuis `profile_photo_url` pour les cartes generees
- **Photos dans Dossiers Administratifs** : avatar ou initiales fallback
- **Onglet "Carte etudiant" dans profil etudiant** (/compte) :
  - 4 onglets : Profil, Carte etudiant, Design, RGPD (visible uniquement pour les etudiants)
  - Recto/Verso avec QR code, infos, photo, mentions legales
  - Boutons Google Wallet + Apple Wallet
- `profile_photo_url` utilise dans StudentCardManagement pour la generation
- Testing: manuel verifie (screenshot etudiant + admin + dimensions)

### Carte Etudiant - Editeur Ameliore
- 10 modeles predefinis (Classique a Artistique), format portrait
- Drapeau France, proprietes etendues (fond element, arrondi, opacite)
- Testing: iteration_32 (100%, 11/11 tests)

### Rapport Emargement
- Testing: iteration_30 (100%, 12/12 tests)

### Historique Audit PV + Validation PV
- Testing: iterations 28-29 (100%)

### Gestion des Diplomes
- Testing: iteration_27 (100%, 14/14 tests)

### Signatures Publiques + Email Brevo
- Testing: iterations 25-26 (100%)

## P1 - [ ] Deploiement production
## P2 - [ ] Export PDF diplomes
## P2 - [ ] Refactoring TranscriptsPanel.tsx
## P2 - [ ] Pagination N+1 sur pages hub
